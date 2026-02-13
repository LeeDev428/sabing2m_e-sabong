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
        $pending = CashTransfer::with(['fromTeller', 'toTeller'])
            ->whereNull('approved_by')
            ->latest()
            ->get();

        $approved = CashTransfer::with(['fromTeller', 'toTeller', 'approvedBy'])
            ->whereNotNull('approved_by')
            ->latest()
            ->take(50)
            ->get();

        $allTransfers = CashTransfer::with(['fromTeller', 'toTeller', 'approvedBy'])
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
            'allTransfers' => $allTransfers,
            'tellers' => $tellers, // Add real-time teller balances
        ]);
    }

    /**
     * Approve a pending cash transfer
     */
    public function approve(CashTransfer $transfer)
    {
        if ($transfer->approved_by) {
            return redirect()->back()
                ->withErrors(['error' => 'Transfer already approved.']);
        }

        $transfer->update([
            'approved_by' => auth()->id(),
        ]);

        return redirect()->back()
            ->with('success', 'Cash transfer approved successfully.');
    }

    /**
     * Reject/delete a pending cash transfer
     */
    public function reject(CashTransfer $transfer)
    {
        if ($transfer->approved_by) {
            return redirect()->back()
                ->withErrors(['error' => 'Cannot reject an already approved transfer.']);
        }

        $transfer->delete();

        return redirect()->back()
            ->with('success', 'Cash transfer rejected and deleted.');
    }
}
