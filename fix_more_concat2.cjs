const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

html = html.replace(/PerformMC/g, 'Performa MC');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed PerformMC in HTML');

let jsFile = fs.readFileSync('public/js/admin-core.js', 'utf8');
jsFile = jsFile.replace(/membukkembali/g, 'membuka kembali');
fs.writeFileSync('public/js/admin-core.js', jsFile, 'utf8');
console.log('Fixed membukkembali in JS');
