const fs = require('fs');

let content = `window.initAdminCms = function() {
    try {
        const ts = Date.now();
        Promise.all([
            fetch('/api/cms/biodata?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/event-categories?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/packages?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/policies?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/gallery?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/presskit?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/riders?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/testimonials?t=' + ts).then(r => r.json()).catch(()=>({}))
        ]).then(results => {
            const bioData = results[0]?.data || {};
            const evtCats = results[1]?.data || [];
            const pkgsData = results[2]?.data || [];
            const polData = results[3]?.data || {};
            const galData = results[4]?.data || [];
            const pkData = results[5]?.data || {};
            const ridersData = results[6]?.data || [];
            const testData = results[7]?.data || [];
            
            window.cmsConfig = window.cmsConfig || {};
            window.cmsConfig.bio = bioData;
            window.cmsConfig.eventCategories = evtCats;
            window.cmsConfig.pkgs = pkgsData;
            window.cmsConfig.policies = polData;
            window.cmsConfig.gallery = galData;
            window.cmsConfig.presskit = pkData;
            window.cmsConfig.riders = ridersData;
            window.cmsConfig.testimonials = testData;
            
            const mapVal = (id, val) => {
                const el = document.getElementById(id);
                if (el && val !== undefined && val !== null) el.value = val;
            };
            
            // Biodata
            mapVal('cmsNamaPanggung', bioData.name);
            mapVal('cmsEmail', bioData.email);
            mapVal('cmsBioText', bioData.bio);
            mapVal('cmsStatEvents', bioData.statEvents);
            mapVal('cmsStatYears', bioData.statYears);
            mapVal('cmsSpesialisasi', bioData.spec);
            mapVal('cmsFotoUrl', bioData.photo);
            mapVal('cmsIg', bioData.ig);
            mapVal('cmsTiktok', bioData.tiktok);
            mapVal('cmsFb', bioData.fb);
            
            if (bioData.photo) {
                const preview = document.getElementById('cmsFotoPreview');
                if (preview) preview.src = bioData.photo;
                const sidebarImg = document.getElementById('sidebarAvatarImg');
                if (sidebarImg) { sidebarImg.src = bioData.photo; sidebarImg.style.opacity = '1'; }
            }
            if (bioData.name) {
                const sidebarName = document.getElementById('sidebarMcName');
                if (sidebarName) sidebarName.textContent = bioData.name;
                const dashName = document.getElementById('dashWelcomeName');
                if (dashName) dashName.textContent = bioData.name;
            }
            
            if (bioData.calendarConfig) {
                mapVal('cfgCalBuffer', bioData.calendarConfig.buffer);
                mapVal('cfgCalMode', bioData.calendarConfig.mode);
                mapVal('cfgCalNotice', bioData.calendarConfig.notice);
            }

            // Packages (Layanan)
            renderAdminPackages(pkgsData);

            // Policies (Terms, Refund, Riders, FAQ)
            mapVal('cmsTermsText', polData.terms);
            mapVal('cmsRefundText', polData.refund);
            mapVal('cmsRidersText', polData.riders);
            renderAdminFaqs(polData.faqs || []);
            renderAdminTestimonials(testData);

            // Press Kit
            mapVal('pk_stageName', pkData.stageName);
            mapVal('pk_spesialisasi', pkData.spesialisasi);
            mapVal('pk_tagline', pkData.tagline);
            mapVal('pk_bio', pkData.bio);
            mapVal('pk_pic', pkData.pic);
            mapVal('pk_wa', pkData.wa);
            mapVal('pk_email', pkData.email);
            mapVal('pk_sosmed', pkData.sosmed);
            mapVal('pk_domisili', pkData.domisili);
            mapVal('pk_scope1', pkData.scope1);
            mapVal('pk_scope2', pkData.scope2);
            mapVal('pk_scope3', pkData.scope3);
            mapVal('pk_scope4', pkData.scope4);
            mapVal('pk_footerNote', pkData.footerNote);
            mapVal('riders_footerNote', pkData.ridersFooter);

            // Gallery
            renderAdminGallery(galData);
            
            // Riders (Table)
            renderAdminRiders(ridersData);
        });
    } catch(e) {
        console.warn('CMS init skipped:', e.message);
    }
}

// Packages Implementation
window.renderAdminPackages = function(pkgs) {
    const list = document.getElementById('cmsPackagesList');
    if (!list) return;
    window.cmsConfig.pkgs = pkgs;
    if (pkgs.length === 0) {
        list.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--text-muted);">Belum ada paket.</div>';
        return;
    }
    let html = '';
    pkgs.forEach((p, i) => {
        const badgeHtml = p.badge ? \`<span class="badge" style="background:var(--gold-primary); color:black; font-size:0.75rem; font-weight:bold; padding:2px 8px; border-radius:12px; margin-left:8px;">\${p.badge}</span>\` : '';
        html += \`
        <div class="ecc-card" style="background:var(--bg-surface); padding:1rem; display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem; border:1px solid var(--border-subtle);">
            <div>
                <div style="font-weight:700; color:var(--gold-primary); font-size:1.1rem; display:flex; align-items:center;">
                    \${p.name || 'Paket '+(i+1)}
                    \${badgeHtml}
                </div>
                <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">Kategori: \${p.category || 'Standard'} | Durasi: \${p.duration || '-'} | Harga: Rp \${parseInt(p.price||0).toLocaleString('id-ID')}</div>
                <ul style="margin:0; padding-left:1.25rem; font-size:0.85rem; color:var(--text-main);">
                    \${(p.features||[]).map(f => '<li>'+f+'</li>').join('')}
                </ul>
            </div>
            <div style="display:flex; gap:0.5rem;">
                <button class="btn btn-secondary btn-sm" onclick="editPackage(\${i})">Edit</button>
                <button class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deletePackage(\${i})">Hapus</button>
            </div>
        </div>\`;
    });
    list.innerHTML = html;
};

window.getPackageFormFields = function(p = null) {
    let catOptions = (window.cmsConfig.eventCategories || []).map(c => ({ value: c.name, label: c.name }));
    if(catOptions.length === 0) catOptions = [{value:'Wedding', label:'Wedding'}, {value:'Corporate', label:'Corporate'}];
    
    let badgeOptions = [
        {value: '', label: '(Tanpa Badge)'},
        {value: 'Most Popular', label: 'Most Popular'},
        {value: 'Best Value', label: 'Best Value'},
        {value: 'Premium', label: 'Premium'},
        {value: 'Recommended', label: 'Recommended'}
    ];
    
    return [
        { id: 'name', label: 'Nama Paket', type: 'text', value: p ? p.name : '' },
        { id: 'badge', label: 'Badge Khusus', type: 'select', options: badgeOptions, value: p ? (p.badge||'') : '' },
        { id: 'price', label: 'Harga (Angka saja)', type: 'number', value: p ? p.price : '0' },
        { id: 'category', label: 'Kategori Acara', type: 'select', options: catOptions, value: p ? p.category : (catOptions[0].value) },
        { id: 'duration', label: 'Durasi (misal: 4 Jam)', type: 'text', value: p ? p.duration : '4 Jam' },
        { id: 'features', label: 'Fitur (Pisahkan dengan koma)', type: 'textarea', value: p ? (p.features||[]).join(', ') : 'Fitur 1, Fitur 2' }
    ];
};

window.openAddPackageModal = async function() {
    window.editingPackageIndex = -1;
    const res = await window.uiCustomForm(getPackageFormFields(), 'Tambah Paket Baru');
    if (!res || !res.name) return;
    
    let pkgs = window.cmsConfig.pkgs || [];
    pkgs.push({
        name: res.name,
        badge: res.badge,
        price: res.price,
        category: res.category,
        duration: res.duration,
        features: res.features.split(',').map(x=>x.trim())
    });
    window.cmsConfig.pkgs = pkgs;
    renderAdminPackages(pkgs);
    handleSavePackage();
};

window.editPackage = async function(i) {
    let pkgs = window.cmsConfig.pkgs || [];
    let p = pkgs[i];
    if(!p) return;
    const res = await window.uiCustomForm(getPackageFormFields(p), 'Edit Paket');
    if (!res || !res.name) return;
    
    p.name = res.name;
    p.badge = res.badge;
    p.price = res.price;
    p.category = res.category;
    p.duration = res.duration;
    p.features = res.features.split(',').map(x=>x.trim());
    
    renderAdminPackages(pkgs);
    handleSavePackage();
};

window.deletePackage = function(i) {
    if(!confirm('Hapus paket ini?')) return;
    let pkgs = window.cmsConfig.pkgs || [];
    pkgs.splice(i, 1);
    renderAdminPackages(pkgs);
    handleSavePackage();
};
window.handleSavePackage = function(e) {
    if (e) e.preventDefault();
    fetch('/api/cms/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages: window.cmsConfig.pkgs || [] })
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Paket disimpan!', 'success');
    });
};

// FAQ
window.renderAdminFaqs = function(faqs) {
    window.cmsConfig.policies = window.cmsConfig.policies || {};
    window.cmsConfig.policies.faqs = faqs;
    const list = document.getElementById('faqItemsList');
    if (!list) return;
    let html = '';
    faqs.forEach((f, i) => {
        html += \`
        <div class="ecc-card" style="background:var(--bg-surface); padding:0.9rem 1.1rem; border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <strong style="color:var(--gold-primary);">Q: \${f.q}</strong>
                <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;">A: \${f.a}</p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteFaq(\${i})">Hapus</button>
        </div>\`;
    });
    list.innerHTML = html;
};
window.promptAddFaq = async function() {
    const res = await window.uiCustomForm([
        { id: 'q', label: 'Pertanyaan (Q)', type: 'text' },
        { id: 'a', label: 'Jawaban (A)', type: 'textarea' }
    ], 'Tambah FAQ');
    if (!res || !res.q) return;
    let faqs = window.cmsConfig.policies.faqs || [];
    faqs.push({q: res.q, a: res.a});
    renderAdminFaqs(faqs);
};
window.deleteFaq = function(i) {
    let faqs = window.cmsConfig.policies.faqs || [];
    faqs.splice(i, 1);
    renderAdminFaqs(faqs);
};

// Testimonials
window.renderAdminTestimonials = function(tests) {
    window.cmsConfig.testimonials = tests;
    const list = document.getElementById('testimonialItemsList');
    if (!list) return;
    let html = '';
    tests.forEach((t, i) => {
        html += \`
        <div class="ecc-card" style="background:var(--bg-surface); padding:0.9rem 1.1rem; border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <strong style="color:var(--gold-primary);">\${t.author}</strong> - \${t.role}
                <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;">"\${t.text}"</p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteTestimonial(\${i})">Hapus</button>
        </div>\`;
    });
    list.innerHTML = html;
};
window.promptAddTestimonial = async function() {
    const res = await window.uiCustomForm([
        { id: 'author', label: 'Nama Klien', type: 'text' },
        { id: 'role', label: 'Peran (misal: Bride, Corporate EO)', type: 'text', value: 'Client' },
        { id: 'text', label: 'Testimoni', type: 'textarea' }
    ], 'Tambah Testimoni');
    if (!res || !res.author) return;
    let tests = window.cmsConfig.testimonials || [];
    tests.push({author: res.author, role: res.role, text: res.text, rating:5});
    renderAdminTestimonials(tests);
};
window.deleteTestimonial = function(i) {
    let tests = window.cmsConfig.testimonials || [];
    tests.splice(i, 1);
    renderAdminTestimonials(tests);
};

window.handleSaveCmsPolicies = function(e) {
    if (e) e.preventDefault();
    const pol = {
        terms: document.getElementById('cmsTermsText')?.value || '',
        refund: document.getElementById('cmsRefundText')?.value || '',
        riders: document.getElementById('cmsRidersText')?.value || '',
        faqs: window.cmsConfig.policies?.faqs || []
    };
    fetch('/api/cms/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pol)
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Kebijakan & FAQ berhasil disimpan!', 'success');
        
        // Also save testimonials
        fetch('/api/cms/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testimonials: window.cmsConfig.testimonials || [] })
        });
    });
};

window.handleSaveCalendarWidgetConfig = function(e) {
    if (e) e.preventDefault();
    const bio = window.cmsConfig.bio || {};
    bio.calendarConfig = {
        buffer: document.getElementById('cfgCalBuffer')?.value || '7',
        mode: document.getElementById('cfgCalMode')?.value || 'request_to_book',
        notice: document.getElementById('cfgCalNotice')?.value || ''
    };
    fetch('/api/cms/biodata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bio)
    }).then(r=>r.json()).then(() => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Pengaturan Kalender disimpan!', 'success');
    });
};

// Press Kit
window.savePressKitData = function() {
    const pk = {
        stageName: document.getElementById('pk_stageName')?.value || '',
        spesialisasi: document.getElementById('pk_spesialisasi')?.value || '',
        tagline: document.getElementById('pk_tagline')?.value || '',
        bio: document.getElementById('pk_bio')?.value || '',
        pic: document.getElementById('pk_pic')?.value || '',
        wa: document.getElementById('pk_wa')?.value || '',
        email: document.getElementById('pk_email')?.value || '',
        sosmed: document.getElementById('pk_sosmed')?.value || '',
        domisili: document.getElementById('pk_domisili')?.value || '',
        scope1: document.getElementById('pk_scope1')?.value || '',
        scope2: document.getElementById('pk_scope2')?.value || '',
        scope3: document.getElementById('pk_scope3')?.value || '',
        scope4: document.getElementById('pk_scope4')?.value || '',
        footerNote: document.getElementById('pk_footerNote')?.value || '',
        ridersFooter: document.getElementById('riders_footerNote')?.value || ''
    };
    fetch('/api/cms/presskit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pk)
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Press Kit disimpan!', 'success');
    });
};
window.saveRidersFooterNote = function() {
    savePressKitData();
};

// Gallery
window.renderAdminGallery = function(gal) {
    window.cmsConfig.gallery = gal;
    const list = document.getElementById('adminGalleryList');
    if (!list) return;
    let html = '';
    gal.forEach((g, i) => {
        html += \`<div style="display:flex; flex-direction:column; gap:0.5rem; background:var(--bg-surface); padding:1rem; border:1px solid var(--border-subtle); border-radius:8px;">
            <img src="\${g.url}" style="width:100%; height:150px; object-fit:cover; border-radius:4px;">
            <input type="text" class="form-input" value="\${g.caption || ''}" onchange="updateGalleryCaption(\${i}, this.value)">
            <button class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteGalleryItem(\${i})">Hapus</button>
        </div>\`;
    });
    list.innerHTML = html;
};
window.updateGalleryCaption = function(i, cap) {
    window.cmsConfig.gallery[i].caption = cap;
};
window.deleteGalleryItem = function(i) {
    window.cmsConfig.gallery.splice(i, 1);
    renderAdminGallery(window.cmsConfig.gallery);
};
window.handleSaveCmsGallery = function() {
    fetch('/api/cms/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery: window.cmsConfig.gallery || [] })
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Galeri disimpan!', 'success');
    });
};
window.addGalleryItem = async function() {
    const res = await window.uiCustomForm([
        { id: 'url', label: 'URL Gambar Baru (atau data:image...)', type: 'text' },
        { id: 'cap', label: 'Caption Gambar', type: 'text' }
    ], 'Tambah Gambar Galeri');
    if (!res || !res.url) return;
    window.cmsConfig.gallery.push({url: res.url, caption: res.cap});
    renderAdminGallery(window.cmsConfig.gallery);
};

// Riders
window.renderAdminRiders = function(riders) {
    window.cmsConfig.riders = riders;
    const body = document.getElementById('ridersTableBody');
    if (!body) return;
    let html = '';
    riders.forEach((r, i) => {
        html += \`<tr>
            <td><strong>\${r.title}</strong></td>
            <td>\${r.notes}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editRider(\${i})">Edit</button>
                <button class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteRider(\${i})">Hapus</button>
            </td>
        </tr>\`;
    });
    body.innerHTML = html;
};
window.openRiderModal = async function() {
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
};
window.editRider = async function(i) {
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
};
window.deleteRider = function(i) {
    let r = window.cmsConfig.riders[i];
    if(!confirm('Hapus rider ini?')) return;
    fetch('/api/cms/riders/' + r.db_id, { method: 'DELETE' })
        .then(res=>res.json()).then(() => initAdminCms());
};


// Trigger initial load
document.addEventListener("DOMContentLoaded", window.initAdminCms);


window.handleCmsPhotoUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
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
        if (urlInput) urlInput.value = base64Data;
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
`
fs.writeFileSync('public/js/cms-overrides.js', content);
