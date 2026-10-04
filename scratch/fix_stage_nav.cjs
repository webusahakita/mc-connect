const fs = require('fs');

let code = fs.readFileSync('public/stage.html', 'utf8');

// 1. Remove Top Navigation Buttons
const topNavRegex = /<button class="stage-nav-arrow-btn" id="btnTopPrev"[\s\S]*?<\/button>\s*<button class="stage-nav-arrow-btn" id="btnTopNext"[\s\S]*?<\/button>/;
code = code.replace(topNavRegex, '');

// 2. Remove Remaining Anticipation Block
const antiRegex = /<!-- \(Sidebar anticipation removed\) -->[\s\S]*?Antisipasi Berikutnya:[\s\S]*?<\/div>\s*<\/div>/;
code = code.replace(antiRegex, '<!-- Sidebar anticipation fully removed -->');

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

            // In our new layout, we completely deleted btnTopNext and btnTopPrev!
            // So we need to control the disabled state manually based on the current segment index!
            
            // Fortunately, loadSegment updates sideNextTitle to '🏁 Selesai (Grand Finale)' etc.
            // But let's just make loadSegment update btnSideNext/btnSidePrev directly.
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

        // Patch loadSegment to sync disabled states for our giant buttons
        const origLoadSegment = window.loadSegment;
        window.loadSegment = function(idx) {
            origLoadSegment(idx);
            
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

if (!code.includes('cycleNavLayout')) {
    // Find the last </script> in the file
    const lastScriptIdx = code.lastIndexOf('</script>');
    if (lastScriptIdx !== -1) {
        code = code.substring(0, lastScriptIdx) + jsHtml + '\n' + code.substring(lastScriptIdx);
        console.log("Injected JS successfully.");
    } else {
        console.log("Could not find </script> at the end.");
    }
} else {
    console.log("JS already injected.");
}

fs.writeFileSync('public/stage.html', code);
