const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html lang="en"><body><div class="admin-shell"></div></body></html>', { runScripts: 'dangerously', url: 'http://localhost' });
dom.window.console.warn = console.warn;
dom.window.console.error = console.error;
const fs = require('fs');
const script = dom.window.document.createElement('script');
script.textContent = fs.readFileSync('public/js/admin-core.js', 'utf8');
try {
  dom.window.document.body.appendChild(script);
  console.log('navigateToSection exists?', typeof dom.window.navigateToSection);
} catch(e) {
  console.error("Caught error:", e);
}
