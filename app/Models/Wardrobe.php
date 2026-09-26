<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Wardrobe extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'deskripsi',
        'foto_kostum_url',
        'warna_dominan',
        'status_ready',
    ];

    protected $casts = [
        'status_ready' => 'boolean',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_id');
    }
}
