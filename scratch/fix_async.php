<?php
$files = [
    'public/js/customers.js',
    'public/js/calendar.js',
    'public/js/teleprompter.js',
    'public/js/public-cms.js'
];

$replacements = [
    "function handleSaveCustomer" => "async function handleSaveCustomer",
    "function resetToDefaultCustomers" => "async function resetToDefaultCustomers",
    "function handleToggleCam" => "async function handleToggleCam",
    "function startDictation" => "async function startDictation",
];

foreach ($files as $f) {
    $path = __DIR__ . '/../' . $f;
    if (!file_exists($path)) continue;
    $c = file_get_contents($path);
    
    foreach ($replacements as $old => $new) {
        if (strpos($c, "async " . $old) === false) {
            $c = str_replace($old, $new, $c);
        }
    }
    file_put_contents($path, $c);
    echo "$f updated\n";
}
