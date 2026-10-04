const fs = require('fs');

let code = fs.readFileSync('public/stage.html', 'utf8');

const titleSpanHtml = `<span id="stageEventTitleInfo" style="font-size:0.85rem; color:#94A3B8; font-weight:600; padding-left:0.8rem; border-left:1px solid #334155; padding-top:2px; display:inline-block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;">Memuat Acara...</span>`;

if (code.includes(titleSpanHtml)) {
    // Remove it from the header
    code = code.replace(titleSpanHtml, '');
} else {
    console.log("Could not find exact titleSpanHtml in the file! I will just remove the whole span manually with regex.");
    code = code.replace(/<span id="stageEventTitleInfo"[^>]*>Memuat Acara\.\.\.<\/span>/g, '');
}

// Ensure the border and padding are removed for the top header since it's gone
// Wait, I can just redesign the injected HTML for the sidebar.
const newTitleHtml = `
                <div id="stageEventTitleInfo" style="font-size:1.05rem; color:var(--gold-primary); font-weight:800; text-align:center; padding-bottom:0.75rem; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:0.5px;">
                    Memuat Acara...
                </div>`;

const targetAnchor = `<div class="stage-clock" id="stageDigitalClock">`;
if (code.includes(targetAnchor) && !code.includes('font-size:1.05rem; color:var(--gold-primary);')) {
    code = code.replace(targetAnchor, newTitleHtml + '\n                ' + targetAnchor);
} else {
    console.log("Could not find the target anchor for injection!");
}

// Wait, I should also make sure `admin-core.js` and `fetchEventData` logic doesn't overwrite it improperly.
// `fetchEventData` logic:
// titleEl.textContent = eventName + (picName ? ' | PIC: ' + picName : '');
// That is perfectly fine and will still work since the ID is the same.

fs.writeFileSync('public/stage.html', code);
console.log('Moved title successfully!');
