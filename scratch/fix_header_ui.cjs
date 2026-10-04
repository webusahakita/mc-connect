const fs = require('fs');

let code = fs.readFileSync('public/stage.html', 'utf8');

const start = code.indexOf('<div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">');
const end = code.indexOf('<div class="prompter-controls">');

if (start > -1 && end > -1) {
    const replaceWith = `
                <!-- Group 1: Navigation -->
                <div style="display:flex; align-items:center; gap:0.6rem;">
                    <a href="admin.html" class="prompter-ctrl-btn" title="Kembali ke Admin Portal">
                        🚪 Keluar Stage
                    </a>
                    <button class="stage-nav-arrow-btn" id="btnTopPrev" onclick="prevSegment()" title="Kembali ke Segmen Sebelumnya">
                        ⏮ Sebelumnya
                    </button>
                    <button class="stage-nav-arrow-btn" id="btnTopNext" onclick="nextSegment()" title="Lanjut ke Segmen Berikutnya">
                        Berikutnya ⏭
                    </button>
                </div>

                <!-- Group 2: Center Info -->
                <div style="display:flex; align-items:center; gap:0.5rem; justify-content:center; flex:1; min-width:0;">
                    <span class="prompter-segment-badge" id="currentSegmentBadge" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:350px;">
                        Segmen 1/7: Open Gate & Welcoming
                    </span>
                    <span id="stageEventTitleInfo" style="font-size:0.85rem; color:#94A3B8; font-weight:600; padding-left:0.8rem; border-left:1px solid #334155; padding-top:2px; display:inline-block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;">Memuat Acara...</span>
                </div>

                `;
    code = code.substring(0, start) + replaceWith + code.substring(end);
    fs.writeFileSync('public/stage.html', code);
    console.log('Replaced header UI successfully!');
} else {
    console.log('Not found');
}
