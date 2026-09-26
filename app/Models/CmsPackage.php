<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsPackage extends Model
{
    protected $table = 'cms_packages';

    protected $fillable = [
        'mc_id', 'name', 'category', 'price', 'duration', 'features', 'urutan', 'is_active', 'badge'
    ];

    protected $casts = [
        'features' => 'array',
        'price' => 'float',
        'is_active' => 'boolean',
    ];

    public function mc()
    {
        return $this->belongsTo(UserMC::class, 'mc_id');
    }
}
