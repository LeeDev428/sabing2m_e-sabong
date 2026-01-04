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
            'total_payouts' => Bet::where('status', 'paid')->sum('payout'),
            'total_revenue' => Bet::sum('amount') - Bet::where('status', 'paid')->sum('payout'),
            'fights_today' => Fight::whereDate('scheduled_at', today())->count(),
            'active_users' => User::count(),
        ];

        // Daily reports (last 30 days)
        $daily_reports = Fight::select(
            DB::raw('DATE(scheduled_at) as date'),
            DB::raw('COUNT(*) as fights'),
            DB::raw('(SELECT COUNT(*) FROM bets WHERE fight_id = fights.id) as bets'),
            DB::raw('(SELECT SUM(amount) FROM bets WHERE fight_id = fights.id) as amount'),
            DB::raw('(SELECT SUM(payout) FROM bets WHERE fight_id = fights.id AND status = "paid") as payouts'),
            DB::raw('(SELECT SUM(amount) - COALESCE(SUM(payout), 0) FROM bets WHERE fight_id = fights.id) as revenue')
        )
        ->where('scheduled_at', '>=', now()->subDays(30))
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
            $payouts = $fight->bets->where('status', 'paid')->sum('payout');
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
