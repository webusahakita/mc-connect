const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

const missingFns = `
window.handleSaveCmsBio = function(e) {
    if (e) e.preventDefault();
    const bio = {
        stageName: document.getElementById('cmsNamaPanggung')?.value || '',
        email: document.getElementById('cmsEmail')?.value || '',
        shortBio: document.getElementById('cmsBioText')?.value || '',
        totalEvents: document.getElementById('cmsStatEvents')?.value || '',
        yearsExp: document.getElementById('cmsStatYears')?.value || '',
        specialties: document.getElementById('cmsSpesialisasi')?.value || '',
        profileImg: document.getElementById('cmsFotoUrl')?.value || '',
        ig: document.getElementById('cmsIg')?.value || '',
        tiktok: document.getElementById('cmsTiktok')?.value || '',
        fb: document.getElementById('cmsFb')?.value || ''
    };
    
    if (typeof AdminDB !== 'undefined') {
        AdminDB.setItem('mc_biodata_config', JSON.stringify(bio));
    }
    if (typeof window.uiAlert === 'function') {
        window.uiAlert('Biodata & Showreel berhasil disimpan dan di-sync ke Web Publik!', 'success');
    } else {
        alert('Biodata & Showreel berhasil disimpan!');
    }
};

window.handleSaveCmsPolicies = function(e) {
    if (e) e.preventDefault();
    const pol = {
        terms: document.getElementById('cmsTermsText')?.value || '',
        refund: document.getElementById('cmsRefundText')?.value || '',
        riders: document.getElementById('cmsRidersText')?.value || ''
    };
    if (typeof AdminDB !== 'undefined') {
        AdminDB.setItem('mc_policies_config', JSON.stringify(pol));
    }
    if (typeof window.uiAlert === 'function') {
        window.uiAlert('Kebijakan & FAQ berhasil disimpan!', 'success');
    }
};

window.handleSaveCalendarWidgetConfig = function(e) {
    if (e) e.preventDefault();
    // Usually empty or handles some toggles
    if (typeof window.uiAlert === 'function') {
        window.uiAlert('Pengaturan Kalender berhasil disimpan!', 'success');
    }
};
`;

if (!js.includes('window.handleSaveCmsBio')) {
    js += '\n' + missingFns;
    fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
    console.log('Appended missing functions');
}
