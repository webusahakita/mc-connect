const fs = require('fs');
let code = fs.readFileSync('public/stage.html', 'utf8');

const target = `        document.addEventListener('DOMContentLoaded', async () => {
            if (window.teleprompter && typeof window.teleprompter.init === 'function') {
                window.teleprompter.init('prompterViewport', 'prompterTextContainer');
            }
            startClock();
            loadStageSoundboard();
            loadSegment(0);
            setupTouchGestures();
        });`;

const rep = `        document.addEventListener('DOMContentLoaded', async () => {
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
                            const m = picName.match(/(.*?)\\s*\\(/);
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
                console.error('Gagal fetch database:', err);
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

let modified = false;

const idx = code.indexOf(target);
if (idx !== -1) {
    code = code.replace(target, rep);
    modified = true;
    console.log('REPLACED!');
} else {
    // maybe newlines are \r\n
    const targetRN = target.replace(/\n/g, '\r\n');
    const idxRN = code.indexOf(targetRN);
    if (idxRN !== -1) {
        code = code.replace(targetRN, rep);
        modified = true;
        console.log('REPLACED WITH RN!');
    } else {
        console.log('NOT FOUND!');
    }
}

if (modified) {
    fs.writeFileSync('public/stage.html', code);
}
