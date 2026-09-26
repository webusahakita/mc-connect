<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CmsWardrobeCatalog extends Model
{
    protected $table = 'cms_wardrobe_catalog';

    protected $fillable = [
        'mc_id', 'nama', 'deskripsi', 'warna', 'file_path', 'foto_url', 'kategori', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function mc()
    {
        return $this->belongsTo(UserMC::class, 'mc_id');
    }

    protected static function booted()
    {
        static::deleting(function ($item) {
            if ($item->file_path && Storage::disk('public')->exists($item->file_path)) {
                Storage::disk('public')->delete($item->file_path);
            }
        });
    }
}
