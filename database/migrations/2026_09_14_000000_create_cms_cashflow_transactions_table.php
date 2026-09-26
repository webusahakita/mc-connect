<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('cms_cashflow_transactions')) {
            Schema::create('cms_cashflow_transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('mc_id')->constrained('users_mc')->onDelete('cascade');
                $table->enum('tipe', ['in', 'out'])->default('out');
                $table->string('kategori')->nullable();
                $table->decimal('nominal', 15, 2)->default(0);
                $table->date('tanggal')->nullable();
                $table->string('deskripsi')->nullable();
                $table->boolean('is_verified')->default(true); // Always verified for manual entries for now
                
                // For integration with specific events (so we know which event this expense belongs to)
                $table->unsignedBigInteger('event_id')->nullable();

                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('cms_cashflow_transactions');
    }
};
