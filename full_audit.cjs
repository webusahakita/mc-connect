const fs = require('fs');

console.log('=== COMPREHENSIVE ERROR AUDIT ===\n');

// 1. Check all JS syntax
const vm = require('vm');
const jsFiles = fs.readdirSync('public/js').filter(f => f.endsWith('.js'));
let allSyntaxOk = true;
for (let file of jsFiles) {
    try {
        new vm.Script(fs.readFileSync('public/js/' + file, 'utf8'), { filename: file });
    } catch(e) {
        console.log('SYNTAX ERROR in ' + file + ':', e.message);
        allSyntaxOk = false;
    }
}
if (allSyntaxOk) console.log('1. ALL JS FILES SYNTAX: OK');

// 2. Check for undefined function references
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');
let cjs = fs.readFileSync('public/js/customers.js', 'utf8');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Check navigateToSection
console.log('\n2. FUNCTION DEFINITIONS:');
console.log('   navigateToSection defined:', js.includes('function navigateToSection'));
console.log('   window.navigateToSection assigned:', js.includes('window.navigateToSection'));
console.log('   toggleSidebar defined:', js.includes('function toggleSidebar') || js.includes('function openSidebar'));
console.log('   closeSidebar defined:', js.includes('function closeSidebar'));
console.log('   updateAdminClock defined:', js.includes('function updateAdminClock'));

// 3. Check for remaining corrupted text
console.log('\n3. TEXT CORRUPTION CHECK:');
let corruptions = [
    ['PerformMC', 'Performa MC'],
    ['addata', 'ada data'],
    ['adacara', 'ada acara'],
    ['acarselesai', 'acara selesai'],
    ['Cobkat', 'Coba kata'],
    ['engaturan CM', 'Pengaturan CMS'],
    ['BukCommand', 'Buka Command'],
    ['BukDirektori', 'Buka Direktori'],
    ['MenunggDP', 'Menunggu DP'],
    ['$newCharts', '(removed)'],
    ['fle🛡️', 'flex:'],
    ['emuStatus', 'Semua Status'],
    ['emuKalender', 'Semua Kalender'],
];

let found = [];
for (let [bad, good] of corruptions) {
    if (html.includes(bad)) found.push(['admin.html', bad, good]);
    if (js.includes(bad)) found.push(['admin-core.js', bad, good]);
    if (cjs.includes(bad)) found.push(['customers.js', bad, good]);
}

if (found.length === 0) {
    console.log('   No corrupted text found - CLEAN');
} else {
    found.forEach(([file, bad, good]) => {
        console.log('   FOUND "' + bad + '" in ' + file + ' (should be "' + good + '")');
    });
}

// 4. Check for control characters
console.log('\n4. CONTROL CHARACTER CHECK:');
let controlCharsFound = false;
for (let [name, content] of [['admin.html', html], ['admin-core.js', js], ['customers.js', cjs]]) {
    let controlMatch = content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g);
    if (controlMatch) {
        console.log('   ' + name + ': ' + controlMatch.length + ' control chars found');
        controlCharsFound = true;
    }
}
if (!controlCharsFound) console.log('   No control characters found - CLEAN');

// 5. Check for window.calendarApp
console.log('\n5. CALENDAR INTEGRATION:');
console.log('   window.calendarApp assigned:', js.includes('window.calendarApp'));
console.log('   window.adminCalendar assigned:', js.includes('window.adminCalendar'));
console.log('   AvailabilityCalendar instantiated:', js.includes('new AvailabilityCalendar'));

// 6. Check HTML script references
console.log('\n6. HTML SCRIPT REFERENCES:');
let scripts = html.match(/<script\s+src="([^"]+)"/g);
if (scripts) {
    scripts.forEach(s => {
        let src = s.match(/src="([^"]+)"/)[1];
        let path = src.startsWith('/') ? 'public' + src : 'public/' + src;
        if (fs.existsSync(path)) {
            console.log('   ' + src + ': EXISTS');
        } else {
            console.log('   ' + src + ': MISSING!');
        }
    });
}

// 7. Check resize listener
console.log('\n7. RESIZE LISTENER:', js.includes("window.addEventListener('resize'") ? 'PRESENT' : 'MISSING');

// 8. Check for esc() references without definition
console.log('\n8. esc() FUNCTION CHECK:');
let escCallsInCjs = (cjs.match(/esc\(/g) || []).length;
let escDefInCjs = cjs.includes('function esc(');
console.log('   customers.js: ' + escCallsInCjs + ' calls, defined: ' + escDefInCjs);
if (escCallsInCjs > 0 && !escDefInCjs) console.log('   WARNING: esc() used but not defined!');

console.log('\n=== AUDIT COMPLETE ===');
