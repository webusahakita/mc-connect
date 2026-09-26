const fs = require('fs');

// ============================================
// FIX 1: Add missing sidebar functions
// ============================================
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

if (!js.includes('function toggleSidebar')) {
    let sidebarFunctions = `
// Sidebar Toggle Functions
function openSidebar() {
    const shell = document.querySelector('.admin-shell');
    const backdrop = document.getElementById('sidebarBackdrop');
    const sidebar = document.querySelector('.admin-sidebar');
    if (shell) shell.classList.add('sidebar-mobile-open');
    if (backdrop) backdrop.classList.add('active');
    if (sidebar) sidebar.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    const shell = document.querySelector('.admin-shell');
    const backdrop = document.getElementById('sidebarBackdrop');
    const sidebar = document.querySelector('.admin-sidebar');
    if (shell) shell.classList.remove('sidebar-mobile-open');
    if (backdrop) backdrop.classList.remove('active');
    if (sidebar) sidebar.classList.remove('open');
    document.body.style.overflow = '';
}

function toggleSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        if (window.innerWidth <= 1024) {
            openSidebar();
        } else {
            // Desktop: toggle collapsed state
            const shell = document.querySelector('.admin-shell');
            if (shell) shell.classList.toggle('sidebar-collapsed');
        }
    }
}
window.toggleSidebar = toggleSidebar;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;

`;
    // Insert before DOMContentLoaded
    let domIdx = js.lastIndexOf("document.addEventListener('DOMContentLoaded'");
    if (domIdx === -1) domIdx = js.lastIndexOf('document.addEventListener("DOMContentLoaded"');
    
    if (domIdx !== -1) {
        js = js.substring(0, domIdx) + sidebarFunctions + js.substring(domIdx);
    } else {
        js += sidebarFunctions;
    }
    console.log('Added sidebar toggle functions');
}

// ============================================
// FIX 2: Fix remaining text corruptions
// ============================================
// admin-core.js
js = js.replace(/addata/g, 'ada data');
js = js.replace(/Belum adacara/g, 'Belum ada acara');
js = js.replace(/Tidak adacarsesuai/g, 'Tidak ada acara sesuai');

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
console.log('Fixed admin-core.js');

// customers.js
let cjs = fs.readFileSync('public/js/customers.js', 'utf8');
cjs = cjs.replace(/addata/g, 'ada data');
fs.writeFileSync('public/js/customers.js', cjs, 'utf8');
console.log('Fixed customers.js');

// admin.html
let html = fs.readFileSync('public/admin.html', 'utf8');

// Fix all remaining corruptions
html = html.replace(/Belum adacara/g, 'Belum ada acara');
html = html.replace(/Tidak adacara/g, 'Tidak ada acara');
html = html.replace(/addata/g, 'ada data');
html = html.replace(/adacara/g, 'ada acara');

// Fix "engaturan CM" patterns  
html = html.replace(/engaturan CM/g, 'Pengaturan CMS');
html = html.replace(/>Pengaturan CMS S</g, '>Pengaturan CMS<'); // prevent double S

// Fix "fle🛡️ 1"
html = html.replace(/fle🛡️ 1/g, 'flex: 1');
html = html.replace(/fle🛡️/g, 'flex:');

// Fix "emuStatus Bayar"
html = html.replace(/>emuStatus Bayar</g, ' value="all">Semua Status Bayar<');
html = html.replace(/emuStatus/g, 'Semua Status');

// Fix "emuKalender"  
html = html.replace(/>emuKalender</g, ' value="all">Semua Kalender<');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed admin.html');

console.log('\nDone! All text corruptions fixed.');
