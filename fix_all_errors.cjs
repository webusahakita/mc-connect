const fs = require('fs');

// 1. Fix admin-core.js - fix the broken ending and add navigateToSection function
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Fix the broken console.error line at end of file
js = js.replace(
    /\n\s*\}\s*\n\s*\}\s*catch\(e\)\s*\{\s*console\.error\(Calendar Init Error:,\s*e\);\s*\}\s*\n\)\;\s*\n*/,
    '\n        }\n    } catch(e) { console.error("Calendar Init Error:", e); }\n});\n'
);

// Check brace count
let openBraces = 0;
for (let i = 0; i < js.length; i++) {
    if (js[i] === '{') openBraces++;
    if (js[i] === '}') openBraces--;
}
console.log('Brace balance after fix:', openBraces);

// If still unbalanced, trim the end to last valid structure
if (openBraces !== 0) {
    // Find the pattern at end and replace properly
    let lastDOMIdx = js.lastIndexOf("document.addEventListener('DOMContentLoaded'");
    if (lastDOMIdx === -1) lastDOMIdx = js.lastIndexOf('document.addEventListener("DOMContentLoaded"');
    
    if (lastDOMIdx !== -1) {
        let beforeDom = js.substring(0, lastDOMIdx);
        let domBlock = js.substring(lastDOMIdx);
        
        // Count braces in the DOM block
        let domBraces = 0;
        for (let i = 0; i < domBlock.length; i++) {
            if (domBlock[i] === '{') domBraces++;
            if (domBlock[i] === '}') domBraces--;
        }
        console.log('DOM block brace balance:', domBraces);
        
        // Fix: ensure the DOM block ends with proper closing
        // Remove existing broken ending
        domBlock = domBlock.replace(/\n\s*\}\s*\n\s*\}\s*catch\(e\).*$/s, '');
        domBlock = domBlock.replace(/\s+$/, '');
        
        // Recount
        domBraces = 0;
        for (let i = 0; i < domBlock.length; i++) {
            if (domBlock[i] === '{') domBraces++;
            if (domBlock[i] === '}') domBraces--;
        }
        
        // Add proper closings
        for (let i = 0; i < domBraces; i++) {
            domBlock += '\n    }';
        }
        // If the DOMContentLoaded arrow function is unclosed, we need });
        domBlock += '\n} catch(e) { console.error("Calendar Init Error:", e); }\n});\n';
        
        js = beforeDom + domBlock;
    }
}

// Recount final
openBraces = 0;
for (let i = 0; i < js.length; i++) {
    if (js[i] === '{') openBraces++;
    if (js[i] === '}') openBraces--;
}
console.log('Final brace balance:', openBraces);

// 2. Add navigateToSection function if missing
if (!js.includes('function navigateToSection')) {
    let navigateFunc = `
// Navigation function - switches between admin sections
function navigateToSection(sectionId, menuElement) {
    // Hide all sections
    document.querySelectorAll('[id^="sec-"]').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Show target section
    const target = document.getElementById(sectionId);
    if (target) {
        target.style.display = '';
    }
    
    // Update active menu
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    if (menuElement) {
        menuElement.classList.add('active');
    }
    
    // Update breadcrumb
    const breadcrumb = document.getElementById('topbarBreadcrumb');
    if (breadcrumb && typeof sectionBreadcrumbMap !== 'undefined' && sectionBreadcrumbMap[sectionId]) {
        breadcrumb.textContent = sectionBreadcrumbMap[sectionId];
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        if (typeof closeSidebar === 'function') closeSidebar();
    }
    
    // Scroll to top
    const mainContent = document.querySelector('.admin-main-content');
    if (mainContent) mainContent.scrollTop = 0;

    // Section-specific initialization
    if (sectionId === 'sec-customers' && typeof window.initCustomersPage === 'function') {
        window.initCustomersPage();
    }
    if (sectionId === 'sec-command-center' && typeof window.loadActiveEventInCommandCenter === 'function') {
        window.loadActiveEventInCommandCenter();
    }
}
window.navigateToSection = navigateToSection;

`;
    // Insert before the DOMContentLoaded listener
    let domIdx = js.lastIndexOf("document.addEventListener('DOMContentLoaded'");
    if (domIdx === -1) domIdx = js.lastIndexOf('document.addEventListener("DOMContentLoaded"');
    
    if (domIdx !== -1) {
        js = js.substring(0, domIdx) + navigateFunc + js.substring(domIdx);
        console.log('Added navigateToSection function');
    } else {
        js = navigateFunc + js;
        console.log('Prepended navigateToSection function');
    }
}

// 3. Fix remaining text typos 
js = js.replace(/PerformMC/g, 'Performa MC');
js = js.replace(/acarselesai/g, 'acara selesai');
js = js.replace(/Kalender Jadwal Acar\(Anti-Bentrok\)/g, 'Kalender Jadwal Acara (Anti-Bentrok)');

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
console.log('admin-core.js fully fixed');

// 4. Fix customers.js - ensure esc() is defined or replaced
let cjs = fs.readFileSync('public/js/customers.js', 'utf8');

// Check if esc() is still used
let escMatches = cjs.match(/esc\(/g);
console.log('esc() calls remaining in customers.js:', escMatches ? escMatches.length : 0);

if (escMatches && escMatches.length > 0) {
    // Add esc function at the top of the IIFE
    if (!cjs.includes('function esc(')) {
        let escFunc = `function esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }\n`;
        // Insert after first { or at top
        let firstBrace = cjs.indexOf('{');
        if (firstBrace !== -1) {
            cjs = cjs.substring(0, firstBrace + 1) + '\n' + escFunc + cjs.substring(firstBrace + 1);
        } else {
            cjs = escFunc + cjs;
        }
        console.log('Added esc() function to customers.js');
    }
}

// Fix text typos in customers.js
cjs = cjs.replace(/Tidak addata/g, 'Tidak ada data');
cjs = cjs.replace(/Cobkatkunci/g, 'Coba kata kunci');

fs.writeFileSync('public/js/customers.js', cjs, 'utf8');
console.log('customers.js fully fixed');

// 5. Fix admin.html - fix fle🛡️ typos
let html = fs.readFileSync('public/admin.html', 'utf8');
html = html.replace(/fle🛡️ 1/g, 'flex: 1');
html = html.replace(/PerformMC/g, 'Performa MC');

// Fix "engaturan CM" -> "Pengaturan CMS"
html = html.replace(/engaturan CM/g, 'Pengaturan CMS');

// Fix "BukCommand Center" -> "Buka Command Center"
html = html.replace(/BukCommand Center/g, 'Buka Command Center');

// Fix "BukDirektori" -> "Buka Direktori"
html = html.replace(/BukDirektori/g, 'Buka Direktori');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('admin.html fully fixed');
