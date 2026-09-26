const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Find all section IDs
let matches = html.match(/id="sec-[^"]+"/g);
if (matches) {
    console.log('Section IDs found:');
    matches.forEach(m => console.log('  ' + m));
}

// Check how sections are displayed - look at the class or style of the first section
let idx = html.indexOf('id="sec-dashboard"');
if (idx !== -1) {
    console.log('\n=== sec-dashboard context ===');
    console.log(html.substring(Math.max(0, idx - 150), idx + 300));
}

// Check sec-calendar
let idx2 = html.indexOf('id="sec-calendar"');
if (idx2 !== -1) {
    console.log('\n=== sec-calendar context ===');
    console.log(html.substring(Math.max(0, idx2 - 100), idx2 + 200));
}

// Check sec-customers
let idx3 = html.indexOf('id="sec-customers"');
if (idx3 !== -1) {
    console.log('\n=== sec-customers context ===');
    console.log(html.substring(Math.max(0, idx3 - 100), idx3 + 200));
}
