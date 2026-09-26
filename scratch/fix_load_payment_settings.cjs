const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

const newLoadSettings = `function loadPaymentSettings() {
    if (window.mcGlobalPaymentSettings) {
        return window.mcGlobalPaymentSettings;
    }
    return {
        bankName: 'BCA',
        bankAccount: '',
        bankHolder: '',
        dpPercent: 50,
        qrisUrl: ''
    };
}`;

js = js.replace(/function loadPaymentSettings\(\) \{[\s\S]*?return \{\s*bankName[\s\S]*?qrisUrl: ''\s*\};\s*\}/, newLoadSettings);
fs.writeFileSync('public/js/admin-core.js', js, 'utf8');

// Do the same for bundle-test.js
if (fs.existsSync('public/js/bundle-test.js')) {
    let bjs = fs.readFileSync('public/js/bundle-test.js', 'utf8');
    bjs = bjs.replace(/function loadPaymentSettings\(\) \{[\s\S]*?return \{\s*bankName[\s\S]*?qrisUrl: ''\s*\};\s*\}/, newLoadSettings);
    fs.writeFileSync('public/js/bundle-test.js', bjs, 'utf8');
}

console.log('Fixed loadPaymentSettings in admin-core.js and bundle-test.js');
