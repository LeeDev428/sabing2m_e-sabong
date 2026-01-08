<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'teller_balance',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
            'teller_balance' => 'decimal:2',
        ];
    }

    // Role helper methods
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isDeclarator(): bool
    {
        return $this->role === 'declarator';
    }

    public function isTeller(): bool
    {
        return $this->role === 'teller';
    }

    // Relationships
    public function createdFights()
    {
        return $this->hasMany(Fight::class, 'created_by');
    }

    public function declaredFights()
    {
        return $this->hasMany(Fight::class, 'declared_by');
    }

    public function bets()
    {
        return $this->hasMany(Bet::class, 'teller_id');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'teller_id');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }
}
