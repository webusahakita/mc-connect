const fs = require('fs');

// ============================================================
// STEP 1: Fix sidebar active state
// ============================================================
let html = fs.readFileSync('public/admin.html', 'utf8');

// Remove ALL "active" from sidebar nav items, then set only Dashboard
html = html.replace(/class="sidebar-nav-item active"/g, 'class="sidebar-nav-item"');
html = html.replace('id="menu-dashboard" class="sidebar-nav-item"', 'id="menu-dashboard" class="sidebar-nav-item active"');

// Make sure only sec-dashboard starts as active section
html = html.replace(/class="admin-section active"/g, 'class="admin-section"');
html = html.replace('id="sec-dashboard" class="admin-section"', 'id="sec-dashboard" class="admin-section active"');

console.log('1. Fixed sidebar active states');

// ============================================================
// STEP 2: Fix ALL text typos in admin.html
// ============================================================
html = html.replace(/RATA-RATBIAYA/g, 'RATA-RATA BIAYA');
html = html.replace(/RATA-RATBiaya/gi, 'RATA-RATA BIAYA');
html = html.replace(/emuTransaksi/g, 'Semua Transaksi');
html = html.replace(/emuKategori/g, 'Semua Kategori');
html = html.replace(/BUSANPANGGUNG/g, 'BUSANA PANGGUNG');
html = html.replace(/Kelolaseluruh/g, 'Kelola seluruh');
html = html.replace(/ajibusana/g, 'aji busana');
html = html.replace(/frekuensipengguna/g, 'frekuensi pengguna');
html = html.replace(/SimpanPengaturan/g, 'Simpan Pengaturan');
html = html.replace(/>Semu</g, '>Semua<');
html = html.replace(/Daftar Acar&/g, 'Daftar Acara &');
html = html.replace(/Jadwal Acara\(/g, 'Jadwal Acara (');
html = html.replace(/Durasi Acara\(/g, 'Durasi Acara (');
html = html.replace(/\$\\?rightarrow\\?\$/g, '→');
html = html.replace(/\$rightarrow\$/g, '→');
html = html.replace(/Request to Book \$.*?Terkunci/g, 'Request to Book → Terkunci');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('2. Fixed all HTML typos');

// ============================================================
// STEP 3: Fix rawVal error in admin-core.js
// ============================================================
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Find and fix the rawVal issue
let rawValMatches = js.match(/.{0,80}rawVal.{0,80}/g);
if (rawValMatches) {
    console.log('3. rawVal occurrences:');
    rawValMatches.forEach((m, i) => console.log('   ' + i + ':', m.trim()));
}

// The issue: "// 7. Tab 2 - Finance Cards & QRIconst rawVal = Number(ev.rawPr"
// This line is broken - comment and code are merged
// Let's find it and fix it
let brokenLine = js.indexOf('QRIconst rawVal');
if (brokenLine !== -1) {
    console.log('Found broken QRIconst at index:', brokenLine);
    let lineStart = js.lastIndexOf('\n', brokenLine);
    let lineEnd = js.indexOf('\n', brokenLine);
    let brokenContent = js.substring(lineStart, lineEnd);
    console.log('Broken line:', brokenContent.trim());
    
    // Fix: Split comment from code
    js = js.replace(
        /QRIconst rawVal = Number\(ev\.rawPr/g,
        'QRI\n        const rawVal = Number(ev.rawPrice || ev.price || 0'
    );
}

// Also check if rawVal is used after being defined
let rawValUses = js.match(/.{0,30}rawVal.{0,50}/g);
if (rawValUses) {
    console.log('After fix, rawVal uses:');
    rawValUses.forEach((m, i) => console.log('   ' + i + ':', m.trim()));
}

// Fix remaining JS typos
js = js.replace(/RATA-RATBIAYA/g, 'RATA-RATA BIAYA');
js = js.replace(/Daftar Acar&/g, 'Daftar Acara &');
js = js.replace(/Belum adacara/g, 'Belum ada acara');

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
console.log('4. Fixed admin-core.js');

// ============================================================
// STEP 4: Fix customers.js typos
// ============================================================
let cjs = fs.readFileSync('public/js/customers.js', 'utf8');
cjs = cjs.replace(/RATA-RATBIAYA/g, 'RATA-RATA BIAYA');
fs.writeFileSync('public/js/customers.js', cjs, 'utf8');
console.log('5. Fixed customers.js');

console.log('\nAll fixes applied!');
