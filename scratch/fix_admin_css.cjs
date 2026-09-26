const fs = require('fs');

let css = fs.readFileSync('public/css/admin.css', 'utf8');

// Replace hardcoded sidebar background
css = css.replace(/width: 275px;\s*background: #0B101E;/, 'width: 275px;\n    background: var(--adm-bg-card);');

// Replace hardcoded form-input background
css = css.replace(/\.form-input, \.form-select, \.form-textarea \{\s*width: 100%;\s*background: #0B101E;/g, '.form-input, .form-select, .form-textarea {\n    width: 100%;\n    background: var(--adm-bg-base);');

// Replace hardcoded form-input focus background
css = css.replace(/box-shadow: 0 0 0 3px rgba\(212, 175, 55, 0\.15\);\s*background: #0E1528;/g, 'box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);\n    background: var(--adm-bg-surface);');

fs.writeFileSync('public/css/admin.css', css, 'utf8');
console.log('Fixed hardcoded colors in admin.css');
