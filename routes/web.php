<?php

use App\Http\Controllers\Admin\FightController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\BetControlController;
use App\Http\Controllers\Admin\CommissionController;
use App\Http\Controllers\Admin\TellerBalanceController;
use App\Http\Controllers\Admin\TellerController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Teller\BetController;
use App\Http\Controllers\Teller\TransactionController;
use App\Http\Controllers\Teller\CashTransferController;
use App\Http\Controllers\Declarator\ResultController;
use App\Http\Controllers\Declarator\BetControlController as DeclaratorBetControlController;
use App\Http\Controllers\Declarator\FightController as DeclaratorFightController;
use App\Http\Controllers\Declarator\CashTransferController as DeclaratorCashTransferController;
use App\Http\Controllers\BigScreenController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Redirect root to login
Route::get('/', function () {
    return redirect()->route('login');
});

// Big Screen - Public (No Auth Required)
Route::get('/bigscreen', [BigScreenController::class, 'index'])->name('bigscreen');
Route::get('/api/bigscreen', [BigScreenController::class, 'api']);
Route::get('/api/bigscreen/history', [BigScreenController::class, 'history']);

// Role-based dashboard routing
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = auth()->user();
        
        return match ($user->role) {
            'admin' => redirect()->route('admin.dashboard'),
            'declarator' => redirect()->route('declarator.dashboard'),
            'teller' => redirect()->route('teller.dashboard'),
            default => abort(403),
        };
    })->name('dashboard');
});

// Admin Routes
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    Route::resource('fights', FightController::class);
    Route::post('fights/create-next', [FightController::class, 'createNext'])->name('fights.create-next');
    Route::post('fights/{fight}/status', [FightController::class, 'updateStatus'])->name('fights.update-status');
    Route::post('fights/{fight}/funds', [FightController::class, 'updateFunds'])->name('fights.update-funds');
    Route::post('fights/{fight}/open-betting', [FightController::class, 'openBetting'])->name('fights.open-betting');
    Route::post('fights/{fight}/close-betting', [FightController::class, 'closeBetting'])->name('fights.close-betting');
    Route::get('fights/{fight}/declare-result', [FightController::class, 'declareResult'])->name('fights.declare-result');
    Route::post('fights/{fight}/declare-result', [FightController::class, 'storeResult'])->name('fights.store-result');
    
    Route::get('history', [FightController::class, 'history'])->name('history');
    
    Route::resource('users', UserController::class)->except(['create', 'show', 'edit']);
    
    Route::get('transactions', [AdminTransactionController::class, 'index'])->name('transactions.index');
    
    // Bet Controls
    Route::get('bet-controls', [BetControlController::class, 'index'])->name('bet-controls.index');
    Route::post('bet-controls/{fight}/toggle-meron', [BetControlController::class, 'toggleMeron'])->name('bet-controls.toggle-meron');
    Route::post('bet-controls/{fight}/toggle-wala', [BetControlController::class, 'toggleWala'])->name('bet-controls.toggle-wala');
    Route::post('bet-controls/{fight}/commission', [BetControlController::class, 'updateCommission'])->name('bet-controls.commission');
    
    // Commission Reports
    Route::get('commissions', [CommissionController::class, 'index'])->name('commissions.index');
    
    // Settings
    Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
    Route::put('settings/{setting}', [SettingController::class, 'update'])->name('settings.update');
    
    // Tellers API
    Route::get('api/tellers', [TellerController::class, 'getTellers'])->name('api.tellers');
    
    // Teller Balance Management
    Route::get('teller-balances', [TellerBalanceController::class, 'index'])->name('teller-balances.index');
    Route::post('teller-balances/{user}/set', [TellerBalanceController::class, 'setBalance'])->name('teller-balances.set');
    Route::post('teller-balances/{user}/add', [TellerBalanceController::class, 'addBalance'])->name('teller-balances.add');
    
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/export', [ReportController::class, 'export'])->name('reports.export');
});

