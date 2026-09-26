const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Add resize listener at end of file if not present
if (!js.includes("window.addEventListener('resize'")) {
    js += `
// Auto-close mobile sidebar on window resize to desktop
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
    fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
    console.log('Added resize listener');
} else {
    console.log('Resize listener already present');
}
