<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'mc_id',
        'nama_pic',
        'no_wa',
        'email',
        'tipe_klien',
        'instansi_atau_organisasi',
        'kategori',
        'nilai_kontrak',
        'status_pembayaran',
        'nama_acara',
        'tanggal_acara',
        'calendar_status',
        'client_category',
        'is_vip',
        'catatan_khusus',
    ];

    protected $casts = [
        'tanggal_acara' => 'date',
        'is_vip'        => 'boolean',
        'nilai_kontrak' => 'decimal:2',
    ];

    public function mc(): BelongsTo
    {
        return $this->belongsTo(UserMC::class, 'mc_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class, 'client_id');
    }
}
