const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// 1. Add tab button
const tabRegex = /<button class="cms-tab-btn" onclick="switchCmsSubTab\('cms-cashflow-categories', this\)">Kategori Arus Kas<\/button>/;
const newTab = `<button class="cms-tab-btn" onclick="switchCmsSubTab('cms-cashflow-categories', this)">Kategori Arus Kas</button>
                    <button class="cms-tab-btn" onclick="switchCmsSubTab('web-logo', this)">Logo Web & Invoice</button>`;

if (tabRegex.test(html)) {
    html = html.replace(tabRegex, newTab);
    console.log('Added Logo tab button');
}

// 2. Add subpanel
const panelHTML = `
                <!-- Logo Web Settings -->
                <div class="cms-subpanel" id="web-logo" style="display:none;">
                    <div class="ecc-card">
                        <div class="ecc-card-header">
                            <div class="ecc-card-title">Pengaturan Logo Web & Invoice</div>
                            <p style="color:var(--adm-text-secondary); font-size:0.85rem; margin:0;">Atur identitas visual web, favicon, invoice, dan Press Kit.</p>
                        </div>
                        <form onsubmit="event.preventDefault(); saveWebSettings();">
                            <div class="form-group">
                                <label class="form-label">Logo Brand / Web (URL)</label>
                                <input type="url" class="form-input" id="ws_logo_url" placeholder="https://example.com/logo.png">
                                <small style="color:var(--adm-text-muted); display:block; margin-top:0.5rem;">Logo ini akan digunakan pada pojok kiri atas dashboard, favicon browser, invoice pelanggan, serta berkas Press Kit PDF.</small>
                            </div>
                            <div style="display:flex; justify-content:flex-end; margin-top:1.5rem;">
                                <button type="submit" class="btn btn-primary">💾 Simpan Pengaturan Web</button>
                            </div>
                        </form>
                    </div>
                </div>
`;

// Insert it right before the EVENT COMMAND CENTER section
const insertTarget = /<!-- ================= MENU 5: EVENT COMMAND CENTER ================= -->/;
if (insertTarget.test(html)) {
    html = html.replace(insertTarget, panelHTML + '\n            $&');
    console.log('Added web-logo subpanel');
}

fs.writeFileSync('public/admin.html', html, 'utf8');
