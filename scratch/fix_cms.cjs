const fs = require('fs');
let code = fs.readFileSync('public/js/cms-overrides.js', 'utf8');

// Replace openAddPackageModal
code = code.replace(/window\.openAddPackageModal[\s\S]*?handleSavePackage\(\);\s*\n};/, `window.openAddPackageModal = async function() {
    window.editingPackageIndex = -1;
    const res = await window.uiCustomForm([
        { id: 'name', label: 'Nama Paket Baru', type: 'text' },
        { id: 'price', label: 'Harga (Angka saja)', type: 'number', value: '0' },
        { id: 'category', label: 'Kategori', type: 'text', value: 'Standard' },
        { id: 'duration', label: 'Durasi (misal: 4 Jam)', type: 'text', value: '4 Jam' },
        { id: 'features', label: 'Fitur (Pisahkan dengan koma)', type: 'textarea', value: 'Fitur 1, Fitur 2' }
    ], 'Tambah Paket Baru');
    if (!res || !res.name) return;
    
    let pkgs = window.cmsConfig.pkgs || [];
    pkgs.push({
        name: res.name,
        price: res.price,
        category: res.category,
        duration: res.duration,
        features: res.features.split(',').map(x=>x.trim())
    });
    window.cmsConfig.pkgs = pkgs;
    renderAdminPackages(pkgs);
    handleSavePackage();
};`);

// Replace editPackage
code = code.replace(/window\.editPackage = function\(i\) {[\s\S]*?handleSavePackage\(\);\s*\n};/, `window.editPackage = async function(i) {
    let pkgs = window.cmsConfig.pkgs || [];
    let p = pkgs[i];
    if(!p) return;
    const res = await window.uiCustomForm([
        { id: 'name', label: 'Nama Paket', type: 'text', value: p.name },
        { id: 'price', label: 'Harga (Angka)', type: 'number', value: p.price },
        { id: 'features', label: 'Fitur (Pisahkan dengan koma)', type: 'textarea', value: (p.features||[]).join(', ') }
    ], 'Edit Paket');
    if (!res || !res.name) return;
    p.name = res.name; p.price = res.price; p.features = res.features.split(',').map(x=>x.trim());
    renderAdminPackages(pkgs);
    handleSavePackage();
};`);

// Replace promptAddFaq
code = code.replace(/window\.promptAddFaq = function\(\) {[\s\S]*?renderAdminFaqs\(faqs\);\s*\n};/, `window.promptAddFaq = async function() {
    const res = await window.uiCustomForm([
        { id: 'q', label: 'Pertanyaan (Q)', type: 'text' },
        { id: 'a', label: 'Jawaban (A)', type: 'textarea' }
    ], 'Tambah FAQ');
    if (!res || !res.q) return;
    let faqs = window.cmsConfig.policies.faqs || [];
    faqs.push({q: res.q, a: res.a});
    renderAdminFaqs(faqs);
};`);

// Replace promptAddTestimonial
code = code.replace(/window\.promptAddTestimonial = function\(\) {[\s\S]*?renderAdminTestimonials\(tests\);\s*\n};/, `window.promptAddTestimonial = async function() {
    const res = await window.uiCustomForm([
        { id: 'author', label: 'Nama Klien', type: 'text' },
        { id: 'role', label: 'Peran (misal: Bride, Corporate EO)', type: 'text', value: 'Client' },
        { id: 'text', label: 'Testimoni', type: 'textarea' }
    ], 'Tambah Testimoni');
    if (!res || !res.author) return;
    let tests = window.cmsConfig.testimonials || [];
    tests.push({author: res.author, role: res.role, text: res.text, rating:5});
    renderAdminTestimonials(tests);
};`);

// Replace addGalleryItem
code = code.replace(/window\.addGalleryItem = function\(\) {[\s\S]*?renderAdminGallery\(window\.cmsConfig\.gallery\);\s*\n};/, `window.addGalleryItem = async function() {
    const res = await window.uiCustomForm([
        { id: 'url', label: 'URL Gambar Baru (atau data:image...)', type: 'text' },
        { id: 'cap', label: 'Caption Gambar', type: 'text' }
    ], 'Tambah Gambar Galeri');
    if (!res || !res.url) return;
    window.cmsConfig.gallery.push({url: res.url, caption: res.cap});
    renderAdminGallery(window.cmsConfig.gallery);
};`);

