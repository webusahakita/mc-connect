const fs = require('fs');
const htmlFile = 'public/admin.html';
let html = fs.readFileSync(htmlFile, 'utf8');

// 1. Rename sidebar menu parent
html = html.replace(
    /<span>Pengaturan Landing Page<\/span>/,
    '<span>Pengaturan</span>'
);

// 2. Rename sidebar sub-menu
html = html.replace(
    /<button class="sidebar-item-btn" id="menu-payment-settings" onclick="navigateToSection\('sec-payment-settings', this\)"/g,
    '<button class="sidebar-item-btn" id="menu-web-settings" onclick="navigateToSection(\'sec-web-settings\', this)"'
);
html = html.replace(
    /<span>Pengaturan Pembayaran<\/span>/,
    '<span>Pengaturan Web</span>'
);

// 3. Remove Kategori tabs from CMS Konten
html = html.replace(
    /\s*<button class="cms-tab-btn" onclick="switchCmsSubTab\('cms-categories', this\)">[\s\S]*?<\/button>/,
    ''
);
html = html.replace(
    /\s*<button class="cms-tab-btn" onclick="switchCmsSubTab\('cms-client-categories', this\)">[\s\S]*?<\/button>/,
    ''
);

// 4. Extract Kategori Acara and Kategori Klien panels
const catMatch = html.match(/(\s*<!-- CMS NEW: KATEGORI ACARA -->[\s\S]*?)(?=\s*<!-- CMS NEW: KATEGORI KLIEN)/);
const catHtml = catMatch ? catMatch[1] : '';
html = html.replace(catHtml, '');

const clientCatMatch = html.match(/(\s*<!-- CMS NEW: KATEGORI KLIEN -->[\s\S]*?)(?=\s*<!-- CMS 2: KATALOG LAYANAN)/);
const clientCatHtml = clientCatMatch ? clientCatMatch[1] : '';
html = html.replace(clientCatHtml, '');

// 5. Modify sec-payment-settings to sec-web-settings and inject tabs
html = html.replace(
    /id="sec-payment-settings" class="admin-section"/,
    'id="sec-web-settings" class="admin-section"'
);
html = html.replace(
    /<!-- ================= MENU 4B: PENGATURAN PEMBAYARAN ================= -->/,
    '<!-- ================= MENU 4B: PENGATURAN WEB ================= -->'
);
html = html.replace(
    /<h1 style="font-size:2rem; font-weight:800;">Pengaturan Pembayaran & QRIS<\/h1>/,
    '<h1 style="font-size:2rem; font-weight:800;">Pengaturan Web</h1>'
);

// We need to wrap the contents of the old sec-payment-settings into a cms-subpanel
const paymentContentStart = html.indexOf('<div id="sec-web-settings" class="admin-section">');
if (paymentContentStart !== -1) {
    // Find the end of the admin-section by looking for the next <!-- ================= MENU
    const nextMenuStart = html.indexOf('<!-- ================= MENU', paymentContentStart + 100);
    if (nextMenuStart !== -1) {
        let sectionHtml = html.substring(paymentContentStart, nextMenuStart);
        
        // Find where the header ends (the flex container with "Simpan Pengaturan" button)
        const headerEnd = sectionHtml.indexOf('</div>\n                \n                <div class="ecc-card">');
        
        if (headerEnd !== -1) {
            const beforeHeaderEnd = sectionHtml.substring(0, headerEnd + 7);
            const contentAfterHeader = sectionHtml.substring(headerEnd + 7, sectionHtml.lastIndexOf('</div>')); // Exclude the closing div of the section itself

            const newSectionHtml = beforeHeaderEnd + `
                <div class="cms-nav-tabs" style="margin-top:1.5rem;">
                    <button class="cms-tab-btn active" onclick="switchCmsSubTab('web-payment', this)">💳 Pembayaran & QRIS</button>
                    <button class="cms-tab-btn" onclick="switchCmsSubTab('cms-categories', this)">🎭 Kategori Acara</button>
                    <button class="cms-tab-btn" onclick="switchCmsSubTab('cms-client-categories', this)">👥 Kategori Klien</button>
                </div>
                <div class="cms-subpanel active" id="web-payment">
                    ${contentAfterHeader}
                </div>
                ${catHtml}
                ${clientCatHtml}
            </div>`;
            
            html = html.substring(0, paymentContentStart) + newSectionHtml + html.substring(nextMenuStart);
        }
    }
}

fs.writeFileSync(htmlFile, html, 'utf8');
console.log('Admin HTML modified successfully.');
