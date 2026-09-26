<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users_mc', function (Blueprint $table) {
            $table->json('event_categories')->nullable()->after('calendar_config');
        });
    }

    public function down(): void
    {
        Schema::table('users_mc', function (Blueprint $table) {
            $table->dropColumn('event_categories');
        });
    }
};
