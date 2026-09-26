const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');
let domIdx = js.lastIndexOf("document.addEventListener('DOMContentLoaded'");
if (domIdx === -1) domIdx = js.lastIndexOf('document.addEventListener("DOMContentLoaded"');
console.log('DOMContentLoaded block (from index', domIdx, '):');
console.log(js.substring(domIdx));
