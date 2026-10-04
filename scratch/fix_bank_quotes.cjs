const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

code = code.replace(/onmouseover="this\.style\.background='rgba/g, 'onmouseover="this.style.background=\\\'rgba');
code = code.replace(/onmouseout="this\.style\.background='rgba/g, 'onmouseout="this.style.background=\\\'rgba');
code = code.replace(/\(212,175,55,0\.1\)'"/g, '(212,175,55,0.1)\\\'"');
code = code.replace(/\(0,0,0,0\.2\)'"/g, '(0,0,0,0.2)\\\'"');

fs.writeFileSync('public/js/admin-core.js', code);
console.log('Fixed bank quotes');
