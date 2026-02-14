<?php

namespace App\Http\Controllers\Teller;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\CashTransfer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use DB;

class CashTransferController extends Controller
{
    public function index()
    {
        $currentTeller = auth()->user();
        
        // Only show OTHER tellers as transfer recipients (teller-to-teller only)
        $tellers = User::where('role', 'teller')
            ->where('id', '!=', $currentTeller->id) // Exclude self
            ->select('id', 'name', 'email', 'role')
            ->orderBy('name')
            ->get();

        $transfers = CashTransfer::where(function($query) use ($currentTeller) {
                $query->where('from_teller_id', $currentTeller->id)
                      ->orWhere('to_teller_id', $currentTeller->id);
            })
            ->where('type', 'transfer')
            ->with(['fromTeller', 'toTeller'])
            ->latest()
            ->limit(20)
            ->get();

        // Get current balance from CURRENT fight assignment
        // ALWAYS show balance regardless of fight status (open, closed, standby, etc.)
        $latestFight = \App\Models\Fight::orderBy('id', 'desc')->first();
        $latestAssignment = null;
        
        if ($latestFight) {
            $latestAssignment = \App\Models\TellerCashAssignment::where('teller_id', $currentTeller->id)
                ->where('fight_id', $latestFight->id)
                ->first();
        }
        
        $currentBalance = $latestAssignment ? (float) $latestAssignment->current_balance : 0;

        return Inertia::render('teller/cash-transfer/index', [
            'tellers' => $tellers,
            'transfers' => $transfers,
            'currentBalance' => $currentBalance,
            'latestFight' => $latestFight ? [
                'id' => $latestFight->id,
                'fight_number' => $latestFight->fight_number,
                'revolving_funds' => (float) $latestFight->revolving_funds,
            ] : null,
        ]);
    }

    public function request(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'remarks' => 'nullable|string|max:255',
        ]);

        $fromTeller = auth()->user();

        // Create a cash request (pending approval)
        CashTransfer::create([
            'from_teller_id' => $fromTeller->id,
            'to_teller_id' => $fromTeller->id, // Request for self
            'amount' => $request->amount,
            'type' => 'request',
            'status' => 'pending',
            'remarks' => $request->remarks,
        ]);

        return redirect()->back()->with('success', 'Cash request submitted. Waiting for approval.');
    }

    public function transfer(Request $request)
    {
        $request->validate([
            'to_teller_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:0.01',
            'remarks' => 'nullable|string|max:255',
        ]);

        $fromTeller = auth()->user();
        $toTeller = User::findOrFail($request->to_teller_id);

        // Only allow transfers to other tellers (teller-to-teller only)
        if ($toTeller->role !== 'teller') {
            return back()->withErrors(['error' => 'Transfers can only be made to other tellers']);
        }

        if ($fromTeller->id === $toTeller->id) {
            return back()->withErrors(['error' => 'Cannot transfer to yourself']);
        }

        // Get latest fight for both tellers
        $latestFight = \App\Models\Fight::orderBy('id', 'desc')->first();
        
        if (!$latestFight) {
            return back()->withErrors(['error' => 'No active fight found. Cannot transfer.']);
        }

        // Get current balance from TellerCashAssignment
        $fromAssignment = \App\Models\TellerCashAssignment::where('teller_id', $fromTeller->id)
            ->where('fight_id', $latestFight->id)
            ->first();
        
        $currentBalance = $fromAssignment ? $fromAssignment->current_balance : 0;
        
        if ($currentBalance < $request->amount) {
            return back()->withErrors(['error' => 'Insufficient balance. Current balance: ₱' . number_format($currentBalance, 2)]);
        }

        // Create PENDING transfer request (requires admin/declarator approval)
        CashTransfer::create([
            'from_teller_id' => $fromTeller->id,
            'to_teller_id' => $toTeller->id,
            'amount' => $request->amount,
            'type' => 'transfer',
            'status' => 'pending', // Pending approval
            'remarks' => $request->remarks,
            'approved_by' => null, // Not approved yet
        ]);

        return back()->with('success', "Transfer request submitted for ₱{$request->amount} to {$toTeller->name}. Waiting for admin/declarator approval.");
    }
}

