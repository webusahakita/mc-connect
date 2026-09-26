const fs = require('fs');

function fixExportFunction(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    const regex = /if\s*\(typeof\s+uiAlert\s*===\s*'function'\s*&&\s*typeof\s+showToast\s*===\s*'undefined'\)\s*\{\s*window\.showToast\s*=\s*uiAlert;\s*\/\/\s*fallback\s*\}\s*else\s*if\s*\(typeof\s+showToast\s*!==\s*'function'\)\s*\{\s*window\.showToast\s*=\s*\(msg\)\s*=>\s*uiAlert\(msg\);\s*\}/s;

    const newLogic = `if (typeof showToast !== 'function') {
        window.showToast = function(msg) {
            if (typeof uiAlert === 'function') uiAlert(msg);
            else console.log(msg); // fallback for public landing page
        };
    }`;

    if (regex.test(content)) {
        content = content.replace(regex, newLogic);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed exportPressKitPDF in', filePath);
    }
}

fixExportFunction('public/js/cms-overrides.js');
fixExportFunction('public/js/public-cms.js');
