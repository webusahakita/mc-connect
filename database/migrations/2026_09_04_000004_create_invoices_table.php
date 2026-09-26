<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->unique()->constrained('events')->onDelete('cascade');
            $table->string('invoice_number', 50)->unique();
            $table->decimal('total_biaya', 15, 2)->default(0.00);
            $table->decimal('nominal_dp', 15, 2)->default(0.00);
            $table->decimal('sisa_tagihan', 15, 2)->default(0.00);
            $table->enum('status_bayar', ['Unpaid', 'DP Paid', 'Fully Paid'])->default('Unpaid');
            $table->timestamp('batas_waktu_bayar')->nullable();
            $table->string('qris_url', 255)->nullable();
            $table->text('catatan_pembayaran')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
