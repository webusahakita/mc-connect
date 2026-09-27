<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CmsCashflowTransaction extends Model
{
    use HasFactory;

    protected $table = 'cms_cashflow_transactions';

    protected $fillable = [
        'mc_id',
        'tipe',
        'kategori',
        'nominal',
        'tanggal',
        'deskripsi',
        'is_verified',
        'event_id',
        'bukti_file'
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'nominal' => 'decimal:2',
        'tanggal' => 'date'
    ];

    public function mc()
    {
        return $this->belongsTo(UsersMC::class, 'mc_id');
    }
}
