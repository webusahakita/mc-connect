const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Dashboard
html = html.replace(/<div class=\"sidebar-icon-sq\">x <\/div>/g, '<div class=\"sidebar-icon-sq\">📊</div>');
// Kalender Acara
html = html.replace(/<div class=\"sidebar-icon-sq\">x &<\/div>/g, '<div class=\"sidebar-icon-sq\">📅</div>');
// Data Pelanggan
html = html.replace(/<div class=\"sidebar-icon-sq\">x <\/div>/g, '<div class=\"sidebar-icon-sq\">👥</div>');
// Cash Flow
html = html.replace(/<div class=\"sidebar-icon-sq\">x <\/div>/g, '<div class=\"sidebar-icon-sq\">💰</div>');
// Pengaturan
html = html.replace(/<div class=\"sidebar-icon-sq\">a\"<\/div>/g, '<div class=\"sidebar-icon-sq\">⚙️</div>');
// Event Command Center
html = html.replace(/<div class=\"sidebar-icon-sq\">a <\/div>/g, '<div class=\"sidebar-icon-sq\">⚡</div>');
// Wardrobe Tracker
html = html.replace(/<div class=\"sidebar-icon-sq\">x <\/div>/g, '<div class=\"sidebar-icon-sq\">👔</div>');
// Logout
html = html.replace(/xa Logout \/ Keluar/g, '🚪 Logout / Keluar');
html = html.replace(/xa Logout/g, '🚪 Logout');

// Additional fixes for Kalender Acara Screen based on the screenshot
html = html.replace(/x≡Hari Ini/g, '📅 Hari Ini');
html = html.replace(/x≡/g, '📅 ');
html = html.replace(/x"/g, '🔒 ');
html = html.replace(/a≡/g, '⏳ ');
html = html.replace(/x:/g, '🛡️ ');
html = html.replace(/xR/g, '🌐 ');
html = html.replace(/x" /g, '⏰ ');
html = html.replace(/a~/g, '🏠 ');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Sidebar and calendar headers fixed');
