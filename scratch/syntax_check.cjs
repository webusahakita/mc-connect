const fs = require('fs');
const vm = require('vm');

function checkSyntax(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    try {
        new vm.Script(code);
        console.log(`✅ Syntax OK: ${filePath}`);
    } catch (e) {
        console.error(`❌ Syntax Error in ${filePath}:`);
        console.error(e.message);
    }
}

checkSyntax('public/js/admin-core.js');
checkSyntax('public/js/cms-overrides.js');
checkSyntax('public/js/calendar.js');
checkSyntax('public/js/customers.js');
