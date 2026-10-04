const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Replace the line exactly safely. We know it contains "AdminDB.setItem('activeCommandCenterEventId', ev.id)"
const target = "try { AdminDB.setItem('activeCommandCenterEventId', ev.id); } catch(e) {}";
const rep = "try { AdminDB.setItem('activeCommandCenterEventId', ev.id); } catch(e) {}\n    try { localStorage.setItem('activeCommandCenterEventId', ev.id); } catch(e) {}";

code = code.split(target).join(rep);
fs.writeFileSync('public/js/admin-core.js', code);
console.log('Fixed admin-core.js');

let code2 = fs.readFileSync('public/js/bundle-test.js', 'utf8');
code2 = code2.split(target).join(rep);
fs.writeFileSync('public/js/bundle-test.js', code2);
console.log('Fixed bundle-test.js');