// Declarator Routes
Route::middleware(['auth', 'verified', 'role:declarator'])->prefix('declarator')->name('declarator.')->group(function () {
    Route::get('dashboard', function () {
        $fights = \App\Models\Fight::with(['creator', 'declarator'])
            ->whereIn('status', ['open', 'lastcall', 'closed', 'result_declared'])
            ->latest()
            ->get();
            
        return Inertia::render('declarator/dashboard', [
            'fights' => $fights,
        ]);
    })->name('dashboard');
    
    Route::get('pending', [ResultController::class, 'pending'])->name('pending');
    Route::get('declared', [ResultController::class, 'declared'])->name('declared');
    Route::get('history', [ResultController::class, 'history'])->name('history');
    Route::post('declare/{fight}', [ResultController::class, 'declare'])->name('declare');
    Route::post('change-result/{fight}', [ResultController::class, 'changeResult'])->name('change-result');
    Route::post('fights/{fight}/status', [ResultController::class, 'updateStatus'])->name('fights.update-status');
    
    // Fight Management
    Route::post('fights/create-next', [DeclaratorFightController::class, 'createNext'])->name('fights.create-next');
    Route::get('fights/{fight}/edit', [DeclaratorFightController::class, 'edit'])->name('fights.edit');
    Route::put('fights/{fight}', [DeclaratorFightController::class, 'update'])->name('fights.update');
    Route::post('fights/{fight}/update-funds', [DeclaratorFightController::class, 'updateFunds'])->name('fights.update-funds');
    
    // Bet Controls
    Route::get('bet-controls', [DeclaratorBetControlController::class, 'index'])->name('bet-controls.index');
    Route::post('bet-controls/{fight}/toggle-meron', [DeclaratorBetControlController::class, 'toggleMeron'])->name('bet-controls.toggle-meron');
    Route::post('bet-controls/{fight}/toggle-wala', [DeclaratorBetControlController::class, 'toggleWala'])->name('bet-controls.toggle-wala');
    Route::post('bet-controls/{fight}/commission', [DeclaratorBetControlController::class, 'updateCommission'])->name('bet-controls.commission');
    
    // Cash Transfer Monitoring
    Route::get('cash-transfer', [DeclaratorCashTransferController::class, 'index'])->name('cash-transfer.index');
    Route::post('cash-transfer/{transfer}/approve', [DeclaratorCashTransferController::class, 'approve'])->name('cash-transfer.approve');
    Route::delete('cash-transfer/{transfer}/reject', [DeclaratorCashTransferController::class, 'reject'])->name('cash-transfer.reject');
});

// Teller Routes
Route::middleware(['auth', 'verified', 'role:teller'])->prefix('teller')->name('teller.')->group(function () {
    Route::get('dashboard', function () {
        $tellerId = auth()->id();
        
        $fights = \App\Models\Fight::with(['creator'])
            ->whereIn('status', ['open', 'lastcall'])
            ->latest()
            ->get()
            ->map(function ($fight) {
                return [
                    'id' => $fight->id,
                    'fight_number' => $fight->fight_number,
                    'meron_fighter' => $fight->meron_fighter,
                    'wala_fighter' => $fight->wala_fighter,
                    'status' => $fight->status,
                    'meron_odds' => $fight->meron_odds,
                    'wala_odds' => $fight->wala_odds,
                    'draw_odds' => $fight->draw_odds,
                    'meron_betting_open' => $fight->meron_betting_open,
                    'wala_betting_open' => $fight->wala_betting_open,
                    'scheduled_at' => $fight->scheduled_at,
                    'created_at' => $fight->created_at,
                ];
            });
        
        // Get teller's bet statistics
        $tellerBets = \App\Models\Bet::where('teller_id', $tellerId);
        
        $summary = [
            'total_bets' => $tellerBets->count(),
            'total_bet_amount' => $tellerBets->sum('amount'),
            'total_payouts' => $tellerBets->where('status', 'won')->sum('actual_payout'),
            'active_bets' => $tellerBets->where('status', 'active')->sum('amount'),
            'meron_bets' => $tellerBets->where('side', 'meron')->count(),
            'wala_bets' => $tellerBets->where('side', 'wala')->count(),
            'draw_bets' => $tellerBets->where('side', 'draw')->count(),
        ];
            
        // Calculate teller's total cash balance from all fight assignments
        $tellerBalance = \App\Models\TellerCashAssignment::where('teller_id', $tellerId)
            ->sum('current_balance');
        
        return Inertia::render('teller/dashboard', [
            'fights' => $fights,
            'summary' => $summary,
            'tellerBalance' => (float) $tellerBalance,
        ]);
    })->name('dashboard');
    
    Route::get('fights', [BetController::class, 'index'])->name('fights.index');
    Route::post('bets', [BetController::class, 'store'])->name('bets.store');
    Route::get('bets/history', [BetController::class, 'history'])->name('bets.history');
    
    // Payout Scanning
    Route::get('payout-scan', [BetController::class, 'payoutScan'])->name('payout-scan');
    Route::post('payout-scan/claim', [BetController::class, 'claimPayout'])->name('payout-scan.claim');
    
    // History & Summary (merged)
    Route::get('history', [BetController::class, 'historyAndSummary'])->name('history');
    Route::post('bets/void', [BetController::class, 'voidBet'])->name('bets.void');
    
    // API endpoint for live odds
    Route::get('api/fights/{fight}/odds', [BetController::class, 'getLiveOdds']);
    Route::get('api/fights/{fight}/bet-totals', [BetController::class, 'getBetTotals']);
    Route::get('api/teller/live-data', [BetController::class, 'getTellerLiveData']);
    Route::get('api/fights/open', [BetController::class, 'getOpenFights']);
    
    // Cash Transfer
    Route::get('cash-transfer', [CashTransferController::class, 'index'])->name('cash-transfer.index');
    Route::post('cash-transfer', [CashTransferController::class, 'transfer'])->name('cash-transfer.transfer');
    
    // Printer Settings
    Route::get('settings/printer', function() {
        return Inertia::render('teller/settings/printer');
    })->name('settings.printer');
    
    Route::post('transactions/cash-in', [TransactionController::class, 'cashIn'])->name('transactions.cash-in');
    Route::post('transactions/cash-out', [TransactionController::class, 'cashOut'])->name('transactions.cash-out');
});

require __DIR__.'/settings.php';

