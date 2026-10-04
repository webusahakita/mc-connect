const fs = require('fs');
const file = 'public/js/admin-core.js';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `{ id: 'artist', label: 'Penyanyi / Artis', type: 'text', value: editItem ? editItem.artist : '' },`;
const replacementStr = `{ id: 'artist', label: 'Penyanyi / Artis', type: 'text', value: editItem ? editItem.artist : '' },
        { id: 'url_link', label: 'Link URL Lagu (Spotify/Youtube)', type: 'text', value: editItem ? (editItem.url_link || '') : '' },
        { id: 'file_upload', label: 'Atau Upload File Audio (.mp3/.wav)', type: 'file' },`;

code = code.replace(targetStr, replacementStr);

const saveTarget = `artist: result.artist || '',`;
const saveReplacement = `artist: result.artist || '',
            url_link: result.url_link || '',
            file_upload: result.file_upload ? (typeof result.file_upload === 'object' ? result.file_upload.name : result.file_upload) : (editItem ? editItem.file_upload : ''),`;

code = code.replace(saveTarget, saveReplacement);

fs.writeFileSync(file, code);
console.log('Added URL and File Upload fields to Add Music form');
