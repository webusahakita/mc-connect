const fs = require('fs');

let js = fs.readFileSync('public/js/cms-overrides.js', 'utf8');

const generateSelectHtml = (icon) => {
    return '`<select class="form-select" style="width:80px; padding:0.5rem;" title="Pilih Icon">` +\n' +
    '    [\'✨\',\'⭐\',\'🎉\',\'🥂\',\'🎙️\',\'💍\',\'💼\',\'🎓\',\'🎵\',\'🏆\',\'🔥\',\'👑\',\'💎\']\n' +
    '    .map(e => `<option value="${e}" ${e === icon ? \'selected\' : \'\'}>${e}</option>`).join(\'\') +\n' +
    '    `</select>`';
};

// Event Categories
const eventOld = '`<input type="text" class="form-input" style="width:60px;" placeholder="Icon" value="${icon}">`';
js = js.replace(/<input type="text" class="form-input" style="width:60px;" placeholder="Icon" value="\$\{icon\}">/, 
    '${[\'✨\',\'⭐\',\'🎉\',\'🥂\',\'🎙️\',\'💍\',\'💼\',\'🎓\',\'🎵\',\'🏆\',\'🔥\',\'👑\',\'💎\'].map(e => `<option value="${e}" ${e === icon ? \'selected\' : \'\'}>${e}</option>`).join(\'\')}</select>'.replace('</select>', '</select>').replace('${[', '<select class="form-select" style="width:80px; padding:0.4rem;" title="Pilih Icon">${[')
);

// Client Categories 
js = js.replace(/<input type="text" class="form-input" style="width:60px;" placeholder="Icon" value="\$\{icon\}">/, 
    '<select class="form-select" style="width:80px; padding:0.4rem;" title="Pilih Icon">${[\'✨\',\'⭐\',\'🎉\',\'🥂\',\'🎙️\',\'💍\',\'💼\',\'🎓\',\'🎵\',\'🏆\',\'🔥\',\'👑\',\'💎\'].map(e => `<option value="${e}" ${e === icon ? \'selected\' : \'\'}>${e}</option>`).join(\'\')}</select>'
);

// We need to update the querySelector logic to get the value.
// It was: const inputs = div.querySelectorAll('input');
// Now we have 1 input and 1 select.
// For Event Categories:
js = js.replace(/const categories = Array\.from\(items\)\.map\(div => \{\s*const inputs = div\.querySelectorAll\('input'\);\s*return \{ name: inputs\[0\]\.value\.trim\(\), icon: inputs\[1\]\?\.value\.trim\(\) \|\| '✨' \};\s*\}\)\.filter\(c => c\.name\);/g, 
    'const categories = Array.from(items).map(div => {\n        const name = div.querySelector(\'input[type="text"]\')?.value.trim();\n        const icon = div.querySelector(\'select\')?.value || \'✨\';\n        return { name, icon };\n    }).filter(c => c.name);'
);

fs.writeFileSync('public/js/cms-overrides.js', js, 'utf8');
console.log('Fixed icon inputs in cms-overrides.js');
