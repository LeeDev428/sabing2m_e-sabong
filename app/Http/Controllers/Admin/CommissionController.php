<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Fight;
use App\Models\Bet;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use DB;

class CommissionController extends Controller
{
    public function index(Request $request)
    {
        $eventFilter = $request->input('event');

        // Get events for dropdown
        $events = Fight::select('event_name')
            ->whereNotNull('event_name')
            ->distinct()
            ->orderBy('event_name')
            ->pluck('event_name');

        // Get fights with commission data
        $fights = Fight::where('status', 'result_declared')
            ->when($eventFilter, fn($q) => $q->where('event_name', $eventFilter))
            ->with(['declarator'])
            ->latest('result_declared_at')
            ->get()
            ->map(function ($fight) {
                $totalPot = (float) Bet::where('fight_id', $fight->id)
                    ->where('status', '!=', 'voided')
                    ->sum('amount');
                
                $commission = $totalPot * ($fight->commission_percentage / 100);

                return [
                    'id' => $fight->id,
                    'fight_number' => $fight->fight_number,
                    'event_name' => $fight->event_name,
                    'event_date' => $fight->event_date,
                    'meron_fighter' => $fight->meron_fighter,
                    'wala_fighter' => $fight->wala_fighter,
                    'result' => $fight->result,
                    'result_declared_at' => $fight->result_declared_at,
                    'total_pot' => $totalPot,
                    'commission_percentage' => $fight->commission_percentage,
                    'commission_amount' => $commission,
                    'net_pot' => $totalPot - $commission,
                    'declarator' => $fight->declarator ? $fight->declarator->name : 'N/A',
                ];
            });

        $revolvingFund = 0;
        if ($eventFilter) {
            $eventRecord = Event::where('name', $eventFilter)
                ->latest('event_date')
                ->first();

            if ($eventRecord) {
                $revolvingFund = (float) $eventRecord->revolving_funds;
            } else {
                $latestFightWithEvent = Fight::where('event_name', $eventFilter)
                    ->latest('event_date')
                    ->latest('id')
                    ->first();
                $revolvingFund = (float) ($latestFightWithEvent?->revolving_funds ?? 0);
            }
        } else {
            $latestEvent = Event::latest('event_date')->first();
            if ($latestEvent) {
                $revolvingFund = (float) $latestEvent->revolving_funds;
            } else {
                $latestFight = Fight::latest('event_date')->latest('id')->first();
                $revolvingFund = (float) ($latestFight?->revolving_funds ?? 0);
            }
        }

        // Summary stats
        $stats = [
            'total_commission' => $fights->sum('commission_amount'),
            'total_pot' => $fights->sum('total_pot'),
            'total_fights' => $fights->count(),
            'revolving_fund' => $revolvingFund,
            'overall_profit' => $fights->sum('commission_amount') + $revolvingFund,
        ];

        return Inertia::render('admin/commissions/index', [
            'fights' => $fights,
            'stats' => $stats,
            'events' => $events,
            'filters' => [
                'event' => $eventFilter,
            ],
        ]);
    }
}
