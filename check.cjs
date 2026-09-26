const fs = require('fs');
const html = fs.readFileSync('c:/Users/Nawakara/.gemini/antigravity-ide/scratch/mc-connect/public/admin.html', 'utf8');
let depth = 2; // assuming we start at 2 for sec-web-settings content
const lines = html.split('\n');
for (let i = 1892; i <= 2157; i++) {
    const line = lines[i];
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    depth += opens - closes;
    if (opens !== closes || line.trim() === '</div>') {
        console.log(`${i+1}: ${'  '.repeat(depth)} +${opens} -${closes} | ${line.trim()}`);
    }
}
