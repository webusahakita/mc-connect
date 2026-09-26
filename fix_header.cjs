const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Header
html = html.replace(/a~°/g, '🏠');
html = html.replace(/x"/g, '⏰');
html = html.replace(/xR Portal Publik a\+-/g, '🌐 Portal Publik ↗');
html = html.replace(/a=,/g, '🔔');
html = html.replace(/a~/g, '🏠');
html = html.replace(/a~ /g, '🏠 ');
html = html.replace(/a \+/g, '↗');
html = html.replace(/a\+-/g, '↗');

// Sidebar top
html = html.replace(/MC-Connect v8.0 Pro/g, 'MC-Connect <span class="badge badge-tier-pro">v8.0 Pro</span>');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Final fixes applied');
