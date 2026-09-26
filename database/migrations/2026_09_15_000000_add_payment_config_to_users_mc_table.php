<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users_mc', function (Blueprint $table) {
            $table->longText('payment_config')->nullable()->after('calendar_config');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users_mc', function (Blueprint $table) {
            $table->dropColumn('payment_config');
        });
    }
};
