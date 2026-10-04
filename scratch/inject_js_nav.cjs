const fs = require('fs');
let code = fs.readFileSync('public/stage.html', 'utf8');

const jsHtml = `
        let currentNavLayout = 'split'; // split, right, left

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

            // Sync disabled state
            const btnTopNext = document.getElementById('btnTopNext');
            const btnTopPrev = document.getElementById('btnTopPrev');
            
            const sideNext = document.getElementById('btnSideNext');
            const sidePrev = document.getElementById('btnSidePrev');
            
            if(sideNext && btnTopNext) sideNext.disabled = btnTopNext.disabled;
            if(sidePrev && btnTopPrev) sidePrev.disabled = btnTopPrev.disabled;
        }

        window.cycleNavLayout = function() {
            if (currentNavLayout === 'split') currentNavLayout = 'right';
            else if (currentNavLayout === 'right') currentNavLayout = 'left';
            else currentNavLayout = 'split';
            
            // Save to localStorage
            localStorage.setItem('stageNavLayout', currentNavLayout);
            renderGiantNav();
        };

        // Load saved layout on startup
        document.addEventListener('DOMContentLoaded', () => {
            const saved = localStorage.getItem('stageNavLayout');
            if(saved) currentNavLayout = saved;
            renderGiantNav();
        });

        // Patch loadSegment to sync disabled states correctly
        const origLoadSegment = window.loadSegment;
        window.loadSegment = function(idx) {
            origLoadSegment(idx);
            setTimeout(renderGiantNav, 50); // wait for UI to update top buttons
        }
`;

if (!code.includes('cycleNavLayout')) {
    code = code.replace('</script>\n</body>', jsHtml + '\n</script>\n</body>');
    fs.writeFileSync('public/stage.html', code);
    console.log("Injected JS");
}
