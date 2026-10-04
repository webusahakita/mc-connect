const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Find sec-musicbank and remove style="display:none;"
html = html.replace(/<div id="sec-musicbank" class="admin-section" style="display:none;">/, '<div id="sec-musicbank" class="admin-section">');

fs.writeFileSync('public/admin.html', html);
console.log('Removed display:none from sec-musicbank');
