const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');
let matches = html.match(/onsubmit="([^"]+)"/g);
if (matches) {
    console.log(matches);
}
