<?php
$content = file_get_contents(__DIR__ . '/../public/js/admin-core.js');
$content = str_replace('function handleCreateQuickEvent(e)', 'async function handleCreateQuickEvent(e)', $content);
file_put_contents(__DIR__ . '/../public/js/admin-core.js', $content);
echo "Fixed handleCreateQuickEvent in admin-core.js\n";
