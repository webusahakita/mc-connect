const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

const newFn = `function switchCmsSubTab(targetId, btn) {
    const section = btn.closest('.admin-section');
    if (!section) return;

    // Reset tabs
    const navGroup = btn.closest('.cms-nav-tabs, .ecc-tabs');
    if (navGroup) {
        navGroup.querySelectorAll('.cms-tab-btn, .ecc-tab-btn, button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    // Hide all subpanels in this section only
    section.querySelectorAll('.cms-subpanel, .ecc-pane').forEach(p => p.classList.remove('active'));

    // Show target
    const target = document.getElementById(targetId);
    if (target) {
        target.classList.add('active');
    }
}
window.switchCmsSubTab = switchCmsSubTab;`;

js = js.replace(/function switchCmsSubTab\([^)]*\)\s*\{[\s\S]*?window\.switchCmsSubTab = switchCmsSubTab;/g, newFn);

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
console.log('Fixed switchCmsSubTab');
