const fs = require('fs');

let code = fs.readFileSync('public/stage.html', 'utf8');

// 1. Remove the entire .stage-sidebar-anticipation block
const anticipationStartStr = `<!-- Stage Segment Progress & Anticipation Preview in Sidebar -->`;
const anticipationEndStr = `</div>\n\n            <!-- Stage Segment Navigation Buttons -->`;

const startIdx = code.indexOf(anticipationStartStr);
const endIdx = code.indexOf(anticipationEndStr);

if (startIdx > -1 && endIdx > -1) {
    const toRemove = code.substring(startIdx, endIdx + 6);
    code = code.replace(toRemove, '');
} else {
    console.log("Could not find anticipation block!");
}

// 2. Inject progress bar into .stage-timer-card
const progressHtml = `
                <!-- Segment Progress -->
                <div style="margin-top:1.25rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.08); display:flex; flex-direction:column; gap:0.5rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-muted); font-weight:700;">
                        <span style="letter-spacing:0.5px;">PROGRES SEGMEN</span>
                        <span id="stageNavProgress" style="color:var(--gold-primary); font-family:monospace; font-weight:800; font-size:0.8rem;">1 / 7</span>
                    </div>
                    <div style="background:#1E293B; height:8px; border-radius:4px; overflow:hidden; box-shadow:inset 0 1px 3px rgba(0,0,0,0.5);">
                        <div id="stageProgressBar" style="background:linear-gradient(90deg, var(--gold-primary), #FDE047); height:100%; width:14%; transition:width 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow:0 0 8px rgba(250,204,21,0.4);"></div>
                    </div>
                </div>`;

const targetAnchor = `                    <button class="btn btn-secondary btn-sm" onclick="resetStopwatch()">Reset</button>
                </div>`;

if (code.includes(targetAnchor) && !code.includes('<!-- Segment Progress -->')) {
    code = code.replace(targetAnchor, targetAnchor + progressHtml);
    fs.writeFileSync('public/stage.html', code);
    console.log("Progress moved to timer card successfully!");
} else {
    console.log("Could not find target anchor in timer card or already injected.");
}

