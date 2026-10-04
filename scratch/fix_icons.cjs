const fs = require('fs');
const file = 'public/js/admin-core.js';
let code = fs.readFileSync(file, 'utf8');

// Fix the garbled arrows
code = code.replace(/Ã¢Å¾Â¡Ã¯Â¸ /g, '&#10145;&#65039;');
code = code.replace(/Ã¢Å¾Â¡Ã¯Â¸/g, '&#10145;&#65039;'); // ➡️
code = code.replace(/Ã¢Å“ Ã¯Â¸ /g, '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>');
code = code.replace(/Ã¢Å“Ã¯Â¸/g, '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>');
code = code.replace(/Ã°Å¸â€”â€˜Ã¯Â¸ /g, '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>');
code = code.replace(/Ã°Å¸â€”â€˜Ã¯Â¸/g, '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>');

// Add the preview button to BGM table
const oldEditBtn = `html += '<button class="btn btn-secondary btn-sm" onclick="window.openAddMusicModal(' + realIdx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);" title="Edit / Ganti Segmen">`;
const newPreviewAndEdit = `
        let previewAction = "alert('Hanya lagu dengan Link URL (Spotify/Youtube) yang dapat di-preview secara langsung.')";
        if (item.url_link) {
            let url = item.url_link.trim();
            if (!url.startsWith('http')) url = 'https://' + url;
            previewAction = "window.open('" + url + "', '_blank')";
        } else if (item.file_upload) {
            previewAction = "alert('File audio tersimpan secara lokal. Putar musik ini di Stage Mode (FOH/DJ).')";
        }
        
        html += '<button class="btn btn-secondary btn-sm" onclick="' + previewAction + '" style="margin-right:0.5rem; color:#38BDF8; border-color:rgba(56,189,248,0.3);" title="Preview / Dengarkan"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></button>';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.openAddMusicModal(' + realIdx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);" title="Edit / Ganti Segmen">`;

code = code.replace(oldEditBtn, newPreviewAndEdit);

fs.writeFileSync(file, code);
console.log('Fixed garbled icons and added preview button');
