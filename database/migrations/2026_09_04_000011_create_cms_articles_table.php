<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mc_id')->constrained('users_mc')->onDelete('cascade');
            $table->enum('kategori', ['Terms', 'Refund', 'Blog', 'Riders', 'FAQ'])->default('Blog');
            $table->string('judul', 255);
            $table->string('slug', 255);
            $table->longText('konten');
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_articles');
    }
};
