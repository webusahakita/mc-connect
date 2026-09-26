const fs = require('fs');
let f = 'public/js/admin-core.js';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/\\`/g, '`');
c = c.replace(/\\\${/g, '${');
fs.writeFileSync(f, c);

let f2 = 'scratch/cms-overrides.js';
if (fs.existsSync(f2)) {
    let c2 = fs.readFileSync(f2, 'utf8');
    c2 = c2.replace(/\\`/g, '`');
    c2 = c2.replace(/\\\${/g, '${');
    fs.writeFileSync(f2, c2);
}
