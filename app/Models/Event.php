<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'name',
        'event_date',
        'revolving_funds',
        'notes',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'revolving_funds' => 'decimal:2',
        ];
    }

    // Relationship: Event has many fights
    public function fights()
    {
        return $this->hasMany(Fight::class, 'event_name', 'name');
    }
}
