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
        // Get the latest fight (current event)
        $latestFight = \App\Models\Fight::orderBy('id', 'desc')->first();
        
        $tellers = User::where('role', 'teller')
            ->select('id', 'name', 'email', 'teller_balance')
            ->orderBy('name')
            ->get()
            ->map(function ($teller) {
                // Get balance from latest assignment (regardless of fight) - consistent with declarator page
                $latestAssignment = TellerCashAssignment::where('teller_id', $teller->id)
                    ->orderBy('id', 'desc')
                    ->first();
                
                $teller->teller_balance = $latestAssignment ? $latestAssignment->current_balance : 0;
                return $teller;
            });

        $recentTransfers = CashTransfer::with(['fromTeller', 'toTeller', 'approvedBy'])
            ->latest()
            ->paginate(20);

        return Inertia::render('admin/teller-balances/index', [
            'tellers' => $tellers,
            'recentTransfers' => $recentTransfers,
            'currentFight' => $latestFight ? [
                'id' => $latestFight->id,
                'fight_number' => $latestFight->fight_number,
                'event_name' => $latestFight->event_name,
            ] : null,
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
                ]
            );
            
            $oldBalance = $currentAssignment->assigned_amount;
            $newBalance = $request->amount;
            
            // VALIDATION: Check if total assigned balance would exceed event's revolving fund
            $revolvingFund = $currentFight->revolving_funds ?? 0;
            
            // Get total assigned for OTHER tellers in current event (excluding this teller)
            $totalAssignedOthers = TellerCashAssignment::whereHas('fight', function ($query) use ($currentFight) {
                $query->where('event_name', $currentFight->event_name)
                      ->where('event_date', $currentFight->event_date);
            })
            ->where('teller_id', '!=', $user->id)
            ->sum('assigned_amount');
            
            // Calculate what total would be with new balance
            $newTotal = $totalAssignedOthers + $newBalance;
            
            if ($newTotal > $revolvingFund) {
                throw new \Exception(
                    "Cannot set balance to ₱" . number_format($newBalance, 2) . ". " .
                    "Total assigned would be ₱" . number_format($newTotal, 2) . " " .
                    "which exceeds event's revolving fund of ₱" . number_format($revolvingFund, 2) . "."
                );
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
                'amount' => abs($newBalance - $oldBalance),
                'type' => 'initial_balance',
                'remarks' => $request->remarks ?? "Balance set from ₱{$oldBalance} to ₱{$newBalance}",
                'approved_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Teller balance updated successfully');
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

        DB::transaction(function () use ($user, $request) {
            // Get the CURRENT/LATEST fight to assign balance to
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
                ]
            );
            
            // VALIDATION: Check if total assigned balance would exceed event's revolving fund
            $revolvingFund = $currentFight->revolving_funds ?? 0;
            
            // Get total assigned balance for ALL tellers in current event
            $totalAssignedInEvent = TellerCashAssignment::whereHas('fight', function ($query) use ($currentFight) {
                $query->where('event_name', $currentFight->event_name)
                      ->where('event_date', $currentFight->event_date);
            })->sum('assigned_amount');
            
            // Calculate what total would be after adding this amount
            $newTotal = $totalAssignedInEvent + $request->amount;
            
            if ($newTotal > $revolvingFund) {
                throw new \Exception(
                    "Cannot add ₱" . number_format($request->amount, 2) . ". " .
                    "Total assigned (₱" . number_format($totalAssignedInEvent, 2) . " + ₱" . number_format($request->amount, 2) . " = ₱" . number_format($newTotal, 2) . ") " .
                    "would exceed event's revolving fund of ₱" . number_format($revolvingFund, 2) . "."
                );
            }
            
            // Add to current balance for THIS fight
            $currentAssignment->update([
                'current_balance' => $currentAssignment->current_balance + $request->amount,
                'assigned_amount' => $currentAssignment->assigned_amount + $request->amount,
            ]);
            
            // Also update the deprecated user.teller_balance for backwards compatibility
            $user->increment('teller_balance', $request->amount);

            CashTransfer::create([
                'from_teller_id' => $user->id,
                'to_teller_id' => $user->id,
                'amount' => $request->amount,
                'type' => 'initial_balance',
                'remarks' => $request->remarks ?? "Admin added ₱{$request->amount}",
                'approved_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Balance added successfully');
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
            // Get the CURRENT/LATEST fight
            $currentFight = \App\Models\Fight::orderBy('id', 'desc')->first();
            
            if (!$currentFight) {
                throw new \Exception('No fights found. Please create a fight first.');
            }
            
            // Find assignment for CURRENT fight
            $currentAssignment = TellerCashAssignment::where('teller_id', $user->id)
                ->where('fight_id', $currentFight->id)
                ->first();
            
            if (!$currentAssignment) {
                throw new \Exception('No balance assignment found for current fight.');
            }
            
            // Deduct from current balance
            $newBalance = $currentAssignment->current_balance - $request->amount;
            if ($newBalance < 0) {
                throw new \Exception('Insufficient balance to deduct');
            }
            
            $currentAssignment->update([
                'current_balance' => $newBalance,
            ]);
            
            // Also update the deprecated user.teller_balance for backwards compatibility
            if ($user->teller_balance < $request->amount) {
                throw new \Exception('Insufficient balance to deduct');
            }
            $user->decrement('teller_balance', $request->amount);

            CashTransfer::create([
                'from_teller_id' => $user->id,
                'to_teller_id' => $user->id,
                'amount' => $request->amount,
                'type' => 'deduction',
                'remarks' => $request->remarks ?? "Admin deducted ₱{$request->amount}",
                'approved_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Balance deducted successfully');
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
            foreach ($tellers as $teller) {
                CashTransfer::create([
                    'from_teller_id' => $teller->id,
                    'to_teller_id' => $teller->id,
                    'amount' => 0,
                    'type' => 'reset',
                    'remarks' => 'All balances reset for new event by admin',
                    'approved_by' => auth()->id(),
                ]);
            }
        });

        return back()->with('success', 'All teller balances have been reset to ₱0');
    }
}
