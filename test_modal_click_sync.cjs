const { JSDOM } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('public/admin.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost' });
dom.window.console.log = console.log;
dom.window.console.error = console.error;
dom.window.fetch = () => Promise.resolve({ json: () => Promise.resolve({ token: 'abc' }) });
dom.window.BroadcastChannel = class { constructor() {} postMessage() {} };
const scriptContent = fs.readFileSync('public/js/admin-core.js', 'utf8');
const script = dom.window.document.createElement('script');
script.textContent = scriptContent;
dom.window.document.body.appendChild(script);

console.log('DOM Loaded. Calling renderMusicBankSection');
dom.window.renderMusicBankSection();
console.log('Called renderMusicBankSection');
const btn = dom.window.document.querySelector('button[onclick="window.openMasterBankForm()"]');
console.log('Found button?', !!btn);
if (btn) {
    btn.click();
    console.log('Clicked button');
    const modal = dom.window.document.getElementById('modalMasterBankForm');
    console.log('Modal display:', modal ? modal.style.display : 'null');
}
