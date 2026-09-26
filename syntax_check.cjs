const fs = require('fs');
const vm = require('vm');

// Test admin-core.js
try {
    let js = fs.readFileSync('public/js/admin-core.js', 'utf8');
    new vm.Script(js, { filename: 'admin-core.js' });
    console.log('admin-core.js: SYNTAX OK');
} catch(e) {
    console.log('admin-core.js SYNTAX ERROR:', e.message);
}

// Test customers.js
try {
    let cjs = fs.readFileSync('public/js/customers.js', 'utf8');
    new vm.Script(cjs, { filename: 'customers.js' });
    console.log('customers.js: SYNTAX OK');
} catch(e) {
    console.log('customers.js SYNTAX ERROR:', e.message);
}

// Test calendar.js
try {
    let caljs = fs.readFileSync('public/js/calendar.js', 'utf8');
    new vm.Script(caljs, { filename: 'calendar.js' });
    console.log('calendar.js: SYNTAX OK');
} catch(e) {
    console.log('calendar.js SYNTAX ERROR:', e.message);
}

// Test all other JS files
const dir = fs.readdirSync('public/js');
for (let file of dir) {
    if (file.endsWith('.js') && !['admin-core.js', 'customers.js', 'calendar.js'].includes(file)) {
        try {
            let content = fs.readFileSync('public/js/' + file, 'utf8');
            new vm.Script(content, { filename: file });
            console.log(file + ': SYNTAX OK');
        } catch(e) {
            console.log(file + ' SYNTAX ERROR:', e.message);
        }
    }
}
