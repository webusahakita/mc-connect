<?php
$files = [
    'public/js/admin-core.js',
    'public/js/customers.js',
    'public/js/calendar.js',
    'public/js/teleprompter.js',
    'public/js/public-cms.js'
];

foreach ($files as $file) {
    $path = __DIR__ . '/../' . $file;
    if (!file_exists($path)) continue;
    $content = file_get_contents($path);
    
    // We will find all lines containing 'await '
    $lines = explode("\n", $content);
    $inAsyncFunc = false;
    $currentFuncName = "";
    
    // This is a naive line-by-line parser. A real parser is better.
    // Let's just use regex to find all functions and check if they have await and lack async.
    
    preg_match_all('/(async\s+)?(function\s+[a-zA-Z0-9_]+\s*\([^)]*\)|[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{)/s', $content, $matches, PREG_OFFSET_CAPTURE);
    
    for ($i = 0; $i < count($matches[0]); $i++) {
        $isAsync = trim($matches[1][$i][0]) === 'async';
        $decl = $matches[2][$i][0];
        $offset = $matches[0][$i][1];
        $nextOffset = isset($matches[0][$i+1]) ? $matches[0][$i+1][1] : strlen($content);
        
        $body = substr($content, $offset, $nextOffset - $offset);
        
        if (strpos($body, 'await ') !== false && !$isAsync) {
            echo "File: $file | Missing async for: " . explode("\n", $decl)[0] . "\n";
        }
    }
}
