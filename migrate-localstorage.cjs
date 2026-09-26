const fs = require('fs');
const files = ['public/js/admin-core.js', 'public/js/customers.js', 'public/js/sync-engine.js'];

files.forEach(file => {
    let f = fs.readFileSync(file, 'utf8');
    // Replace all localStorage calls EXCEPT for mc_theme, mc_auth*, mc_offline_queue
    f = f.replace(/localStorage\.(getItem|setItem|removeItem)\((?!['"]mc_(theme|auth|offline_queue)['"])/g, 'AdminDB.$1(');
    fs.writeFileSync(file, f);
    console.log('Updated ' + file);
});
