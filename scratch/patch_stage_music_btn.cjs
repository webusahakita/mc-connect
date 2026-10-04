const fs = require('fs');

let code = fs.readFileSync('public/stage.html', 'utf8');

// 1. Replace HTML
const oldHtml = `<div id="prompterMusicHint" class="prompter-music-hint">
                    🎵 Music Cue: Fade-in Orchestral Romance Theme, volume 30%
                </div>`;
const newHtml = `<div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem;">
                    <div id="prompterMusicHint" class="prompter-music-hint" style="margin-bottom:0; flex-grow:0;">
                        🎵 Music Cue: Fade-in Orchestral Romance Theme, volume 30%
                    </div>
                    <button id="prompterPlayMusicBtn" onclick="playSegmentMusic()" style="display:none; padding:0.4rem 1rem; border-radius:8px; font-weight:700; background:linear-gradient(135deg, #10B981, #059669); border:none; color:#fff; cursor:pointer; align-items:center; gap:0.4rem; font-size:0.9rem; box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                        ▶ Putar Lagu
                    </button>
                    <audio id="segmentAudioPlayer" style="display:none;" onended="document.getElementById('prompterPlayMusicBtn').innerHTML = '▶ Putar Lagu'"></audio>
                </div>`;
if (code.includes('id="prompterMusicHint" class="prompter-music-hint"')) {
    if(!code.includes('id="prompterPlayMusicBtn"')){
        code = code.replace(oldHtml, newHtml);
    }
}

// 2. Update loadSegment
const oldLogic = `            const picHint = document.getElementById('prompterPicHint');
            if (picHint) {
                if (item.pic) {
                    picHint.style.display = 'block';
                    picHint.textContent = '👤 PIC: ' + item.pic;
                } else {
                    picHint.style.display = 'none';
                }
            }

            const musicHint = document.getElementById('prompterMusicHint');
            if (musicHint) {
                if (item.instruksi_musik) {
                    musicHint.style.display = 'block';
                    const cueText = item.instruksi_musik.startsWith('🎵') || item.instruksi_musik.startsWith('🎺') || item.instruksi_musik.startsWith('🍾') || item.instruksi_musik.startsWith('🎸') || item.instruksi_musik.startsWith('🥁') || item.instruksi_musik.startsWith('🎻')
                        ? item.instruksi_musik
                        : \`🎵 \${item.instruksi_musik}\`;
                    musicHint.textContent = \`Music Cue: \${cueText}\`;
                } else {
                    musicHint.style.display = 'none';
                }
            }`;

const newLogic = `            const picHint = document.getElementById('prompterPicHint');
            if (picHint) {
                if (item.pic) {
                    picHint.style.display = 'block';
                    picHint.textContent = '👤 PIC: ' + item.pic;
                } else {
                    picHint.style.display = 'none';
                }
            }

            const musicHint = document.getElementById('prompterMusicHint');
            const playBtn = document.getElementById('prompterPlayMusicBtn');
            const audioPlayer = document.getElementById('segmentAudioPlayer');
            
            // Hentikan lagu sebelumnya jika pindah segmen
            if (audioPlayer) {
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
                if(playBtn) playBtn.innerHTML = '▶ Putar Lagu';
            }

            if (musicHint) {
                if (item.instruksi_musik) {
                    musicHint.style.display = 'block';
                    const cueText = item.instruksi_musik.startsWith('🎵') || item.instruksi_musik.startsWith('🎺') || item.instruksi_musik.startsWith('🍾') || item.instruksi_musik.startsWith('🎸') || item.instruksi_musik.startsWith('🥁') || item.instruksi_musik.startsWith('🎻')
                        ? item.instruksi_musik
                        : \`🎵 \${item.instruksi_musik}\`;
                    musicHint.textContent = \`Music Cue: \${cueText}\`;
                    
                    // Cek ketersediaan lagu di musicList
                    if (playBtn && audioPlayer && currentEventData && currentEventData.musicList) {
                        const musicFound = currentEventData.musicList.find(m => m.title === item.instruksi_musik);
                        if (musicFound && (musicFound.file_upload || musicFound.url_link)) {
                            playBtn.style.display = 'flex';
                            audioPlayer.src = musicFound.file_upload || musicFound.url_link;
                        } else {
                            playBtn.style.display = 'none';
                            audioPlayer.removeAttribute('src');
                        }
                    } else if (playBtn) {
                        playBtn.style.display = 'none';
                    }
                } else {
                    musicHint.style.display = 'none';
                    if (playBtn) playBtn.style.display = 'none';
                }
            }`;

if (code.includes(oldLogic)) {
    code = code.replace(oldLogic, newLogic);
} else {
    console.log("Could not find old logic in loadSegment");
}

// 3. Add playSegmentMusic()
const scriptEnd = `        setupTouchGestures();
        });`;
const scriptEndLogic = `        setupTouchGestures();
        });

        window.playSegmentMusic = function() {
            const player = document.getElementById('segmentAudioPlayer');
            const btn = document.getElementById('prompterPlayMusicBtn');
            if (!player || !player.src) return;
            
            if (player.paused) {
                player.play().then(() => {
                    btn.innerHTML = '⏸ Jeda Lagu';
                }).catch(err => {
                    console.error("Gagal memutar audio:", err);
                    alert("Gagal memutar lagu. Browser mungkin memblokir auto-play.");
                });
            } else {
                player.pause();
                btn.innerHTML = '▶ Putar Lagu';
            }
        };`;

if (code.includes(scriptEnd) && !code.includes('window.playSegmentMusic = function()')) {
    code = code.replace(scriptEnd, scriptEndLogic);
}

fs.writeFileSync('public/stage.html', code);
console.log('Added music button successfully!');
