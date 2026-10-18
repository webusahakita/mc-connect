<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users_mc', 'music_bank')) {
            Schema::table('users_mc', function (Blueprint $table) {
                $table->longText('music_bank')->nullable();
            });
        }

        // Older installations may already have this column from the former setup endpoint.
        if (!Schema::hasColumn('cms_cashflow_transactions', 'bukti_file')) {
            Schema::table('cms_cashflow_transactions', function (Blueprint $table) {
                $table->string('bukti_file')->nullable();
            });
        }
    }

    public function down(): void
    {
        // Keep these columns: they may predate this migration and contain uploaded-file references.
    }
};
