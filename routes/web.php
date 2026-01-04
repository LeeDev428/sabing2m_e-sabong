<?php

use App\Http\Controllers\Admin\FightController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Teller\BetController;
use App\Http\Controllers\Teller\TransactionController;
use App\Http\Controllers\Declarator\ResultController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Redirect root to login
Route::get('/', function () {
    return redirect()->route('login');
});

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
    Route::get('dashboard', function () {
        $fights = \App\Models\Fight::with(['creator', 'declarator'])
            ->latest()
            ->paginate(20);
            
        return Inertia::render('admin/dashboard', [
            'fights' => $fights,
        ]);
    })->name('dashboard');
    
    Route::resource('fights', FightController::class);
    Route::post('fights/{fight}/open-betting', [FightController::class, 'openBetting'])->name('fights.open-betting');
    Route::post('fights/{fight}/close-betting', [FightController::class, 'closeBetting'])->name('fights.close-betting');
    
    Route::resource('users', UserController::class);
});

// Declarator Routes
Route::middleware(['auth', 'verified', 'role:declarator'])->prefix('declarator')->name('declarator.')->group(function () {
    Route::get('dashboard', function () {
        $fights = \App\Models\Fight::with(['creator', 'declarator'])
            ->whereIn('status', ['betting_closed', 'result_declared'])
            ->latest()
            ->get();
            
        return Inertia::render('declarator/dashboard', [
            'fights' => $fights,
        ]);
    })->name('dashboard');
    
    Route::get('fights', [ResultController::class, 'index'])->name('fights.index');
    Route::post('fights/{fight}/declare', [ResultController::class, 'declare'])->name('fights.declare');
});

// Teller Routes
Route::middleware(['auth', 'verified', 'role:teller'])->prefix('teller')->name('teller.')->group(function () {
    Route::get('dashboard', function () {
        $fights = \App\Models\Fight::with(['creator'])
            ->where('status', 'betting_open')
            ->latest()
            ->get();
            
        return Inertia::render('teller/dashboard', [
            'fights' => $fights,
        ]);
    })->name('dashboard');
    
    Route::get('fights', [BetController::class, 'index'])->name('fights.index');
    Route::post('bets', [BetController::class, 'store'])->name('bets.store');
    Route::get('bets', [BetController::class, 'history'])->name('bets.history');
    
    Route::post('transactions/cash-in', [TransactionController::class, 'cashIn'])->name('transactions.cash-in');
    Route::post('transactions/cash-out', [TransactionController::class, 'cashOut'])->name('transactions.cash-out');
});

require __DIR__.'/settings.php';