// Replace openRiderModal
code = code.replace(/window\.openRiderModal = function\(\) {[\s\S]*?initAdminCms\(\); \/\/ reload everything\s*\n    \}\);\s*\n};/, `window.openRiderModal = async function() {
    const res = await window.uiCustomForm([
        { id: 't', label: 'Judul Rider (misal: Hospitality)', type: 'text' },
        { id: 'n', label: 'Catatan (misal: 1x Ruang Tunggu)', type: 'textarea' }
    ], 'Tambah Rider');
    if (!res || !res.t) return;
    fetch('/api/cms/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: res.t, notes: res.n })
    }).then(r=>r.json()).then(result => {
        initAdminCms(); // reload everything
    });
};`);

// Replace editRider
code = code.replace(/window\.editRider = function\(i\) {[\s\S]*?initAdminCms\(\)\);\s*\n};/, `window.editRider = async function(i) {
    let r = window.cmsConfig.riders[i];
    const res = await window.uiCustomForm([
        { id: 't', label: 'Judul Rider', type: 'text', value: r.title },
        { id: 'n', label: 'Catatan', type: 'textarea', value: r.notes }
    ], 'Edit Rider');
    if (!res || !res.t) return;
    fetch('/api/cms/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_id: r.db_id, title: res.t, notes: res.n })
    }).then(r=>r.json()).then(() => initAdminCms());
};`);

// Append new functions
code += `\n
window.handleCmsPhotoUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validasi ukuran (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        if(typeof window.uiAlert==='function') window.uiAlert('Ukuran foto maksimal 2MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        const base64Data = evt.target.result;
        const preview = document.getElementById('cmsFotoPreview');
        if (preview) preview.src = base64Data;
        const urlInput = document.getElementById('cmsFotoUrl');
        if (urlInput) urlInput.value = base64Data; // Simpan base64 di input ini sementara
    };
    reader.readAsDataURL(file);
};

window.handleSaveCmsBio = function(e) {
    if (e) e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.innerHTML : 'Simpan Biodata & Sosmed';
    if(btn) { btn.disabled = true; btn.innerHTML = 'Menyimpan...'; }
    
    const bioData = {
        name: document.getElementById('cmsNamaPanggung')?.value || '',
        email: document.getElementById('cmsEmail')?.value || '',
        bio: document.getElementById('cmsBioText')?.value || '',
        statEvents: document.getElementById('cmsStatEvents')?.value || '',
        statYears: document.getElementById('cmsStatYears')?.value || '',
        spec: document.getElementById('cmsSpesialisasi')?.value || '',
        photo: document.getElementById('cmsFotoUrl')?.value || '',
        ig: document.getElementById('cmsIg')?.value || '',
        tiktok: document.getElementById('cmsTiktok')?.value || '',
        fb: document.getElementById('cmsFb')?.value || ''
    };
    
    // Pastikan calendar config disertakan jika tidak diubah di modal ini (supaya tidak hilang)
    if(window.cmsConfig && window.cmsConfig.bio && window.cmsConfig.bio.calendarConfig) {
        bioData.calendarConfig = window.cmsConfig.bio.calendarConfig;
    }
    
    fetch('/api/cms/biodata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bioData)
    }).then(r => r.json()).then(res => {
        if(btn) { btn.disabled = false; btn.innerHTML = originalText; }
        if (typeof window.uiAlert === 'function') window.uiAlert('Biodata berhasil disimpan ke database!', 'success');
        initAdminCms();
    }).catch(err => {
        if(btn) { btn.disabled = false; btn.innerHTML = originalText; }
        if (typeof window.uiAlert === 'function') window.uiAlert('Gagal menyimpan biodata', 'error');
    });
};
`;

fs.writeFileSync('public/js/cms-overrides.js', code);
console.log("Done overwriting cms-overrides.js!");
