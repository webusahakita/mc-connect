const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

let target = '<!DOCTYPE html>\r\n<html l🏠 Admin Workspace & Management - MC-Connect</title>';
if (!html.includes(target)) {
    target = '<!DOCTYPE html>\n<html l🏠 Admin Workspace & Management - MC-Connect</title>';
}

let newHead = '<!DOCTYPE html>\n<html lang="id">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Admin Workspace & Management - MC-Connect</title>';

html = html.replace(target, newHead);
fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Restored head!');
