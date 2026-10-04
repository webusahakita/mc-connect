const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Read sec-cashflow structure
let cashflowStart = html.indexOf('<div id="sec-cashflow" class="admin-section">');
let cashflowEnd = html.indexOf('<div id="sec-landing-settings" class="admin-section">');
console.log('--- CASHFLOW STRUCTURE ---');
console.log(html.substring(cashflowStart, cashflowStart + 1000));
