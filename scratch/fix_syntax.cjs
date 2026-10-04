const fs = require('fs');

function fix(file) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/\\'/g, "'");
    fs.writeFileSync(file, code);
    console.log('Fixed ' + file);
}

fix('public/js/admin-core.js');
fix('public/js/bundle-test.js');
