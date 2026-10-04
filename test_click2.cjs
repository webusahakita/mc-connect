const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('public/admin.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost' });

dom.window.console.log = console.log;
dom.window.console.error = console.error;
dom.window.console.warn = console.warn;

// polyfills
dom.window.fetch = function() { return Promise.resolve({ json: () => Promise.resolve({ token: 'abc' }) }); };
dom.window.BroadcastChannel = class { constructor(name) { this.name = name; } postMessage() {} };

const scriptContent = fs.readFileSync('public/js/admin-core.js', 'utf8');
const script = dom.window.document.createElement('script');
script.textContent = scriptContent;
dom.window.document.body.appendChild(script);

setTimeout(() => {
    try {
        console.log("Is openMasterBankForm defined?", typeof dom.window.openMasterBankForm);
        const addBtn = dom.window.document.querySelector('button[onclick="window.openMasterBankForm()"]');
        if (addBtn) {
            console.log("Found add button, clicking...");
            addBtn.click();
            const modal = dom.window.document.getElementById('modalMasterBankForm');
            console.log("Modal display style after click:", modal ? modal.style.display : 'Not found');
        } else {
            console.log("Add button not found!");
        }

        if (typeof dom.window.renderMusicBankSection === 'function') {
            dom.window.renderMusicBankSection();
            const playBtn = dom.window.document.querySelector('button[title="Putar Preview"]');
            if (playBtn) {
                console.log("Found play button, clicking...");
                playBtn.click();
                const pModal = dom.window.document.getElementById('modalMusicPlayer');
                console.log("Play modal display style after click:", pModal ? pModal.style.display : 'Not found');
            } else {
                console.log("Play button not found!");
            }
        } else {
            console.log("renderMusicBankSection is not a function!");
        }
    } catch (e) {
        console.error("Error during click test:", e);
    }
}, 1000);
