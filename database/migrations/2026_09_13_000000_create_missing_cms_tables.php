<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('cms_packages')) {
            Schema::create('cms_packages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('mc_id')->constrained('users_mc')->onDelete('cascade');
                $table->string('name')->nullable();
                $table->string('category')->nullable();
                $table->decimal('price', 15, 2)->default(0);
                $table->string('duration')->nullable();
                $table->json('features')->nullable();
                $table->integer('urutan')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('cms_gallery')) {
            Schema::create('cms_gallery', function (Blueprint $table) {
                $table->id();
                $table->foreignId('mc_id')->constrained('users_mc')->onDelete('cascade');
                $table->string('file_path')->nullable();
                $table->string('url')->nullable();
                $table->string('caption')->nullable();
                $table->integer('urutan')->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('cms_presskit')) {
            Schema::create('cms_presskit', function (Blueprint $table) {
                $table->id();
                $table->foreignId('mc_id')->constrained('users_mc')->onDelete('cascade');
                $table->string('stage_name')->nullable();
                $table->string('spesialisasi')->nullable();
                $table->string('tagline')->nullable();
                $table->text('bio')->nullable();
                $table->string('pic_name')->nullable();
                $table->string('wa')->nullable();
                $table->string('email')->nullable();
                $table->string('sosmed')->nullable();
                $table->string('domisili')->nullable();
                $table->text('scope_corporate')->nullable();
                $table->text('scope_wedding')->nullable();
                $table->text('scope_entertainment')->nullable();
                $table->text('scope_nilai_tambah')->nullable();
                $table->text('footer_note')->nullable();
                $table->text('riders_footer_note')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('cms_riders')) {
            Schema::create('cms_riders', function (Blueprint $table) {
                $table->id();
                $table->foreignId('mc_id')->constrained('users_mc')->onDelete('cascade');
                $table->string('rider_key')->nullable();
                $table->string('title')->nullable();
                $table->text('notes')->nullable();
                $table->integer('urutan')->default(0);
                $table->timestamps();
            });
        }
        
        if (!Schema::hasTable('cms_cashflow_categories')) {
            Schema::create('cms_cashflow_categories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('mc_id')->constrained('users_mc')->onDelete('cascade');
                $table->string('nama')->nullable();
                $table->string('tipe')->nullable();
                $table->string('warna')->nullable();
                $table->timestamps();
            });
        }
        
        if (!Schema::hasTable('cms_wardrobe_catalog')) {
            Schema::create('cms_wardrobe_catalog', function (Blueprint $table) {
                $table->id();
                $table->foreignId('mc_id')->constrained('users_mc')->onDelete('cascade');
                $table->string('nama')->nullable();
                $table->text('deskripsi')->nullable();
                $table->string('warna')->nullable();
                $table->string('file_path')->nullable();
                $table->string('foto_url')->nullable();
                $table->string('kategori')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('cms_packages');
        Schema::dropIfExists('cms_gallery');
        Schema::dropIfExists('cms_presskit');
        Schema::dropIfExists('cms_riders');
        Schema::dropIfExists('cms_cashflow_categories');
        Schema::dropIfExists('cms_wardrobe_catalog');
    }
};
