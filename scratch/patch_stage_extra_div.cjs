const fs = require('fs');
let code = fs.readFileSync('public/stage.html', 'utf8');
code = code.replace(
    /                <\/div>\r?\n                <\/div>\r?\n            <\/div>/g,
    '                </div>\n            </div>'
);
fs.writeFileSync('public/stage.html', code);
console.log('Fixed extra div');
