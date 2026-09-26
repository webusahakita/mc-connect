const fs = require('fs');

// Fix admin-core.js runtime issues
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Fix corrupted icon text
js = js.replace(/icon = 'x}0'/g, "icon = '🎭'");
js = js.replace(/icon = 'x'/g, "icon = '🏢'");

// Fix corrupted text
js = js.replace(/Belum adacara/g, 'Belum ada acara');
js = js.replace(/Tidak adacarsesuai filter/g, 'Tidak ada acara sesuai filter');
js = js.replace(/Belum Ada Data/g, 'Belum Ada Data'); // already fixed
js = js.replace(/acarselesai/g, 'acara selesai');

// Fix "$newCharts" text showing up
let newChartsMatch = js.match(/\$newCharts/g);
if (newChartsMatch) {
    console.log('Found $newCharts:', newChartsMatch.length);
}

// Make sure navigateToSection is globally accessible
if (!js.includes('window.navigateToSection')) {
    js = js.replace('function navigateToSection(', 'function navigateToSection(');
    // Add global assignment after function
    let navIdx = js.indexOf('function navigateToSection(');
    if (navIdx !== -1) {
        // find the end of the function - find the matching closing brace
        // Instead, just add window assignment after the function definition exists
        if (!js.includes('window.navigateToSection = navigateToSection;')) {
            // The fix_all_errors.cjs already added it, let's verify
            let windowNavIdx = js.indexOf('window.navigateToSection');
            if (windowNavIdx !== -1) {
                console.log('window.navigateToSection already assigned');
            }
        }
    }
}

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
console.log('admin-core.js runtime fixes applied');

// Fix admin.html
let html = fs.readFileSync('public/admin.html', 'utf8');

// Check for $newCharts text in HTML
if (html.includes('$newCharts')) {
    console.log('Found $newCharts in admin.html');
    // This is from a template literal that got corrupted - remove it
    html = html.replace(/\$newCharts/g, '');
}

// Fix "Selamat Datang, ... ! 9" - the 9 is a remnant
let welcomeMatch = html.match(/Selamat Datang,.*?!\s*9/);
if (welcomeMatch) {
    console.log('Found welcome with trailing 9:', welcomeMatch[0]);
    html = html.replace(/(Selamat Datang,.*?!)\s*9/g, '$1');
}

// Fix "Masa Tunggu Menunggu DP atau review" text corruption
html = html.replace(/Menunggu DP atauReview/gi, 'Menunggu DP atau Review');
html = html.replace(/Menunggu DP atauReview/g, 'Menunggu DP atau Review');
html = html.replace(/MenunggDP ataureviewer/gi, 'Menunggu DP atau Review');
html = html.replace(/MenunggDP atauReview/gi, 'Menunggu DP atau Review');
html = html.replace(/MenunggDP/g, 'Menunggu DP');
html = html.replace(/Menunggu DP ataureview/g, 'Menunggu DP atau Review');

// Fix "Masa Tunggu Menungg DP ataurev" corruptions
html = html.replace(/Menungg DP/g, 'Menunggu DP');
html = html.replace(/DP ataurev/g, 'DP atau Review');

// Fix "fle🛡️ 1" -> "flex: 1"
html = html.replace(/fle🛡️ 1/g, 'flex: 1');

// Fix "engaturan CM" -> "Pengaturan CMS"
html = html.replace(/>engaturan CM</g, '>Pengaturan CMS<');
html = html.replace(/engaturan CM/g, 'Pengaturan CMS');

// Fix "BukCommand" -> "Buka Command"
html = html.replace(/BukCommand/g, 'Buka Command');
html = html.replace(/BukDirektori/g, 'Buka Direktori');

// Fix stray icon x in HTML
html = html.replace(/>x <\/span>/g, '>⏰ </span>');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('admin.html runtime fixes applied');

// Fix customers.js
let cjs = fs.readFileSync('public/js/customers.js', 'utf8');

// Double check esc() is defined or removed
let escCount = (cjs.match(/esc\(/g) || []).length;
console.log('esc() calls in customers.js:', escCount);

if (escCount > 0 && !cjs.includes('function esc(')) {
    // Add esc function
    let iife = cjs.indexOf('{');
    if (iife !== -1) {
        let escFn = '\nfunction esc(str) { if (!str) return ""; const d = document.createElement("div"); d.textContent = str; return d.innerHTML; }\n';
        cjs = cjs.substring(0, iife + 1) + escFn + cjs.substring(iife + 1);
        console.log('Added esc() function');
    }
}

// Fix text corruptions
cjs = cjs.replace(/Tidak ada data/g, 'Tidak ada data');
cjs = cjs.replace(/Coba kata kunci/g, 'Coba kata kunci');

fs.writeFileSync('public/js/customers.js', cjs, 'utf8');
console.log('customers.js runtime fixes applied');
