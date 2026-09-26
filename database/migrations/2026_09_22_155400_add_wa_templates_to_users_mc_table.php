<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users_mc', function (Blueprint $table) {
            $table->json('wa_templates')->nullable()->after('event_categories');
        });
    }

    public function down(): void
    {
        Schema::table('users_mc', function (Blueprint $table) {
            $table->dropColumn('wa_templates');
        });
    }
};
