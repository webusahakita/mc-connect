const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

let m = html.match(/[xa][^a-zA-Z0-9\s<>\=\"\-\/]{1,3}/g);
if (m) {
    let u = new Set(m);
    for (let s of u) {
        let hex = [];
        for(let i=0; i<s.length; i++) hex.push(s.charCodeAt(i).toString(16));
        console.log(s + ' => ' + hex.join(' '));
    }
} else {
    console.log('No matches');
}
