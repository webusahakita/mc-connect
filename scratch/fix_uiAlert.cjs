const fs = require('fs');
let js = fs.readFileSync('public/js/cms-overrides.js', 'utf8');

js = js.replace(/window\.uiAlert/g, 'window.showToast');
js = js.replace(/typeof window\.uiAlert/g, 'typeof window.showToast');
js = js.replace(/'success'/g, "'gold'");
js = js.replace(/'error'/g, "'red'");

fs.writeFileSync('public/js/cms-overrides.js', js);
console.log('Replaced uiAlert with showToast in cms-overrides.js');

let html = fs.readFileSync('public/admin.html', 'utf8');
html = html.replace(/cms-overrides\.js\?v=\d+\.\d+/g, 'cms-overrides.js?v=8.7');
fs.writeFileSync('public/admin.html', html);
console.log('Bumped version in admin.html to 8.7');
