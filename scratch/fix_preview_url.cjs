const fs = require('fs');
const path = 'c:\\Users\\Nawakara\\.gemini\\antigravity-ide\\scratch\\mc-connect\\public\\js\\admin-core.js';
let content = fs.readFileSync(path, 'utf8');

const oldRegex = /window\._currentAudio = new Audio\('\/storage\/' \+ fileUrl\);/g;
const replacement = `
        let audioSrc = fileUrl;
        if (!audioSrc.startsWith('http') && !audioSrc.startsWith('/')) {
            audioSrc = '/' + audioSrc;
        }
        window._currentAudio = new Audio(audioSrc);
`;

content = content.replace(oldRegex, replacement);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed preview audio URL path!");
