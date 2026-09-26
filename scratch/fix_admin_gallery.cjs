const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');
html = html.replace(
    /<button type="button" class="btn btn-secondary btn-sm" onclick="if\(confirm\('Hapus.*?localStorage\.removeItem\('mc_gallery_config'\); renderAdminGallery\(\); showToast\('Galeri direset ke default\.','gold'\);\}">Reset ke Default<\/button>/g,
    `<button type="button" class="btn btn-secondary btn-sm" onclick="if(confirm('Hapus semua foto galeri?')){ window.cmsConfig.gallery=[]; renderAdminGallery(window.cmsConfig.gallery); handleSaveCmsGallery(); }">Reset ke Kosong</button>`
);
html = html.replace(
    /<button type="button" class="btn btn-primary" onclick="saveAdminGalleryData\(getAdminGalleryData\(\)\); showToast\('Galeri berhasil disimpan! Perubahan akan tampil di landing page\.', 'gold'\);">Simpan & Publikasi Galeri<\/button>/g,
    `<button type="button" class="btn btn-primary" onclick="handleSaveCmsGallery()">Simpan & Publikasi Galeri</button>`
);
fs.writeFileSync('public/admin.html', html);
console.log('Fixed gallery buttons in admin.html');
