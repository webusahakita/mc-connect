<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CmsGallery extends Model
{
    protected $table = 'cms_gallery';

    protected $fillable = [
        'mc_id', 'file_path', 'url', 'caption', 'urutan',
    ];

    public function mc()
    {
        return $this->belongsTo(UserMC::class, 'mc_id');
    }

    /**
     * Delete the associated file from storage when model is deleted.
     */
    protected static function booted()
    {
        static::deleting(function ($gallery) {
            if ($gallery->file_path && Storage::disk('public')->exists($gallery->file_path)) {
                Storage::disk('public')->delete($gallery->file_path);
            }
        });
    }
}
