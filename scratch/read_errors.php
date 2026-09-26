<?php
$lines = file('storage/logs/laravel.log');
foreach(array_slice($lines, -150) as $line) {
    if (strpos($line, 'local.ERROR') !== false) {
        echo $line;
    }
}
