const fs = require('fs');

let code = fs.readFileSync('public/stage.html', 'utf8');

const regex = /else if \(typeof window\.soundboard\.playSound === 'function'\) \{\s*window\.soundboard\.playSound\(item\.preset \|\| 'ding', vol\);\s*\}/g;

if (regex.test(code)) {
    code = code.replace(regex, `else {\n                    triggerSound(item.preset || 'ding', btn, vol);\n                }`);
    fs.writeFileSync('public/stage.html', code);
    console.log('Fixed triggerStageSound bug');
} else {
    console.log('Could not find triggerStageSound bug regex');
}
