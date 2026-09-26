const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');
js = js.replace('ada\\\\n        if', 'ada\n        if');
fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
