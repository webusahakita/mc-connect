const fs = require('fs');
let js = fs.readFileSync('public/js/cms-overrides.js', 'utf8');

if (!js.includes('window.mcGlobalPaymentSettings = paySet;')) {
    js = js.replace(/const paySet = json\.data \|\| \{\};/g, 'const paySet = json.data || {};\n            window.mcGlobalPaymentSettings = paySet;');
    fs.writeFileSync('public/js/cms-overrides.js', js, 'utf8');
    console.log('Set window.mcGlobalPaymentSettings in cms-overrides.js');
} else {
    console.log('Already set');
}
