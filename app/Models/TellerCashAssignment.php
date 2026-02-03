<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TellerCashAssignment extends Model
{
    protected $fillable = [
        'fight_id',
        'teller_id',
        'assigned_by',
        'assigned_amount',
        'current_balance',
        'status',
    ];

    protected $casts = [
        'assigned_amount' => 'decimal:2',
        'current_balance' => 'decimal:2',
    ];

    public function fight(): BelongsTo
    {
        return $this->belongsTo(Fight::class);
    }

    public function teller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teller_id');
    }
}
