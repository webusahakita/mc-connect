const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');
html = html.replace(/textareclass/g, 'textarea class');
html = html.replace(/Simpan Data ress Kit/g, 'Simpan Data Press Kit');
fs.writeFileSync('public/admin.html', html);
console.log('Fixed typos');
