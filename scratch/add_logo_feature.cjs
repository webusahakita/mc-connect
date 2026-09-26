const fs = require('fs');

function addLogoFeature() {
    // 1. Update CmsApiController.php
    let apiCode = fs.readFileSync('app/Http/Controllers/CmsApiController.php', 'utf8');
    
    if (!apiCode.includes("'webConfig'")) {
        apiCode = apiCode.replace(
            /'calendarConfig'\s*=>.*?calendar_config,\s*(?=\])/s,
            `$&
                'webConfig'      => is_string($mc->payment_config) ? json_decode($mc->payment_config, true) : $mc->payment_config,`
        );
        
        apiCode = apiCode.replace(
            /'calendar_config'\s*=>.*?(?=,\s*\]\);\s*return response)/s,
            `$&,
            'payment_config'     => $request->input('webConfig') ? json_encode($request->input('webConfig')) : $mc->payment_config`
        );
        fs.writeFileSync('app/Http/Controllers/CmsApiController.php', apiCode, 'utf8');
        console.log('Updated CmsApiController.php');
    }

    // 2. Update ProfileApiController.php (Just in case)
    let profileCode = fs.readFileSync('app/Http/Controllers/ProfileApiController.php', 'utf8');
    if (!profileCode.includes("'webConfig'")) {
        profileCode = profileCode.replace(
            /'tiktok'\s*=>\s*\$mc->tiktok_handle,/,
            `$&
                'webConfig' => is_string($mc->payment_config) ? json_decode($mc->payment_config, true) : $mc->payment_config,`
        );
        fs.writeFileSync('app/Http/Controllers/ProfileApiController.php', profileCode, 'utf8');
        console.log('Updated ProfileApiController.php');
    }

    // 3. Add UI to admin.html
    let html = fs.readFileSync('public/admin.html', 'utf8');
    
    // Check if sec-web-settings exists, if not, add it before sec-command-center
    if (!html.includes('id="sec-web-settings"')) {
        const webSettingsSection = `
            <!-- ================= MENU 4.5: WEB SETTINGS ================= -->
            <div id="sec-web-settings" class="admin-section" style="display:none;">
                <div class="cms-subpanel">
                    <div class="ecc-card">
                        <div class="ecc-card-header">
                            <div class="ecc-card-title">Pengaturan Web & Logo</div>
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
            </div>
            `;
            
        html = html.replace(/(?=<!-- ================= MENU 5: EVENT COMMAND CENTER)/, webSettingsSection);
        fs.writeFileSync('public/admin.html', html, 'utf8');
        console.log('Added sec-web-settings to admin.html');
    }

    // 4. Update cms-overrides.js to save/load web settings and inject logo into PDF
    let js = fs.readFileSync('public/js/cms-overrides.js', 'utf8');
    
    if (!js.includes('saveWebSettings')) {
        const jsLogic = `
window.saveWebSettings = function() {
    const webConfig = {
        logo_url: document.getElementById('ws_logo_url').value
    };
    
    let btn = event.target.querySelector('button[type="submit"]');
    let originalText = btn ? btn.innerHTML : '';
    if(btn) { btn.disabled = true; btn.innerHTML = 'Menyimpan...'; }
    
    fetch('/api/cms/biodata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webConfig: webConfig })
    }).then(r => r.json()).then(res => {
        if(btn) { btn.disabled = false; btn.innerHTML = originalText; }
        if (typeof window.showToast === 'function') window.showToast('Pengaturan Web berhasil disimpan!', 'gold');
        initAdminCms(); // reload to apply changes globally
    }).catch(err => {
        if(btn) { btn.disabled = false; btn.innerHTML = originalText; }
        if (typeof window.showToast === 'function') window.showToast('Gagal menyimpan pengaturan', 'red');
    });
};
`;
        js = js.replace('window.saveBioData', jsLogic + '\nwindow.saveBioData');
        
        // Also apply it in initAdminCms
        js = js.replace(
            /window\.cmsConfig\.bio\s*=\s*data;/,
            `$&
        // Load web settings
        if (data.webConfig && data.webConfig.logo_url) {
            let logoEl = document.getElementById('ws_logo_url');
            if (logoEl) logoEl.value = data.webConfig.logo_url;
            
            // Apply favicon
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            favicon.href = data.webConfig.logo_url;
            
            // Apply to sidebar brand if exists
            let brandLogo = document.querySelector('.sidebar-brand img');
            if (brandLogo) {
                brandLogo.src = data.webConfig.logo_url;
                brandLogo.style.maxHeight = '40px';
                brandLogo.style.width = 'auto';
            }
        }`
        );
        
        fs.writeFileSync('public/js/cms-overrides.js', js, 'utf8');
        console.log('Added saveWebSettings to cms-overrides.js');
    }

}

addLogoFeature();
