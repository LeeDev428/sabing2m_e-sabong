<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashTransfer extends Model
{
    protected $fillable = [
        'from_teller_id',
        'to_teller_id',
        'amount',
        'type',
        'status',
        'remarks',
        'approved_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function fromTeller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_teller_id');
    }

    public function toTeller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_teller_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
