const fs = require('fs');

let code = fs.readFileSync('public/stage.html', 'utf8');

// 1. Remove Top Navigation Buttons completely (using precise replacement)
const topNavOld = `<button class="stage-nav-arrow-btn" id="btnTopPrev" onclick="prevSegment()" title="Kembali ke Segmen Sebelumnya">
                        ⏮ Sebelumnya
                    </button>
                    <button class="stage-nav-arrow-btn" id="btnTopNext" onclick="nextSegment()" title="Lanjut ke Segmen Berikutnya">
                        Berikutnya ⏭
                    </button>`;
code = code.replace(topNavOld, '');
// Also try regex in case of spacing issues
const topNavRegex = /<button class="stage-nav-arrow-btn" id="btnTopPrev"[\s\S]*?<\/button>\s*<button class="stage-nav-arrow-btn" id="btnTopNext"[\s\S]*?<\/button>/;
code = code.replace(topNavRegex, '');

// 2. Remove Remaining Anticipation Block
const antiRegex = /<!-- \(Sidebar anticipation removed\) -->[\s\S]*?Antisipasi Berikutnya:[\s\S]*?<\/div>\s*<\/div>/;
code = code.replace(antiRegex, '<!-- Sidebar anticipation fully removed -->');
// And if it wasn't removed yet
const antiRegex2 = /<div class="stage-sidebar-anticipation"[\s\S]*?<\/div>\s*<\/div>/;
code = code.replace(antiRegex2, '');
// Let's just aggressively remove any leftover sideNextTitle stuff:
const leftoverAntiRegex = /<div style="margin-top:0\.25rem;">\s*<div style="font-size:0\.7rem; color:var\(--gold-primary\); font-weight:800; text-transform:uppercase; letter-spacing:0\.04em;">Antisipasi Berikutnya:<\/div>\s*<div id="sideNextTitle"[^>]*>[\s\S]*?<\/div>\s*<div id="sideNextCue"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
code = code.replace(leftoverAntiRegex, '');

// 3. Inject JS Logic
const jsHtml = `
        // === GIANT NAV LOGIC ===
        let currentNavLayout = 'split'; 

        function renderGiantNav() {
            const leftZone = document.getElementById('giantNavLeft');
            const rightZone = document.getElementById('giantNavRight');
            const btnHtmlPrev = \`<button class="giant-nav-btn giant-btn-prev" id="btnSidePrev" onclick="prevSegment()">◀ SEBELUM</button>\`;
            const btnHtmlNext = \`<button class="giant-nav-btn giant-btn-next" id="btnSideNext" onclick="nextSegment()">BERIKUTNYA ▶</button>\`;
            
            if(!leftZone || !rightZone) return;

            leftZone.innerHTML = '';
            rightZone.innerHTML = '';

            const layoutBtn = document.getElementById('btnNavLayout');

            if (currentNavLayout === 'split') {
                leftZone.innerHTML = btnHtmlPrev;
                rightZone.innerHTML = btnHtmlNext;
                if(layoutBtn) layoutBtn.innerHTML = '🎛️ Navigasi: Split (Kiri/Kanan)';
            } else if (currentNavLayout === 'right') {
                rightZone.innerHTML = btnHtmlPrev + btnHtmlNext;
                if(layoutBtn) layoutBtn.innerHTML = '🎛️ Navigasi: Semua Kanan';
            } else if (currentNavLayout === 'left') {
                leftZone.innerHTML = btnHtmlPrev + btnHtmlNext;
                if(layoutBtn) layoutBtn.innerHTML = '🎛️ Navigasi: Semua Kiri';
            }
        }

        window.cycleNavLayout = function() {
            if (currentNavLayout === 'split') currentNavLayout = 'right';
            else if (currentNavLayout === 'right') currentNavLayout = 'left';
            else currentNavLayout = 'split';
            
            localStorage.setItem('stageNavLayout', currentNavLayout);
            renderGiantNav();
        };

        document.addEventListener('DOMContentLoaded', () => {
            const saved = localStorage.getItem('stageNavLayout');
            if(saved) currentNavLayout = saved;
            renderGiantNav();
        });

        const origLoadSegment2 = window.loadSegment;
        window.loadSegment = function(idx) {
            origLoadSegment2(idx);
            
            setTimeout(() => {
                const sideNext = document.getElementById('btnSideNext');
                const sidePrev = document.getElementById('btnSidePrev');
                if(!window.currentEventData || !window.currentEventData.rundown) return;
                
                if (sidePrev) sidePrev.disabled = (idx === 0);
                if (sideNext) sideNext.disabled = (idx >= window.currentEventData.rundown.length - 1);
            }, 100); 
        }
        // =======================
`;

if (!code.includes('window.cycleNavLayout = function')) {
    const lastScriptIdx = code.lastIndexOf('</script>');
    if (lastScriptIdx !== -1) {
        code = code.substring(0, lastScriptIdx) + jsHtml + '\n' + code.substring(lastScriptIdx);
        console.log("Injected JS successfully.");
    }
} else {
    console.log("JS already fully injected.");
}

fs.writeFileSync('public/stage.html', code);
