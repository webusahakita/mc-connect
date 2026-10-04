<?php
$file = 'c:\\Users\\Nawakara\\.gemini\\antigravity-ide\\scratch\\mc-connect\\app\\Http\\Controllers\\CmsApiController.php';
$content = file_get_contents($file);

$search = "'invoiceItems'  => \$meta['invoice_items'] ?? null,
                'metadata'      => \$meta,";
$replace = "'invoiceItems'  => \$meta['invoice_items'] ?? null,
                'musicList'     => \$meta['musicList'] ?? [],
                'landingMusic'  => \$meta['landingMusic'] ?? [],
                'rundown'       => \$meta['rundown'] ?? [],
                'soundboard'    => \$meta['soundboard'] ?? [],
                'metadata'      => \$meta,";
$content = str_replace($search, $replace, $content);

file_put_contents($file, $content);
echo "Patched getEventsAdmin in CmsApiController.php successfully!";
