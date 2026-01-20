<?php

namespace App\Http\Controllers\Declarator;

use App\Http\Controllers\Controller;
use App\Models\CashTransfer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CashTransferController extends Controller
{
    /**
     * Display cash transfer monitoring page
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

        return Inertia::render('declarator/cash-transfer', [
            'pending' => $pending,
            'approved' => $approved,
            'allTransfers' => $allTransfers,
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
