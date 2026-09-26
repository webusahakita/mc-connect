<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'invoice_number',
        'total_biaya',
        'nominal_dp',
        'sisa_tagihan',
        'status_bayar',
        'batas_waktu_bayar',
        'qris_url',
        'catatan_pembayaran',
    ];

    protected $casts = [
        'total_biaya' => 'decimal:2',
        'nominal_dp' => 'decimal:2',
        'sisa_tagihan' => 'decimal:2',
        'batas_waktu_bayar' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_id');
    }
}
