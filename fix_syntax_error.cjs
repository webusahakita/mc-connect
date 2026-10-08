const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'public', 'js', 'admin-core.js');

let content = fs.readFileSync(filePath, 'utf-8');

// Replace the double closing braces
const fixedContent = content.replace(/\};\r?\n\};\r?\n\r?\nwindow\.openAiCoPilotModal/m, '};\n\nwindow.openAiCoPilotModal');

fs.writeFileSync(filePath, fixedContent, 'utf-8');
console.log('Syntax error fixed');
