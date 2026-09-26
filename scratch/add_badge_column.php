<?php
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

if (!Schema::hasColumn('cms_packages', 'badge')) {
    Schema::table('cms_packages', function (Blueprint $table) {
        $table->string('badge')->nullable()->after('features');
    });
    echo "Column 'badge' added successfully!\n";
} else {
    echo "Column 'badge' already exists.\n";
}
