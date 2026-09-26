const fs = require('fs');
let js = fs.readFileSync('public/js/customers.js', 'utf8');
js = js.replace(/Dat=/g, 'Data =');
fs.writeFileSync('public/js/customers.js', js, 'utf8');
