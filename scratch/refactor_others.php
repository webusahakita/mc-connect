<?php
$files = [
    __DIR__ . '/../public/js/calendar.js',
    __DIR__ . '/../public/js/customers.js',
    __DIR__ . '/../public/js/public-cms.js',
    __DIR__ . '/../public/js/teleprompter.js'
];

foreach ($files as $file) {
    if (!file_exists($file)) continue;
    $content = file_get_contents($file);

    // Naive replace
    $content = preg_replace('/(?<!ui)alert\(/', 'uiAlert(', $content);
    $content = preg_replace('/(?<!ui)confirm\(/', 'uiConfirm(', $content);
    $content = preg_replace('/(?<!ui)prompt\(/', 'uiPrompt(', $content);

    // Add await
    $content = preg_replace('/(?<!await\s)uiConfirm\(/', 'await uiConfirm(', $content);
    $content = preg_replace('/(?<!await\s)uiPrompt\(/', 'await uiPrompt(', $content);
    
    // Some known functions
    $replacements = [
        "function exportPDF()" => "async function exportPDF()",
        "function deleteCustomer(id)" => "async function deleteCustomer(id)",
        "function handleConflict(eventId)" => "async function handleConflict(eventId)",
        "function deleteEvent(id)" => "async function deleteEvent(id)",
    ];

    foreach ($replacements as $old => $new) {
        if (strpos($content, "async " . $old) === false) {
            $content = str_replace($old, $new, $content);
        }
    }

    file_put_contents($file, $content);
    echo "Refactored " . basename($file) . "\n";
}
