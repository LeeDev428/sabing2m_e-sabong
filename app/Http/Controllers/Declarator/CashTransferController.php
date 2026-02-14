<?php

namespace App\Http\Controllers\Declarator;

use App\Http\Controllers\Controller;
use App\Models\CashTransfer;
use App\Models\Fight;
use App\Models\User;
use App\Models\TellerCashAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CashTransferController extends Controller
{
    /**
     * Display cash transfer monitoring page with real-time teller balances and event filter
     */
    public function index(Request $request)
    {
        $eventFilter = $request->input('event');

        // Get events for dropdown
        $events = Fight::select('event_name')
            ->whereNotNull('event_name')
            ->distinct()
            ->orderBy('event_name')
            ->pluck('event_name');

        // Only teller-to-teller transfers (type='transfer')
        $pending = CashTransfer::with(['fromTeller', 'toTeller', 'fight'])
            ->where('type', 'transfer')
            ->where('status', 'pending')
            ->when($eventFilter, fn($q) => $q->where('event_name', $eventFilter))
            ->latest()
            ->get();

        $approved = CashTransfer::with(['fromTeller', 'toTeller', 'approvedBy', 'fight'])
            ->where('type', 'transfer')
            ->where('status', 'approved')
            ->when($eventFilter, fn($q) => $q->where('event_name', $eventFilter))
            ->latest()
            ->take(50)
            ->get();

        $declined = CashTransfer::with(['fromTeller', 'toTeller', 'approvedBy', 'fight'])
            ->where('type', 'transfer')
            ->where('status', 'declined')
            ->when($eventFilter, fn($q) => $q->where('event_name', $eventFilter))
            ->latest()
            ->take(20)
            ->get();

        $allTransfers = CashTransfer::with(['fromTeller', 'toTeller', 'approvedBy', 'fight'])
            ->where('type', 'transfer')
            ->when($eventFilter, fn($q) => $q->where('event_name', $eventFilter))
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

        return Inertia::render('declarator/cash-transfer', [
            'pending' => $pending,
            'approved' => $approved,
            'declined' => $declined,
            'allTransfers' => $allTransfers,
            'tellers' => $tellers, // Add real-time teller balances            'events' => $events,
            'filters' => ['event' => $eventFilter],        ]);
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
            
            // Mark transfer as approved and track event
            $transfer->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'event_name' => $latestFight->event_name,
                'fight_id' => $latestFight->id,
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

    /**
     * Display teller balances monitoring page (read-only)
     */
    public function tellerBalances()
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
        
        // Get the latest fight (current event)
        $latestFight = \App\Models\Fight::orderBy('id', 'desc')->first();

        return Inertia::render('declarator/teller-balances', [
            'tellers' => $tellers,
            'recentTransfers' => $recentTransfers,
            'currentFight' => $latestFight ? [
                'id' => $latestFight->id,
                'fight_number' => $latestFight->fight_number,
                'event_name' => $latestFight->event_name,
                'revolving_funds' => (float) ($latestFight->revolving_funds ?? 0),
            ] : null,
        ]);
    }
}
