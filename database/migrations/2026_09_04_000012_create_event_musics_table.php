<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_musics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->onDelete('cascade');
            $table->foreignId('rundown_item_id')->nullable()->constrained('rundown_items')->onDelete('set null');
            $table->string('judul_lagu');
            $table->string('penyanyi')->nullable();
            $table->string('genre')->default('Pop / Acoustic');
            $table->string('segmen_rundown')->nullable();
            $table->string('tipe_cue')->default('Background');
            $table->string('durasi_menit')->default('03:30');
            $table->string('audio_url')->nullable();
            $table->string('synth_preset')->default('Romantic Piano');
            $table->text('catatan_operator')->nullable();
            $table->string('status')->default('Ready');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_musics');
    }
};
