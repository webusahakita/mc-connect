const fs = require('fs');
let code = fs.readFileSync('public/stage.html', 'utf8');

// 1. Add stageEventTitleInfo
const badgeSpan = '<span class="prompter-segment-badge" id="currentSegmentBadge">';
const badgeEndIndex = code.indexOf('</span>', code.indexOf(badgeSpan)) + 7;
if (code.indexOf('id="stageEventTitleInfo"') === -1) {
    code = code.slice(0, badgeEndIndex) + 
           '\n                    <span id="stageEventTitleInfo" style="font-size:0.85rem; color:#94A3B8; font-weight:600; margin-left:0.5rem; border-left:1px solid #334155; padding-left:0.8rem; display:inline-block; padding-top:2px;">Memuat Acara...</span>' + 
           code.slice(badgeEndIndex);
}

// 2. Add prompterPicHint
const musicHintDiv = '<div id="prompterMusicHint" class="prompter-music-hint">';
const musicHintEndIndex = code.indexOf('</div>', code.indexOf(musicHintDiv)) + 6;
if (code.indexOf('id="prompterPicHint"') === -1) {
    code = code.slice(0, musicHintEndIndex) +
           '\n                <div id="prompterPicHint" class="prompter-pic-hint" style="display:none; color:var(--purple-primary); font-size:1.15rem; font-weight:600; letter-spacing:1px; margin-bottom:1.5rem; border-left:3px solid var(--purple-primary); padding-left:0.75rem;">\n                    👤 PIC: Greeter Team\n                </div>' +
           code.slice(musicHintEndIndex);
}

// 3. Update loadSegment logic
const logicSearch = `            const musicHint = document.getElementById('prompterMusicHint');
            if (musicHint) {`;

if (code.indexOf("const picHint = document.getElementById('prompterPicHint');") === -1) {
    const repLogic = `            const picHint = document.getElementById('prompterPicHint');
            if (picHint) {
                if (item.pic) {
                    picHint.style.display = 'block';
                    picHint.textContent = '👤 PIC: ' + item.pic;
                } else {
                    picHint.style.display = 'none';
                }
            }

            const musicHint = document.getElementById('prompterMusicHint');
            if (musicHint) {`;
            
    code = code.replace(logicSearch, repLogic);
}

fs.writeFileSync('public/stage.html', code);
console.log('Patched stage.html for PIC and Title');
