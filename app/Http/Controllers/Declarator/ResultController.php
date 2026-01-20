<?php

namespace App\Http\Controllers\Declarator;

use App\Http\Controllers\Controller;
use App\Models\Bet;
use App\Models\Fight;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ResultController extends Controller
{
    public function pending()
    {
        $pending_fights = Fight::whereIn('status', ['open', 'lastcall', 'closed'])
            ->with(['creator'])
            ->latest()
            ->get();

        return Inertia::render('declarator/pending', [
            'pending_fights' => $pending_fights,
        ]);
    }

    public function declared()
    {
        // Show all active fights (not just result_declared) - same as admin fights
        $declared_fights = Fight::whereNotIn('status', ['cancelled'])
            ->with(['creator', 'declarator'])
            ->latest()
            ->get()
            ->map(function($fight) {
                $fight->total_bets = $fight->bets()->count();
                $fight->total_payouts = $fight->bets()->where('status', 'won')->sum('actual_payout');
                $fight->declared_at = $fight->result_declared_at ?? $fight->updated_at;
                
                // Add bet control data
                $fight->total_meron_bets = $fight->bets()->where('side', 'meron')->sum('amount');
                $fight->total_wala_bets = $fight->bets()->where('side', 'wala')->sum('amount');
                
                return $fight;
            })
            ->values();

        return Inertia::render('declarator/declared', [
            'declared_fights' => $declared_fights,
        ]);
    }

    public function history()
    {
        $history = Fight::where('status', 'result_declared')
            ->with(['creator'])
            ->withCount('bets')
            ->latest()
            ->get()
            ->map(function($fight) {
                $fight->meron_total = $fight->bets()->where('side', 'meron')->sum('amount');
                $fight->wala_total = $fight->bets()->where('side', 'wala')->sum('amount');
                $fight->draw_total = $fight->bets()->where('side', 'draw')->sum('amount');
                $fight->total_payouts = $fight->bets()->where('status', 'won')->sum('actual_payout');
                $fight->declared_at = $fight->result_declared_at ?? $fight->updated_at;
                return $fight;
            });

        return Inertia::render('declarator/history', [
            'history' => $history,
        ]);
    }

    public function index()
    {
        $fights = Fight::whereIn('status', ['betting_closed'])
            ->with(['creator'])
            ->latest()
            ->get();

        return Inertia::render('declarator/fights/index', [
            'fights' => $fights,
        ]);
    }

    public function declare(Request $request, Fight $fight)
    {
        if (!in_array($fight->status, ['closed', 'lastcall'])) {
            return redirect()->back()
                ->with('error', 'Can only declare results for closed fights.');
        }

        $validated = $request->validate([
            'result' => 'required|in:meron,wala,draw,cancelled',
            'remarks' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($fight, $validated) {
            // Update fight result
            $fight->update([
                'result' => $validated['result'],
                'remarks' => $validated['remarks'] ?? null,
                'status' => 'result_declared',
                'result_declared_at' => now(),
                'declared_by' => auth()->id(),
            ]);

            // Process payouts
            $this->processPayouts($fight, $validated['result']);

            // Auto-add and open next fight
            $this->autoOpenNextFight($fight);
        });

        return redirect()->back()
            ->with('success', 'Result declared successfully. Next fight opened automatically.');
    }

    /**
     * Automatically find and open the next pending fight
     */
    private function autoOpenNextFight(Fight $currentFight)
    {
        // Find the next standby fight with higher fight number in the same event
        $nextFight = Fight::where('status', 'standby')
            ->where('fight_number', '>', $currentFight->fight_number)
            ->orderBy('fight_number', 'asc')
            ->first();

        // If no fight in current sequence, get the earliest standby fight
        if (!$nextFight) {
            $nextFight = Fight::where('status', 'standby')
                ->orderBy('fight_number', 'asc')
                ->first();
        }

        // Open the next fight automatically with betting enabled for both sides
        if ($nextFight) {
            $nextFight->update([
                'status' => 'open',
                'betting_opened_at' => now(),
                'meron_betting_open' => true,  // Auto-enable Meron betting
                'wala_betting_open' => true,   // Auto-enable Wala betting
            ]);
        }
    }

    public function changeResult(Request $request, Fight $fight)
    {
        if ($fight->status !== 'result_declared') {
            return redirect()->back()
                ->with('error', 'Can only change results for declared fights.');
        }

        $validated = $request->validate([
            'new_result' => 'required|in:meron,wala,draw,cancelled',
            'reason' => 'required|string|max:500',
        ]);

        DB::transaction(function () use ($fight, $validated) {
            $oldResult = $fight->result;
            
            // Reset all bets to active status
            Bet::where('fight_id', $fight->id)
                ->whereIn('status', ['won', 'lost', 'refunded'])
                ->update([
                    'status' => 'active',
                    'actual_payout' => null,
                ]);

            // Update fight with new result and audit trail
            $auditMessage = sprintf(
                "Result changed from '%s' to '%s' by %s. Reason: %s",
                strtoupper($oldResult ?? 'None'),
                strtoupper($validated['new_result']),
                auth()->user()->name,
                $validated['reason']
            );

            $fight->update([
                'result' => $validated['new_result'],
                'remarks' => $auditMessage,
                'declared_by' => auth()->id(),
                'result_declared_at' => now(),
            ]);

            // Reprocess payouts with new result
            $this->processPayouts($fight, $validated['new_result']);
        });

        return redirect()->back()
            ->with('success', 'Result changed successfully. Payouts recalculated.');
    }

    private function processPayouts(Fight $fight, string $result)
    {
        if ($result === 'cancelled' || $result === 'draw') {
            // Refund all bets
            Bet::where('fight_id', $fight->id)
                ->where('status', 'active')
                ->update([
                    'status' => 'refunded',
                    'actual_payout' => DB::raw('amount'),
                ]);
        } else {
            // Calculate total pot and commission
            $totalPot = (float) Bet::where('fight_id', $fight->id)
                ->where('status', 'active')
                ->sum('amount');
            
            // Get commission from settings (dynamic)
            $commissionPercentage = $fight->commission_percentage ?? Setting::get('commission_percentage', 7.5);
            $commission = $totalPot * ($commissionPercentage / 100);
            $netPot = $totalPot - $commission;

            // Get total bets on winning side
            $winningTotal = (float) Bet::where('fight_id', $fight->id)
                ->where('status', 'active')
                ->where('side', $result)
                ->sum('amount');

            // Calculate payout multiplier after commission
            // Net Payout = (Net Pot / Winning Side Total) * Bet Amount
            $payoutMultiplier = $winningTotal > 0 ? ($netPot / $winningTotal) : 0;

            // Mark winning side with commission-adjusted payouts
            Bet::where('fight_id', $fight->id)
                ->where('status', 'active')
                ->where('side', $result)
                ->get()
                ->each(function ($bet) use ($payoutMultiplier) {
                    $bet->update([
                        'status' => 'won',
                        'actual_payout' => round($bet->amount * $payoutMultiplier, 2),
                    ]);
                });

            // Mark losing side
            $losingSide = $result === 'meron' ? 'wala' : 'meron';
            Bet::where('fight_id', $fight->id)
                ->where('status', 'active')
                ->where('side', $losingSide)
                ->update([
                    'status' => 'lost',
                    'actual_payout' => 0,
                ]);
        }
    }

    public function updateStatus(Request $request, Fight $fight)
    {
        $validated = $request->validate([
            'status' => 'required|in:standby,open,lastcall,closed',
        ]);

        $fight->update([
            'status' => $validated['status'],
        ]);

        return redirect()->back()
            ->with('success', 'Fight status updated successfully.');
    }
}
