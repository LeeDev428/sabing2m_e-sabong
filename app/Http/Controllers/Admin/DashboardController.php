<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Fight;
use App\Models\Bet;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Date filter (default: today)
        $dateFrom = $request->input('date_from', now()->startOfDay()->toDateString());
        $dateTo = $request->input('date_to', now()->endOfDay()->toDateString());
        
        // Overall Statistics
        $stats = [
            'total_fights' => Fight::count(),
            'active_fights' => Fight::whereIn('status', ['standby', 'open', 'lastcall'])->count(),
            'closed_fights' => Fight::where('status', 'closed')->count(),
            'completed_fights' => Fight::where('status', 'result_declared')->count(),
            'total_bets' => Bet::count(),
            'total_bet_amount' => Bet::sum('amount'),
            'total_payouts' => Bet::where('status', 'won')->sum('actual_payout'),
            'active_bet_amount' => Bet::where('status', 'active')->sum('amount'),
            'total_users' => User::count(),
            'total_tellers' => User::where('role', 'teller')->count(),
        ];

        // Today's Statistics
        $todayStats = [
            'fights_today' => Fight::whereDate('created_at', now()->toDateString())->count(),
            'bets_today' => Bet::whereDate('created_at', now()->toDateString())->count(),
            'revenue_today' => Bet::whereDate('created_at', now()->toDateString())->sum('amount'),
            'payouts_today' => Bet::whereDate('created_at', now()->toDateString())
                                 ->where('status', 'won')
                                 ->sum('actual_payout'),
        ];

        // Bet Distribution
        $betDistribution = [
            'meron_amount' => (float) Bet::where('side', 'meron')->sum('amount'),
            'wala_amount' => (float) Bet::where('side', 'wala')->sum('amount'),
            'draw_amount' => (float) Bet::where('side', 'draw')->sum('amount'),
            'meron_bets' => Bet::where('side', 'meron')->count(),
            'wala_bets' => Bet::where('side', 'wala')->count(),
            'draw_bets' => Bet::where('side', 'draw')->count(),
        ];

        // Recent Fights (last 10, exclude result_declared and cancelled)
        $recentFights = Fight::with(['creator', 'declarator'])
            ->whereNotIn('status', ['result_declared', 'cancelled'])
            ->latest()
            ->take(10)
            ->get();

        // Daily Revenue Chart (last 7 days)
        $dailyRevenue = Bet::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(amount) as total')
            )
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        // Fight Results Distribution
        $resultsDistribution = Fight::select('result', DB::raw('count(*) as count'))
            ->whereNotNull('result')
            ->groupBy('result')
            ->get();

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'todayStats' => $todayStats,
            'betDistribution' => $betDistribution,
            'recentFights' => $recentFights,
            'dailyRevenue' => $dailyRevenue,
            'resultsDistribution' => $resultsDistribution,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }
}
