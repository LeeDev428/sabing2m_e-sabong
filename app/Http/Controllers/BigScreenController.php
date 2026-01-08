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
        // Get the current active fight (open or lastcall)
        $fight = Fight::whereIn('status', ['open', 'lastcall'])
            ->with(['creator', 'declarator'])
            ->latest()
            ->first();

        if (!$fight) {
            // Check for recently declared fight
            $fight = Fight::where('status', 'result_declared')
                ->latest('result_declared_at')
                ->first();
            
            if ($fight && $fight->result_declared_at && $fight->result_declared_at->diffInSeconds(now()) < 30) {
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
                        'meron_total' => 0,
                        'wala_total' => 0,
                        'draw_total' => 0,
                        'total_pot' => 0,
                    ],
                ]);
            }

            return response()->json([
                'fight' => null,
                'message' => 'No active fight',
            ]);
        }

        // Get bet totals for each side
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

        return response()->json([
            'fight' => [
                'id' => $fight->id,
                'fight_number' => $fight->fight_number,
                'meron_fighter' => $fight->meron_fighter,
                'wala_fighter' => $fight->wala_fighter,
                'status' => $fight->status,
                'meron_odds' => $fight->meron_odds,
                'wala_odds' => $fight->wala_odds,
                'draw_odds' => $fight->draw_odds,
                'meron_total' => (float) $meronTotal,
                'wala_total' => (float) $walaTotal,
                'draw_total' => (float) $drawTotal,
                'total_pot' => (float) $totalPot,
                'meron_betting_open' => $fight->meron_betting_open,
                'wala_betting_open' => $fight->wala_betting_open,
            ],
        ]);
    }
}
