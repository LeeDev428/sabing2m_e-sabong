<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Bet extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ticket_id',
        'fight_id',
        'teller_id',
        'side',
        'amount',
        'odds',
        'potential_payout',
        'status',
        'actual_payout',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'odds' => 'decimal:2',
            'potential_payout' => 'decimal:2',
            'actual_payout' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($bet) {
            if (empty($bet->ticket_id)) {
                $bet->ticket_id = self::generateTicketId();
            }
        });
    }

    public static function generateTicketId(): string
    {
        do {
            $ticketId = 'TKT-' . strtoupper(Str::random(10));
        } while (self::where('ticket_id', $ticketId)->exists());

        return $ticketId;
    }

    // Relationships
    public function fight()
    {
        return $this->belongsTo(Fight::class);
    }

    public function teller()
    {
        return $this->belongsTo(User::class, 'teller_id');
    }

    // Helper methods
    public function isWinning(): bool
    {
        return $this->status === 'won';
    }

    public function calculatePotentialPayout(): float
    {
        return $this->amount * $this->odds;
    }
}
