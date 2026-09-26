<?php
$path = 'public/js/admin-core.js';
$text = file_get_contents($path);

$startMarker = "// 9. CMS Handlers\n";
$endMarker = "// 10. Anti-Bentrok Calendar Inspector & Actions\n";

$startPos = strpos($text, "// 9. CMS Handlers");
$endPos = strpos($text, "// 10. Anti-Bentrok Calendar Inspector & Actions");

if ($startPos !== false && $endPos !== false) {
    $block = file_get_contents('scratch/block.txt');
    $newText = substr($text, 0, $startPos) . $block . "\n" . substr($text, $endPos);
    file_put_contents($path, $newText);
    echo "Replaced correctly!\n";
} else {
    echo "Markers not found!\n";
}
