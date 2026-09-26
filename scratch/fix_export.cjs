const fs = require('fs');

// Read public-cms.js
let publicCms = fs.readFileSync('public/js/public-cms.js', 'utf8');

// Extract the exportPressKitPDF function
let funcStart = publicCms.indexOf('function exportPressKitPDF() {');
let funcEnd = publicCms.indexOf('window.exportPressKitPDF = exportPressKitPDF;');

if (funcStart > -1 && funcEnd > -1) {
    let funcBody = publicCms.substring(funcStart, funcEnd);
    
    // Replace the variables to match the admin dashboard structure
    funcBody = funcBody.replace('const pk = cachedPressKitData;', 'const pk = window.cmsConfig.presskit || {};');
    funcBody = funcBody.replace('const riders = cachedRidersData;', 'const riders = window.cmsConfig.riders || [];');
    
    // Read cms-overrides.js
    let overrides = fs.readFileSync('public/js/cms-overrides.js', 'utf8');
    
    // Check if we already appended it
    if (!overrides.includes('function exportPressKitPDF()')) {
        overrides += '\n\n' + funcBody + '\nwindow.exportPressKitPDF = exportPressKitPDF;\n';
        fs.writeFileSync('public/js/cms-overrides.js', overrides);
        console.log('Appended exportPressKitPDF to cms-overrides.js');
    } else {
        console.log('exportPressKitPDF already exists in cms-overrides.js');
    }
} else {
    console.log('Could not find exportPressKitPDF in public-cms.js');
}
