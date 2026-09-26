const fs = require('fs');

let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

// ============================================================
// FIX CMS CONFIG INTEGRATION
// ============================================================
let cmsReplacement = `function initAdminCms() {
    try {
        let saved = null;
        if (typeof AdminDB !== 'undefined') {
            const pkgs = AdminDB.getItem('mc_packages_config');
            const bio = AdminDB.getItem('mc_biodata_config');
            const press = AdminDB.getItem('mc_presskit_v2');
            if (bio || pkgs || press) {
                // We have DB data! Use it.
                saved = JSON.stringify({ bio, pkgs, press });
            }
        }
        
        if (!saved) saved = localStorage.getItem('mc_cms_config');
        
        if (saved) {
            window.cmsConfig = typeof saved === 'string' ? JSON.parse(saved) : saved;
        } else {
            window.cmsConfig = {};
        }
        
        // Populate CMS fields if on settings page
        const heroTitle = document.getElementById('cmsHeroTitle');
        if (heroTitle && window.cmsConfig.bio && window.cmsConfig.bio.stageName) {
            heroTitle.value = window.cmsConfig.bio.stageName;
        }
    } catch(e) {
        console.warn('CMS init skipped:', e.message);
    }
}`;
js = js.replace(/function initAdminCms\(\) \{[\s\S]*?window\.initAdminCms = initAdminCms;/g, cmsReplacement + '\nwindow.initAdminCms = initAdminCms;');

// ============================================================
// FIX PAYMENT SETTINGS INTEGRATION
// ============================================================
let paymentReplacement = `function loadPaymentSettings() {
    try {
        let saved = null;
        if (typeof AdminDB !== 'undefined') {
            saved = AdminDB.getItem('mc_payment_settings');
        }
        if (!saved) saved = localStorage.getItem('mc_payment_settings');
        
        if (saved) {
            return typeof saved === 'string' ? JSON.parse(saved) : saved;
        }
    } catch(e) {}
    
    return {
        bankName: 'BCA',
        bankAccount: '',
        bankHolder: '',
        dpPercent: 50,
        qrisUrl: ''
    };
}`;
js = js.replace(/function loadPaymentSettings\(\) \{[\s\S]*?window\.loadPaymentSettings = loadPaymentSettings;/g, paymentReplacement + '\nwindow.loadPaymentSettings = loadPaymentSettings;');

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
console.log('Fixed CMS and Payment Settings Integrations');
