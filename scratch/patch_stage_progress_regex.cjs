const fs = require('fs');

let code = fs.readFileSync('public/stage.html', 'utf8');

const regex = /<!-- Stage Segment Progress & Anticipation Preview in Sidebar -->[\s\S]*?<\/div>\s*<\/div>/;

if (regex.test(code)) {
    code = code.replace(regex, '<!-- (Sidebar anticipation removed) -->');
    console.log("Removed sidebar anticipation.");
} else {
    console.log("Could not find sidebar anticipation.");
}

const progressHtml = `
                <!-- Segment Progress -->
                <div style="margin-top:1.25rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.08); display:flex; flex-direction:column; gap:0.5rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-muted); font-weight:700;">
                        <span style="letter-spacing:0.5px;">PROGRES SEGMEN</span>
                        <span id="stageNavProgress" style="color:var(--gold-primary); font-family:monospace; font-weight:800; font-size:0.8rem;">1 / 7 (14%)</span>
                    </div>
                    <div style="background:#1E293B; height:8px; border-radius:4px; overflow:hidden; box-shadow:inset 0 1px 3px rgba(0,0,0,0.5);">
                        <div id="stageProgressBar" style="background:linear-gradient(90deg, var(--gold-primary), #FDE047); height:100%; width:14%; transition:width 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow:0 0 8px rgba(250,204,21,0.4);"></div>
                    </div>
                </div>`;

const targetAnchor = `                    <button class="btn btn-secondary btn-sm" onclick="resetStopwatch()">Reset</button>\n                </div>`;

if (code.includes(targetAnchor)) {
    code = code.replace(targetAnchor, targetAnchor + progressHtml);
    console.log("Injected progress bar.");
} else {
    // try a more resilient replacement for the timer card injection
    const altAnchor = `<button class="btn btn-secondary btn-sm" onclick="resetStopwatch()">Reset</button>`;
    if (code.includes(altAnchor)) {
        code = code.replace(altAnchor, altAnchor + '\n                </div>' + progressHtml);
        // Also remove the extra </div> that we just added if it exists right after, but let's just do it carefully.
    }
}

fs.writeFileSync('public/stage.html', code);

// 3. Update the loadSegment logic in stage.html to format the progress text like "1 / 7 (14%)"
// Look for `stageNavProgress.textContent =`
code = fs.readFileSync('public/stage.html', 'utf8');
code = code.replace(
    /stageNavProgress\.textContent = \`\$\{item\.urutan\} \/ \$\{rundownItems\.length\}\`;/g,
    'stageNavProgress.textContent = `${item.urutan} / ${rundownItems.length} (${Math.round((item.urutan / rundownItems.length) * 100)}%)`;'
);
fs.writeFileSync('public/stage.html', code);
console.log("Done.");
