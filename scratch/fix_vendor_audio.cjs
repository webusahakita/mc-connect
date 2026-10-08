const fs = require('fs');
let code = fs.readFileSync('public/vendor.html', 'utf8');

// We need to inject real audio playback into playVendorCue and stopAllVendorAudio
// Let's replace the content of stopAllVendorAudio to also stop the real audio player
const stopFuncStart = code.indexOf('function stopAllVendorAudio() {');
const stopFuncEnd = code.indexOf('function playVendorCue(rowIdx, btnEl) {');
if (stopFuncStart !== -1 && stopFuncEnd !== -1) {
    let stopFunc = code.substring(stopFuncStart, stopFuncEnd);
    stopFunc = stopFunc.replace('if (vendorActiveOscillators', 'if (window._vendorAudioPlayer) {\n                window._vendorAudioPlayer.pause();\n                window._vendorAudioPlayer.currentTime = 0;\n                window._vendorAudioPlayer = null;\n            }\n            if (vendorActiveOscillators');
    code = code.substring(0, stopFuncStart) + stopFunc + code.substring(stopFuncEnd);
}

// Let's replace playVendorCue
const playFuncStart = code.indexOf('function playVendorCue(rowIdx, btnEl) {');
const playFuncEnd = code.indexOf('function playActiveLiveCue() {');
if (playFuncStart !== -1 && playFuncEnd !== -1) {
    let newPlayFunc = `function playVendorCue(rowIdx, btnEl) {
            if (currentPlayingRowIdx === rowIdx && (vendorAudioCtx || window._vendorAudioPlayer)) {
                stopAllVendorAudio();
                return;
            }

            stopAllVendorAudio();
            currentPlayingRowIdx = rowIdx;

            const item = vendorRundown[rowIdx];
            if (!item) return;

            if (btnEl) {
                btnEl.classList.add('playing');
                btnEl.innerHTML = '⏹ Stop';
            }
            const row = document.getElementById(\`row-segment-\${rowIdx + 1}\`);
            if (row) row.classList.add('playing');

            let masterBank = [];
            try {
                const rawBank = localStorage.getItem('mc_music_bank_data');
                if (rawBank) masterBank = JSON.parse(rawBank);
            } catch(e) {}
            
            const musicItem = masterBank.find(m => m.title === item.cue_music);
            if (musicItem) {
                let src = musicItem.url_link || '';
                if (!src && musicItem.file_upload) {
                    if (String(musicItem.file_upload).startsWith('uploads/')) src = '/' + musicItem.file_upload;
                    else if (String(musicItem.file_upload).startsWith('/uploads/')) src = musicItem.file_upload;
                    else src = '/uploads/music/' + musicItem.file_upload;
                }
                if (src) {
                    window._vendorAudioPlayer = new Audio(src);
                    window._vendorAudioPlayer.onended = () => { stopAllVendorAudio(); };
                    window._vendorAudioPlayer.play().catch(e => console.error('Gagal memutar audio vendor:', e));
                    return;
                }
            }

            // Fallback
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            vendorAudioCtx = new AudioContextClass();

            const genre = item.musicGenre || (item.music ? item.music.genre : 'Romance');
            const preset = genre === 'Fanfare' ? 'royal_fanfare' : (genre === 'Upbeat' ? 'upbeat_beat' : 'romantic_piano');

            synthesizeVendorMelody(vendorAudioCtx, preset, () => {
                stopAllVendorAudio();
            });
        }
        
        `;
    code = code.substring(0, playFuncStart) + newPlayFunc + code.substring(playFuncEnd);
}

fs.writeFileSync('public/vendor.html', code, 'utf8');
console.log('Successfully updated vendor audio playback logic.');
