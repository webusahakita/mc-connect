const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

let s = html.indexOf('<div id="sec-cashflow"');
console.log(html.substring(s, s + 1500));
