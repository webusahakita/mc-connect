<?php
$dir = __DIR__ . '/../public/js';
$files = glob($dir . '/*.js');

foreach ($files as $file) {
    $content = file_get_contents($file);
    // Split into functions
    preg_match_all('/(async\s+)?function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{([^}]*)\}/s', $content, $matches, PREG_SET_ORDER);
    
    foreach ($matches as $match) {
        $isAsync = trim($match[1]) === 'async';
        $funcName = $match[2];
        $body = $match[3];
        
        // Count { and } to properly capture the whole function body (naive regex might cut off at first })
        // A better approach is simply to check if 'await ' is in the function and the function is not async.
        // But since regex is naive, let's just use it as a heuristic.
    }
}
// Actually, let's just do a simpler search: find all occurrences of "await " and see if the nearest preceding "function" has "async".
