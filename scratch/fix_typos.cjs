const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Fix typos
html = html.replace('Pengaturan Soundboard & SFX Panggung yang Dibaw</h2>', 'Pengaturan Soundboard & SFX Panggung yang Dibawa</h2>');
html = html.replace('Atur koleksi efek suarinstan panggung', 'Atur koleksi efek suara instan panggung');
html = html.replace('dibawMC untuk acar', 'dibawa MC untuk acara');
html = html.replace('visentuhan', 'via sentuhan');
html = html.replace('ratinjau Interaktif Stage Soundboard', 'Pratinjau Interaktif Stage Soundboard');
html = html.replace('ukStage Mode', 'Buka Stage Mode');
html = html.replace('ukStage Mode', 'Buka Stage Mode');
html = html.replace('9 Tabel Pengaturan Sound yang Dibawa', 'Tabel Pengaturan Sound yang Dibawa');
html = html.replace('<span>Soundboard & SFX yang Dibawa</span>', '<span>🔊 Soundboard & SFX yang Dibawa</span>');

fs.writeFileSync('public/admin.html', html);
console.log('Fixed typos in admin.html');
