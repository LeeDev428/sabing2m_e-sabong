<?php

namespace App\Http\Controllers\Teller;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function cashIn(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'remarks' => 'nullable|string|max:500',
        ]);

        $teller = auth()->user();
        
        // Update teller balance
        $teller->teller_balance += $validated['amount'];
        $teller->save();

        // Create transaction record
        Transaction::create([
            'teller_id' => auth()->id(),
            'type' => 'cash_in',
            'amount' => $validated['amount'],
            'remarks' => $validated['remarks'] ?? null,
        ]);

        return redirect()->back()
            ->with('success', 'Cash in recorded successfully.');
    }

    public function cashOut(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'remarks' => 'nullable|string|max:500',
        ]);

        $teller = auth()->user();

        // Check if teller has sufficient balance
        if ($teller->teller_balance < $validated['amount']) {
            return redirect()->back()
                ->with('error', 'Insufficient balance.');
        }
        
        // Update teller balance
        $teller->teller_balance -= $validated['amount'];
        $teller->save();

        // Create transaction record
        Transaction::create([
            'teller_id' => auth()->id(),
            'type' => 'cash_out',
            'amount' => $validated['amount'],
            'remarks' => $validated['remarks'] ?? null,
        ]);

        return redirect()->back()
            ->with('success', 'Cash out recorded successfully.');
    }
}
