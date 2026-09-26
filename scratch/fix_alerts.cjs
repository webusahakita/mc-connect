const fs = require('fs');

let js = fs.readFileSync('public/js/cms-overrides.js', 'utf8');

function replaceAlert(str) {
    return str.replace(/alert\((['"`].*?['"`])\)/g, "if (typeof window.uiAlert === 'function') window.uiAlert($1, 'Notifikasi'); else alert($1)");
}

js = js.replace(/if\s*\(res\.ok\)\s*alert\((.*?)\);/g, "if (res.ok) { if (typeof window.uiAlert === 'function') window.uiAlert($1, 'Sukses'); else alert($1); }");
js = js.replace(/else\s*alert\((.*?)\);/g, "else { if (typeof window.uiAlert === 'function') window.uiAlert($1, 'Gagal'); else alert($1); }");

// Replace standalone alerts that are not handled by the previous two (like catch block alerts)
const lines = js.split('\n');
const newLines = lines.map(line => {
    if (line.includes("alert(") && !line.includes("uiAlert")) {
        return replaceAlert(line);
    }
    return line;
});

fs.writeFileSync('public/js/cms-overrides.js', newLines.join('\n'), 'utf8');
console.log('Replaced alerts with uiAlert in cms-overrides.js');
