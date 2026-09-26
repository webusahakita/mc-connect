const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');
js = js.replace(/\$\{idHapus/g, '${idx})">Hapus');
fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
