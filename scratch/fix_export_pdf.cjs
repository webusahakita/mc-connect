const fs = require('fs');

function fixExportFunction(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    const oldLogic = `    if (typeof uiAlert === 'function' && typeof showToast === 'undefined') {
        window.showToast = uiAlert; // fallback
    } else if (typeof showToast !== 'function') {
        window.showToast = (msg) => uiAlert(msg);
    }`;

    const newLogic = `    if (typeof showToast !== 'function') {
        window.showToast = function(msg) {
            if (typeof uiAlert === 'function') uiAlert(msg);
            else console.log(msg); // fallback for public landing page
        };
    }`;

    if (content.includes(oldLogic)) {
        content = content.replace(oldLogic, newLogic);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed exportPressKitPDF in', filePath);
    }
}

fixExportFunction('public/js/cms-overrides.js');
fixExportFunction('public/js/public-cms.js');
