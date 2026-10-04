const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');
let mainIdx = html.indexOf('<main class="admin-main">');
let dashIdx = html.indexOf('<div id="sec-dashboard"');
console.log(html.substring(mainIdx, dashIdx + 50));
