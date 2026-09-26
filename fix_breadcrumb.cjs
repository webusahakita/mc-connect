const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// Fix initial breadcrumb to show Dashboard
html = html.replace(
    'id="topbarBreadcrumb">Kalender Acara</span>',
    'id="topbarBreadcrumb">Dashboard Ringkasan & Performa MC</span>'
);

// Fix "BukPortal Publik"
html = html.replace(/BukPortal/g, 'Buka Portal');

// Fix any remaining typo: "Pantau di acar" -> "Pantau di acara"
html = html.replace(/Pantau di acar([^a])/g, 'Pantau di acara$1');

// Fix "gaun/jas di sini" wardrobe text
html = html.replace(/gaun\/jas di sini\. Pantau di acara/g, 'gaun/jas di sini. Pantau di acara');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed breadcrumb and remaining typos');

// Fix JS too
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');
js = js.replace(/BukPortal/g, 'Buka Portal');
fs.writeFileSync('public/js/admin-core.js', js, 'utf8');

// Final syntax check
const vm = require('vm');
try {
    new vm.Script(js);
    console.log('admin-core.js: SYNTAX OK');
} catch(e) {
    console.log('admin-core.js SYNTAX ERROR:', e.message);
}
