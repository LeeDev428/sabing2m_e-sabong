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
    public function index()
    {
        // Overall stats
        $stats = [
            'total_bets' => Bet::count(),
            'total_amount' => Bet::sum('amount'),
            'total_payouts' => Bet::where('status', 'won')->sum('actual_payout'),
            'total_revenue' => Bet::sum('amount') - Bet::where('status', 'won')->sum('actual_payout'),
            'fights_today' => Fight::whereDate('scheduled_at', today())->count(),
            'active_users' => User::count(),
        ];

        // Daily reports (last 30 days)
        $daily_reports = DB::table('fights')
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
            ->whereNull('fights.deleted_at')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();

        return Inertia::render('admin/reports/index', [
            'stats' => $stats,
            'daily_reports' => $daily_reports,
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
