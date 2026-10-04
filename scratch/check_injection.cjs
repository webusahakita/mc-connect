const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

console.log('main index:', html.indexOf('<main'));
console.log('wrapper closing:', html.indexOf('</div>', html.lastIndexOf('</main>')));

// Let's check where sec-musicbank actually got injected!
let musicBankStart = html.indexOf('<div id="sec-musicbank"');
let mainEnd = html.indexOf('</main>');

console.log('musicBankStart:', musicBankStart);
console.log('mainEnd:', mainEnd);

console.log(html.substring(musicBankStart - 50, musicBankStart + 100));

