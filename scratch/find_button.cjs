const fs = require('fs');
const html = fs.readFileSync('c:/Users/Nawakara/.gemini/antigravity-ide/scratch/mc-connect/public/admin.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
    if (l.toLowerCase().includes('buka halaman') || l.toLowerCase().includes('kelola profil biodata') || l.toLowerCase().includes('pengaturan landing page')) {
        console.log(`Line ${i+1}: ${l.trim().substring(0, 100)}`);
    }
});
