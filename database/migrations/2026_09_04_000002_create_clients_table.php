<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mc_id')->constrained('users_mc')->onDelete('cascade');
            $table->string('nama_pic', 150);
            $table->string('no_wa', 30);
            $table->string('email', 150)->nullable();
            $table->enum('tipe_klien', ['Personal', 'EO', 'WO', 'Corporate'])->default('Personal');
            $table->string('instansi_atau_organisasi', 150)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
