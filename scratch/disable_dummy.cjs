const fs = require('fs');
let adminCore = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Replace checkAndGenerateDummySoundboard
const dummySbRegex = /window\.checkAndGenerateDummySoundboard\s*=\s*function\(currentEv\)\s*\{[\s\S]*?\};\s*(?=\/\/|window\.)/g;
const newDummySb = `window.checkAndGenerateDummySoundboard = function(currentEv) {
    if (!currentEv.soundboard) currentEv.soundboard = [];
};
`;
adminCore = adminCore.replace(dummySbRegex, newDummySb);

// Replace checkAndGenerateDummyMusic if it exists
const dummyMusicRegex = /window\.checkAndGenerateDummyMusic\s*=\s*function\(currentEv\)\s*\{[\s\S]*?\};\s*(?=\/\/|window\.)/g;
const newDummyMusic = `window.checkAndGenerateDummyMusic = function(currentEv) {
    if (!currentEv.music) currentEv.music = [];
};
`;
adminCore = adminCore.replace(dummyMusicRegex, newDummyMusic);

fs.writeFileSync('public/js/admin-core.js', adminCore, 'utf8');
console.log('Dummy data generation disabled.');
