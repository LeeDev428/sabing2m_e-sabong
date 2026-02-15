<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\CashTransfer;
use App\Models\TellerCashAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use DB;

class TellerBalanceController extends Controller
{
    public function index()
    {
        // Get the latest fight to determine current event
        $latestFight = \App\Models\Fight::orderBy('id', 'desc')->first();
        
        // Get all fight IDs for the current event (same event_name)
        $currentEventFightIds = [];
        if ($latestFight && $latestFight->event_name) {
            $currentEventFightIds = \App\Models\Fight::where('event_name', $latestFight->event_name)
                ->pluck('id')
                ->toArray();
        }
        
        $tellers = User::where('role', 'teller')
            ->select('id', 'name', 'email', 'teller_balance')
            ->orderBy('name')
            ->get()
            ->map(function ($teller) use ($latestFight, $currentEventFightIds) {
                // Get balance from latest assignment (regardless of fight) - consistent with declarator page
                $latestAssignment = TellerCashAssignment::where('teller_id', $teller->id)
                    ->orderBy('id', 'desc')
                    ->first();
                
                $teller->teller_balance = $latestAssignment ? $latestAssignment->current_balance : 0;
                
                // Get stats ONLY for current EVENT (all fights in this event)
                if (!empty($currentEventFightIds)) {
                    // Total assigned across all fights in current event
                    $teller->total_assigned = TellerCashAssignment::where('teller_id', $teller->id)
                        ->whereIn('fight_id', $currentEventFightIds)
                        ->sum('assigned_amount') ?? 0;
                    
                    // Total bets for current event
                    $teller->total_bets = \App\Models\Bet::where('teller_id', $teller->id)
                        ->whereIn('fight_id', $currentEventFightIds)
                        ->count();
                    
                    // Total bet amount for current event
                    $teller->total_bet_amount = \App\Models\Bet::where('teller_id', $teller->id)
                        ->whereIn('fight_id', $currentEventFightIds)
                        ->sum('amount') ?? 0;
                } else {
                    $teller->total_assigned = 0;
                    $teller->total_bets = 0;
                    $teller->total_bet_amount = 0;
                }
                
                return $teller;
            });
        
        // Calculate total balance and stats for all tellers (current event only)
        $totalBalance = $tellers->sum('teller_balance');
        $totalAssigned = $tellers->sum('total_assigned');
        $totalBets = $tellers->sum('total_bets');
        $totalBetAmount = $tellers->sum('total_bet_amount');

        // Show only transfers for current event (all fights in this event)
        $recentTransfers = CashTransfer::with(['fromTeller', 'toTeller', 'approvedBy'])
            ->when(!empty($currentEventFightIds), function ($query) use ($currentEventFightIds) {
                return $query->whereIn('fight_id', $currentEventFightIds);
            })
            ->latest()
            ->paginate(20);

        return Inertia::render('admin/teller-balances/index', [
            'tellers' => $tellers,
            'recentTransfers' => $recentTransfers,
            'currentFight' => $latestFight ? [
                'id' => $latestFight->id,
                'fight_number' => $latestFight->fight_number,
                'event_name' => $latestFight->event_name,
                'revolving_funds' => (float) ($latestFight->revolving_funds ?? 0),
            ] : null,
            'stats' => [
                'total_balance' => $totalBalance,
                'total_assigned' => $totalAssigned,
                'total_bets' => $totalBets,
                'total_bet_amount' => $totalBetAmount,
            ],
        ]);
    }

