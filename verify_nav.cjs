const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Count active sections
let activeCount = (html.match(/class="admin-section active"/g) || []).length;
console.log('Active sections:', activeCount);

let dashActive = html.includes('id="sec-dashboard" class="admin-section active"');
console.log('Dashboard is active:', dashActive);

let calActive = html.includes('id="sec-calendar" class="admin-section active"');
console.log('Calendar is active:', calActive);

// Verify navigateToSection uses classList
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');
let navStart = js.indexOf('function navigateToSection');
let navEnd = js.indexOf('window.navigateToSection', navStart);
let navFunc = js.substring(navStart, navEnd);
console.log('Uses classList.remove:', navFunc.includes('classList.remove'));
console.log('Uses classList.add:', navFunc.includes('classList.add'));
console.log('Uses display none:', navFunc.includes("display = 'none'"));
console.log('Uses style.display:', navFunc.includes('style.display'));
