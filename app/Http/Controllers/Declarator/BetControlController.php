<?php

namespace App\Http\Controllers\Declarator;

use App\Http\Controllers\Controller;
use App\Models\Fight;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BetControlController extends Controller
{
    public function index()
    {
        $fights = Fight::whereIn('status', ['standby', 'open', 'lastcall', 'closed'])
            ->with(['creator'])
            ->latest()
            ->get()
            ->map(function ($fight) {
                return [
                    'id' => $fight->id,
                    'fight_number' => $fight->fight_number,
                    'meron_fighter' => $fight->meron_fighter,
                    'wala_fighter' => $fight->wala_fighter,
                    'status' => $fight->status,
                    'meron_odds' => $fight->meron_odds,
                    'wala_odds' => $fight->wala_odds,
                    'meron_betting_open' => $fight->meron_betting_open,
                    'wala_betting_open' => $fight->wala_betting_open,
                    'commission_percentage' => $fight->commission_percentage,
                    'total_meron_bets' => (float) $fight->getTotalMeronBets(),
                    'total_wala_bets' => (float) $fight->getTotalWalaBets(),
                ];
            });

        return Inertia::render('declarator/bet-controls/index', [
            'fights' => $fights,
        ]);
    }

    public function toggleMeron(Request $request, Fight $fight)
    {
        $fight->update([
            'meron_betting_open' => !$fight->meron_betting_open,
        ]);

        return redirect()->back()->with('success', 
            $fight->meron_betting_open 
                ? 'Meron betting opened' 
                : 'Meron betting closed'
        );
    }

    public function toggleWala(Request $request, Fight $fight)
    {
        $fight->update([
            'wala_betting_open' => !$fight->wala_betting_open,
        ]);

        return redirect()->back()->with('success', 
            $fight->wala_betting_open 
                ? 'Wala betting opened' 
                : 'Wala betting closed'
        );
    }

    public function toggleDraw(Request $request, Fight $fight)
    {
        $fight->update([
            'draw_betting_open' => !$fight->draw_betting_open,
        ]);

        return redirect()->back()->with('success', 
            $fight->draw_betting_open 
                ? 'Draw betting opened' 
                : 'Draw betting closed'
        );
    }

    public function updateCommission(Request $request, Fight $fight)
    {
        $validated = $request->validate([
            'commission_percentage' => 'required|numeric|min:0|max:100',
        ]);

        $fight->update([
            'commission_percentage' => $validated['commission_percentage'],
        ]);

        return redirect()->back()->with('success', 
            'Commission updated to ' . $validated['commission_percentage'] . '%'
        );
    }
}
