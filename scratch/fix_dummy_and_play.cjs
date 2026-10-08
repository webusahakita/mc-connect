const fs = require('fs');
let adminCore = fs.readFileSync('public/js/admin-core.js', 'utf8');

const regex = /html \+= '<td style="padding:1rem; text-align:right; white-space:nowrap;">';\s*html \+= '<button class="btn btn-secondary btn-sm" onclick="window\.toggleSoundboardIsBrought\(' \+ idx \+ '\)"/g;

const replacement = `html += '<td style="padding:1rem; text-align:right; white-space:nowrap;">';
            html += \`<button class="btn btn-secondary btn-sm" onclick="window.playSoundboardEffect('\${item.title.replace(/'/g, "\\\\'")}')" style="margin-right:0.5rem; color:#60A5FA; border-color:rgba(96,165,250,0.3);" title="Putar Preview">▶️ Putar</button>\`;
            html += '<button class="btn btn-secondary btn-sm" onclick="window.toggleSoundboardIsBrought(' + idx + ')"`;

if(regex.test(adminCore)) {
    // Need to reset regex lastIndex after testing
    adminCore = adminCore.replace(regex, replacement);
    fs.writeFileSync('public/js/admin-core.js', adminCore, 'utf8');
    console.log('Play button added via regex.');
} else {
    console.log('Regex did not match.');
}
