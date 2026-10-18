<?php

$root = realpath($argv[1] ?? '');
$revision = $argv[2] ?? '';
if (!$root || !preg_match('/^[a-f0-9]{40}$/', $revision)) {
    throw new RuntimeException('Invalid release verification arguments.');
}
$manifest = json_decode(file_get_contents($root.'/release.json'), true, 512, JSON_THROW_ON_ERROR);
if (($manifest['revision'] ?? '') !== $revision || empty($manifest['files'])) {
    throw new RuntimeException('Release revision or file inventory does not match.');
}
$allowed = '~^(?:mc-connect/(?:app/|config/|resources/|routes/|deployment/|database/migrations/|bootstrap/(?!cache/)[^/]+\.php$|artisan$|composer\.(?:json|lock)$|\.env\.production\.example$)|public_html/(?:css/|js/|build/|uploads/\.htaccess$|(?:\.htaccess|index\.(?:php|html)|login\.html|favicon\.jpg|manifest\.json|sw\.js)$))~';
$actual = [];
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
foreach ($iterator as $entry) {
    if ($entry->isLink()) throw new RuntimeException('Symlinks are not allowed in release archives.');
    if (!$entry->isFile()) continue;
    $relative = str_replace(DIRECTORY_SEPARATOR, '/', substr($entry->getPathname(), strlen($root) + 1));
    if ($relative === 'release.json') continue;
    if (str_contains($relative, '..') || str_contains($relative, '\\') || !preg_match($allowed, $relative)) {
        throw new RuntimeException('Unexpected release file: '.$relative);
    }
    $actual[$relative] = hash_file('sha256', $entry->getPathname());
}
ksort($actual);
$expected = $manifest['files'];
ksort($expected);
if ($actual !== $expected) throw new RuntimeException('Release file integrity check failed.');
echo 'Release verified: '.count($actual).' files.'.PHP_EOL;
