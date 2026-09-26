<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsRider extends Model
{
    protected $table = 'cms_riders';

    protected $fillable = [
        'mc_id', 'rider_key', 'title', 'notes', 'urutan',
    ];

    public function mc()
    {
        return $this->belongsTo(UserMC::class, 'mc_id');
    }
}
