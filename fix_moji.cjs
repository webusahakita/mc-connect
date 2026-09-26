const fs = require('fs');

function fixMojibake(filePath) {
    let buf = fs.readFileSync(filePath);
    let str = buf.toString('utf-8');
    
    // Check for 'ð' which is a common start for double-encoded UTF-8
    if (str.includes('ð') || str.includes('â') || str.includes('Ã')) {
        console.log('Fixing: ' + filePath);
        // The file has double-encoded UTF-8. Let's fix it by converting back to Latin1, then interpreting as UTF-8
        let fixedBuf = Buffer.from(str, 'binary');
        let fixedStr = fixedBuf.toString('utf8');
        fs.writeFileSync(filePath, fixedStr, 'utf8');
        return true;
    }
    return false;
}

let files = [
    'public/js/admin-core.js',
    'public/js/customers.js',
    'public/css/landing.css',
    'public/css/app.css',
    'public/index.html',
    'public/admin.html'
];

files.forEach(f => {
    let fixed = fixMojibake(f);
    if (!fixed) {
        console.log('No obvious mojibake in ' + f);
    }
});

console.log('Done script.');
