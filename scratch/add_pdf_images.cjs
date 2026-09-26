const fs = require('fs');

function addLogoToPDF(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    const newHeader = `
            <div class="p1-header" style="display:flex; justify-content:space-between; align-items:center;">
                <div style="flex:1;">
                    <div class="p1-badge">Official Media Kit</div>
                    <h1 class="p1-title">\${esc(pk.stageName)}</h1>
                    <p class="p1-subtitle">Professional Master of Ceremony</p>
                </div>
                \${window.cmsConfig && window.cmsConfig.bio && window.cmsConfig.bio.photo ? 
                    \`<div style="margin-left: 20px;"><img src="\${window.cmsConfig.bio.photo}" style="width:120px; height:120px; border-radius:50%; object-fit:cover; border: 3px solid #D4AF37;"></div>\` 
                : ''}
                \${window.cmsConfig && window.cmsConfig.bio && window.cmsConfig.bio.webConfig && window.cmsConfig.bio.webConfig.logo_url ? 
                    \`<div style="margin-left: 20px;"><img src="\${window.cmsConfig.bio.webConfig.logo_url}" style="max-height:80px; max-width:120px; object-fit:contain;"></div>\` 
                : ''}
            </div>`;

    // Replace the old header
    const oldHeaderRegex = /<div class="p1-header">.*?<h1 class="p1-title">\$\{esc\(pk\.stageName\)\}<\/h1>.*?<\/div>/s;
    if (oldHeaderRegex.test(content)) {
        content = content.replace(oldHeaderRegex, newHeader);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated PDF Header in', filePath);
    }
}

addLogoToPDF('public/js/cms-overrides.js');
addLogoToPDF('public/js/public-cms.js');
