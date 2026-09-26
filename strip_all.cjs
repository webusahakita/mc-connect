const fs = require('fs');

function cleanFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace x followed by any char in \x00-\x1F or \x7F, and then optional spaces
    let origLen = content.length;
    content = content.replace(/x[\x00-\x1F\x7F]+[\s]*/g, '');
    content = content.replace(/a[\x00-\x1F\x7F]+[\s]*/g, '');
    content = content.replace(/S[\x00-\x1F\x7F]+[\s]*/g, ''); // Also strip S (for the dropdown)
    if (content.length !== origLen) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Cleaned', filePath, 'removed', origLen - content.length, 'chars');
    }
}

cleanFile('public/admin.html');
cleanFile('public/js/admin-core.js');
cleanFile('public/js/customers.js');

