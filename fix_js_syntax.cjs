const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');
js = js.replace(/faqs\[idx\]\.\}/g, 'faqs[idx].a }');
js = js.replace(/res\.\}/g, 'res.a }');
js = js.replace(/faqs\[idx\]\. =/g, 'faqs[idx].a =');
js = js.replace(/\. =/g, '.a =');
js = js.replace(/catDat=/g, 'catData =');
js = js.replace(/clientCatDat=/g, 'clientCatData =');
fs.writeFileSync('public/js/admin-core.js', js, 'utf8');

let js2 = fs.readFileSync('public/js/customers.js', 'utf8');
js2 = js2.replace(/catDat=/g, 'catData =');
js2 = js2.replace(/clientCatDat=/g, 'clientCatData =');
fs.writeFileSync('public/js/customers.js', js2, 'utf8');
