const fs = require('fs');
let js = fs.readFileSync('public/js/bundle-test.js', 'utf8');

js = js.replace(/btn\.textContent = 'xR"'/g, "btn.textContent = '🌞'");
js = js.replace(/btn\.textContent = newTheme === 'dark' \? '.*?' : '.*?'/g, "btn.textContent = newTheme === 'dark' ? '🌙' : '🌞'");

fs.writeFileSync('public/js/bundle-test.js', js, 'utf8');
console.log('Fixed broken theme icons in bundle-test.js');
