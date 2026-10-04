const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

// The file has: \\'rgba  which needs to be \'rgba
// and \\'transparent\\' which needs to be \'transparent\'
// and \)'\" which needs to be \)'\"

code = code.replace(/\\\\'rgba/g, "\\'rgba");
code = code.replace(/\\\\'transparent\\\\'"/g, "\\'transparent\\'\"");
code = code.replace(/0\.1\)\\\\'"/g, "0.1)\\'\"");
code = code.replace(/0\.2\)\\\\'"/g, "0.2)\\'\"");

fs.writeFileSync('public/js/admin-core.js', code);
console.log('Fixed bank quotes backslashes');
