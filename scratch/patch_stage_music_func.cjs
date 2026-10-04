const fs = require('fs');
let code = fs.readFileSync('public/stage.html', 'utf8');

const funcCode = `
        window.playSegmentMusic = function() {
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
        };
`;

if (!code.includes('window.playSegmentMusic = function()')) {
    const lastScriptTag = code.lastIndexOf('</script>');
    if (lastScriptTag !== -1) {
        code = code.substring(0, lastScriptTag) + funcCode + code.substring(lastScriptTag);
        fs.writeFileSync('public/stage.html', code);
        console.log('Added playSegmentMusic function successfully!');
    }
} else {
    console.log('Function already exists.');
}