    public function setBalance(Request $request, User $user)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'remarks' => 'nullable|string|max:255',
        ]);

        if ($user->role !== 'teller') {
            return back()->withErrors(['error' => 'User is not a teller']);
        }

        DB::transaction(function () use ($user, $request) {
            // Get the CURRENT/LATEST fight
            $currentFight = \App\Models\Fight::orderBy('id', 'desc')->first();
            
            if (!$currentFight) {
                throw new \Exception('No fights found. Please create a fight first.');
            }
            
            // Find or create assignment for CURRENT fight
            $currentAssignment = TellerCashAssignment::firstOrCreate(
                [
                    'teller_id' => $user->id,
                    'fight_id' => $currentFight->id,
                ],
                [
                    'assigned_amount' => 0,
                    'current_balance' => 0,
                    'assigned_by' => auth()->id(),
                    'status' => 'active',
                ]
            );
            
            $oldBalance = $currentAssignment->assigned_amount;
            $newBalance = $request->amount;
            $difference = $newBalance - $oldBalance;
            
            // VALIDATION & REVOLVING FUND ADJUSTMENT
            $revolvingFund = $currentFight->revolving_funds ?? 0;
            
            if ($difference > 0) {
                // Increasing balance - need to deduct from revolving fund
                if ($difference > $revolvingFund) {
                    throw new \Exception(
                        "Cannot set balance to ₱" . number_format($newBalance, 2) . ". " .
                        "Would need ₱" . number_format($difference, 2) . " more, " .
                        "but only ₱" . number_format($revolvingFund, 2) . " available in revolving fund."
                    );
                }
                $currentFight->decrement('revolving_funds', $difference);
            } else if ($difference < 0) {
                // Decreasing balance - add back to revolving fund
                $currentFight->increment('revolving_funds', abs($difference));
            }
            
            // Update assignment
            $currentAssignment->update([
                'assigned_amount' => $newBalance,
                'current_balance' => $newBalance,
            ]);
            
            // Also update deprecated user.teller_balance
            $user->update([
                'teller_balance' => $newBalance,
            ]);

            // Record as initial balance transfer
            CashTransfer::create([
                'from_teller_id' => $user->id,
                'to_teller_id' => $user->id,
                'amount' => abs($difference),
                'type' => 'initial_balance',
                'remarks' => $request->remarks ?? "Balance set from ₱{$oldBalance} to ₱{$newBalance}",
                'approved_by' => auth()->id(),
                'event_name' => $currentFight?->event_name,
                'fight_id' => $currentFight?->id,
            ]);
        });

        return back()->with('success', 'Teller balance updated and revolving fund adjusted');
    }

    public function addBalance(Request $request, User $user)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'remarks' => 'nullable|string|max:255',
        ]);

        if ($user->role !== 'teller') {
            return back()->withErrors(['error' => 'User is not a teller']);
        }

        // Get the CURRENT/LATEST fight to assign balance to
        $currentFight = \App\Models\Fight::orderBy('id', 'desc')->first();
        
        if (!$currentFight) {
            return back()->withErrors(['error' => 'No fights found. Please create a fight first.']);
        }
        
        // VALIDATION: Check if adding amount would exceed revolving fund
        $revolvingFund = $currentFight->revolving_funds ?? 0;
        
        if ($request->amount > $revolvingFund) {
            return back()->withErrors([
                'amount' => "Cannot add ₱" . number_format($request->amount, 2) . ". " .
                           "Insufficient revolving funds. Available: ₱" . number_format($revolvingFund, 2) . "."
            ]);
        }

        DB::transaction(function () use ($user, $request, $currentFight) {
            
            // Find or create assignment for CURRENT fight
            $currentAssignment = TellerCashAssignment::firstOrCreate(
                [
                    'teller_id' => $user->id,
                    'fight_id' => $currentFight->id,
                ],
                [
                    'assigned_amount' => 0,
                    'current_balance' => 0,
                    'assigned_by' => auth()->id(),
                    'status' => 'active',
                ]
            );
            
            // Add to current balance for THIS fight
            $currentAssignment->update([
                'current_balance' => $currentAssignment->current_balance + $request->amount,
                'assigned_amount' => $currentAssignment->assigned_amount + $request->amount,
            ]);
            
            // DEDUCT from revolving fund
            $currentFight->decrement('revolving_funds', $request->amount);
            
            // Also update the deprecated user.teller_balance for backwards compatibility
            $user->increment('teller_balance', $request->amount);

            CashTransfer::create([
                'from_teller_id' => $user->id,
                'to_teller_id' => $user->id,
                'amount' => $request->amount,
                'type' => 'initial_balance',
                'remarks' => $request->remarks ?? "Admin added ₱{$request->amount}",
                'approved_by' => auth()->id(),
                'event_name' => $currentFight?->event_name,
                'fight_id' => $currentFight?->id,
            ]);
        });

        return back()->with('success', 'Balance added successfully and revolving fund deducted');
    }

    public function deductBalance(Request $request, User $user)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'remarks' => 'nullable|string|max:255',
        ]);

        if ($user->role !== 'teller') {
            return back()->withErrors(['error' => 'User is not a teller']);
        }

        DB::transaction(function () use ($user, $request) {
            // Get LATEST assignment for this teller (regardless of fight)
            $latestAssignment = TellerCashAssignment::where('teller_id', $user->id)
                ->orderBy('id', 'desc')
                ->first();
            
            if (!$latestAssignment) {
                throw new \Exception('No balance assignment found for this teller.');
            }
            
            // Deduct from current balance
            $newBalance = $latestAssignment->current_balance - $request->amount;
            if ($newBalance < 0) {
                throw new \Exception('Insufficient balance to deduct. Current balance: ₱' . number_format($latestAssignment->current_balance, 2));
            }
            
            $latestAssignment->update([
                'current_balance' => $newBalance,
            ]);
            
            // ADD back to revolving fund (returned to pool)
            $currentFight = \App\Models\Fight::orderBy('id', 'desc')->first();
            if ($currentFight) {
                $currentFight->increment('revolving_funds', $request->amount);
            }
            
            // Also update the deprecated user.teller_balance for backwards compatibility
            $user->update(['teller_balance' => $newBalance]);

            CashTransfer::create([
                'from_teller_id' => $user->id,
                'to_teller_id' => $user->id,
                'amount' => $request->amount,
                'type' => 'deduction',
                'remarks' => $request->remarks ?? "Admin deducted ₱{$request->amount}",
                'approved_by' => auth()->id(),
                'event_name' => $currentFight?->event_name,
                'fight_id' => $currentFight?->id,
            ]);
        });

        return back()->with('success', 'Balance deducted and returned to revolving fund');
    }

    public function resetAllBalances(Request $request)
    {
        DB::transaction(function () use ($request) {
            // Reset all teller_cash_assignments to 0
            TellerCashAssignment::query()->update(['current_balance' => 0]);
            
            // Reset all teller balances in users table
            User::where('role', 'teller')->update(['teller_balance' => 0]);
            
            // Log this action for all tellers
            $tellers = User::where('role', 'teller')->get();
            $latestFight = \App\Models\Fight::orderBy('id', 'desc')->first();
            foreach ($tellers as $teller) {
                CashTransfer::create([
                    'from_teller_id' => $teller->id,
                    'to_teller_id' => $teller->id,
                    'amount' => 0,
                    'type' => 'reset',
                    'remarks' => 'All balances reset for new event by admin',
                    'approved_by' => auth()->id(),
                    'event_name' => $latestFight?->event_name,
                    'fight_id' => $latestFight?->id,
                ]);
            }
        });

        return back()->with('success', 'All teller balances have been reset to ₱0');
    }
}
