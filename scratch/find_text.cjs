const fs = require('fs');
const txt = fs.readFileSync('c:/Users/Nawakara/.gemini/antigravity-ide/scratch/mc-connect/public/admin.html', 'utf8');
const lines = txt.split('\n');
lines.forEach((l, i) => {
    if (l.toLowerCase().includes('pengaturan web') || l.toLowerCase().includes('pembayaran') || l.toLowerCase().includes('simpan pengaturan')) {
        console.log(`Line ${i+1}: ${l.trim()}`);
    }
});
