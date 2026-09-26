const fs = require('fs');

function fixPublicPDF() {
    let js = fs.readFileSync('public/js/public-cms.js', 'utf8');

    // 1. Save bio to window.cachedBioData
    const bioRegex = /const bio = bioRes\?\.data \|\| \{\};/;
    if (js.includes('const bio = bioRes?.data || {};')) {
        js = js.replace(bioRegex, 'const bio = bioRes?.data || {};\n        window.cachedBioData = bio;');
    }
    
    // 2. Use window.cachedBioData instead of window.cmsConfig in public-cms.js PDF template
    js = js.replace(/window\.cmsConfig && window\.cmsConfig\.bio && window\.cmsConfig\.bio\.photo/g, 'window.cachedBioData && window.cachedBioData.photo');
    js = js.replace(/window\.cmsConfig\.bio\.photo/g, 'window.cachedBioData.photo');
    js = js.replace(/window\.cmsConfig && window\.cmsConfig\.bio && window\.cmsConfig\.bio\.webConfig && window\.cmsConfig\.bio\.webConfig\.logo_url/g, 'window.cachedBioData && window.cachedBioData.webConfig && window.cachedBioData.webConfig.logo_url');
    js = js.replace(/window\.cmsConfig\.bio\.webConfig\.logo_url/g, 'window.cachedBioData.webConfig.logo_url');

    fs.writeFileSync('public/js/public-cms.js', js, 'utf8');
    console.log('Fixed public-cms.js PDF images logic');
}

fixPublicPDF();
