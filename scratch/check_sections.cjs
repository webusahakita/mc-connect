const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');
let match = html.match(/<div[^>]*id="sec-[^>]*>/g);
console.log(match);
