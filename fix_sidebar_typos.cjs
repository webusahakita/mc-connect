const fs = require('fs');

// ============================================================
// STEP 1: Fix sidebar active state (only 1 active at a time)
// ============================================================
let html = fs.readFileSync('public/admin.html', 'utf8');

// Remove ALL "active" classes from sidebar nav items in HTML
html = html.replace(/class="sidebar-nav-item active"/g, 'class="sidebar-nav-item"');
// Set only Dashboard as initially active
html = html.replace('id="menu-dashboard" class="sidebar-nav-item"', 'id="menu-dashboard" class="sidebar-nav-item active"');

// Make sure only sec-dashboard starts as active
html = html.replace(/class="admin-section active"/g, 'class="admin-section"');
html = html.replace('id="sec-dashboard" class="admin-section"', 'id="sec-dashboard" class="admin-section active"');

console.log('Fixed sidebar active states');

// ============================================================
// STEP 2: Fix ALL remaining text typos in admin.html
// ============================================================
const htmlTypos = [
    // Dashboard
    ['RATA-RATBIAYA', 'RATA-RATA BIAYA'],
    ['RATA-RATBiaya', 'RATA-RATA BIAYA'],
    ['RATA-RATA BIAYA', 'RATA-RATA BIAYA'], // Already correct - skip
    ['$\\rightarrow$ Terkunci', '→ Terkunci'],
    ['$rightarrow$', '→'],
    ['\\$rightarrow\\$', '→'],
    ['$\\\\rightarrow\\\\$', '→'],
    // Cash Flow
    ['emuTransaksi', 'Semua Transaksi'],
    ['emuKategori', 'Semua Kategori'],
    // Wardrobe
    ['BUSANPANGGUNG', 'BUSANA PANGGUNG'],
    ['Kelolaseluruh', 'Kelola seluruh'],
    ['ajibusana', 'aji busana'],
    ['di sini. Pantau di acar', 'di sini. Pantau di acara'],
    ['frekuensipengguna', 'frekuensi pengguna'],
    ['penggunaannya', 'penggunaannya'],
    // Dashboard buttons
    ['>Semu<', '>Semua<'],
    // Breadcrumb map values
    ['Performa MC', 'Performa MC'], // Already correct
    // Data Pelanggan
    ['Tidak ada data pelanggan', 'Tidak ada data pelanggan'], // Already correct
    ['Coba kata kunci', 'Coba kata kunci'], // Already correct
    // Misc
    ['Belum Ada Data', 'Belum Ada Data'], // Already correct
    ['Belum ada acara', 'Belum ada acara'], // Already correct
    // Command Center text
    ['Tidak ada acara sesuai filter', 'Tidak ada acara sesuai filter'], // Already correct
    ['Daftar Acar&', 'Daftar Acara &'],
    ['Daftar Acar ', 'Daftar Acara '],
    // Calendar
    ['Jadwal Acara(', 'Jadwal Acara ('],
    ['Durasi Acara(', 'Durasi Acara ('],
    // Pengaturan
    ['SimpanPengaturan', 'Simpan Pengaturan'],
    ['Simpan Pengaturan', 'Simpan Pengaturan'], // Already correct
    // Various broken words
    ['tersedi(', 'tersedia ('],
    ['tersedi ', 'tersedia '],
    ['Request to Book $', 'Request to Book →'],
    ['Terkunci$', 'Terkunci'],
];

for (let [bad, good] of htmlTypos) {
    if (bad !== good) {
        while (html.includes(bad)) {
            html = html.replace(bad, good);
        }
    }
}

// Fix "Memuat..." in pie chart legend - this is from renderPie function
// Fix "$\rightarrow$ Terkunci" pattern more aggressively
html = html.replace(/\$\\?rightarrow\\?\$/g, '→');
html = html.replace(/\$rightarrow\$/g, '→');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed all HTML typos');

// ============================================================
// STEP 3: Fix rawVal error in admin-core.js
// ============================================================
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Find the rawVal reference
let rawValIdx = js.indexOf('rawVal');
if (rawValIdx !== -1) {
    console.log('Found rawVal at index:', rawValIdx);
    console.log('Context:', js.substring(Math.max(0, rawValIdx - 100), rawValIdx + 100));
    
    // The error is in loadActiveEventInCommandCenter - "rawVal" is not defined
    // It should likely be ev.rawPrice or ev.price
    // Let's look at the context more
    let context = js.substring(Math.max(0, rawValIdx - 200), rawValIdx + 200);
    console.log('\nWider context:', context);
}

// Fix rawVal - it's likely a variable that should be defined
// From the context "const rawVal = Number(ev.rawPr" - the line got cut off
// It should be "const rawVal = Number(ev.rawPrice || ev.price || 0);"
let rawValContext = js.match(/.{0,50}rawVal.{0,100}/g);
if (rawValContext) {
    rawValContext.forEach((m, i) => console.log('rawVal match ' + i + ':', m));
}
