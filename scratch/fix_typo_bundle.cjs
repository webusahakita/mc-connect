const fs = require('fs');
let js = fs.readFileSync('public/js/bundle-test.js', 'utf8');
js = js.replace(/const postReviewAre= document.getElementById\('postEventReviewTemplate'\);/g, "const postReviewArea = document.getElementById('postEventReviewTemplate');");
fs.writeFileSync('public/js/bundle-test.js', js, 'utf8');
console.log('Fixed typo in bundle-test.js');
