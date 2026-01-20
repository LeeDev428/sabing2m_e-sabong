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
        
        // Only show admin and declarator users as transfer recipients
        $tellers = User::whereIn('role', ['admin', 'declarator'])
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

        return Inertia::render('teller/cash-transfer/index', [
            'tellers' => $tellers,
            'transfers' => $transfers,
            'currentBalance' => $currentTeller->teller_balance,
        ]);
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

        // Only allow transfers to admin or declarator
        if (!in_array($toTeller->role, ['admin', 'declarator'])) {
            return back()->withErrors(['error' => 'Transfers can only be made to admin or declarator']);
        }

        if ($fromTeller->id === $toTeller->id) {
            return back()->withErrors(['error' => 'Cannot transfer to yourself']);
        }

        if ($fromTeller->teller_balance < $request->amount) {
            return back()->withErrors(['error' => 'Insufficient balance']);
        }

        DB::transaction(function () use ($fromTeller, $toTeller, $request) {
            $fromTeller->decrement('teller_balance', $request->amount);
            $toTeller->increment('teller_balance', $request->amount);

            CashTransfer::create([
                'from_teller_id' => $fromTeller->id,
                'to_teller_id' => $toTeller->id,
                'amount' => $request->amount,
                'type' => 'transfer',
                'remarks' => $request->remarks,
            ]);
        });

        return back()->with('success', "Successfully transferred ₱{$request->amount} to {$toTeller->name}");
    }
}

