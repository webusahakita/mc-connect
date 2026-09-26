const fs = require('fs');

// 1. Update admin.html
let html = fs.readFileSync('public/admin.html', 'utf8');

const targetHtml = `<div class="form-group">
                                <label class="form-label">Logo Brand / Web (URL)</label>
                                <input type="url" class="form-input" id="ws_logo_url" placeholder="https://example.com/logo.png">
                                <small style="color:var(--adm-text-muted); display:block; margin-top:0.5rem;">Logo ini akan digunakan pada pojok kiri atas dashboard, favicon browser, invoice pelanggan, serta berkas Press Kit PDF.</small>
                            </div>`;

const replaceHtml = `<div class="form-group">
                                <label class="form-label">Logo Brand / Web</label>
                                <div style="display:flex; gap:1rem; flex-wrap:wrap; align-items:flex-end;">
                                    <div style="flex: 1; min-width:250px;">
                                        <label style="display:block; margin-bottom:0.5rem; font-size:0.75rem; color:var(--text-secondary);">Tautan (URL) atau Base64</label>
                                        <input type="text" class="form-input" id="ws_logo_url" placeholder="https://example.com/logo.png" oninput="const img = document.getElementById('previewLogoImg'); if(img) img.src = this.value || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%2280%22%3E%3Crect%20width%3D%22200%22%20height%3D%2280%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22bold%22%20fill%3D%22%2364748b%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ELogo%20Preview%3C%2Ftext%3E%3C%2Fsvg%3E';">
                                    </div>
                                    <div>
                                        <label style="display:block; margin-bottom:0.5rem; font-size:0.75rem; color:var(--text-secondary);">Upload File (Otomatis konversi)</label>
                                        <input type="file" id="ws_logo_file" accept="image/*" class="form-input" onchange="handleWebLogoUpload(event)" style="padding:0.35rem 0.6rem;">
                                    </div>
                                </div>
                                <div style="margin-top:1rem; padding:1rem; background:rgba(255,255,255,0.03); border-radius:var(--adm-radius-sm); border:1px dashed rgba(255,255,255,0.1); width:fit-content;">
                                    <div style="margin-bottom:0.5rem; font-size:0.75rem; color:var(--text-secondary);">Pratinjau Logo:</div>
                                    <img id="previewLogoImg" src="data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%2280%22%3E%3Crect%20width%3D%22200%22%20height%3D%2280%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22bold%22%20fill%3D%22%2364748b%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ELogo%20Preview%3C%2Ftext%3E%3C%2Fsvg%3E" alt="Logo Preview" style="max-height:80px; object-fit:contain; background:#fff; padding:0.5rem; border-radius:4px;">
                                </div>
                                <small style="color:var(--adm-text-muted); display:block; margin-top:1rem;">Logo ini akan digunakan pada pojok kiri atas dashboard, favicon browser, invoice pelanggan, serta berkas Press Kit PDF.</small>
                            </div>`;

html = html.replace(targetHtml, replaceHtml);
fs.writeFileSync('public/admin.html', html, 'utf8');

// 2. Update cms-overrides.js
let js = fs.readFileSync('public/js/cms-overrides.js', 'utf8');

// Insert the new upload function just before saveWebSettings
const jsInsertTarget = `// --- Logo Web & Invoice ---`;
const jsUploadFunction = `// --- Logo Web & Invoice ---
window.handleWebLogoUpload = function(event) {
    const file = event.target.files[0];
    if (file) {
        // Cek ukuran max 500KB agar database tidak berat
        if (file.size > 500 * 1024) {
            alert('Ukuran file logo terlalu besar. Maksimal 500KB untuk logo.');
            event.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('previewLogoImg');
            if(img) img.src = e.target.result;
            const input = document.getElementById('ws_logo_url');
            if(input) input.value = e.target.result; 
        }
        reader.readAsDataURL(file);
    }
};
`;

js = js.replace(jsInsertTarget, jsUploadFunction);

// Also need to initialize the logo preview in loadCmsWebSettings
const initLogoTarget = `            if (paySet.logoUrl) {
                const wl = document.getElementById('ws_logo_url');
                if (wl) wl.value = paySet.logoUrl;
            }`;

const initLogoReplace = `            if (paySet.logoUrl) {
                const wl = document.getElementById('ws_logo_url');
                const wlImg = document.getElementById('previewLogoImg');
                if (wl) wl.value = paySet.logoUrl;
                if (wlImg) wlImg.src = paySet.logoUrl;
            }`;

js = js.replace(initLogoTarget, initLogoReplace);

fs.writeFileSync('public/js/cms-overrides.js', js, 'utf8');
console.log('Added logo upload feature to admin.html and cms-overrides.js');
