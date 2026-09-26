const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');
let cjs = fs.readFileSync('public/js/customers.js', 'utf8');

let patterns = [
    [/addata/g, 'addata'],
    [/adacara/g, 'adacara'],
    [/emuStatus/g, 'emuStatus'],
    [/emuKalender/g, 'emuKalender'],
    [/acarselesai/g, 'acarselesai'],
    [/dibuktepat/g, 'dibuktepat'],
    [/MenunggDP/g, 'MenunggDP'],
    [/Cobkat/g, 'Cobkat'],
    [/BukCommand/g, 'BukCommand'],
    [/BukDirektori/g, 'BukDirektori'],
];

let issues = [];
let files = [['admin.html', html], ['admin-core.js', js], ['customers.js', cjs]];

for (let [pattern, desc] of patterns) {
    for (let [name, content] of files) {
        let m = content.match(pattern);
        if (m) issues.push(name + ': ' + desc + ' (' + m.length + ')');
    }
}

if (issues.length === 0) {
    console.log('ALL TEXT CLEAN!');
} else {
    issues.forEach(i => console.log('ISSUE:', i));
}
