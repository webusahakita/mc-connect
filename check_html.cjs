const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');
console.log(html.substring(0, 1000));
