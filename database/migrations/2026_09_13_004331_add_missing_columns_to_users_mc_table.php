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
            $table->string('stat_events')->nullable()->after('foto_profil');
            $table->string('stat_years')->nullable()->after('stat_events');
            $table->string('showreel_url')->nullable()->after('showreel_youtube_id');
            $table->string('facebook_handle')->nullable()->after('tiktok_handle');
            $table->text('calendar_config')->nullable()->after('facebook_handle');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users_mc', function (Blueprint $table) {
            $table->dropColumn(['stat_events', 'stat_years', 'showreel_url', 'facebook_handle', 'calendar_config']);
        });
    }
};
