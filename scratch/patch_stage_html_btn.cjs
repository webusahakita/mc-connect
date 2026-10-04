const fs = require('fs');

let code = fs.readFileSync('public/stage.html', 'utf8');

const start = code.indexOf('<div id="prompterMusicHint" class="prompter-music-hint">');
const end = code.indexOf('<div id="prompterPicHint"');

if (start > -1 && end > -1) {
    const replaceWith = `<div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem;">
                    <div id="prompterMusicHint" class="prompter-music-hint" style="margin-bottom:0; flex-grow:0;">
                        🎵 Music Cue: Fade-in Orchestral Romance Theme, volume 30%
                    </div>
                    <button id="prompterPlayMusicBtn" onclick="playSegmentMusic()" style="display:none; padding:0.4rem 1rem; border-radius:8px; font-weight:700; background:linear-gradient(135deg, #10B981, #059669); border:none; color:#fff; cursor:pointer; align-items:center; gap:0.4rem; font-size:0.9rem; box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                        ▶ Putar Lagu
                    </button>
                    <audio id="segmentAudioPlayer" style="display:none;" onended="document.getElementById('prompterPlayMusicBtn').innerHTML = '▶ Putar Lagu'"></audio>
                </div>
                `;
    code = code.substring(0, start) + replaceWith + code.substring(end);
    fs.writeFileSync('public/stage.html', code);
    console.log('Replaced HTML successfully!');
} else {
    console.log('Could not find HTML boundaries!');
}

// Ensure the logic handles both ev.musicList and ev.metadata.musicList just in case
const logicSearch = `const musicFound = window.currentEventData.musicList.find`;
if (code.includes(logicSearch)) {
    code = code.replace(
        `const musicFound = window.currentEventData.musicList.find(m => m.title === item.instruksi_musik || m.cue_instruction === item.instruksi_musik);`,
        `const mList = window.currentEventData.musicList || (window.currentEventData.metadata && window.currentEventData.metadata.musicList) || [];
                        const trimName = (name) => name ? name.trim().toLowerCase() : '';
                        const musicFound = mList.find(m => trimName(m.title) === trimName(item.instruksi_musik) || trimName(m.cue_instruction) === trimName(item.instruksi_musik));`
    );
    // and replace the if condition to check mList instead of window.currentEventData.musicList
    code = code.replace(
        `if (playBtn && audioPlayer && window.currentEventData && window.currentEventData.musicList) {`,
        `if (playBtn && audioPlayer && window.currentEventData) {`
    );
    fs.writeFileSync('public/stage.html', code);
    console.log('Updated logic successfully!');
}
