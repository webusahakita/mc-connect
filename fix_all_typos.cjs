const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const replacements = {
    'Jakart& Surabaydengan': 'Jakarta & Surabaya dengan',
    'Biodat& Sosmed': 'Biodata & Sosmed',
    'KelolPaket': 'Kelola Paket',
    'Harga anggung': 'Harga Panggung',
    'Andtambahkan': 'Anda tambahkan',
    'Acara ukses': 'Acara Sukses',
    'unting Profil': 'Sunting Profil',
    'Klien ktif': 'Klien Aktif',
    'tampil padetalase': 'tampil pada etalase',
    'Acara erkait': 'Acara Terkait',
    'Datpelanggan': 'Data pelanggan',
    'secardinamis': 'secara dinamis',
    'viJavascript': 'via Javascript',
    'Pembayarant& QRIS': 'Pembayaran & QRIS',
    'Kategori cara': 'Kategori Acara',
    'Template W': 'Template WA',
    'Kategori Klien': 'Kategori Klien', // just in case
    'Manajemen Arus as': 'Manajemen Arus Kas',
    'Catatan Kas eluar': 'Catatan Kas Keluar',
    'Total Kas asuk': 'Total Kas Masuk',
    'Total Kas eluar': 'Total Kas Keluar',
    'Saldo Kas ersih': 'Saldo Kas Bersih',
    'Margin Keuntungan ersih': 'Margin Keuntungan Bersih',
    'Kas eluar-Masuk': 'Kas Keluar-Masuk',
    'Jurnal Transaksi': 'Jurnal Transaksi',
    'TANGGAL': 'TANGGAL',
    'KETERANGAN / DESKRIPSI': 'KETERANGAN / DESKRIPSI',
    'KATEGORI': 'KATEGORI',
    'NOMINAL': 'NOMINAL',
    'STATUS': 'STATUS',
    'AKSI': 'AKSI',
    'Belum ada data transaksi as': 'Belum ada data transaksi kas',
    'Dashboard tUtama': 'Dashboard Utama',
    'Kalender cara': 'Kalender Acara',
    'Data elanggan': 'Data Pelanggan',
    'Cash low': 'Cash Flow',
    'engaturan': 'Pengaturan',
    'CMS onten': 'CMS Konten',
    'Pengaturan eb': 'Pengaturan Web',
    'Event Command enter': 'Event Command Center',
    'Wardrobe racker': 'Wardrobe Tracker',
    'Lihat eb': 'Lihat Web',
    'Logout / eluar': 'Logout / Keluar',
    'Admin orkspace': 'Admin Workspace',
    'Pengaturan Landing age': 'Pengaturan Landing Page',
    'Kelolprofil': 'Kelola profil',
    'BukHalaman': 'Buka Halaman'
};

for (const [bad, good] of Object.entries(replacements)) {
    // global replace
    html = html.split(bad).join(good);
}

// Special regex fixes for common missing letters
html = html.replace(/Jakart&/g, 'Jakarta &');
html = html.replace(/Surabaydengan/g, 'Surabaya dengan');
html = html.replace(/Biodat&/g, 'Biodata &');
html = html.replace(/KelolPaket/g, 'Kelola Paket');
html = html.replace(/Andtambahkan/g, 'Anda tambahkan');
html = html.replace(/tampil padetalase/g, 'tampil pada etalase');

fs.writeFileSync('public/admin.html', html, 'utf8');

// Now let's fix initAdminCms in admin-core.js
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');
const newSaved = `saved = JSON.stringify({ 
                    bio: typeof bio === 'string' ? JSON.parse(bio) : (bio || {}), 
                    pkgs: typeof pkgs === 'string' ? JSON.parse(pkgs) : (pkgs || []), 
                    press: typeof press === 'string' ? JSON.parse(press) : (press || {}) 
                });`;
js = js.replace(/saved = JSON\.stringify\(\{ bio: bio \|\| \{\}, pkgs: pkgs \|\| \[\], press: press \|\| \{\} \}\);/g, newSaved);
fs.writeFileSync('public/js/admin-core.js', js, 'utf8');

console.log('Fixed typos and initAdminCms bug');
