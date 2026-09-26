<?php
$file = __DIR__ . '/../public/js/admin-core.js';
$content = file_get_contents($file);

$replacements = [
    [
        'from' => '/function handleLogout\(e\) \{\s*e\.preventDefault\(\);\s*if \(confirm\(\'Apakah Anda yakin ingin keluar dari ruang kerja Admin MC\?\'\)\) \{/',
        'to' => "async function handleLogout(e) {\n    e.preventDefault();\n    if (await uiConfirm('Apakah Anda yakin ingin keluar dari ruang kerja Admin MC?')) {"
    ],
    [
        'from' => '/function togglePublicPackage\(btn, isPublic\) \{\s*const el = btn\.closest\(\'\.ecc-card\'\);\s*if \(el && confirm\(\'Hapus paket layanan ini dari katalog publik\?\'\)\) \{/',
        'to' => "async function togglePublicPackage(btn, isPublic) {\n    const el = btn.closest('.ecc-card');\n    if (el && await uiConfirm('Hapus paket layanan ini dari katalog publik?')) {"
    ],
    [
        'from' => '/function deletePackage\(idx\) \{\s*if \(\!confirm\(\'Hapus paket ini\?\'\)\) return;/',
        'to' => "async function deletePackage(idx) {\n    if (!await uiConfirm('Hapus paket ini?')) return;"
    ],
    [
        'from' => '/function promptAddFaq\(\) \{\s*const q = prompt\(\'Pertanyaan FAQ baru:\'\);\s*if \(\!q\) return;\s*const a = prompt\(\'Jawaban FAQ:\'\);/',
        'to' => "async function promptAddFaq() {\n    const q = await uiPrompt('Pertanyaan FAQ baru:');\n    if (!q) return;\n    const a = await uiPrompt('Jawaban FAQ:');"
    ],
    [
        'from' => '/function deleteCmsFaq\(idx\) \{\s*if \(\!confirm\(\'Hapus FAQ ini\?\'\)\) return;/',
        'to' => "async function deleteCmsFaq(idx) {\n    if (!await uiConfirm('Hapus FAQ ini?')) return;"
    ],
    [
        'from' => '/function promptAddTestimonial\(\) \{\s*const text = prompt\(\'Isi Testimoni:\'\);\s*if \(\!text\) return;\s*const author = prompt\(\'Nama Klien:\'\);\s*if \(\!author\) return;\s*const role = prompt\(\'Peran \/ Jabatan \(contoh: Mempelai Wanita\):\', \'Klien\'\);/',
        'to' => "async function promptAddTestimonial() {\n    const text = await uiPrompt('Isi Testimoni:');\n    if (!text) return;\n    const author = await uiPrompt('Nama Klien:');\n    if (!author) return;\n    const role = await uiPrompt('Peran / Jabatan (contoh: Mempelai Wanita):', 'Klien');"
    ],
    [
        'from' => '/function deleteCmsTestimonial\(idx\) \{\s*if \(\!confirm\(\'Hapus testimoni ini\?\'\)\) return;/',
        'to' => "async function deleteCmsTestimonial(idx) {\n    if (!await uiConfirm('Hapus testimoni ini?')) return;"
    ],
    [
        'from' => '/promptAddCmsGallery\(\) \{\s*const url = prompt\("Masukkan URL Foto Galeri \(contoh: https:\/\/...\/foto1\.jpg\):"\);\s*if \(\!url\) return;\s*const caption = prompt\("Masukkan Judul \/ Caption singkat foto ini:"\);/',
        'to' => "async promptAddCmsGallery() {\n        const url = await uiPrompt(\"Masukkan URL Foto Galeri (contoh: https://.../foto1.jpg):\");\n        if (!url) return;\n        const caption = await uiPrompt(\"Masukkan Judul / Caption singkat foto ini:\");"
    ],
    [
        'from' => '/deleteCmsGallery\(idx\) \{\s*if \(\!confirm\(\'Hapus foto ini dari galeri publik\?\'\)\) return;/',
        'to' => "async deleteCmsGallery(idx) {\n        if (!await uiConfirm('Hapus foto ini dari galeri publik?')) return;"
    ],
    [
        'from' => '/function deleteWardrobeItem\(id\) \{\s*if \(\!confirm\(\'Hapus item busana ini dari katalog\? Data di event yang menggunakannya juga akan hilang\.\'\)\) return;/',
        'to' => "async function deleteWardrobeItem(id) {\n    if (!await uiConfirm('Hapus item busana ini dari katalog? Data di event yang menggunakannya juga akan hilang.')) return;"
    ],
    [
        'from' => '/function handleRemoveWardrobeFromEvent\(e\) \{\s*const btn = e\.currentTarget;\s*if \(\!confirm\(\'Lepaskan gaun ini dari acara\?\'\)\) return;/',
        'to' => "async function handleRemoveWardrobeFromEvent(e) {\n    const btn = e.currentTarget;\n    if (!await uiConfirm('Lepaskan gaun ini dari acara?')) return;"
    ],
    [
        'from' => '/function addCashflowExpense\(\) \{\s*const desc = prompt\("Pengeluaran operasional:", "Sewa Mobil Kru Tambahan"\);\s*if\(\!desc\) return;\s*const amt = prompt\("Nominal \(Rp\):", "400000"\);/',
        'to' => "async function addCashflowExpense() {\n    const desc = await uiPrompt(\"Pengeluaran operasional:\", \"Sewa Mobil Kru Tambahan\");\n    if(!desc) return;\n    const amt = await uiPrompt(\"Nominal (Rp):\", \"400000\");"
    ],
    [
        'from' => '/deleteCashflowCategory\(id\) \{\s*if \(\!confirm\(\'Hapus kategori ini\?\'\)\) return;/',
        'to' => "async deleteCashflowCategory(id) {\n        if (!await uiConfirm('Hapus kategori ini?')) return;"
    ],
    [
        'from' => '/function deleteCmsRider\(id\) \{\s*if \(\!confirm\(\'Hapus rider ini secara permanen\?\'\)\) return;/',
        'to' => "async function deleteCmsRider(id) {\n    if (!await uiConfirm('Hapus rider ini secara permanen?')) return;"
    ],
    [
        'from' => '/function deleteCmsGalleryItem\(id\) \{\s*if \(\!confirm\(\'Hapus foto ini dari galeri publik\?\'\)\) return;/',
        'to' => "async function deleteCmsGalleryItem(id) {\n    if (!await uiConfirm('Hapus foto ini dari galeri publik?')) return;"
    ]
];

$replaced = 0;
foreach ($replacements as $r) {
    if (preg_match($r['from'], $content)) {
        $content = preg_replace($r['from'], $r['to'], $content);
        $replaced++;
    } else {
        echo "NOT FOUND Regex: " . $r['from'] . "\n";
    }
}

// Global alert replace
$content = preg_replace('/(?<!ui)alert\(/', 'uiAlert(', $content);
// Global confirm replace that is missed
$content = preg_replace('/(?<!ui)confirm\(/', 'uiConfirm(', $content);
// Global prompt replace that is missed
$content = preg_replace('/(?<!ui)prompt\(/', 'uiPrompt(', $content);

file_put_contents($file, $content);
echo "Replaced $replaced blocks with regex.\n";
