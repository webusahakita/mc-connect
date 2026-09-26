const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Fix missing <a> tags
html = html.replace(/<href=/g, '<a href=');
html = html.replace(/<\/href>/g, '</a>'); // just in case

// Fix checkbo🔒
html = html.replace(/checkbo🔒 /g, 'checkbox" ');
// Fix Bo🔒
html = html.replace(/Bo🔒 /g, 'Box" ');
// Fix Inde🔒
html = html.replace(/Inde🔒 /g, 'Index" ');
// Fix He🔒
html = html.replace(/He🔒 /g, 'Hex" ');

fs.writeFileSync('public/admin.html', html, 'utf8');
