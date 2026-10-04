const fs = require('fs');
let code = fs.readFileSync('public/stage.html', 'utf8');

// Replace the old rundownItems initialization
const regex = /let activeEventId = 1;[\s\S]*?document\.addEventListener\('DOMContentLoaded', \(\) => {/m;
const match = code.match(regex);
if (match) {
    const replacement = `let activeEventId = 1;
        try {
            const stored = localStorage.getItem('activeCommandCenterEventId');
            if (stored) activeEventId = stored;
        } catch(e) {}

        let rundownItems = [];
        let currentEventData = null;

        document.addEventListener('DOMContentLoaded', async () => {`;
    code = code.replace(match[0], replacement);
}

// Add fetchEventData inside DOMContentLoaded and define the function
const regex2 = /document\.addEventListener\('DOMContentLoaded', async \(\) => {[\s\S]*?setupTouchGestures\(\);\n        }\);/m;
const match2 = code.match(regex2);
if (match2) {
    const replacement2 = `document.addEventListener('DOMContentLoaded', async () => {
            if (window.teleprompter && typeof window.teleprompter.init === 'function') {
                window.teleprompter.init('prompterViewport', 'prompterTextContainer');
            }
            startClock();
            
            await fetchEventData();
            
            loadStageSoundboard();
            loadSegment(0);
            setupTouchGestures();
        });

        async function fetchEventData() {
            try {
                const res = await fetch('/api/cms/events');
                const json = await res.json();
                
                if (json.success && json.data) {
                    const ev = json.data.find(e => String(e.id) === String(activeEventId));
                    if (ev) {
                        currentEventData = ev;
                        
                        const titleEl = document.getElementById('stageEventTitleInfo');
                        if (titleEl) {
                            let eventName = ev.title || 'Acara';
                            let picName = ev.pic || '';
                            // if pic has phone number "Name (Phone)", extract just name
                            const m = picName.match(/(.*?)\\s*\\(.*?\\)/);
                            if (m) picName = m[1].trim();
                            
                            titleEl.textContent = eventName + (picName ? ' | PIC: ' + picName : '');
                        }
                        
                        const dbRundown = ev.rundown || (ev.metadata && ev.metadata.rundown) || [];
                        if (dbRundown.length > 0) {
                            rundownItems = dbRundown.map((item, i) => ({
                                urutan: i + 1,
                                judul_segmen: item.title,
                                naskah_prompter: item.prompter || item.script,
                                instruksi_musik: item.cue_music || item.musicTitle ? (item.cue_music || item.musicTitle) : '',
                                startTime: item.start_time || item.startTime || '',
                                endTime: item.end_time || item.endTime || '',
                                duration: item.duration || '',
                                pic: item.pic || ''
                            }));
                        } else {
                            rundownItems = [];
                        }
                    }
                }
            } catch (err) {
                console.error("Gagal fetch database:", err);
            }

            if (rundownItems.length === 0) {
                rundownItems = [{
                    urutan: 1,
                    judul_segmen: 'Belum Ada Rundown',
                    naskah_prompter: 'Rundown belum diset di Command Center. Harap tambahkan segmen terlebih dahulu.',
                    instruksi_musik: '',
                    startTime: '', endTime: ''
                }];
            }
        }`;
    code = code.replace(match2[0], replacement2);
}

// Add the UI element for Event Info
code = code.replace('Segmen 1/7: Open Gate & Welcoming Cocktail (Akustik)\n                    </span>', 'Segmen 1/7: Open Gate & Welcoming Cocktail (Akustik)\n                    </span>\n\n                    <!-- Event Title & PIC Info -->\n                    <span id="stageEventTitleInfo" style="font-size:0.85rem; color:#94A3B8; font-weight:600; margin-left:0.5rem; border-left:1px solid #334155; padding-left:0.8rem;">Memuat Acara...</span>');

fs.writeFileSync('public/stage.html', code);
console.log('Patched script successfully');
