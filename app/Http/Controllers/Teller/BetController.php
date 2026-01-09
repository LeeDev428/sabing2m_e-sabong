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

        // Check if the specific side is accepting bets (bet control)
        if ($validated['side'] === 'meron' && !$fight->canAcceptMeronBets()) {
            return redirect()->back()
                ->with('error', 'Meron betting is temporarily closed by admin.');
        }

        if ($validated['side'] === 'wala' && !$fight->canAcceptWalaBets()) {
            return redirect()->back()
                ->with('error', 'Wala betting is temporarily closed by admin.');
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

    public function history(Request $request)
    {
        $query = Bet::with(['fight', 'teller'])
            ->where('teller_id', auth()->id());

        // Filter by fight number
        if ($request->has('fight_number') && $request->fight_number) {
            $query->whereHas('fight', function($q) use ($request) {
                $q->where('fight_number', $request->fight_number);
            });
        }

        // Filter by side
        if ($request->has('side') && $request->side) {
            $query->where('side', $request->side);
        }

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Search by ticket ID
        if ($request->has('search') && $request->search) {
            $query->where('id', 'like', '%' . $request->search . '%');
        }

        $bets = $query->latest()->paginate(20);

        // Get unique fight numbers for filter dropdown
        $fightNumbers = Bet::where('teller_id', auth()->id())
            ->join('fights', 'bets.fight_id', '=', 'fights.id')
            ->select('fights.fight_number')
            ->distinct()
            ->orderBy('fights.fight_number', 'desc')
            ->limit(50)
            ->pluck('fight_number');

        return Inertia::render('teller/bets/history', [
            'bets' => $bets,
            'filters' => $request->only(['fight_number', 'side', 'status', 'start_date', 'end_date', 'search']),
            'fightNumbers' => $fightNumbers,
        ]);
    }

    /**
     * Get live odds for a specific fight (API endpoint)
     */
    public function getLiveOdds(Fight $fight)
    {
        return response()->json([
            'id' => $fight->id,
            'meron_odds' => $fight->meron_odds,
            'wala_odds' => $fight->wala_odds,
            'draw_odds' => $fight->draw_odds,
            'meron_betting_open' => $fight->meron_betting_open,
            'wala_betting_open' => $fight->wala_betting_open,
            'status' => $fight->status,
        ]);
    }

    /**
     * Get bet totals for a specific fight (API endpoint)
     */
    public function getBetTotals(Fight $fight)
    {
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

        return response()->json([
            'meron_total' => (float) $meronTotal,
            'wala_total' => (float) $walaTotal,
            'draw_total' => (float) $drawTotal,
            'total_pot' => (float) ($meronTotal + $walaTotal + $drawTotal),
        ]);
    }

    /**
     * Get teller's live balance (API endpoint)
     */
    public function getTellerLiveData()
    {
        $teller = auth()->user();
        
        return response()->json([
            'balance' => (float) ($teller->balance ?? 0),
        ]);
    }}