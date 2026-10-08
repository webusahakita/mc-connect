const fs = require('fs');
let stageHtml = fs.readFileSync('public/stage.html', 'utf8');

// Replace loadStageSoundboard and renderStageSoundboard
const startLoad = stageHtml.indexOf('let stageSoundboardList = [];');
const endTrigger = stageHtml.indexOf('function startClock() {');

if (startLoad !== -1 && endTrigger !== -1) {
    const newSoundboardLogic = `let stageSoundboardList = [];

        function loadStageSoundboard() {
            try {
                if (window.currentEventData && window.currentEventData.metadata && window.currentEventData.metadata.soundboard) {
                    stageSoundboardList = window.currentEventData.metadata.soundboard;
                } else {
                    stageSoundboardList = [];
                }
            } catch(e) {}

            renderStageSoundboard();
        }

        function renderStageSoundboard() {
            const grid = document.getElementById('stageSoundboardGrid');
            if (!grid) return;

            const activePads = stageSoundboardList.filter(item => item.is_brought !== false);
            if (activePads.length === 0) {
                grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.85rem;">Belum ada efek suara.</div>';
                return;
            }

            grid.innerHTML = activePads.map((item, idx) => {
                const title = item.title || item.name || 'Untitled';
                const shortcut = item.shortcut || item.key || '';
                return \`
                    <button class="sound-pad" id="stage-pad-\${idx}" onclick="triggerStageSound('\${title.replace(/'/g, "\\\\'")}', this)" title="\${title} \${shortcut ? '(Shortcut: ' + shortcut + ')' : ''}" style="position:relative;">
                        \${shortcut ? \`<span style="position:absolute; top:4px; right:6px; font-size:0.68rem; font-family:monospace; color:var(--gold-primary); font-weight:800; background:rgba(0,0,0,0.5); padding:1px 4px; border-radius:3px;">[\${shortcut}]</span>\` : ''}
                        <span class="sound-pad-icon">🎵</span>
                        <span style="font-size:0.82rem; font-weight:700; line-height:1.2; text-align:center;">\${title}</span>
                    </button>
                \`;
            }).join('');
        }

        async function triggerStageSound(title, btn) {
            // Retrieve master bank
            let masterBank = [];
            try {
                const rawBank = localStorage.getItem('ecc_master_music_bank');
                if (rawBank) masterBank = JSON.parse(rawBank);
            } catch(e) {}
            
            const item = masterBank.find(m => m.title === title);
            if (!item) {
                console.warn('Lagu tidak ditemukan di Master Bank:', title);
                return;
            }
            
            if (typeof window.playMasterMusic === 'function') {
                window.playMasterMusic(item);
            } else if (window.audioEngine && typeof window.audioEngine.playAudio === 'function') {
                let src = item.url_link || ('/uploads/music/' + item.file_upload);
                window.audioEngine.playAudio(src);
            } else {
                console.warn('Audio Engine tidak tersedia.');
            }

            if (btn) {
                btn.classList.add('triggered');
                setTimeout(() => btn.classList.remove('triggered'), 220);
            }
        }

        `;
        
    stageHtml = stageHtml.substring(0, startLoad) + newSoundboardLogic + stageHtml.substring(endTrigger);
    fs.writeFileSync('public/stage.html', stageHtml, 'utf8');
    console.log('Fixed stage.html soundboard logic.');
} else {
    console.error('Could not find start/end markers in stage.html');
}
