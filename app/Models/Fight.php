<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Fight extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'fight_number',
        'meron_fighter',
        'wala_fighter',
        'status',
        'meron_odds',
        'wala_odds',
        'draw_odds',
        'auto_odds',
        'meron_betting_open',
        'wala_betting_open',
        'commission_percentage',
        'result',
        'remarks',
        'scheduled_at',
        'betting_opened_at',
        'betting_closed_at',
        'result_declared_at',
        'created_by',
        'declared_by',
    ];

    protected function casts(): array
    {
        return [
            'auto_odds' => 'boolean',
            'meron_betting_open' => 'boolean',
            'wala_betting_open' => 'boolean',
            'scheduled_at' => 'datetime',
            'betting_opened_at' => 'datetime',
            'betting_closed_at' => 'datetime',
            'result_declared_at' => 'datetime',
            'meron_odds' => 'decimal:2',
            'wala_odds' => 'decimal:2',
            'draw_odds' => 'decimal:2',
            'commission_percentage' => 'decimal:2',
        ];
    }

    // Relationships
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function declarator()
    {
        return $this->belongsTo(User::class, 'declared_by');
    }

    public function bets()
    {
        return $this->hasMany(Bet::class);
    }

    // Helper methods
    public function isBettingOpen(): bool
    {
        return in_array($this->status, ['betting_open', 'betting_closed']);
    }

    public function canAcceptBets(): bool
    {
        return in_array($this->status, ['betting_open', 'betting_closed']);
    }

    public function canAcceptMeronBets(): bool
    {
        return $this->canAcceptBets() && $this->meron_betting_open;
    }

    public function canAcceptWalaBets(): bool
    {
        return $this->canAcceptBets() && $this->wala_betting_open;
    }

    public function isResultDeclared(): bool
    {
        return $this->status === 'result_declared';
    }

    public function getTotalMeronBets(): float
    {
        return $this->bets()
            ->where('side', 'meron')
            ->where('status', '!=', 'cancelled')
            ->sum('amount');
    }

    public function getTotalWalaBets(): float
    {
        return $this->bets()
            ->where('side', 'wala')
            ->where('status', '!=', 'cancelled')
            ->sum('amount');
    }

    public function calculateAutoOdds(): void
    {
        $meronTotal = $this->getTotalMeronBets();
        $walaTotal = $this->getTotalWalaBets();

        if ($meronTotal > 0 && $walaTotal > 0) {
            $this->meron_odds = round($walaTotal / $meronTotal, 2);
            $this->wala_odds = round($meronTotal / $walaTotal, 2);
        }
    }
}
