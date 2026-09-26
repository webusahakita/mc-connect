const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

const target = 'function initAdminWorkspace() {';
const replacement = `function initAdminWorkspace() {
    // Integrate with Database (Sync Engine)
    if (typeof window.SyncEngine !== 'undefined' && typeof window.SyncEngine.pullAll === 'function') {
        window.SyncEngine.pullAll();
    }
`;

if (js.includes(target) && !js.includes('window.SyncEngine.pullAll')) {
    js = js.replace(target, replacement);
    fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
    console.log('Successfully injected SyncEngine.pullAll()');
} else {
    console.log('Already injected or not found.');
}
