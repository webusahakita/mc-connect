const fs = require('fs');
const bundlePath = 'c:/Users/Nawakara/.gemini/antigravity-ide/scratch/mc-connect/public/js/bundle-test.js';
let b = fs.readFileSync(bundlePath, 'utf8');
b = b.replace(/\\nwindow\.closeModals/g, '\nwindow.closeModals');
b = b.replace(/\\n\/\*\*/g, '\n/**');
b = b.replace(/\\nwindow\.initAdminCms/g, '\nwindow.initAdminCms');
fs.writeFileSync(bundlePath, b);
console.log('Fixed bundle-test.js');

const cmsPath = 'c:/Users/Nawakara/.gemini/antigravity-ide/scratch/cms-overrides.js';
let c = fs.readFileSync(cmsPath, 'utf8');
if (c.indexOf('`') === -1) {
    console.log('No backticks found in cms-overrides.js. Need to fix it.');
}
