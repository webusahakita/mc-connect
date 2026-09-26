<?php
$file = __DIR__ . '/../public/js/admin-core.js';
$content = file_get_contents($file);

$replacements = [
    "function handleLogout(e) {\n    e.preventDefault();\n    if (confirm('Apakah Anda yakin ingin keluar dari ruang kerja Admin MC?')) {" => "async function handleLogout(e) {\n    e.preventDefault();\n    if (await uiConfirm('Apakah Anda yakin ingin keluar dari ruang kerja Admin MC?')) {",
    
    "function togglePublicPackage(btn, isPublic) {\n    const el = btn.closest('.ecc-card');\n    if (el && confirm('Hapus paket layanan ini dari katalog publik?')) {" => "async function togglePublicPackage(btn, isPublic) {\n    const el = btn.closest('.ecc-card');\n    if (el && await uiConfirm('Hapus paket layanan ini dari katalog publik?')) {",
    
    "function deletePackage(idx) {\n    if (!confirm('Hapus paket ini?')) return;" => "async function deletePackage(idx) {\n    if (!await uiConfirm('Hapus paket ini?')) return;",
    
    "function promptAddFaq() {\n    const q = prompt('Pertanyaan FAQ baru:');\n    if (!q) return;\n    const a = prompt('Jawaban FAQ:');" => "async function promptAddFaq() {\n    const q = await uiPrompt('Pertanyaan FAQ baru:');\n    if (!q) return;\n    const a = await uiPrompt('Jawaban FAQ:');",
    
    "function deleteCmsFaq(idx) {\n    if (!confirm('Hapus FAQ ini?')) return;" => "async function deleteCmsFaq(idx) {\n    if (!await uiConfirm('Hapus FAQ ini?')) return;",
    
    "function promptAddTestimonial() {\n    const text = prompt('Isi Testimoni:');\n    if (!text) return;\n    const author = prompt('Nama Klien:');\n    if (!author) return;\n    const role = prompt('Peran / Jabatan (contoh: Mempelai Wanita):', 'Klien');" => "async function promptAddTestimonial() {\n    const text = await uiPrompt('Isi Testimoni:');\n    if (!text) return;\n    const author = await uiPrompt('Nama Klien:');\n    if (!author) return;\n    const role = await uiPrompt('Peran / Jabatan (contoh: Mempelai Wanita):', 'Klien');",
    
    "function deleteCmsTestimonial(idx) {\n    if (!confirm('Hapus testimoni ini?')) return;" => "async function deleteCmsTestimonial(idx) {\n    if (!await uiConfirm('Hapus testimoni ini?')) return;",
    
    "    promptAddCmsGallery() {\n        const url = prompt(\"Masukkan URL Foto Galeri (contoh: https://.../foto1.jpg):\");\n        if (!url) return;\n        const caption = prompt(\"Masukkan Judul / Caption singkat foto ini:\");" => "    async promptAddCmsGallery() {\n        const url = await uiPrompt(\"Masukkan URL Foto Galeri (contoh: https://.../foto1.jpg):\");\n        if (!url) return;\n        const caption = await uiPrompt(\"Masukkan Judul / Caption singkat foto ini:\");",
    
    "    deleteCmsGallery(idx) {\n        if (!confirm('Hapus foto ini dari galeri publik?')) return;" => "    async deleteCmsGallery(idx) {\n        if (!await uiConfirm('Hapus foto ini dari galeri publik?')) return;",
    
    "function deleteWardrobeItem(id) {\n    if (!confirm('Hapus item busana ini dari katalog? Data di event yang menggunakannya juga akan hilang.')) return;" => "async function deleteWardrobeItem(id) {\n    if (!await uiConfirm('Hapus item busana ini dari katalog? Data di event yang menggunakannya juga akan hilang.')) return;",
    
    "function handleRemoveWardrobeFromEvent(e) {\n    const btn = e.currentTarget;\n    if (!confirm('Lepaskan gaun ini dari acara?')) return;" => "async function handleRemoveWardrobeFromEvent(e) {\n    const btn = e.currentTarget;\n    if (!await uiConfirm('Lepaskan gaun ini dari acara?')) return;",
    
    "function addCashflowExpense() {\n    const desc = prompt(\"Pengeluaran operasional:\", \"Sewa Mobil Kru Tambahan\");\n    if(!desc) return;\n    const amt = prompt(\"Nominal (Rp):\", \"400000\");" => "async function addCashflowExpense() {\n    const desc = await uiPrompt(\"Pengeluaran operasional:\", \"Sewa Mobil Kru Tambahan\");\n    if(!desc) return;\n    const amt = await uiPrompt(\"Nominal (Rp):\", \"400000\");",
    
    "        alert('Belum ada file audio yang dipilih.');" => "        uiAlert('Belum ada file audio yang dipilih.');",
    "        alert('Silakan masukkan tautan audio terlebih dahulu.');" => "        uiAlert('Silakan masukkan tautan audio terlebih dahulu.');",
    "        alert('Gagal memutar audio dari tautan: ' + err.message);" => "        uiAlert('Gagal memutar audio dari tautan: ' + err.message);",
    "        alert('Belum ada file audio SFX yang dipilih.');" => "        uiAlert('Belum ada file audio SFX yang dipilih.');",
    "        alert('Silakan masukkan tautan audio SFX terlebih dahulu.');" => "        uiAlert('Silakan masukkan tautan audio SFX terlebih dahulu.');",
    "        alert('Mohon masukkan nama sound effect.');" => "        uiAlert('Mohon masukkan nama sound effect.');",
    "        alert('Token AI Co-Pilot Anda habis. Silakan hubungi admin atau upgrade paket.');" => "        uiAlert('Token AI Co-Pilot Anda habis. Silakan hubungi admin atau upgrade paket.');",
    "            alert(`Error fullscreen: \${err.message}`);" => "            uiAlert(`Error fullscreen: \${err.message}`);",
    "        alert('Mohon lengkapi judul lagu dan artis/musisi.');" => "        uiAlert('Mohon lengkapi judul lagu dan artis/musisi.');",
    "        alert('Browser Anda tidak mendukung rendering offline audio.');" => "        uiAlert('Browser Anda tidak mendukung rendering offline audio.');",
    "        alert('Belum ada lagu pada playlist acara.');" => "        uiAlert('Belum ada lagu pada playlist acara.');",
    
    "    deleteCashflowCategory(id) {\n        if (!confirm('Hapus kategori ini?')) return;" => "    async deleteCashflowCategory(id) {\n        if (!await uiConfirm('Hapus kategori ini?')) return;",
    
    "function deleteCmsRider(id) {\n    if (!confirm('Hapus rider ini secara permanen?')) return;" => "async function deleteCmsRider(id) {\n    if (!await uiConfirm('Hapus rider ini secara permanen?')) return;",
    
    "function deleteCmsGalleryItem(id) {\n    if (!confirm('Hapus foto ini dari galeri publik?')) return;" => "async function deleteCmsGalleryItem(id) {\n    if (!await uiConfirm('Hapus foto ini dari galeri publik?')) return;"
];

$replaced = 0;
foreach ($replacements as $from => $to) {
    if (strpos($content, $from) !== false) {
        $content = str_replace($from, $to, $content);
        $replaced++;
    } else {
        echo "NOT FOUND: " . substr($from, 0, 50) . "\n";
    }
}

$content = preg_replace('/alert\(/', 'uiAlert(', $content);
file_put_contents($file, $content);
echo "Replaced $replaced blocks.\n";
