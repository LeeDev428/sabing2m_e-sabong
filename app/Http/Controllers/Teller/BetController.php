<?php

namespace App\Http\Controllers\Teller;

use App\Http\Controllers\Controller;
use App\Models\Bet;
use App\Models\Fight;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'amount' => 'required|numeric|min:100',
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

        if ($validated['side'] === 'draw' && !$fight->canAcceptDrawBets()) {
            return redirect()->back()
                ->with('error', 'Draw betting is temporarily closed by admin.');
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
        // Create or update the teller's cash assignment for this fight
        $assignment = \App\Models\TellerCashAssignment::firstOrCreate(
            [
                'teller_id' => auth()->id(),
                'fight_id' => $validated['fight_id'],
            ],
            [
                'assigned_by' => auth()->id(), // Self-assigned when placing first bet
                'assigned_amount' => 0,
                'current_balance' => 0,
                'status' => 'active',
            ]
        );
        
        $balanceBefore = $assignment->current_balance;
        
        // Always add bet amount to current balance
        $assignment->current_balance += $validated['amount'];
        $assignment->save();

        // Create transaction record for audit trail (using existing fields only)
        \App\Models\Transaction::create([
            'teller_id' => auth()->id(),
            'type' => 'cash_in',
            'amount' => $validated['amount'],
            'remarks' => "Bet placed on {$validated['side']} for Fight #{$fight->fight_number} (Ticket #{$bet->id})",
        ]);

        // Prepare ticket data with fallback for event_name
        $eventName = $fight->event_name ?? 'SABONG EVENT';
        
        \Log::info('🥊 Fight data:', [
            'fight_id' => $fight->id,
            'fight_number' => $fight->fight_number,
            'event_name_raw' => $fight->event_name,
            'event_name_final' => $eventName,
        ]);
        
        $ticketData = [
            'id' => $bet->id,
            'ticket_id' => $bet->ticket_id,
            'fight_number' => $fight->fight_number,
            'potential_payout' => $bet->potential_payout,
            'amount' => $bet->amount,
            'odds' => $bet->odds,
            'side' => $bet->side,
            'event_name' => $eventName,
        ];

        // Store ticket in persistent session (not flash) so polling doesn't consume it
        session()->put('last_ticket_' . auth()->id(), $ticketData);
        \Log::info('💾 Stored ticket in session:', ['key' => 'last_ticket_' . auth()->id(), 'ticket' => $ticketData]);

        // Return with success message
        return back()->with('success', 'Bet placed successfully.');
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
            'draw_betting_open' => $fight->draw_betting_open,
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
        
        // ALWAYS show balance from CURRENT fight assignment, regardless of fight status
        $latestFight = \App\Models\Fight::orderBy('id', 'desc')->first();
        $latestAssignment = null;
        
        if ($latestFight) {
            $latestAssignment = \App\Models\TellerCashAssignment::where('teller_id', $teller->id)
                ->where('fight_id', $latestFight->id)
                ->first();
        }
        
        $balance = $latestAssignment ? (float) $latestAssignment->current_balance : 0;
        
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
        return Inertia::render('teller/payout-scan', $this->getPayoutTrackingPayload());
    }

    /**
     * Process payout claim via QR code
     */
    public function claimPayout(Request $request)
    {
        $validated = $request->validate([
            'ticket_id' => 'required|string|exists:bets,ticket_id',
        ]);

        $bet = Bet::with(['fight', 'teller'])->where('ticket_id', $validated['ticket_id'])->firstOrFail();
        $trackingData = $this->getPayoutTrackingPayload();

        // Check if bet has already been claimed or refunded
        if ($bet->status === 'claimed') {
            return Inertia::render('teller/payout-scan', array_merge([
                'message' => 'This bet has already been claimed.',
                'claimData' => [
                    'amount' => $bet->actual_payout ?? 0,
                    'bet_by' => $bet->teller->name ?? 'Customer',
                    'claimed_by' => auth()->user()->name,
                    'status' => 'Already Claimed',
                    'already_claimed' => true,
                ]
            ], $trackingData));
        }

        // Check if bet is already refunded (scanned before)
        if ($bet->status === 'refund_claimed') {
            return Inertia::render('teller/payout-scan', array_merge([
                'message' => 'This ticket has already been refunded.',
                'claimData' => [
                    'amount' => $bet->actual_payout ?? $bet->amount,
                    'bet_by' => $bet->teller->name ?? 'Customer',
                    'claimed_by' => auth()->user()->name,
                    'status' => 'Already Refunded',
                    'already_claimed' => true,
                ]
            ], $trackingData));
        }

        // Handle REFUND flow (draw or cancelled fights)
        if ($bet->status === 'refunded') {
            $refundAmount = (float) $bet->amount; // Refund full bet amount

            // Mark as refund claimed
            $bet->status = 'claimed';
            $bet->claimed_at = now();
            $bet->claimed_by = auth()->id();
            $bet->actual_payout = $refundAmount;
            $bet->save();

            // Deduct refund from teller's LATEST cash assignment (teller gives cash back from current balance)
            $latestFight = \App\Models\Fight::orderBy('id', 'desc')->first();
            if ($latestFight) {
                $assignment = \App\Models\TellerCashAssignment::where('teller_id', auth()->id())
                    ->where('fight_id', $latestFight->id)
                    ->first();

                if ($assignment) {
                    $assignment->current_balance -= $refundAmount;
                    $assignment->save();
                }
            }

            // Determine refund reason from fight result or default to 'CANCELLED'
            $fightResult = $bet->fight ? $bet->fight->result : null;
            $reasonText = 'CANCELLED'; // Default
            
            if ($fightResult === 'draw') {
                $reasonText = 'DRAW';
            } elseif ($fightResult === 'cancelled') {
                $reasonText = 'CANCELLED';
            }

            $trackingData = $this->getPayoutTrackingPayload();

            \Log::info("💰 Refund claimed: {$bet->ticket_id}, Amount: ₱{$refundAmount}, Reason: {$reasonText}");

            return Inertia::render('teller/payout-scan', [
                'message' => "Refund processed! ₱" . number_format($refundAmount, 2) . " returned to customer ({$reasonText}).",
                'claimData' => [
                    'amount' => (float) $refundAmount,
                    'bet_by' => $bet->teller ? $bet->teller->name : 'Customer',
                    'claimed_by' => auth()->user()->name,
                    'status' => 'Refunded',
                    'already_claimed' => false,
                    'ticket_id' => $bet->ticket_id,
                    'fight_number' => $bet->fight ? (int) $bet->fight->fight_number : 0,
                    'side' => $bet->side,
                    'bet_amount' => (float) $bet->amount,
                    'odds' => (float) 1.0, // Refunds have 1:1 odds
                    'event_name' => ($bet->fight && $bet->fight->event_name) ? $bet->fight->event_name : null,
                    'is_refund' => true,
                    'refund_reason' => $reasonText,
                ]
            ] + $trackingData);
        }

        // Check if bet is a winning bet
        if ($bet->status !== 'won') {
            $statusMessage = $bet->status === 'lost' ? 'Lost' : 'Not eligible for payout';
            return Inertia::render('teller/payout-scan', [
                'message' => "Cannot claim payout. This bet {$statusMessage}.",
            ] + $trackingData);
        }

        // Use actual_payout (calculated with FINAL closing odds when result was declared)
        // NOT potential_payout (calculated with odds at time of bet)
        $payoutAmount = $bet->actual_payout ?? $bet->potential_payout ?? $bet->amount;
        
        // Calculate the FINAL odds that were used (actual_payout / amount)
        $finalOdds = $bet->amount > 0 ? ($bet->actual_payout / $bet->amount) : 1.0;

        // Check if teller has enough funds to process payout
        $latestFight = \App\Models\Fight::orderBy('id', 'desc')->first();
        if ($latestFight) {
            $assignment = \App\Models\TellerCashAssignment::where('teller_id', auth()->id())
                ->where('fight_id', $latestFight->id)
                ->first();
            
            if ($assignment && $assignment->current_balance < $payoutAmount) {
                return Inertia::render('teller/payout-scan', [
                    'message' => "⚠️ Insufficient funds to process payout. Available: ₱" . number_format($assignment->current_balance, 2) . ", Required: ₱" . number_format($payoutAmount, 2),
                ] + $trackingData);
            }
        }

        // Update bet status to claimed
        $bet->status = 'claimed';
        $bet->claimed_at = now();
        $bet->claimed_by = auth()->id();
        $bet->save();

        // Deduct payout from teller's LATEST cash assignment (teller pays out from current balance)
        $latestFight = \App\Models\Fight::orderBy('id', 'desc')->first();
        if ($latestFight) {
            $assignment = \App\Models\TellerCashAssignment::where('teller_id', auth()->id())
                ->where('fight_id', $latestFight->id)
                ->first();
            
            if ($assignment) {
                $assignment->current_balance -= $payoutAmount;
                $assignment->save();
                
                \Log::info("💸 Payout deducted from teller's latest assignment (Fight #{$latestFight->fight_number}): ₱{$payoutAmount}");
            }
        }

        \Log::info("✅ Payout claimed: {$bet->ticket_id}, Amount: ₱{$payoutAmount}");

        $trackingData = $this->getPayoutTrackingPayload();

        return Inertia::render('teller/payout-scan', [
            'message' => "Payout claimed successfully! ₱{$payoutAmount} paid to customer.",
            'claimData' => [
                'amount' => $payoutAmount,
                'bet_by' => $bet->teller->name ?? 'Customer',
                'claimed_by' => auth()->user()->name,
                'status' => 'Claimed',
                'already_claimed' => false,
                'ticket_id' => $bet->ticket_id,
                'fight_number' => $bet->fight->fight_number ?? 0,
                'side' => $bet->side,
                'bet_amount' => (float) $bet->amount,
                'odds' => (float) $finalOdds,  // Use FINAL closing odds, not bet-time odds
                'event_name' => $bet->fight->event_name ?? null,
            ]
        ] + $trackingData);
    }

    private function getPayoutTrackingPayload(): array
    {
        $winningBase = Bet::query()
            ->with([
                'fight:id,fight_number,event_name',
                'teller:id,name',
                'claimer:id,name',
            ])
            ->whereHas('fight', function ($query) {
                $query->where('status', 'result_declared')
                    ->whereIn('result', ['meron', 'wala'])
                    ->whereColumn('fights.result', 'bets.side');
            });

        $winningQuery = (clone $winningBase)->whereIn('status', ['won', 'claimed']);
        $unclaimedQuery = (clone $winningBase)->where('status', 'won');
        $paidOutQuery = (clone $winningBase)->where('status', 'claimed');

        $unclaimedTickets = (clone $unclaimedQuery)
            ->latest('updated_at')
            ->limit(10)
            ->get()
            ->map(function ($bet) {
                return [
                    'ticket_id' => $bet->ticket_id,
                    'fight_number' => $bet->fight?->fight_number,
                    'event_name' => $bet->fight?->event_name,
                    'side' => $bet->side,
                    'payout_amount' => (float) ($bet->actual_payout ?? 0),
                    'sold_by' => $bet->teller?->name,
                    'created_at' => $bet->created_at,
                ];
            });

        $paidOutTickets = (clone $paidOutQuery)
            ->latest('claimed_at')
            ->limit(10)
            ->get()
            ->map(function ($bet) {
                return [
                    'ticket_id' => $bet->ticket_id,
                    'fight_number' => $bet->fight?->fight_number,
                    'event_name' => $bet->fight?->event_name,
                    'side' => $bet->side,
                    'payout_amount' => (float) ($bet->actual_payout ?? 0),
                    'sold_by' => $bet->teller?->name,
                    'claimed_by' => $bet->claimer?->name,
                    'claimed_at' => $bet->claimed_at,
                ];
            });

        return [
            'payoutTracking' => [
                'winning_tickets' => (clone $winningQuery)->count(),
                'winning_amount' => (float) (clone $winningQuery)->sum('actual_payout'),
                'unclaimed_tickets' => (clone $unclaimedQuery)->count(),
                'unclaimed_amount' => (float) (clone $unclaimedQuery)->sum('actual_payout'),
                'paid_out_tickets' => (clone $paidOutQuery)->count(),
                'paid_out_amount' => (float) (clone $paidOutQuery)->sum('actual_payout'),
            ],
            'unclaimedWinningTickets' => $unclaimedTickets,
            'paidOutWinningTickets' => $paidOutTickets,
        ];
    }

    /**
     * Get teller's bet history and summary

    /**
     * Display merged history and summary page
     */
    public function historyAndSummary()
    {
        $teller = auth()->user();

        // Get ALL bets (not just today) with pagination (30 per page)
        $bets = Bet::with(['fight:id,fight_number,meron_fighter,wala_fighter,event_name', 'teller:id,name'])
            ->where('teller_id', $teller->id)
            ->latest()
            ->paginate(30)
            ->through(function ($bet) {
                return [
                    'id' => $bet->id,
                    'ticket_id' => $bet->ticket_id,
                    'fight' => [
                        'fight_number' => $bet->fight->fight_number,
                        'meron_fighter' => $bet->fight->meron_fighter,
                        'wala_fighter' => $bet->fight->wala_fighter,
                        'event_name' => $bet->fight->event_name,
                    ],
                    'side' => $bet->side,
                    'amount' => (float) $bet->amount,
                    'odds' => (float) $bet->odds,
                    'potential_payout' => (float) $bet->potential_payout,
                    'actual_payout' => $bet->actual_payout ? (float) $bet->actual_payout : null,
                    'status' => $bet->status,
                    'created_at' => $bet->created_at,
                ];
            });

        // Get teller's current cash balance from latest assignment
        $latestFight = \App\Models\Fight::orderBy('id', 'desc')->first();
        $latestAssignment = null;
        $cashBalance = 0;
        
        if ($latestFight) {
            $latestAssignment = \App\Models\TellerCashAssignment::where('teller_id', $teller->id)
                ->where('fight_id', $latestFight->id)
                ->first();
            $cashBalance = $latestAssignment ? (float) $latestAssignment->current_balance : 0;
        }
        
        // Calculate summary stats (today's stats only)
        $totalBets = Bet::where('teller_id', $teller->id)
            ->whereDate('created_at', today())
            ->whereNotIn('status', ['voided', 'cancelled', 'refunded'])
            ->count();
            
        $summary = [
            'total_bets' => $totalBets,
            'total_amount' => $cashBalance, // Show actual cash balance, not sum of bets
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
                ->where('status', 'voided')
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
            'ticket_id' => 'required|exists:bets,ticket_id',
        ]);

        $bet = Bet::with(['fight'])->where('ticket_id', $validated['ticket_id'])->firstOrFail();

        // Verify bet belongs to this teller
        if ($bet->teller_id !== auth()->id()) {
            return back()->with('error', 'You can only void your own bets.');
        }

        // Check if bet can be voided (must be active and fight not yet declared)
        if ($bet->status !== 'active') {
            return back()->with('error', "Cannot void bet. Current status: {$bet->status}");
        }

        if ($bet->fight->status === 'declared') {
            return back()->with('error', 'Cannot void bet. Fight result already declared.');
        }

        try {
            DB::beginTransaction();
            
            // Void the bet and refund amount
            $bet->status = 'voided';
            
            // Try to set voided_at and voided_by if columns exist
            try {
                $bet->voided_at = now();
                $bet->voided_by = auth()->id();
            } catch (\Exception $e) {
                \Log::warning("Voided_at/voided_by columns not found, skipping: " . $e->getMessage());
            }
            
            $bet->save();

            // Recalculate odds if auto-odds is enabled
            $fight = $bet->fight;
            if ($fight->auto_odds) {
                $fight->calculateAutoOdds();
            }
            
            // Refund to teller's fight-specific cash assignment
            $assignment = \App\Models\TellerCashAssignment::where('teller_id', auth()->id())
                ->where('fight_id', $bet->fight_id)
                ->first();
            
            if ($assignment) {
                // Subtract the bet amount from current balance (return cash to customer)
                $oldBalance = $assignment->current_balance;
                $assignment->current_balance -= $bet->amount;
                $assignment->save();
                
                \Log::info("✅ Balance updated for void: Old={$oldBalance}, New={$assignment->current_balance}, Deducted={$bet->amount}");
            } else {
                \Log::warning("⚠️ No assignment found for teller " . auth()->id() . " fight {$bet->fight_id}");
            }

            \Log::info("✅ Bet voided: {$bet->ticket_id}, Amount refunded: ₱{$bet->amount}");
            
            DB::commit();

            return back()->with('success', "Bet {$bet->ticket_id} voided successfully! ₱{$bet->amount} refunded to customer.");
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("❌ Void bet failed: " . $e->getMessage(), [
                'ticket_id' => $validated['ticket_id'],
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', "Failed to void bet: " . $e->getMessage());
        }
    }
}