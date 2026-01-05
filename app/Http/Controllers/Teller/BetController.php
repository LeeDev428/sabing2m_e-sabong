<?php

namespace App\Http\Controllers\Teller;

use App\Http\Controllers\Controller;
use App\Models\Bet;
use App\Models\Fight;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BetController extends Controller
{
    public function index()
    {
        $fights = Fight::whereIn('status', ['open', 'lastcall'])
            ->with(['creator'])
            ->latest()
            ->get();

        return Inertia::render('teller/fights/index', [
            'fights' => $fights,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'fight_id' => 'required|exists:fights,id',
            'side' => 'required|in:meron,wala,draw',
            'amount' => 'required|numeric|min:1',
        ]);

        $fight = Fight::findOrFail($validated['fight_id']);

        if (!$fight->canAcceptBets()) {
            return redirect()->back()
                ->with('error', 'Betting is not open for this fight.');
        }

        // Get current odds based on side
        $odds = $validated['side'] === 'meron' ? $fight->meron_odds : 
               ($validated['side'] === 'wala' ? $fight->wala_odds : $fight->draw_odds);

        if (!$odds) {
            return redirect()->back()
                ->with('error', 'Odds not set for this fight.');
        }

        $bet = Bet::create([
            'fight_id' => $validated['fight_id'],
            'teller_id' => auth()->id(),
            'side' => $validated['side'],
            'amount' => $validated['amount'],
            'odds' => $odds,
            'potential_payout' => $validated['amount'] * $odds,
            'status' => 'active',
        ]);

        // Update auto odds if enabled
        if ($fight->auto_odds) {
            $fight->calculateAutoOdds();
            $fight->save();
        }

        return redirect()->back()
            ->with('success', 'Bet placed successfully.')
            ->with('ticket', $bet);
    }

    public function history()
    {
        $bets = Bet::with(['fight', 'teller'])
            ->where('teller_id', auth()->id())
            ->latest()
            ->paginate(50);

        return Inertia::render('teller/bets/history', [
            'bets' => $bets,
        ]);
    }
}
