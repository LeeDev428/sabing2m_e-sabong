<?php

namespace App\Http\Controllers;

use App\Models\Fight;
use App\Models\Bet;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BigScreenController extends Controller
{
    public function index()
    {
        return Inertia::render('bigscreen/index');
    }

    public function api()
    {
        // Get the current active fight (open, lastcall, or closed awaiting result)
        $fight = Fight::whereIn('status', ['open', 'lastcall', 'closed'])
            ->with(['creator', 'declarator'])
            ->latest()
            ->first();

        if (!$fight) {
            // Check for recently declared fight
            $fight = Fight::where('status', 'result_declared')
                ->latest('result_declared_at')
                ->first();
            
            if ($fight && $fight->result_declared_at && $fight->result_declared_at->diffInSeconds(now()) < 30) {
                // Get final bet totals
                $meronTotal = Bet::where('fight_id', $fight->id)
                    ->where('side', 'meron')
                    ->where('status', 'active')
                    ->sum('amount');

                $walaTotal = Bet::where('fight_id', $fight->id)
                    ->where('side', 'wala')
                    ->where('status', 'active')
                    ->sum('amount');

                $drawTotal = Bet::where('fight_id', $fight->id)
                    ->where('side', 'draw')
                    ->where('status', 'active')
                    ->sum('amount');

                $totalPot = $meronTotal + $walaTotal + $drawTotal;
                $commission = $totalPot * ($fight->commission_percentage / 100);
                $netPot = $totalPot - $commission;

                $meronCount = Bet::where('fight_id', $fight->id)
                    ->where('side', 'meron')
                    ->where('status', 'active')
                    ->count();

                $walaCount = Bet::where('fight_id', $fight->id)
                    ->where('side', 'wala')
                    ->where('status', 'active')
                    ->count();

                $drawCount = Bet::where('fight_id', $fight->id)
                    ->where('side', 'draw')
                    ->where('status', 'active')
                    ->count();

                // Show declared fight for 30 seconds after result
                return response()->json([
                    'fight' => [
                        'id' => $fight->id,
                        'fight_number' => $fight->fight_number,
                        'meron_fighter' => $fight->meron_fighter,
                        'wala_fighter' => $fight->wala_fighter,
                        'status' => 'declared',
                        'result' => $fight->result,
                        'meron_odds' => $fight->meron_odds,
                        'wala_odds' => $fight->wala_odds,
                        'draw_odds' => $fight->draw_odds,
                        'meron_total' => (float) $meronTotal,
                        'wala_total' => (float) $walaTotal,
                        'draw_total' => (float) $drawTotal,
                        'total_pot' => (float) $totalPot,
                        'commission' => (float) $commission,
                        'net_pot' => (float) $netPot,
                        'meron_count' => $meronCount,
                        'wala_count' => $walaCount,
                        'draw_count' => $drawCount,
                        'notes' => $fight->notes,
                        'venue' => $fight->venue,
                        'event_name' => $fight->event_name,
                        'event_date' => $fight->event_date,
                        'round_number' => $fight->round_number,
                        'match_type' => $fight->match_type,
                        'special_conditions' => $fight->special_conditions,
                        'result_declared_at' => $fight->result_declared_at?->toISOString(),
                    ],
                ]);
            }

            return response()->json([
                'fight' => null,
            ]);
        }

        // Active fight - calculate totals
        $meronTotal = Bet::where('fight_id', $fight->id)
            ->where('side', 'meron')
            ->where('status', 'active')
            ->sum('amount');

        $walaTotal = Bet::where('fight_id', $fight->id)
            ->where('side', 'wala')
            ->where('status', 'active')
            ->sum('amount');

        $drawTotal = Bet::where('fight_id', $fight->id)
            ->where('side', 'draw')
            ->where('status', 'active')
            ->sum('amount');

        $totalPot = $meronTotal + $walaTotal + $drawTotal;
        $commission = $totalPot * ($fight->commission_percentage / 100);
        $netPot = $totalPot - $commission;

        $meronCount = Bet::where('fight_id', $fight->id)
            ->where('side', 'meron')
            ->where('status', 'active')
            ->count();

        $walaCount = Bet::where('fight_id', $fight->id)
            ->where('side', 'wala')
            ->where('status', 'active')
            ->count();

        $drawCount = Bet::where('fight_id', $fight->id)
            ->where('side', 'draw')
            ->where('status', 'active')
            ->count();

        return response()->json([
            'fight' => [
                'id' => $fight->id,
                'fight_number' => $fight->fight_number,
                'meron_fighter' => $fight->meron_fighter,
                'wala_fighter' => $fight->wala_fighter,
                'status' => $fight->status,
                'result' => $fight->result,
                'meron_odds' => $fight->meron_odds,
                'wala_odds' => $fight->wala_odds,
                'draw_odds' => $fight->draw_odds,
                'meron_total' => (float) $meronTotal,
                'wala_total' => (float) $walaTotal,
                'draw_total' => (float) $drawTotal,
                'total_pot' => (float) $totalPot,
                'commission' => (float) $commission,
                'net_pot' => (float) $netPot,
                'meron_count' => $meronCount,
                'wala_count' => $walaCount,
                'draw_count' => $drawCount,
                'meron_betting_open' => $fight->meron_betting_open,
                'wala_betting_open' => $fight->wala_betting_open,
                'notes' => $fight->notes,
                'venue' => $fight->venue,
                'event_name' => $fight->event_name,
                'event_date' => $fight->event_date,
                'round_number' => $fight->round_number,
                'match_type' => $fight->match_type,
                'special_conditions' => $fight->special_conditions,
                'commission_percentage' => $fight->commission_percentage,
                'result_declared_at' => $fight->result_declared_at?->toISOString(),
            ],
        ]);
    }

    public function history()
    {
        // Get last 10 declared fights for history display in natural order (oldest to newest, left to right)
        $history = Fight::where('status', 'result_declared')
            ->whereNotNull('result')
            ->orderBy('result_declared_at', 'desc')
            ->limit(10)
            ->get(['fight_number', 'result'])
            ->reverse()
            ->values();

        return response()->json([
            'history' => $history,
        ]);
    }
}
