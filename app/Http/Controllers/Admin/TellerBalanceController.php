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
            ->map(function ($teller) use ($latestFight) {
                // ONLY show balance for CURRENT/LATEST fight
                // If new event/fight created, this will show ₱0 until assigned
                if ($latestFight) {
                    $currentAssignment = TellerCashAssignment::where('teller_id', $teller->id)
                        ->where('fight_id', $latestFight->id)
                        ->first();
                    
                    $teller->teller_balance = $currentAssignment ? $currentAssignment->current_balance : 0;
                } else {
                    $teller->teller_balance = 0;
                }
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
            $oldBalance = $user->teller_balance;
            $newBalance = $request->amount;
            
            $user->update([
                'teller_balance' => $newBalance,
            ]);

            // Record as initial balance transfer
            CashTransfer::create([
                'from_teller_id' => $user->id,
                'to_teller_id' => $user->id,
                'amount' => abs($newBalance - $oldBalance),
                'type' => 'initial_balance',
                'remarks' => $request->remarks ?? "Balance set from {$oldBalance} to {$newBalance}",
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
            // Get the latest teller cash assignment to update real-time balance
            $latestAssignment = TellerCashAssignment::where('teller_id', $user->id)
                ->orderBy('id', 'desc')
                ->first();
            
            if ($latestAssignment) {
                // Add to existing balance
                $latestAssignment->update([
                    'current_balance' => $latestAssignment->current_balance + $request->amount,
                ]);
            }
            
            // Also update the deprecated user.teller_balance for backwards compatibility
            $user->increment('teller_balance', $request->amount);

            CashTransfer::create([
                'from_teller_id' => $user->id,
                'to_teller_id' => $user->id,
                'amount' => $request->amount,
                'type' => 'initial_balance',
                'remarks' => $request->remarks ?? "Admin added balance",
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
            // Get the latest teller cash assignment to update real-time balance
            $latestAssignment = TellerCashAssignment::where('teller_id', $user->id)
                ->orderBy('id', 'desc')
                ->first();
            
            if ($latestAssignment) {
                // Deduct from existing balance
                $newBalance = $latestAssignment->current_balance - $request->amount;
                if ($newBalance < 0) {
                    throw new \Exception('Insufficient balance to deduct');
                }
                $latestAssignment->update([
                    'current_balance' => $newBalance,
                ]);
            }
            
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
                'remarks' => $request->remarks ?? "Admin deducted balance",
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
