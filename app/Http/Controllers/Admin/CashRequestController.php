<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CashTransfer;
use App\Models\TellerCashAssignment;
use App\Models\Fight;
use Illuminate\Http\Request;
use Inertia\Inertia;
use DB;

class CashRequestController extends Controller
{
    /**
     * Display pending cash requests
     */
    public function index()
    {
        $pendingRequests = CashTransfer::where('type', 'request')
            ->where('status', 'pending')
            ->with(['fromTeller', 'approvedBy'])
            ->latest()
            ->get();

        $processedRequests = CashTransfer::where('type', 'request')
            ->whereIn('status', ['approved', 'declined'])
            ->with(['fromTeller', 'approvedBy'])
            ->latest()
            ->limit(20)
            ->get();

        return Inertia::render('admin/cash-requests/index', [
            'pendingRequests' => $pendingRequests,
            'processedRequests' => $processedRequests,
        ]);
    }

    /**
     * Approve a cash request
     */
    public function approve(Request $request, CashTransfer $cashRequest)
    {
        if ($cashRequest->status !== 'pending') {
            return back()->withErrors(['error' => 'This request has already been processed.']);
        }

        DB::beginTransaction();
        try {
            // Get latest fight
            $latestFight = Fight::orderBy('id', 'desc')->first();
            
            if (!$latestFight) {
                return back()->withErrors(['error' => 'No active fight found.']);
            }

            // Check if revolving funds are sufficient
            if ($latestFight->revolving_funds < $cashRequest->amount) {
                return back()->withErrors(['error' => 'Insufficient revolving funds.']);
            }

            // Get or create teller assignment for latest fight
            $assignment = TellerCashAssignment::firstOrCreate(
                [
                    'teller_id' => $cashRequest->from_teller_id,
                    'fight_id' => $latestFight->id
                ],
                [
                    'assigned_amount' => 0,
                    'current_balance' => 0
                ]
            );

            // Add requested amount to teller's balance
            $assignment->assigned_amount += $cashRequest->amount;
            $assignment->current_balance += $cashRequest->amount;
            $assignment->save();

            // Deduct from revolving funds
            $latestFight->revolving_funds -= $cashRequest->amount;
            $latestFight->save();

            // Update request status
            $cashRequest->status = 'approved';
            $cashRequest->approved_by = auth()->id();
            $cashRequest->save();

            DB::commit();

            return back()->with('success', 'Cash request approved successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to approve request: ' . $e->getMessage()]);
        }
    }

    /**
     * Decline a cash request
     */
    public function decline(Request $request, CashTransfer $cashRequest)
    {
        if ($cashRequest->status !== 'pending') {
            return back()->withErrors(['error' => 'This request has already been processed.']);
        }

        $cashRequest->status = 'declined';
        $cashRequest->approved_by = auth()->id();
        $cashRequest->save();

        return back()->with('success', 'Cash request declined.');
    }
}
