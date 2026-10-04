const fs = require('fs');
let code = fs.readFileSync('public/stage.html', 'utf8');

const oldFunc = `        window.playSegmentMusic = function() {
            const player = document.getElementById('segmentAudioPlayer');
            const btn = document.getElementById('prompterPlayMusicBtn');
            if (!player || !player.src) return;
            
            if (player.paused) {
                player.play().then(() => {
                    if(btn) btn.innerHTML = '⏸ Jeda Lagu';
                }).catch(err => {
                    console.error("Gagal memutar audio:", err);
                    alert("Gagal memutar lagu. Browser mungkin memblokir auto-play.");
                });
            } else {
                player.pause();
                if(btn) btn.innerHTML = '▶ Putar Lagu';
            }
        };`;

const newFunc = `        window.playSegmentMusic = function() {
            const btn = document.getElementById('prompterPlayMusicBtn');
            if (btn && btn.dataset.found === 'false') {
                alert("Lagu tidak ditemukan di master bank musik. Harap pastikan judul lagu persis (misal: 'Lagu upload').");
                return;
            }
            
            const player = document.getElementById('segmentAudioPlayer');
            if (!player || !player.src) {
                alert("Tidak ada sumber audio yang valid.");
                return;
            }
            
            if (player.paused) {
                player.play().then(() => {
                    if(btn) btn.innerHTML = '⏸ Jeda Lagu';
                }).catch(err => {
                    console.error("Gagal memutar audio:", err);
                    alert("Gagal memutar lagu. Browser mungkin memblokir auto-play.");
                });
            } else {
                player.pause();
                if(btn) btn.innerHTML = '▶ Putar Lagu';
            }
        };`;

if (code.includes('window.playSegmentMusic = function()')) {
    const start = code.indexOf('window.playSegmentMusic = function()');
    const end = code.indexOf('};', start) + 2;
    code = code.substring(0, start) + newFunc.substring(8) + code.substring(end);
    fs.writeFileSync('public/stage.html', code);
    console.log('Replaced function');
}
