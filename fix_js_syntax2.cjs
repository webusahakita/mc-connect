const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

js = js.replace(/jikfungsi loadCustomersDatadif/g, 'jika fungsi loadCustomersData ada\\n        if');
js = js.replace(/window\.loadCustomersDat===/g, 'window.loadCustomersData ===');
js = js.replace(/jikacaryang aktif adalah yang diedit/g, 'jika acara yang aktif adalah yang diedit');
js = js.replace(/JikInspector Kalender sedang terbukpadtanggal tersebut/g, 'Jika Inspector Kalender sedang terbuka pada tanggal tersebut');

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
