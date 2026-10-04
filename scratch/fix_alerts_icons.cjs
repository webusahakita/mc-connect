const fs = require('fs');
const file = 'public/js/admin-core.js';
let code = fs.readFileSync(file, 'utf8');

// Replace alert with uiAlert for preview
code = code.replace(
    "previewAction = \"alert('Hanya lagu dengan Link URL (Spotify/Youtube) yang dapat di-preview secara langsung.')\";",
    "previewAction = \"window.uiAlert('Hanya lagu dengan Link URL (Spotify/Youtube) yang dapat di-preview secara langsung.')\";"
);
code = code.replace(
    "previewAction = \"alert('File audio tersimpan secara lokal. Putar musik ini di Stage Mode (FOH/DJ).')\";",
    "previewAction = \"window.uiAlert('File audio tersimpan secara lokal. Putar musik ini di Stage Mode (FOH/DJ).')\";"
);
code = code.replace(/onclick="alert\('Memutar/g, "onclick=\"window.uiAlert('Memutar");

// Replace ALL garbled text
const editSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
const trashSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
const arrowSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';

// For Edit (âœ ï¸)
code = code.replace(/âœ ï¸ /g, editSvg);
code = code.replace(/âœ /g, editSvg);

// For Delete (ðŸ—‘ï¸)
code = code.replace(/ðŸ—‘ï¸ /g, trashSvg);
code = code.replace(/ðŸ—‘/g, trashSvg);

// For Arrow (âž¡ï¸)
code = code.replace(/âž¡ï¸ /g, arrowSvg);

// For Checkmark (âœ…)
const checkSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
code = code.replace(/âœ…/g, checkSvg);

// For X (âœ•)
const xSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
code = code.replace(/âœ•/g, xSvg);

fs.writeFileSync(file, code);
console.log('Fixed alerts and garbled icons');
