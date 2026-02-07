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
        $tellers = User::where('role', 'teller')
            ->select('id', 'name', 'email', 'teller_balance')
            ->orderBy('name')
            ->get()
            ->map(function ($teller) {
                // Get real-time current balance from latest teller_cash_assignment
                $latestAssignment = TellerCashAssignment::where('teller_id', $teller->id)
                    ->orderBy('id', 'desc')
                    ->first();
                
                // Override with actual current balance (real-time)
                $teller->teller_balance = $latestAssignment ? $latestAssignment->current_balance : 0;
                return $teller;
            });

        $recentTransfers = CashTransfer::with(['fromTeller', 'toTeller', 'approvedBy'])
            ->latest()
            ->limit(20)
            ->get();

        return Inertia::render('admin/teller-balances/index', [
            'tellers' => $tellers,
            'recentTransfers' => $recentTransfers,
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
}
