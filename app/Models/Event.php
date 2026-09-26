<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'nama_acara',
        'lokasi',
        'tanggal_acara',
        'waktu_mulai',
        'waktu_selesai',
        'status',
        'catatan_khusus',
        'total_budget',
        'tipe_acara',
        'metadata',
        'nilai_kontrak',
        'status_pembayaran',
    ];

    protected $casts = [
        'tanggal_acara' => 'date',
        'total_budget'  => 'decimal:2',
        'nilai_kontrak' => 'decimal:2',
        'metadata'      => 'array',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class, 'event_id');
    }

    public function rundownItems(): HasMany
    {
        return $this->hasMany(RundownItem::class, 'event_id')->orderBy('urutan', 'asc');
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(Checklist::class, 'event_id');
    }

    public function wardrobes(): HasMany
    {
        return $this->hasMany(Wardrobe::class, 'event_id');
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'event_id');
    }

    public function communicationLogs(): HasMany
    {
        return $this->hasMany(CommunicationLog::class, 'event_id')->orderBy('waktu_log', 'desc');
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class, 'event_id');
    }

    public function musics(): HasMany
    {
        return $this->hasMany(EventMusic::class, 'event_id')->orderBy('id', 'asc');
    }

    // Helper attributes
    public function getNetProfitAttribute()
    {
        $revenue = $this->invoice ? $this->invoice->total_biaya : 0;
        $totalExpenses = $this->expenses->sum('jumlah');
        return $revenue - $totalExpenses;
    }

    public function getChecklistProgressAttribute()
    {
        $total = $this->checklists->count();
        if ($total === 0) return 0;
        $done = $this->checklists->where('status_selesai', true)->count();
        return round(($done / $total) * 100);
    }
}
