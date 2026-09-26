<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\CmsWardrobeCatalog;

$mc_id = 1;

$dummyData = [
    [
        'mc_id' => $mc_id,
        'nama' => 'Jas Formal Hitam (Slim Fit)',
        'deskripsi' => 'Jas formal dengan potongan slim fit yang elegan, cocok untuk acara pernikahan internasional.',
        'warna' => 'Hitam',
        'kategori' => 'Setelan Jas',
        'is_active' => true,
    ],
    [
        'mc_id' => $mc_id,
        'nama' => 'Gaun Malam Velvet Biru',
        'deskripsi' => 'Gaun malam berbahan velvet untuk acara gala dinner dan penghargaan korporat.',
        'warna' => 'Biru Navy',
        'kategori' => 'Gaun Malam',
        'is_active' => true,
    ],
    [
        'mc_id' => $mc_id,
        'nama' => 'Kemeja Batik Tulis Exclusive',
        'deskripsi' => 'Batik tulis lengan panjang bermotif kontemporer, khusus untuk acara formal bertema kenegaraan atau BUMN.',
        'warna' => 'Coklat Sogan',
        'kategori' => 'Batik',
        'is_active' => true,
    ],
    [
        'mc_id' => $mc_id,
        'nama' => 'Blazer Smart Casual Abu-abu',
        'deskripsi' => 'Blazer ringan untuk dipadukan dengan kemeja dan celana chino untuk event gathering santai.',
        'warna' => 'Abu-abu',
        'kategori' => 'Blazer',
        'is_active' => true,
    ]
];

foreach ($dummyData as $data) {
    CmsWardrobeCatalog::create($data);
}

echo "Berhasil menambahkan " . count($dummyData) . " data dummy ke Wardrobe Catalog.\n";
