const fs = require('fs');
const txt = fs.readFileSync('c:/Users/Nawakara/.gemini/antigravity-ide/scratch/cms-overrides.js', 'utf8');
const lines = txt.split('\n');
lines.forEach((line, i) => {
    if (line.includes('\\`')) {
        console.log(`Line ${i+1}: ${line}`);
    }
});
