const fs = require('fs');
const html = fs.readFileSync('c:/Users/Nawakara/.gemini/antigravity-ide/scratch/mc-connect/public/admin.html', 'utf8');
let depth = 0;
html.split('\n').forEach((line, i) => {
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    depth += opens - closes;
    if(line.includes('sec-dashboard')) console.log(i+1, 'sec-dashboard', depth);
    if(line.includes('sec-web-settings')) console.log(i+1, 'sec-web-settings', depth);
    if(line.includes('sec-command-center')) console.log(i+1, 'sec-command-center', depth);
    if(line.includes('sec-customers')) console.log(i+1, 'sec-customers', depth);
    if(line.includes('class="admin-content-pad"')) console.log(i+1, 'pad', depth);
});
