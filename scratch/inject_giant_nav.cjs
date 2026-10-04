const fs = require('fs');

let code = fs.readFileSync('public/stage.html', 'utf8');

// 1. Remove old .stage-nav-bar
const oldNavRegex = /<!-- Stage Segment Navigation Buttons -->\s*<div class="stage-nav-bar">\s*<button class="stage-nav-btn btn-secondary" id="btnSidePrev" onclick="prevSegment\(\)" title="Segmen Sebelumnya \(Hotkeys: ←\)">\s*◀ Sebelum\s*<\/button>\s*<button class="stage-nav-btn btn-primary" id="btnSideNext" onclick="nextSegment\(\)" title="Segmen Berikutnya \(Hotkeys: →\)">\s*Berikutnya ▶\s*<\/button>\s*<\/div>/g;
code = code.replace(oldNavRegex, '');

// 2. Add control button to header for changing layout
const headerControlsRegex = /<button class="prompter-ctrl-btn" id="btnMirrorToggle" onclick="toggleMirrorMode\(\)">🪞 Mirror<\/button>/;
const layoutBtnHtml = `<button class="prompter-ctrl-btn" id="btnNavLayout" onclick="cycleNavLayout()" title="Ubah Posisi Tombol Navigasi">🎛️ Navigasi: Split</button>\n                    <button class="prompter-ctrl-btn" id="btnMirrorToggle" onclick="toggleMirrorMode()">🪞 Mirror</button>`;
if (code.includes('id="btnNavLayout"')) {
    console.log("Nav layout button already exists");
} else {
    code = code.replace(headerControlsRegex, layoutBtnHtml);
}

// 3. Inject new layout zones inside .stage-container
const containerRegex = /<div class="stage-container">/;
const newContainerHtml = `<div class="stage-container" id="stageLayoutContainer" data-nav-layout="right">
            
            <div id="giantNavLeft" class="giant-nav-zone"></div>
            
            <div class="stage-center-wrapper" style="display:flex; flex:1; width:100%; overflow:hidden;">`;

const endContainerRegex = /<\/div>\s*<!-- End of \.stage-container -->/; 
// wait, stage.html might just end with </div> before scripts.

if (!code.includes('giantNavLeft')) {
    code = code.replace(containerRegex, newContainerHtml);
    
    // We need to wrap the prompter-pane and sidebar-pane in `stage-center-wrapper`.
    // Then add giantNavRight.
    // Let's just find the end of stage-sidebar-pane.
    // Actually, it's safer to just inject giantNavRight right before the script tag.
    const scriptRegex = /<script>/;
    const rightNavHtml = `
            </div> <!-- End stage-center-wrapper -->
            <div id="giantNavRight" class="giant-nav-zone"></div>
        </div> <!-- End stage-container -->
        <script>`;
    
    // Wait, the original has `<div class="stage-container"> ... </div> <script>`.
    // I will replace `</div>\n    <script>`
    code = code.replace(/<\/div>\s*<script>/, rightNavHtml);
}

// 4. Add the CSS and JS logic right before </head> and </body>
const cssHtml = `
    <style>
        .giant-nav-zone {
            display: flex;
            flex-direction: row;
            background: #0B0F19;
            z-index: 100;
        }
        
        .giant-nav-btn {
            border: none;
            outline: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 1.1rem;
            transition: all 0.2s;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            padding: 1rem 0;
            letter-spacing: 2px;
        }

        .giant-btn-prev {
            background: #1E293B;
            color: #94A3B8;
            width: 60px;
            border-right: 1px solid #334155;
            border-left: 1px solid #334155;
        }
        .giant-btn-prev:hover:not(:disabled) { background: #334155; color: #fff; }
        .giant-btn-prev:disabled { opacity: 0.3; cursor: not-allowed; }

        .giant-btn-next {
            background: var(--gold-primary);
            color: #000;
            width: 90px;
        }
        .giant-btn-next:hover:not(:disabled) { filter: brightness(1.1); }
        .giant-btn-next:disabled { background: #475569; color: #94A3B8; cursor: not-allowed; }
    </style>
`;
if (!code.includes('.giant-nav-zone')) {
    code = code.replace('</head>', cssHtml + '\n</head>');
}

const jsHtml = `
        let currentNavLayout = 'split'; // split, right, left

        function renderGiantNav() {
            const leftZone = document.getElementById('giantNavLeft');
            const rightZone = document.getElementById('giantNavRight');
            const btnHtmlPrev = \`<button class="giant-nav-btn giant-btn-prev" id="btnSidePrev" onclick="prevSegment()">◀ SEBELUM</button>\`;
            const btnHtmlNext = \`<button class="giant-nav-btn giant-btn-next" id="btnSideNext" onclick="nextSegment()">BERIKUTNYA ▶</button>\`;
            
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
    code = code.replace('setupTouchGestures();', 'setupTouchGestures();\n' + jsHtml);
}

fs.writeFileSync('public/stage.html', code);
console.log("Injected giant nav feature");
