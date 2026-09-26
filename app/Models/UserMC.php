<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserMC extends Model
{
    use HasFactory;

    protected $table = 'users_mc';

    protected $fillable = [
        'nama_panggung',
        'email',
        'password_hash',
        'tier_langganan',
        'custom_domain',
        'token_ai_tersisa',
        'bio',
        'no_telp',
        'foto_profil',
        'spesialisasi',
        'showreel_youtube_id',
        'showreel_url',
        'instagram_handle',
        'tiktok_handle',
        'facebook_handle',
        'stat_events',
        'stat_years',
        'calendar_config',
        'payment_config',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'token_ai_tersisa' => 'integer',
        'calendar_config' => 'array',
        'payment_config' => 'array',
    ];

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class, 'mc_id');
    }

    public function events()
    {
        return $this->hasManyThrough(Event::class, Client::class, 'mc_id', 'client_id');
    }

    public function cmsArticles(): HasMany
    {
        return $this->hasMany(CmsArticle::class, 'mc_id');
    }
}
