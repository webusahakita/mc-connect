const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Inject the hamburger button into admin-topbar-left
let target = '<div class="admin-topbar-breadcrumb">';
let button = '<button class="btn btn-secondary btn-sm mobile-menu-toggle" onclick="toggleSidebar()" style="margin-right:0.75rem; font-size:1.2rem; padding:0.2rem 0.6rem;">☰</button>\n                    ';

if (!html.includes('mobile-menu-toggle')) {
    html = html.replace(target, button + target);
    fs.writeFileSync('public/admin.html', html, 'utf8');
    console.log('Hamburger menu injected into HTML');
} else {
    console.log('Hamburger menu already exists');
}

// Add CSS to hide it on desktop and show it on mobile
let css = fs.readFileSync('public/css/admin.css', 'utf8');
if (!css.includes('.mobile-menu-toggle { display: none; }')) {
    // Add to the top
    css = '.mobile-menu-toggle { display: none; }\n' + css;
    
    // Add to the media query
    let mediaQueryIdx = css.indexOf('@media (max-width: 1024px) {');
    if (mediaQueryIdx !== -1) {
        css = css.replace('@media (max-width: 1024px) {', '@media (max-width: 1024px) {\n    .mobile-menu-toggle { display: inline-block !important; }\n');
    }
    fs.writeFileSync('public/css/admin.css', css, 'utf8');
    console.log('CSS updated for mobile-menu-toggle');
} else {
    console.log('CSS already has mobile-menu-toggle');
}
