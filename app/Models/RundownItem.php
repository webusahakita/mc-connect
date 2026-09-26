<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RundownItem extends Model
{
    use HasFactory;

    protected $table = 'rundown_items';

    protected $fillable = [
        'event_id',
        'urutan',
        'waktu_segmen',
        'judul_segmen',
        'naskah_prompter',
        'instruksi_musik',
        'is_completed',
    ];

    protected $casts = [
        'urutan' => 'integer',
        'is_completed' => 'boolean',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_id');
    }
}
