<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CashTransfer;
use App\Models\User;
use App\Models\TellerCashAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CashTransferController extends Controller
{
    /**
     * Display cash transfer monitoring page with real-time teller balances
     */
    public function index()
    {
        // Only teller-to-teller transfers (type='transfer')
        $pending = CashTransfer::with(['fromTeller', 'toTeller'])
            ->where('type', 'transfer')
            ->where('status', 'pending')
            ->latest()
            ->get();

        $approved = CashTransfer::with(['fromTeller', 'toTeller', 'approvedBy'])
            ->where('type', 'transfer')
            ->where('status', 'approved')
            ->latest()
            ->take(50)
            ->get();

        $declined = CashTransfer::with(['fromTeller', 'toTeller', 'approvedBy'])
            ->where('type', 'transfer')
            ->where('status', 'declined')
            ->latest()
            ->take(20)
            ->get();

        $allTransfers = CashTransfer::with(['fromTeller', 'toTeller', 'approvedBy'])
            ->where('type', 'transfer')
            ->latest()
            ->take(100)
            ->get();

        // Get real-time teller balances for monitoring
        $tellers = User::where('role', 'teller')
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get()
            ->map(function ($teller) {
                // Get real-time current balance from latest teller_cash_assignment
                $latestAssignment = TellerCashAssignment::where('teller_id', $teller->id)
                    ->orderBy('id', 'desc')
                    ->first();
                
                $teller->current_balance = $latestAssignment ? $latestAssignment->current_balance : 0;
                return $teller;
            });

        return Inertia::render('admin/cash-transfer', [
            'pending' => $pending,
            'approved' => $approved,
            'declined' => $declined,
            'allTransfers' => $allTransfers,
            'tellers' => $tellers, // Add real-time teller balances
        ]);
    }

    /**
     * Approve a pending cash transfer
     */
    public function approve(CashTransfer $transfer)
    {
        if ($transfer->status === 'approved') {
            return redirect()->back()
                ->withErrors(['error' => 'Transfer already approved.']);
        }

        if ($transfer->status === 'declined') {
            return redirect()->back()
                ->withErrors(['error' => 'Cannot approve a declined transfer.']);
        }

        \DB::transaction(function () use ($transfer) {
            $fromTeller = $transfer->fromTeller;
            $toTeller = $transfer->toTeller;
            
            // Get latest fight
            $latestFight = \App\Models\Fight::orderBy('id', 'desc')->first();
            
            if (!$latestFight) {
                throw new \Exception('No active fight found.');
            }
            
            // Get FROM teller assignment
            $fromAssignment = TellerCashAssignment::where('teller_id', $fromTeller->id)
                ->where('fight_id', $latestFight->id)
                ->first();
            
            if (!$fromAssignment || $fromAssignment->current_balance < $transfer->amount) {
                throw new \Exception('Sender has insufficient balance.');
            }
            
            // Deduct from sender
            $fromAssignment->decrement('current_balance', $transfer->amount);
            
            // Add to receiver (create if doesn't exist)
            $toAssignment = TellerCashAssignment::firstOrCreate(
                [
                    'teller_id' => $toTeller->id,
                    'fight_id' => $latestFight->id,
                ],
                [
                    'assigned_amount' => 0,
                    'current_balance' => 0,
                    'assigned_by' => auth()->id(),
                    'status' => 'active',
                ]
            );
            $toAssignment->increment('current_balance', $transfer->amount);
            
            // Also update deprecated user.teller_balance for backwards compatibility
            $fromTeller->decrement('teller_balance', $transfer->amount);
            $toTeller->increment('teller_balance', $transfer->amount);
            
            // Mark transfer as approved
            $transfer->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
            ]);
        });

        return redirect()->back()
            ->with('success', 'Cash transfer approved and completed successfully.');
    }

    /**
     * Reject a pending cash transfer
     */
    public function reject(CashTransfer $transfer)
    {
        if ($transfer->status === 'approved') {
            return redirect()->back()
                ->withErrors(['error' => 'Cannot reject an already approved transfer.']);
        }

        if ($transfer->status === 'declined') {
            return redirect()->back()
                ->withErrors(['error' => 'Transfer already declined.']);
        }

        $transfer->update([
            'status' => 'declined',
            'approved_by' => auth()->id(), // Track who rejected it
        ]);

        return redirect()->back()
            ->with('success', 'Cash transfer rejected successfully.');
    }
}
