const fs = require('fs');

const file = 'public/admin.html';
let content = fs.readFileSync(file, 'utf8');

// Replace all occurrences of ' ??</th>' with '</th>'
const newContent = content.replace(/ \?\?<\/th>/g, '</th>').replace(/\?\?<\/th>/g, '</th>');

if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Successfully removed ?? from headers.');
} else {
    console.log('No changes made.');
}
