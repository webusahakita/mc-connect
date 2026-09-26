const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// Replace specific hardcoded hex colors that break light mode with CSS variables
// #0B0F19 -> var(--adm-bg-surface)
html = html.replace(/background:\s*#0B0F19/g, 'background:var(--adm-bg-surface)');
// #050811 -> var(--adm-bg-base)
html = html.replace(/background:\s*#050811/g, 'background:var(--adm-bg-base)');
// #0D131F -> var(--adm-bg-card)
html = html.replace(/background:\s*#0D131F/g, 'background:var(--adm-bg-card)');
// #0F172A -> var(--adm-bg-card-hover)
html = html.replace(/background:\s*#0F172A/g, 'background:var(--adm-bg-card-hover)');
// #1a1a2e -> var(--adm-bg-surface)
html = html.replace(/background:\s*#1a1a2e/g, 'background:var(--adm-bg-surface)');
// For the select in eccEventSelector (line 1755) which also had color:#FFFFFF hardcoded:
html = html.replace(/color:\s*#FFFFFF/g, 'color:var(--adm-text-primary)');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed inline background colors in admin.html');
