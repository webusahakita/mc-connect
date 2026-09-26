const fs = require('fs');
let content = fs.readFileSync('public/admin.html', 'utf8');
content = content.replace(/<textareclass=/g, '<textarea class=');
fs.writeFileSync('public/admin.html', content);
console.log('Fixed textareclass to textarea class in admin.html');
