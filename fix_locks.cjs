const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

html = html.replace(/bo🔒 >/g, 'box">');
html = html.replace(/xxx🔒 >/g, 'xxxx">');

fs.writeFileSync('public/admin.html', html, 'utf8');
