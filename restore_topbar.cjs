const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

let target = '<he🏠 Admin Workspace</span>';
let replacement = <header class="admin-topbar">
                <div class="admin-topbar-left">
                    <div class="admin-topbar-breadcrumb">
                        <div class="sidebar-icon-sq">🏠</div>
                        <span>Admin Workspace</span>;

html = html.replace(target, replacement);
fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Restored topbar HTML');
