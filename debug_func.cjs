const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Find start of populateCommandCenterSelector
let funcStart = js.indexOf('function populateCommandCenterSelector');
// Find the next function after it
let nextFunc = js.indexOf('\nfunction ', funcStart + 10);
let funcBlock = js.substring(funcStart, nextFunc !== -1 ? nextFunc : funcStart + 1000);

// Count braces within this function
let braces = 0;
for (let i = 0; i < funcBlock.length; i++) {
    if (funcBlock[i] === '{') braces++;
    if (funcBlock[i] === '}') braces--;
}
console.log('populateCommandCenterSelector brace balance:', braces);
console.log('---');
console.log(funcBlock);
