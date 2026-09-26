const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');
let domIdx = js.lastIndexOf("document.addEventListener('DOMContentLoaded'");
let beforeDom = js.substring(0, domIdx);

// Track brace balance for beforeDom
let braces = 0;
let lastExtraBrace = -1;
for (let i = 0; i < beforeDom.length; i++) {
    if (beforeDom[i] === '{') braces++;
    if (beforeDom[i] === '}') {
        braces--;
        if (braces < 0) {
            lastExtraBrace = i;
            console.log('Extra closing brace at position', i);
            console.log('Context:', beforeDom.substring(Math.max(0, i - 80), i + 20));
            braces = 0; // reset to keep scanning
        }
    }
}
console.log('beforeDom brace balance:', braces);
