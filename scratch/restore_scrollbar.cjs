const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

html = html.replace(/\.cms-nav-tabs::-webkit-scrollbar\s*\{\s*display:\s*none;\s*\}/, 
`.cms-nav-tabs::-webkit-scrollbar { height: 4px; }
        .cms-nav-tabs::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 4px; }
        .cms-nav-tabs::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.5); border-radius: 4px; }
        .cms-nav-tabs::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.8); }`);

html = html.replace('scrollbar-width: none;', 'scrollbar-width: thin; scrollbar-color: rgba(212, 175, 55, 0.5) rgba(255, 255, 255, 0.05);');

fs.writeFileSync('public/admin.html', html);
console.log('Scrollbar restored');
