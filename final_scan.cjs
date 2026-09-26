const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');
let cjs = fs.readFileSync('public/js/customers.js', 'utf8');

console.log('=== COMPREHENSIVE TYPO SCAN ===\n');

let patterns = [
    // Known corruptions from comma removal
    [/[a-z]Acar[^a]/g, 'truncated Acara'],
    [/addata/g, 'addata'],
    [/adacara/g, 'adacara'],
    [/acarselesai/g, 'acarselesai'],
    [/emuTransaksi/g, 'emuTransaksi'],
    [/emuKategori/g, 'emuKategori'],
    [/emuStatus/g, 'emuStatus'],
    [/emuKalender/g, 'emuKalender'],
    [/BUSANPANGGUNG/g, 'BUSANPANGGUNG'],
    [/Kelolaseluruh/g, 'Kelolaseluruh'],
    [/ajibusana/g, 'ajibusana'],
    [/RATA-RATBIAYA/gi, 'RATA-RATBIAYA'],
    [/SimpanPengaturan/g, 'SimpanPengaturan'],
    [/frekuensipengguna/g, 'frekuensipengguna'],
    [/dibuktepat/g, 'dibuktepat'],
    [/MenunggDP/g, 'MenunggDP'],
    [/Cobkat/g, 'Cobkat'],
    [/BukCommand/g, 'BukCommand'],
    [/BukDirektori/g, 'BukDirektori'],
    [/\$newCharts/g, '$newCharts'],
    [/fle🛡️/g, 'fle🛡️'],
    [/PerformMC/g, 'PerformMC (not Performa MC)'],
];

let files = [['admin.html', html], ['admin-core.js', js], ['customers.js', cjs]];
let issues = [];

for (let [pattern, desc] of patterns) {
    for (let [name, content] of files) {
        let m = content.match(pattern);
        if (m) {
            issues.push(name + ': ' + desc + ' (' + m.length + ')');
        }
    }
}

if (issues.length === 0) {
    console.log('ALL CLEAN - No typos found!');
} else {
    issues.forEach(i => console.log('FOUND:', i));
}

// Check sidebar active states
console.log('\n=== SIDEBAR ACTIVE CHECK ===');
let sidebarActives = (html.match(/sidebar-nav-item active/g) || []).length;
console.log('Active sidebar items in HTML:', sidebarActives);

let sectionActives = (html.match(/admin-section active/g) || []).length;
console.log('Active sections in HTML:', sectionActives);

// Check rawVal is properly defined
console.log('\n=== rawVal CHECK ===');
let rawValDef = js.match(/const rawVal = Number\(/g);
console.log('rawVal definitions:', rawValDef ? rawValDef.length : 0);

// Check >Semu< pattern
let semuMatch = html.match(/>Semu</g);
console.log('\n=== Button text check ===');
console.log('Truncated "Semu" buttons:', semuMatch ? semuMatch.length : 0);
