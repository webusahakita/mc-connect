const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

function extract(sectionId) {
    let match = html.match(new RegExp('id="' + sectionId + '"[\\s\\S]*?<\\/form>'));
    if (match) {
        let inputs = match[0].match(/id="([^"]+)"/g);
        console.log(sectionId, inputs);
    }
}

extract('cms-policies');
extract('sec-web-settings');
