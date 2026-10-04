const fs = require('fs');
const path = 'c:\\Users\\Nawakara\\.gemini\\antigravity-ide\\scratch\\mc-connect\\public\\js\\admin-core.js';
let content = fs.readFileSync(path, 'utf8');

const regexReset = /ev\.metadata\.musicList\s*=\s*\[\];\n\s*if\s*\(typeof\s*window\.renderAdminMusicListWrapper\s*===\s*'function'\)\s*window\.renderAdminMusicListWrapper\(ev\);\n\s*if\s*\(typeof\s*window\.syncEngine\s*!==\s*'undefined'\s*&&\s*window\.syncEngine\.pushEventsToServer\)\s*\{\n\s*window\.syncEngine\.pushEventsToServer\(\);\n\s*\}/;
const replacementReset = `ev.metadata.musicList = [];
        if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
        if (typeof window.syncEventMetadata === 'function') window.syncEventMetadata(ev);`;

content = content.replace(regexReset, replacementReset);
fs.writeFileSync(path, content, 'utf8');
console.log("Patched resetCurrentEventMusic successfully!");
