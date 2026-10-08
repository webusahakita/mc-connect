const fs = require('fs');
let adminCore = fs.readFileSync('public/js/admin-core.js', 'utf8');

// 1. Fix checkAndGenerateDummySoundboard to actually restore from metadata
const dummySbRegex = /window\.checkAndGenerateDummySoundboard\s*=\s*function\(currentEv\)\s*\{\s*if \(\!currentEv\.soundboard\) currentEv\.soundboard = \[\];\s*\};/g;
const newDummySb = `window.checkAndGenerateDummySoundboard = function(currentEv) {
    if (currentEv.metadata) {
        if (currentEv.metadata.soundboard) currentEv.soundboard = currentEv.metadata.soundboard;
        if (currentEv.metadata.landingMusic) currentEv.landingMusic = currentEv.metadata.landingMusic;
    }
    if (!currentEv.soundboard) currentEv.soundboard = [];
    if (!currentEv.landingMusic) currentEv.landingMusic = [];
};`;
adminCore = adminCore.replace(dummySbRegex, newDummySb);

// 2. Fix KPI Active calculation
const kpiRegex = /const kpiActive = document\.getElementById\('sbMetricActive'\); \/\/ Assuming this exists or similar/g;
const newKpi = `const kpiActive = document.getElementById('sbMetricActive');
    if (kpiActive) {
        const activeCount = sbList.filter(item => item.is_brought).length;
        kpiActive.textContent = activeCount + ' Sound';
    }`;
adminCore = adminCore.replace(kpiRegex, newKpi);

fs.writeFileSync('public/js/admin-core.js', adminCore, 'utf8');
console.log('Fixed fetching from metadata and KPI active count.');
