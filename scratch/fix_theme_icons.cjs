const fs = require('fs');

let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

js = js.replace(/btn\.textContent = 'xR"'/g, "btn.textContent = '🌞'");
js = js.replace(/btn\.textContent = newTheme === 'dark' \? '.*?' : '.*?'/g, "btn.textContent = newTheme === 'dark' ? '🌙' : '🌞'");

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
console.log('Fixed broken theme icons in admin-core.js');
