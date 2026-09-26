const fs = require('fs');

// 1. Fix the Page Break issue in the PDF generators
function fixPageBreak(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // The current problematic page break structure:
    const oldBreakStr = `        </div>
        
        <!-- FORCE PAGE BREAK -->
        <div class="page-break" style="height:0;"></div>
        
        <!-- PAGE 2 CONTENT -->
        <div class="page">`;
        
    const newBreakStr = `        </div>
    </td></tr></tbody>
    <tfoot><tr><td></td></tr></tfoot>
</table>

<div class="page-break" style="page-break-after: always;"></div>

<table class="master-table">
    <thead><tr><td></td></tr></thead>
    <tbody><tr><td class="master-content-td">
        <!-- PAGE 2 CONTENT -->
        <div class="page">`;
        
    if (content.includes('<!-- FORCE PAGE BREAK -->')) {
        content = content.replace(oldBreakStr, newBreakStr);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed PDF page break in', filePath);
    }
}

fixPageBreak('public/js/cms-overrides.js');
fixPageBreak('public/js/public-cms.js');


// 2. Fix Typos in admin.html
let html = fs.readFileSync('public/admin.html', 'utf8');
html = html.replace('9 Press Kit (Hal. 1)', '📄 Press Kit (Hal. 1)');
html = html.replace('vent Riders (Hal. 2)', '📝 Event Riders (Hal. 2)');
html = html.replace('Kelolpersyaratan teknis', 'Kelola persyaratan teknis');
html = html.replace('BahasIndonesi', 'Bahasa Indonesia');

fs.writeFileSync('public/admin.html', html);
console.log('Fixed typos in admin.html');
