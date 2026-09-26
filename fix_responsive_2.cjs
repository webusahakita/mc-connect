const fs = require('fs');

let adminJs = fs.readFileSync('public/js/admin-core.js', 'utf8');
if (!adminJs.includes('window.addEventListener(\'resize\'')) {
    let resizeScript = `
window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
        const shell = document.querySelector('.admin-shell');
        const backdrop = document.getElementById('sidebarBackdrop');
        const sidebar = document.querySelector('.admin-sidebar');
        if (shell) shell.classList.remove('sidebar-mobile-open');
        if (backdrop) backdrop.classList.remove('active');
        if (sidebar) sidebar.classList.remove('open');
        document.body.style.overflow = '';
    }
});
`;
    adminJs = adminJs + resizeScript;
    fs.writeFileSync('public/js/admin-core.js', adminJs, 'utf8');
    console.log('Added resize listener');
}
