const fs = require('fs');

let adminCore = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Fix emojis
adminCore = adminCore.replace(/ðŸŽµ/g, '🎵');
adminCore = adminCore.replace(/ðŸ‘€/g, '👀');

// Change alert to actual playback
adminCore = adminCore.replace(/onclick="window\.uiAlert\('Memutar: \$\{item\.title\}'\)"/g, 'onclick="window.playSoundboardEffect(\'${item.title}\')"');

// Inject the playback function before renderAdminSoundboardList
const playbackFunc = `
window.playSoundboardEffect = function(title) {
    if (!title) return;
    const bank = window.getGlobalMusicBank() || [];
    const idx = bank.findIndex(m => m.title.toLowerCase() === title.toLowerCase());
    
    if (idx !== -1) {
        if (typeof window.playMasterMusic === 'function') {
            window.playMasterMusic(idx);
        }
    } else {
        if (typeof window.uiAlert === 'function') {
            window.uiAlert('Efek suara "' + title + '" belum ada di Master Bank Musik. Silakan tambahkan file audio untuk judul ini di menu Master Bank Musik terlebih dahulu agar dapat diputar.', 'Tidak Ditemukan');
        } else {
            alert('Efek suara "' + title + '" belum ada di Master Bank Musik.');
        }
    }
};

window.renderAdminSoundboardList =`;

adminCore = adminCore.replace('window.renderAdminSoundboardList =', playbackFunc);

fs.writeFileSync('public/js/admin-core.js', adminCore, 'utf8');
console.log('Fixed soundboard in admin-core.js');
