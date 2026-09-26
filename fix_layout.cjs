const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

let target = '<!-- ================= STICKY TOPBAR WORKSPACE ================= -->\n            <he🏠 Admin Workspace</span>';
if (!html.includes(target)) {
    target = '<!-- ================= STICKY TOPBAR WORKSPACE ================= -->\r\n            <he🏠 Admin Workspace</span>';
}

let rep1 = '<!-- ================= STICKY TOPBAR WORKSPACE ================= -->\n';
let rep2 = '            <header class="admin-topbar">\n';
let rep3 = '                <div class="admin-topbar-left">\n';
let rep4 = '                    <div class="admin-topbar-breadcrumb">\n';
let rep5 = '                        <div class="sidebar-icon-sq">🏠</div>\n';
let rep6 = '                        <span>Admin Workspace</span>';

html = html.replace(target, rep1+rep2+rep3+rep4+rep5+rep6);
fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Done fixing layout');
