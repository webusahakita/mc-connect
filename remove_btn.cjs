const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'admin.html');
let content = fs.readFileSync(filePath, 'utf-8');

const targetRegex = /<a href="stage\.html" target="_blank" class="btn btn-secondary btn-sm">\s*Mode Layar Penuh\s*<\/a>/g;

content = content.replace(targetRegex, '');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Button removed.');
