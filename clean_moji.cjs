const fs = require('fs');

function cleanFile(filePath) {
    let str = fs.readFileSync(filePath, 'utf8');
    let originalLength = str.length;
    
    // Replace the replacement character
    str = str.replace(/\ufffd/g, '');
    
    // Also clean any lingering mojibake characters just in case
    // Note: The regex contains extended ASCII characters that appear in mojibake
    str = str.replace(/[ðŸâ˜€œ™˜º¦‘‡”•›œ£¨©«®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]/g, '');
    
    // Some common mojibake sequences that form multiple characters
    str = str.replace(/âœ¨/g, '');
    str = str.replace(/âœ/g, '');
    str = str.replace(/ðŸ/g, '');
    str = str.replace(/ï¸/g, '');
    str = str.replace(/â/g, '');
    
    if (str.length !== originalLength) {
        fs.writeFileSync(filePath, str, 'utf8');
        console.log('Cleaned ' + filePath + ' (' + (originalLength - str.length) + ' characters removed)');
    } else {
        console.log('No garbage found in ' + filePath);
    }
}

cleanFile('public/admin.html');
cleanFile('public/js/admin-core.js');
cleanFile('public/js/customers.js');
cleanFile('public/css/landing.css');
cleanFile('public/css/app.css');
cleanFile('public/index.html');
