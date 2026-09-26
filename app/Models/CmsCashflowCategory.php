<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsCashflowCategory extends Model
{
    protected $table = 'cms_cashflow_categories';

    protected $fillable = [
        'mc_id', 'nama', 'tipe', 'warna',
    ];

    public function mc()
    {
        return $this->belongsTo(UserMC::class, 'mc_id');
    }
}
