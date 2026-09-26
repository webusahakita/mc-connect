const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Replace 🔒 before topbarLiveClock with ⏰
html = html.replace(/🔒(\s*)<span id="topbarLiveClock">/g, '⏰<span id="topbarLiveClock">');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed clock icon in HTML');

let jsFile = fs.readFileSync('public/js/admin-core.js', 'utf8');
jsFile = jsFile.replace(/🔒/g, '⏰'); 
// Wait! There are actual locks in the UI (e.g. for locked dates)
