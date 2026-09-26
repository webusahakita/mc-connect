<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsPressKit extends Model
{
    protected $table = 'cms_presskit';

    protected $fillable = [
        'mc_id', 'stage_name', 'spesialisasi', 'tagline', 'bio',
        'pic_name', 'wa', 'email', 'sosmed', 'domisili',
        'scope_corporate', 'scope_wedding', 'scope_entertainment', 'scope_nilai_tambah',
        'footer_note', 'riders_footer_note',
    ];

    public function mc()
    {
        return $this->belongsTo(UserMC::class, 'mc_id');
    }
}
