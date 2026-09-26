<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users_mc', function (Blueprint $table) {
            $table->id();
            $table->string('nama_panggung', 150);
            $table->string('email', 150)->unique();
            $table->string('password_hash');
            $table->enum('tier_langganan', ['Free', 'Pro', 'Agency'])->default('Pro');
            $table->string('custom_domain', 200)->nullable();
            $table->integer('token_ai_tersisa')->default(50);
            $table->text('bio')->nullable();
            $table->string('no_telp', 30)->nullable();
            $table->string('foto_profil')->nullable();
            $table->string('spesialisasi')->default('Wedding, Corporate Gala, Awarding Night, Festival');
            $table->string('showreel_youtube_id', 50)->default('kJQP7kiw5Fk');
            $table->string('instagram_handle', 100)->default('@vanyaarsyad.mc');
            $table->string('tiktok_handle', 100)->default('@vanya_stage');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users_mc');
    }
};
