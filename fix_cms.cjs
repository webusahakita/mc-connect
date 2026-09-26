const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

// 1. Add switchCmsSubTab globally
const tabFn = `
function switchCmsSubTab(targetId, btn) {
    const navGroup = btn.closest('.cms-nav-tabs') || btn.closest('.ecc-tabs');
    if (navGroup) {
        navGroup.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    let section = document.getElementById('sec-cms');
    if (!section) section = document.getElementById('sec-web-settings');
    if (!section) section = btn.closest('.admin-section');
    
    if (section) {
        section.querySelectorAll('.cms-subpanel, .ecc-pane').forEach(p => p.classList.remove('active'));
    } else {
        // Fallback global search
        document.querySelectorAll('.cms-subpanel, .ecc-pane').forEach(p => p.classList.remove('active'));
    }

    const target = document.getElementById(targetId);
    if (target) target.classList.add('active');
}
window.switchCmsSubTab = switchCmsSubTab;
`;
if (!js.includes('function switchCmsSubTab')) {
    js += '\n' + tabFn;
    console.log('Added switchCmsSubTab');
}

// 2. Rewrite initAdminCms to map all fields correctly
const newInit = `
function initAdminCms() {
    try {
        let saved = null;
        if (typeof AdminDB !== 'undefined') {
            const pkgs = AdminDB.getItem('mc_packages_config');
            const bio = AdminDB.getItem('mc_biodata_config');
            const press = AdminDB.getItem('mc_presskit_v2');
            if (bio || pkgs || press) {
                saved = JSON.stringify({ bio: bio || {}, pkgs: pkgs || [], press: press || {} });
            }
        }
        
        if (!saved) saved = localStorage.getItem('mc_cms_config');
        
        if (saved) {
            window.cmsConfig = typeof saved === 'string' ? JSON.parse(saved) : saved;
        } else {
            window.cmsConfig = {};
        }
        
        if (!window.cmsConfig.bio) window.cmsConfig.bio = {};
        const bio = window.cmsConfig.bio;
        
        const mapVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== undefined) el.value = val;
        };
        
        mapVal('cmsNamaPanggung', bio.stageName);
        mapVal('cmsEmail', bio.email);
        mapVal('cmsBioText', bio.shortBio);
        mapVal('cmsStatEvents', bio.totalEvents);
        mapVal('cmsStatYears', bio.yearsExp);
        mapVal('cmsSpesialisasi', bio.specialties);
        mapVal('cmsFotoUrl', bio.profileImg);
        mapVal('cmsIg', bio.ig);
        mapVal('cmsTiktok', bio.tiktok);
        mapVal('cmsFb', bio.fb);
        
        if (bio.profileImg) {
            const preview = document.getElementById('cmsFotoPreview');
            if (preview) preview.src = bio.profileImg;
        }
        
    } catch(e) {
        console.warn('CMS init skipped:', e.message);
    }
}
window.initAdminCms = initAdminCms;
`;

js = js.replace(/function initAdminCms\(\) \{[\s\S]*?window\.initAdminCms = initAdminCms;/g, newInit.trim());

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
console.log('Fixed initAdminCms');
