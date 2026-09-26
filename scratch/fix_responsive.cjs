const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Fix breadcrumb class so media query hiding works on mobile
html = html.replace(/class="admin-topbar-breadcrumb"/g, 'class="admin-breadcrumbs"');

// Fix tabs scrolling
html = html.replace(/\.cms-nav-tabs\s*\{[^}]+\}/, match => {
    return match.replace('overflow-x: auto;', 'overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none;');
});
html = html.replace(/\.cms-tab-btn\s*\{[^}]+\}/, match => {
    return match.replace('cursor: pointer;', 'cursor: pointer; white-space: nowrap; flex-shrink: 0;');
});

// Hide scrollbar for webkit in cms-nav-tabs
if (!html.includes('::-webkit-scrollbar')) {
    html = html.replace('/* CMS Sub Tabs */', '/* CMS Sub Tabs */\n        .cms-nav-tabs::-webkit-scrollbar { display: none; }');
}

fs.writeFileSync('public/admin.html', html);
console.log('Fixed responsiveness in admin.html');
