<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->string('nama_acara', 255);
            $table->string('lokasi', 255);
            $table->date('tanggal_acara');
            $table->time('waktu_mulai');
            $table->time('waktu_selesai');
            $table->enum('status', ['Review', 'Tentative', 'Terkunci', 'Selesai'])->default('Review');
            $table->text('catatan_khusus')->nullable();
            $table->decimal('total_budget', 15, 2)->default(0.00);
            $table->string('tipe_acara', 100)->default('Wedding Reception');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
