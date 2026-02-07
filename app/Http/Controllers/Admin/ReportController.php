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

class ReportController extends Controller
{
    public function index(Request $request)
    {
        // Get event filter
        $eventFilter = $request->input('event');

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
            ->get();

        // Commission reports by fight
        $commissionQuery = Fight::select(
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
            ->limit(50)
            ->get();

        // Teller reports
        $tellerReports = User::where('role', 'teller')
            ->withCount('bets')
            ->withSum('bets', 'amount')
            ->when($eventFilter, function($q) use ($eventFilter) {
                $q->whereHas('bets.fight', fn($query) => $query->where('event_name', $eventFilter));
            })
            ->get()
            ->map(function($user) use ($eventFilter) {
                $betsQuery = $user->bets();
                if ($eventFilter) {
                    $betsQuery->whereHas('fight', fn($q) => $q->where('event_name', $eventFilter));
                }
                
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'total_bets' => $betsQuery->count(),
                    'total_amount' => $betsQuery->sum('amount'),
                    'won_bets' => $betsQuery->where('status', 'won')->count(),
                    'total_payouts' => $betsQuery->where('status', 'won')->sum('actual_payout'),
                ];
            });

        // Get events for dropdown
        $events = Fight::select('event_name')
            ->whereNotNull('event_name')
            ->distinct()
            ->pluck('event_name');

        // Event Summary - Group fights by event with comprehensive stats
        $eventSummaries = Fight::select(
                'event_name',
                'event_date',
                DB::raw('COUNT(*) as total_fights'),
                DB::raw('SUM(CASE WHEN status = "result_declared" THEN 1 ELSE 0 END) as declared_fights'),
                DB::raw('SUM(CASE WHEN result = "meron" THEN 1 ELSE 0 END) as meron_wins'),
                DB::raw('SUM(CASE WHEN result = "wala" THEN 1 ELSE 0 END) as wala_wins'),
                DB::raw('SUM(CASE WHEN result = "draw" THEN 1 ELSE 0 END) as draws'),
                DB::raw('SUM(CASE WHEN result = "cancelled" THEN 1 ELSE 0 END) as cancelled'),
                DB::raw('AVG(commission_percentage) as avg_commission'),
                DB::raw('SUM(revolving_funds) as total_revolving_funds')
            )
            ->whereNotNull('event_name')
            ->when($eventFilter, fn($q) => $q->where('event_name', $eventFilter))
            ->whereNull('deleted_at')
            ->groupBy('event_name', 'event_date')
            ->orderBy('event_date', 'desc')
            ->get()
            ->map(function($event) {
                // Get detailed stats for this event
                $fights = Fight::where('event_name', $event->event_name)
                    ->where('event_date', $event->event_date)
                    ->pluck('id');

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
            'commission_reports' => $commissionQuery,
            'teller_reports' => $tellerReports,
            'event_summaries' => $eventSummaries,
            'events' => $events,
            'filters' => [
                'event' => $eventFilter,
            ],
        ]);
    }

    public function export(Request $request)
    {
        $query = Fight::with(['bets']);

        if ($request->from) {
            $query->whereDate('scheduled_at', '>=', $request->from);
        }

        if ($request->to) {
            $query->whereDate('scheduled_at', '<=', $request->to);
        }

        $fights = $query->get();

        $csv = "Fight Number,Meron,Wala,Status,Result,Total Bets,Total Amount,Payouts,Revenue,Date\n";

        foreach ($fights as $fight) {
            $totalBets = $fight->bets->count();
            $totalAmount = $fight->bets->sum('amount');
            $payouts = $fight->bets->where('status', 'won')->sum('actual_payout');
            $revenue = $totalAmount - $payouts;

            $csv .= sprintf(
                "%s,%s,%s,%s,%s,%d,%.2f,%.2f,%.2f,%s\n",
                $fight->fight_number,
                $fight->meron_fighter,
                $fight->wala_fighter,
                $fight->status,
                $fight->result ?? 'N/A',
                $totalBets,
                $totalAmount,
                $payouts,
                $revenue,
                $fight->scheduled_at->format('Y-m-d H:i:s')
            );
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="fights_report_' . date('Y-m-d') . '.csv"',
        ]);
    }
}
