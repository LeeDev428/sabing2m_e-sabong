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

        // Add bet amount to teller balance (teller receives cash from customer)
        // Update the teller's current_balance in teller_cash_assignments for this fight
        $assignment = \App\Models\TellerCashAssignment::where('teller_id', auth()->id())
            ->where('fight_id', $validated['fight_id'])
            ->first();
        
        if ($assignment) {
            $assignment->current_balance += $validated['amount'];
            $assignment->save();
        }

        // Return with ticket data in props (not flash session)
        return back()->with([
            'success' => 'Bet placed successfully.',
            'ticket' => [
                'id' => $bet->id,
                'ticket_id' => $bet->ticket_id,
                'fight_number' => $fight->fight_number,
                'potential_payout' => $bet->potential_payout,
                'amount' => $bet->amount,
                'odds' => $bet->odds,
                'side' => $bet->side,
            ],
        ]);
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
        
        // Only show balance for the LATEST fight if it's currently open or lastcall
        $balance = 0;
        $latestFight = Fight::latest()->first();
        
        if ($latestFight && in_array($latestFight->status, ['open', 'lastcall'])) {
            $balance = (float) \App\Models\TellerCashAssignment::where('teller_id', $teller->id)
                ->where('fight_id', $latestFight->id)
                ->value('current_balance') ?? 0;
        }
        
        return response()->json([
            'balance' => (float) $balance,
        ]);
    }

    /**
     * Get currently open fights (API endpoint)
     */
    public function getOpenFights()
    {
        $fights = Fight::whereIn('status', ['open', 'lastcall'])
            ->latest()
            ->get();

        return response()->json($fights);
    }

    /**
     * Display the payout scan page
     */
    public function payoutScan()
    {
        return Inertia::render('teller/payout-scan');
    }

    /**
     * Process payout claim via QR code
     */
    public function claimPayout(Request $request)
    {
        $validated = $request->validate([
            'bet_id' => 'required|exists:bets,id',
        ]);

        $bet = Bet::with(['fight', 'teller'])->findOrFail($validated['bet_id']);

        // Check if bet has already been claimed
        if ($bet->status === 'claimed') {
            return response()->json([
                'success' => false,
                'message' => 'This bet has already been claimed.',
            ], 400);
        }

        // Check if bet is a winning bet
        if ($bet->status !== 'won') {
            $statusMessage = $bet->status === 'lost' ? 'lost' : 'not eligible for payout';
            return response()->json([
                'success' => false,
                'message' => "Cannot claim payout. This bet {$statusMessage}.",
            ], 400);
        }

        // Calculate payout amount
        $payoutAmount = $bet->potential_payout ?? $bet->amount;

        // Update bet status to claimed
        $bet->status = 'claimed';
        $bet->claimed_at = now();
        $bet->claimed_by = auth()->id();
        $bet->save();

        // Deduct payout from teller's cash assignment (teller pays out winnings)
        $assignment = \App\Models\TellerCashAssignment::where('teller_id', auth()->id())
            ->where('fight_id', $bet->fight_id)
            ->first();
        
        if ($assignment) {
            $assignment->current_balance -= $payoutAmount;
            $assignment->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Payout claimed successfully!',
            'bet' => $bet,
            'payout_amount' => (float) $payoutAmount,
        ]);
    }

    /**
     * Display merged history and summary page
     */
    public function historyAndSummary()
    {
        $teller = auth()->user();

        // Get today's bets
        $bets = Bet::with(['fight', 'teller'])
            ->where('teller_id', $teller->id)
            ->whereDate('created_at', today())
            ->latest()
            ->paginate(50);

        // Calculate summary stats
        $totalBets = Bet::where('teller_id', $teller->id)
            ->whereDate('created_at', today())
            ->count();
            
        $summary = [
            'total_bets' => $totalBets,
            'total_amount' => (float) Bet::where('teller_id', $teller->id)
                ->whereDate('created_at', today())
                ->sum('amount'),
            'won_bets' => Bet::where('teller_id', $teller->id)
                ->whereDate('created_at', today())
                ->where('status', 'won')
                ->count(),
            'lost_bets' => Bet::where('teller_id', $teller->id)
                ->whereDate('created_at', today())
                ->where('status', 'lost')
                ->count(),
            'claimed_bets' => Bet::where('teller_id', $teller->id)
                ->whereDate('created_at', today())
                ->where('status', 'claimed')
                ->count(),
            'voided_bets' => Bet::where('teller_id', $teller->id)
                ->whereDate('created_at', today())
                ->where('status', 'void')
                ->count(),
        ];

        return Inertia::render('teller/history', [
            'bets' => $bets,
            'summary' => $summary,
        ]);
    }

    /**
     * Void a bet via QR code scanning
     */
    public function voidBet(Request $request)
    {
        $validated = $request->validate([
            'bet_id' => 'required|exists:bets,id',
        ]);

        $bet = Bet::with(['fight'])->findOrFail($validated['bet_id']);

        // Verify bet belongs to this teller
        if ($bet->teller_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You can only void your own bets.',
            ], 403);
        }

        // Check if bet can be voided (must be active and fight not yet declared)
        if ($bet->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => "Cannot void bet. Current status: {$bet->status}",
            ], 400);
        }

        if ($bet->fight->status === 'declared') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot void bet. Fight result already declared.',
            ], 400);
        }

        // Void the bet and refund amount
        $bet->status = 'void';
        $bet->voided_at = now();
        $bet->voided_by = auth()->id();
        $bet->save();

        // Refund to teller's balance
        $teller = auth()->user();
        $teller->increment('balance', $bet->amount);

        return response()->json([
            'success' => true,
            'message' => 'Bet voided successfully! Amount refunded.',
            'bet' => $bet,
            'refund_amount' => (float) $bet->amount,
        ]);
    }
}