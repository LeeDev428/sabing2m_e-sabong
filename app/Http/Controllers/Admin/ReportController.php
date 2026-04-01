<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bet;
use App\Models\Fight;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        // Get event filter
        $eventFilter = $request->input('event');

        try {
            $hasEventDate = Schema::hasColumn('fights', 'event_date');
            $hasRevolvingFunds = Schema::hasColumn('fights', 'revolving_funds');

            // Build base query with optional event filter
            $baseBetQuery = Bet::query();
            if ($eventFilter) {
                $baseBetQuery->whereHas('fight', fn($q) => $q->where('event_name', $eventFilter));
            }

            // Overall stats
            $stats = [
                'total_bets' => (clone $baseBetQuery)->count(),
                'total_amount' => (clone $baseBetQuery)->sum('amount'),
                'total_payouts' => (clone $baseBetQuery)->where('status', 'won')->sum('actual_payout'),
                'total_revenue' => (clone $baseBetQuery)->sum('amount') - (clone $baseBetQuery)->where('status', 'won')->sum('actual_payout'),
                'fights_today' => Fight::when($eventFilter, fn($q) => $q->where('event_name', $eventFilter))
                    ->whereDate('scheduled_at', today())
                    ->count(),
                'active_users' => User::count(),
                'unclaimed_winnings_count' => (clone $baseBetQuery)->where('status', 'won')->whereNull('claimed_at')->count(),
                'unclaimed_winnings_amount' => (clone $baseBetQuery)->where('status', 'won')->whereNull('claimed_at')->sum('actual_payout'),
            ];

            // Daily reports query
            $dailyQuery = DB::table('fights')
                ->leftJoin('bets', 'fights.id', '=', 'bets.fight_id')
                ->select(
                    DB::raw('DATE(fights.scheduled_at) as date'),
                    DB::raw('COUNT(DISTINCT fights.id) as fights'),
                    DB::raw('COUNT(bets.id) as bets'),
                    DB::raw('COALESCE(SUM(bets.amount), 0) as amount'),
                    DB::raw('COALESCE(SUM(CASE WHEN bets.status = "won" THEN bets.actual_payout ELSE 0 END), 0) as payouts'),
                    DB::raw('COALESCE(SUM(bets.amount), 0) - COALESCE(SUM(CASE WHEN bets.status = "won" THEN bets.actual_payout ELSE 0 END), 0) as revenue')
                )
                ->where('fights.scheduled_at', '>=', now()->subDays(30))
                ->whereNull('fights.deleted_at');

            if ($eventFilter) {
                $dailyQuery->where('fights.event_name', $eventFilter);
            }

            $daily_reports = $dailyQuery
                ->groupBy('date')
                ->orderBy('date', 'desc')
                ->paginate(10, ['*'], 'daily_page')
                ->withQueryString();

            // Commission reports by fight
            $commission_reports = Fight::select(
                    'fights.id',
                    'fights.fight_number',
                    'fights.event_name',
                    'fights.commission_percentage',
                    'fights.scheduled_at',
                    DB::raw('COALESCE(SUM(bets.amount), 0) as total_amount'),
                    DB::raw('COALESCE(SUM(bets.amount), 0) * (COALESCE(fights.commission_percentage, 7.5) / 100) as commission_earned')
                )
                ->leftJoin('bets', 'fights.id', '=', 'bets.fight_id')
                ->when($eventFilter, fn($q) => $q->where('fights.event_name', $eventFilter))
                ->whereNull('fights.deleted_at')
                ->groupBy('fights.id', 'fights.fight_number', 'fights.event_name', 'fights.commission_percentage', 'fights.scheduled_at')
                ->orderBy('fights.scheduled_at', 'desc')
                ->paginate(20, ['*'], 'commission_page')
                ->withQueryString();

            // Teller reports
            $teller_reports = DB::table('users')
                ->leftJoin('bets', 'users.id', '=', 'bets.user_id')
                ->leftJoin('fights', 'bets.fight_id', '=', 'fights.id')
                ->select(
                    'users.id',
                    'users.name',
                    'users.email',
                    DB::raw('COUNT(bets.id) as total_bets'),
                    DB::raw('COALESCE(SUM(bets.amount), 0) as total_amount'),
                    DB::raw('COALESCE(SUM(CASE WHEN bets.status = "won" THEN 1 ELSE 0 END), 0) as won_bets'),
                    DB::raw('COALESCE(SUM(CASE WHEN bets.status = "won" THEN bets.actual_payout ELSE 0 END), 0) as total_payouts')
                )
                ->where('users.role', 'teller')
                ->when($eventFilter, fn($q) => $q->where('fights.event_name', $eventFilter))
                ->groupBy('users.id', 'users.name', 'users.email')
                ->orderBy('users.name')
                ->paginate(20, ['*'], 'teller_page')
                ->withQueryString();

            // Get events for dropdown
            $events = Fight::select('event_name')
                ->whereNotNull('event_name')
                ->distinct()
                ->pluck('event_name');

            // Event Summary - Group fights by event with comprehensive stats
            $eventSummaryQuery = Fight::query()
                ->whereNotNull('event_name')
                ->when($eventFilter, fn($q) => $q->where('event_name', $eventFilter))
                ->whereNull('deleted_at');

            $eventSummarySelects = [
                'event_name',
                DB::raw('COUNT(*) as total_fights'),
                DB::raw('SUM(CASE WHEN status = "result_declared" THEN 1 ELSE 0 END) as declared_fights'),
                DB::raw('SUM(CASE WHEN result = "meron" THEN 1 ELSE 0 END) as meron_wins'),
                DB::raw('SUM(CASE WHEN result = "wala" THEN 1 ELSE 0 END) as wala_wins'),
                DB::raw('SUM(CASE WHEN result = "draw" THEN 1 ELSE 0 END) as draws'),
                DB::raw('SUM(CASE WHEN result = "cancelled" THEN 1 ELSE 0 END) as cancelled'),
                DB::raw('AVG(commission_percentage) as avg_commission'),
                $hasRevolvingFunds
                    ? DB::raw('SUM(revolving_funds) as total_revolving_funds')
                    : DB::raw('0 as total_revolving_funds'),
            ];

            if ($hasEventDate) {
                $eventSummarySelects[] = 'event_date';
                $event_summaries = $eventSummaryQuery
                    ->select($eventSummarySelects)
                    ->groupBy('event_name', 'event_date')
                    ->orderBy('event_date', 'desc')
                    ->paginate(10, ['*'], 'event_page')
                    ->withQueryString();
            } else {
                $eventSummarySelects[] = DB::raw('DATE(scheduled_at) as event_date');
                $event_summaries = $eventSummaryQuery
                    ->select($eventSummarySelects)
                    ->groupBy('event_name', DB::raw('DATE(scheduled_at)'))
                    ->orderByRaw('DATE(scheduled_at) desc')
                    ->paginate(10, ['*'], 'event_page')
                    ->withQueryString();
            }

            $event_summaries->getCollection()->transform(function ($event) use ($hasEventDate) {
                // Get detailed stats for this event
                $fightsQuery = Fight::where('event_name', $event->event_name);

                if ($hasEventDate) {
                    $fightsQuery->where('event_date', $event->event_date);
                } else {
                    $fightsQuery->whereDate('scheduled_at', $event->event_date);
                }

                $fights = $fightsQuery->pluck('id');

                $totalBets = Bet::whereIn('fight_id', $fights)->count();
                $totalAmount = Bet::whereIn('fight_id', $fights)->sum('amount');
                $totalPayouts = Bet::whereIn('fight_id', $fights)->where('status', 'won')->sum('actual_payout');
                $totalCommission = $totalAmount * (($event->avg_commission ?? 7.5) / 100);
                $netRevenue = $totalAmount - $totalPayouts - $totalCommission;

                return [
                    'event_name' => $event->event_name,
                    'event_date' => $event->event_date,
                    'total_fights' => $event->total_fights,
                    'declared_fights' => $event->declared_fights,
                    'meron_wins' => $event->meron_wins,
                    'wala_wins' => $event->wala_wins,
                    'draws' => $event->draws,
                    'cancelled' => $event->cancelled,
                    'total_bets' => $totalBets,
                    'total_amount' => $totalAmount,
                    'total_payouts' => $totalPayouts,
                    'total_commission' => $totalCommission,
                    'net_revenue' => $netRevenue,
                    'avg_commission' => $event->avg_commission ?? 7.5,
                    'total_revolving_funds' => $event->total_revolving_funds ?? 0,
                ];
            });

            return Inertia::render('admin/reports/index', [
                'stats' => $stats,
                'daily_reports' => $daily_reports,
                'commission_reports' => $commission_reports,
                'teller_reports' => $teller_reports,
                'event_summaries' => $event_summaries,
                'events' => $events,
                'filters' => [
                    'event' => $eventFilter,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Reports index error: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all(),
            ]);

            return Inertia::render('admin/reports/index', [
                'stats' => [
                    'total_bets' => 0,
                    'total_amount' => 0,
                    'total_payouts' => 0,
                    'total_revenue' => 0,
                    'fights_today' => 0,
                    'active_users' => 0,
                    'unclaimed_winnings_count' => 0,
                    'unclaimed_winnings_amount' => 0,
                ],
                'daily_reports' => [
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'from' => null,
                    'to' => null,
                    'total' => 0,
                    'links' => [],
                ],
                'commission_reports' => [
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'from' => null,
                    'to' => null,
                    'total' => 0,
                    'links' => [],
                ],
                'teller_reports' => [
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'from' => null,
                    'to' => null,
                    'total' => 0,
                    'links' => [],
                ],
                'event_summaries' => [
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'from' => null,
                    'to' => null,
                    'total' => 0,
                    'links' => [],
                ],
                'events' => [],
                'filters' => [
                    'event' => $eventFilter,
                ],
            ]);
        }
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'event' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $filename = 'fights_report_' . date('Y-m-d_H-i-s') . '.csv';

            return response()->streamDownload(function () use ($validated) {
                $handle = fopen('php://output', 'w');
                if ($handle === false) {
                    throw new \RuntimeException('Unable to open CSV output stream.');
                }

                // UTF-8 BOM for Excel compatibility.
                fwrite($handle, "\xEF\xBB\xBF");

                fputcsv($handle, [
                    'Fight Number',
                    'Meron',
                    'Wala',
                    'Status',
                    'Result',
                    'Total Bets',
                    'Total Amount',
                    'Payouts',
                    'Revenue',
                    'Date',
                ]);

                Fight::query()
                    ->select([
                        'id',
                        'fight_number',
                        'meron_fighter',
                        'wala_fighter',
                        'status',
                        'result',
                        'scheduled_at',
                    ])
                    ->when(!empty($validated['from']), fn($q) => $q->whereDate('scheduled_at', '>=', $validated['from']))
                    ->when(!empty($validated['to']), fn($q) => $q->whereDate('scheduled_at', '<=', $validated['to']))
                    ->when(!empty($validated['event']), fn($q) => $q->where('event_name', $validated['event']))
                    ->withCount('bets')
                    ->withSum('bets as total_amount', 'amount')
                    ->withSum(['bets as total_payouts' => fn($q) => $q->where('status', 'won')], 'actual_payout')
                    ->orderBy('id')
                    ->chunkById(500, function ($fights) use ($handle) {
                        foreach ($fights as $fight) {
                            $totalAmount = (float) ($fight->total_amount ?? 0);
                            $payouts = (float) ($fight->total_payouts ?? 0);
                            $revenue = $totalAmount - $payouts;

                            fputcsv($handle, [
                                $fight->fight_number ?? 'N/A',
                                $fight->meron_fighter ?? 'N/A',
                                $fight->wala_fighter ?? 'N/A',
                                $fight->status ?? 'N/A',
                                $fight->result ?? 'N/A',
                                (int) ($fight->bets_count ?? 0),
                                number_format($totalAmount, 2, '.', ''),
                                number_format($payouts, 2, '.', ''),
                                number_format($revenue, 2, '.', ''),
                                $fight->scheduled_at ? $fight->scheduled_at->format('Y-m-d H:i:s') : 'N/A',
                            ]);
                        }
                    });

                fclose($handle);
            }, $filename, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        } catch (\Throwable $e) {
            Log::error('CSV Export Error: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all(),
            ]);

            return response()->json(['error' => 'Failed to generate CSV export'], 500);
        }
    }
}
