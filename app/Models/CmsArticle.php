<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CmsArticle extends Model
{
    use HasFactory;

    protected $table = 'cms_articles';

    protected $fillable = [
        'mc_id',
        'kategori',
        'judul',
        'slug',
        'konten',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];

    public function mc(): BelongsTo
    {
        return $this->belongsTo(UserMC::class, 'mc_id');
    }
}
