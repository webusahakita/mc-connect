const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// The rest of the concatenated words
html = html.replace(/Semutamu/g, 'Semua tamu');
html = html.replace(/pintu utamballroom/g, 'pintu utama ballroom');
html = html.replace(/Fitur Utam\(/g, 'Fitur Utama (');
html = html.replace(/Menu Utama Workspace/gi, 'Menu Utama'); // if any
html = html.replace(/Menu UtamWorkspace/gi, 'Menu Utama');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Done');
