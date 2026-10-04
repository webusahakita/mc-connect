const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Change "+ Cara Tambah Lagu" to "+ Tambah Lagu"
html = html.replace('+ Cara Tambah Lagu', '+ Tambah Lagu');

// Update onclick from window.uiAlert(...) to window.openMasterBankForm()
html = html.replace(/onclick="window\.uiAlert\('[^']*'\)"/g, 'onclick="window.openMasterBankForm()"');

fs.writeFileSync('public/admin.html', html);
console.log('Updated button in admin.html');
