const fs = require('fs');

// Fix navigateToSection to use correct sidebar class
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');
js = js.replace(/sidebar-nav-item/g, 'sidebar-item-btn');
fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
console.log('Fixed sidebar class name in JS');

// Set initial active in HTML
let html = fs.readFileSync('public/admin.html', 'utf8');

// Remove any existing active from sidebar buttons
html = html.replace(/class="sidebar-item-btn active"/g, 'class="sidebar-item-btn"');

// Add active to dashboard button
html = html.replace(
    'class="sidebar-item-btn" id="menu-dashboard"',
    'class="sidebar-item-btn active" id="menu-dashboard"'
);
fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Set dashboard button as active');

// Verify
let activeButtons = (html.match(/sidebar-item-btn active/g) || []).length;
console.log('Active sidebar buttons:', activeButtons);
