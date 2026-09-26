<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventMusic extends Model
{
    use HasFactory;

    protected $table = 'event_musics';

    protected $fillable = [
        'event_id',
        'rundown_item_id',
        'judul_lagu',
        'penyanyi',
        'genre',
        'segmen_rundown',
        'tipe_cue',
        'durasi_menit',
        'audio_url',
        'synth_preset',
        'catatan_operator',
        'status',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function rundownItem(): BelongsTo
    {
        return $this->belongsTo(RundownItem::class, 'rundown_item_id');
    }
}
