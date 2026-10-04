const fs = require('fs');
const file = 'public/js/admin-core.js';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    /await window\.uiFormModal\(([^,]+),\s*fields\)/g,
    "await window.uiCustomForm(fields, { title: $1 })"
);

fs.writeFileSync(file, code);
console.log('Fixed uiFormModal to uiCustomForm');
