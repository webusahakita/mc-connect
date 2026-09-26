<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

if (!Schema::hasColumn('clients', 'calendar_status')) {
    Schema::table('clients', function (Blueprint $table) {
        $table->string('calendar_status')->nullable();
    });
    echo "Column added.\n";
} else {
    echo "Column already exists.\n";
}
