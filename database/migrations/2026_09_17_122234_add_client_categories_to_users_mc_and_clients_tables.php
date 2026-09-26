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
            if (!Schema::hasColumn('users_mc', 'client_categories')) {
                $table->json('client_categories')->nullable()->after('event_categories');
            }
        });
        
        Schema::table('clients', function (Blueprint $table) {
            if (!Schema::hasColumn('clients', 'client_category')) {
                $table->string('client_category')->nullable()->after('kategori');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            if (Schema::hasColumn('clients', 'client_category')) {
                $table->dropColumn('client_category');
            }
        });
        Schema::table('users_mc', function (Blueprint $table) {
            if (Schema::hasColumn('users_mc', 'client_categories')) {
                $table->dropColumn('client_categories');
            }
        });
    }
};
