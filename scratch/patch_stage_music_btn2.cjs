const fs = require('fs');

let code = fs.readFileSync('public/stage.html', 'utf8');

const start = code.indexOf(`            const musicHint = document.getElementById('prompterMusicHint');`);
const end = code.indexOf(`            // 2. SEBELUM SEGMEN`);

if (start > -1 && end > -1) {
    const replaceWith = `            const picHint = document.getElementById('prompterPicHint');
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
                        : '🎵 ' + item.instruksi_musik;
                    musicHint.textContent = 'Music Cue: ' + cueText;
                    
                    // Cek ketersediaan lagu di musicList
                    if (playBtn && audioPlayer && window.currentEventData && window.currentEventData.musicList) {
                        const musicFound = window.currentEventData.musicList.find(m => m.title === item.instruksi_musik || m.cue_instruction === item.instruksi_musik);
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
            }

`;
    code = code.substring(0, start) + replaceWith + code.substring(end);
    fs.writeFileSync('public/stage.html', code);
    console.log('Replaced loadSegment logic successfully!');
} else {
    console.log('Could not find boundaries!', start, end);
}
