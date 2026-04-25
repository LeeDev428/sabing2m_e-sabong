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
        // Get the current active fight (standby, open, lastcall, or closed awaiting result)
        $fight = Fight::whereIn('status', ['standby', 'open', 'lastcall', 'closed'])
            ->with(['creator', 'declarator'])
            ->latest()
            ->first();

        if (!$fight) {
            // Check for LATEST declared fight (no time limit - keep showing until next fight)
            $fight = Fight::where('status', 'result_declared')
                ->latest('result_declared_at')
                ->first();
            
            // Show the last declared fight indefinitely until next fight opens
            if ($fight) {
                // Get final bet totals
                $meronTotal = Bet::where('fight_id', $fight->id)
                    ->where('side', 'meron')
                    ->where('status', '!=', 'voided')
                    ->sum('amount');

                $walaTotal = Bet::where('fight_id', $fight->id)
                    ->where('side', 'wala')
                    ->where('status', '!=', 'voided')
                    ->sum('amount');

                $drawTotal = Bet::where('fight_id', $fight->id)
                    ->where('side', 'draw')
                    ->where('status', '!=', 'voided')
                    ->sum('amount');

                $totalPot = $meronTotal + $walaTotal + $drawTotal;
                $commission = $totalPot * ($fight->commission_percentage / 100);
                $netPot = $totalPot - $commission;

                $meronCount = Bet::where('fight_id', $fight->id)
                    ->where('side', 'meron')
                    ->where('status', '!=', 'voided')
                    ->count();

                $walaCount = Bet::where('fight_id', $fight->id)
                    ->where('side', 'wala')
                    ->where('status', '!=', 'voided')
                    ->count();

                $drawCount = Bet::where('fight_id', $fight->id)
                    ->where('side', 'draw')
                    ->where('status', '!=', 'voided')
                    ->count();

                $isOpenLike = in_array($fight->status, ['open', 'lastcall']);

                // Show declared fight for 30 seconds after result
                return response()->json([
                    'fight' => [
                        'id' => $fight->id,
                        'fight_number' => $fight->fight_number,
                        'meron_fighter' => $fight->meron_fighter,
                        'wala_fighter' => $fight->wala_fighter,
                        'status' => 'declared',
                        'result' => $fight->result,
                        'meron_odds' => $meronTotal > 0 ? $fight->meron_odds : null,
                        'wala_odds' => $walaTotal > 0 ? $fight->wala_odds : null,
                        'draw_odds' => $drawTotal > 0 ? $fight->draw_odds : null,
                        'meron_total' => (float) $meronTotal,
                        'wala_total' => (float) $walaTotal,
                        'draw_total' => (float) $drawTotal,
                        'total_pot' => (float) $totalPot,
                        'commission' => (float) $commission,
                        'net_pot' => (float) $netPot,
                        'meron_count' => $meronCount,
                        'wala_count' => $walaCount,
                        'draw_count' => $drawCount,
                        'meron_betting_open' => $isOpenLike ? (bool) $fight->meron_betting_open : false,
                        'wala_betting_open' => $isOpenLike ? (bool) $fight->wala_betting_open : false,
                        'draw_betting_open' => false,
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

        $isOpenLike = in_array($fight->status, ['open', 'lastcall']);

        return response()->json([
            'fight' => [
                'id' => $fight->id,
                'fight_number' => $fight->fight_number,
                'meron_fighter' => $fight->meron_fighter,
                'wala_fighter' => $fight->wala_fighter,
                'status' => $fight->status,
                'result' => $fight->result,
                'meron_odds' => $meronTotal > 0 ? $fight->meron_odds : null,
                'wala_odds' => $walaTotal > 0 ? $fight->wala_odds : null,
                'draw_odds' => $drawTotal > 0 ? $fight->draw_odds : null,
                'meron_total' => (float) $meronTotal,
                'wala_total' => (float) $walaTotal,
                'draw_total' => (float) $drawTotal,
                'total_pot' => (float) $totalPot,
                'commission' => (float) $commission,
                'net_pot' => (float) $netPot,
                'meron_count' => $meronCount,
                'wala_count' => $walaCount,
                'draw_count' => $drawCount,
                'meron_betting_open' => $isOpenLike ? (bool) $fight->meron_betting_open : false,
                'wala_betting_open' => $isOpenLike ? (bool) $fight->wala_betting_open : false,
                'draw_betting_open' => false,
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
        // Determine the current active event from the active fight (same priority as api())
        $activeFight = Fight::whereIn('status', ['standby', 'open', 'lastcall', 'closed'])
            ->latest()
            ->first();

        if (!$activeFight) {
            // Fall back to the latest declared fight to get the event
            $activeFight = Fight::where('status', 'result_declared')
                ->latest('result_declared_at')
                ->first();
        }

        $eventName = $activeFight?->event_name;

        // Get declared fights scoped to the current event (oldest to newest, left to right)
        $query = Fight::where('status', 'result_declared')
            ->whereNotNull('result');

        if ($eventName) {
            $query->where('event_name', $eventName);
        }

        $history = $query
            ->orderBy('result_declared_at', 'desc')
            ->limit(20)
            ->get(['fight_number', 'result'])
            ->reverse()
            ->values();

        return response()->json([
            'history' => $history,
        ]);
    }
}
