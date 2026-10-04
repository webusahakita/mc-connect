const fs = require('fs');
let code = fs.readFileSync('public/stage.html', 'utf8');
code = code.replace(
    /window\.liveSync\.syncActiveSegment\(eventId, index \+ 1, item\.judul_segmen, item\.instruksi_musik\);/g,
    "window.liveSync.syncActiveSegment(activeEventId, index + 1, item.judul_segmen, item.instruksi_musik);"
);
fs.writeFileSync('public/stage.html', code);
console.log("Fixed eventId bug");
