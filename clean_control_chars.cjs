const fs = require('fs');

function cleanFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove unprintable control characters like \x19, \x1D, \x1A etc.
    // Keep standard ones like \x09 (tab), \x0A (LF), \x0D (CR).
    let originalLength = content.length;
    content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(filePath + ' cleaned. Removed chars: ' + (originalLength - content.length));
}

cleanFile('public/admin.html');
cleanFile('public/js/admin-core.js');
cleanFile('public/js/customers.js');
