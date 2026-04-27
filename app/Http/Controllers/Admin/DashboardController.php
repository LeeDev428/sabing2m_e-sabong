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
        // Filters
        $eventFilter = $request->input('event');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        
        // Get all unique events for filter dropdown
        $events = Fight::select('event_name')
            ->whereNotNull('event_name')
            ->distinct()
            ->orderBy('event_name')
            ->pluck('event_name');
        
        // Build query with filters
        $fightsQuery = Fight::query();
        $betsQuery = Bet::query();
        
        if ($eventFilter) {
            $fightsQuery->where('event_name', $eventFilter);
            $betsQuery->whereHas('fight', function($q) use ($eventFilter) {
                $q->where('event_name', $eventFilter);
            });
        }
        
        if ($dateFrom) {
            $fightsQuery->whereDate('created_at', '>=', $dateFrom);
            $betsQuery->whereDate('created_at', '>=', $dateFrom);
        }
        
        if ($dateTo) {
            $fightsQuery->whereDate('created_at', '<=', $dateTo);
            $betsQuery->whereDate('created_at', '<=', $dateTo);
        }
        
        // Overall Statistics (with filters)
        $declaredFightsIds = (clone $fightsQuery)->where('status', 'result_declared')->pluck('id');
        $totalCommission = Bet::whereIn('fight_id', $declaredFightsIds)
            ->where('status', '!=', 'voided')
            ->get()
            ->sum(function ($bet) {
                $fight = \App\Models\Fight::find($bet->fight_id);
                return $bet->amount * (($fight->commission_percentage ?? 0) / 100);
            });

        $stats = [
            'total_fights' => (clone $fightsQuery)->count(),
            'total_bets' => (clone $betsQuery)->count(),
            'total_bet_amount' => (clone $betsQuery)->sum('amount') ?: 0,
            'total_payouts' => (clone $betsQuery)->where('status', 'won')->sum('actual_payout') ?: 0,
            'total_commission' => $totalCommission,
        ];

        // Bet Distribution (filtered)
        $filteredFightIds = (clone $fightsQuery)->pluck('id');
        $betDistribution = [
            'meron_amount' => (float) Bet::whereIn('fight_id', $filteredFightIds)->where('side', 'meron')->sum('amount'),
            'wala_amount' => (float) Bet::whereIn('fight_id', $filteredFightIds)->where('side', 'wala')->sum('amount'),
            'draw_amount' => (float) Bet::whereIn('fight_id', $filteredFightIds)->where('side', 'draw')->sum('amount'),
            'meron_bets' => Bet::whereIn('fight_id', $filteredFightIds)->where('side', 'meron')->count(),
            'wala_bets' => Bet::whereIn('fight_id', $filteredFightIds)->where('side', 'wala')->count(),
            'draw_bets' => Bet::whereIn('fight_id', $filteredFightIds)->where('side', 'draw')->count(),
        ];

        // Recent Fights (with filters)
        $recentFights = (clone $fightsQuery)
            ->with(['creator', 'declarator'])
            ->whereNotIn('status', ['result_declared', 'cancelled'])
            ->latest()
            ->take(10)
            ->get();

        // Daily Revenue Chart (last 7 days or filtered range)
        $revenueQuery = Bet::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(amount) as total')
            );
            
        if ($dateFrom && $dateTo) {
            $revenueQuery->whereBetween('created_at', [$dateFrom, $dateTo]);
        } else {
            $revenueQuery->where('created_at', '>=', now()->subDays(7));
        }
        
        if ($eventFilter) {
            $revenueQuery->whereHas('fight', function($q) use ($eventFilter) {
                $q->where('event_name', $eventFilter);
            });
        }
        
        $dailyRevenue = $revenueQuery
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        // Fight Results Distribution (filtered)
        $resultsDistribution = (clone $fightsQuery)
            ->select('result', DB::raw('count(*) as count'))
            ->whereNotNull('result')
            ->groupBy('result')
            ->get();

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'betDistribution' => $betDistribution,
            'recentFights' => $recentFights,
            'dailyRevenue' => $dailyRevenue,
            'resultsDistribution' => $resultsDistribution,
            'events' => $events,
            'filters' => [
                'event' => $eventFilter,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }
}
