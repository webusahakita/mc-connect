const fs = require('fs');

// Fix admin.html
let html = fs.readFileSync('public/admin.html', 'utf8');
html = html.replace(/loada nified/g, 'loadUnified');
html = html.replace(/loada rm/g, 'loadCrm');
html = html.replace(/downloada ll/g, 'downloadAll');
html = html.replace(/<metname=/g, '<meta name=');
html = html.replace(/<metproperty=/g, '<meta property=');
html = html.replace(/<metcontent=/g, '<meta content=');
html = html.replace(/AgendTerjadwal/g, 'Agenda Terjadwal'); // in case it missed any
fs.writeFileSync('public/admin.html', html, 'utf8');

// Fix admin-core.js
let core = fs.readFileSync('public/js/admin-core.js', 'utf8');
core = core.replace(/dat=/g, 'data =');
core = core.replace(/Dat=/g, 'Data =');
// wait, incomeDat= was already matched by Dat=? Yes, incomeDat= -> incomeData =
// what about dat= ? const dat= getCombined -> const data = getCombined
fs.writeFileSync('public/js/admin-core.js', core, 'utf8');
console.log('Fixed additional variables');
