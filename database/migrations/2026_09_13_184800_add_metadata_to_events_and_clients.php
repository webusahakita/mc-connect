<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->json('metadata')->nullable()->after('tipe_acara');
            $table->decimal('nilai_kontrak', 15, 2)->default(0.00)->after('total_budget');
            $table->string('status_pembayaran', 100)->default('Belum Bayar')->after('nilai_kontrak');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->string('kategori', 50)->default('Wedding')->after('tipe_klien');
            $table->decimal('nilai_kontrak', 15, 2)->default(0.00)->after('kategori');
            $table->string('status_pembayaran', 100)->default('Belum Bayar')->after('nilai_kontrak');
            $table->string('nama_acara', 255)->nullable()->after('status_pembayaran');
            $table->date('tanggal_acara')->nullable()->after('nama_acara');
            $table->string('tipe_relasi', 100)->default('Active Booking')->after('tanggal_acara');
            $table->boolean('is_vip')->default(false)->after('tipe_relasi');
            $table->text('catatan_khusus')->nullable()->after('is_vip');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['metadata', 'nilai_kontrak', 'status_pembayaran']);
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['kategori', 'nilai_kontrak', 'status_pembayaran', 'nama_acara', 'tanggal_acara', 'tipe_relasi', 'is_vip', 'catatan_khusus']);
        });
    }
};
