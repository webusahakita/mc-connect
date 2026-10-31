<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

$appRoot = $argv[1] ?? '';
$output = $argv[2] ?? '';
if (!is_file($appRoot.'/artisan') || !is_dir(dirname($output)) || file_exists($output)) {
    throw new RuntimeException('Invalid database backup configuration paths.');
}
require $appRoot.'/vendor/autoload.php';
$app = require $appRoot.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$config = DB::connection()->getConfig();
if (($config['driver'] ?? '') !== 'mysql' || !preg_match('/^[a-zA-Z0-9_]+$/', $config['database'] ?? '')) {
    throw new RuntimeException('This deployment requires a MySQL database.');
}
$quote = static fn ($value) => '"'.str_replace(["\\", '"', "\n", "\r"], ["\\\\", '\\"', '\\n', '\\r'], (string) $value).'"';
$options = "[mysqldump]\n";
foreach (['host' => 'host', 'port' => 'port', 'user' => 'username', 'password' => 'password'] as $option => $key) {
    $options .= $option.'='.$quote($config[$key] ?? '')."\n";
}
if (!empty($config['unix_socket'])) $options .= 'socket='.$quote($config['unix_socket'])."\n";
$handle = fopen($output, 'x');
if (!$handle || !chmod($output, 0600)) throw new RuntimeException('Cannot protect database backup options.');
if (fwrite($handle, $options) !== strlen($options)) throw new RuntimeException('Cannot write database backup options.');
fclose($handle);
echo $config['database'];
