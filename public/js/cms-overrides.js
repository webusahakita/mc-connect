window.applyCmsConfigToUi = function(cfg) {
    if (!cfg) return;
    const bioData = cfg.bio || {};
    const evtCats = cfg.eventCategories || [];
    const pkgsData = cfg.pkgs || [];
    const polData = cfg.policies || {};
    const galData = cfg.gallery || [];
    const pkData = cfg.presskit || {};
    const ridersData = cfg.riders || [];
    const testData = cfg.testimonials || [];

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
    if (typeof renderAdminPackages === "function") renderAdminPackages(pkgsData);

    // Policies (Terms, Refund, Riders, FAQ)
    mapVal('cmsTermsText', polData.terms);
    mapVal('cmsRefundText', polData.refund);
    mapVal('cmsRidersText', polData.riders);
    if (typeof renderAdminFaqs === "function") renderAdminFaqs(polData.faqs || []);
    if (typeof renderAdminTestimonials === "function") renderAdminTestimonials(testData);

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
    if (typeof renderAdminGallery === "function") renderAdminGallery(galData);

    // Riders (Table)
    if (typeof renderAdminRiders === "function") renderAdminRiders(ridersData);
};

window.initAdminCms = function(force = false) {
    try {
        if (!force && window.cmsConfig && window.cmsConfig.bio && Object.keys(window.cmsConfig.bio).length > 0) {
            window.applyCmsConfigToUi(window.cmsConfig);
            return;
        }
        const ts = Date.now();
        fetch('/api/cms/bootstrap?t=' + ts)
            .then(r => r.json())
            .then(res => {
                if (res.success && res.data) {
                    const d = res.data;
                    window.cmsConfig = window.cmsConfig || {};
                    window.cmsConfig.bio = d.biodata || {};
                    window.cmsConfig.eventCategories = d.event_categories || [];
                    window.cmsConfig.pkgs = d.packages || [];
                    window.cmsConfig.policies = d.policies || {};
                    window.cmsConfig.gallery = d.gallery || [];
                    window.cmsConfig.presskit = d.presskit || {};
                    window.cmsConfig.riders = d.riders || [];
                    window.cmsConfig.testimonials = d.testimonials || [];
                    window.applyCmsConfigToUi(window.cmsConfig);
                }
            })
            .catch(e => console.warn('CMS init fallback:', e.message));
    } catch(e) {
        console.warn('CMS init skipped:', e.message);
    }
};

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
        const badgeHtml = p.badge ? `<span class="badge" style="background:var(--gold-primary); color:black; font-size:0.75rem; font-weight:bold; padding:2px 8px; border-radius:12px; margin-left:8px;">${p.badge}</span>` : '';
        html += `
        <div class="ecc-card" style="background:var(--bg-surface); padding:1rem; display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem; border:1px solid var(--border-subtle);">
            <div>
                <div style="font-weight:700; color:var(--gold-primary); font-size:1.1rem; display:flex; align-items:center;">
                    ${p.name || 'Paket '+(i+1)}
                    ${badgeHtml}
                </div>
                <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">Kategori: ${p.category || 'Standard'} | Durasi: ${p.duration || '-'} | Harga: Rp ${parseInt(p.price||0).toLocaleString('id-ID')}</div>
                <ul style="margin:0; padding-left:1.25rem; font-size:0.85rem; color:var(--text-main);">
                    ${(p.features||[]).map(f => '<li>'+f+'</li>').join('')}
                </ul>
            </div>
            <div style="display:flex; gap:0.5rem;">
                <button class="btn btn-secondary btn-sm" onclick="editPackage(${i})">Edit</button>
                <button class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deletePackage(${i})">Hapus</button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
};

window.getPackageFormFields = function(p = null) {
    let catOptions = (window.cmsConfig && window.cmsConfig.eventCategories || []).map(c => ({ value: c.name, label: c.name }));
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
        { id: 'price', label: 'Harga (Angka saja)', type: 'number', min: 0, value: p ? Math.max(0, parseFloat(p.price) || 0) : '0' },
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
        price: Math.max(0, parseFloat(res.price) || 0),
        category: res.category,
        duration: res.duration,
        features: res.features.split(',').map(x=>x.trim()).filter(Boolean)
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
    p.price = Math.max(0, parseFloat(res.price) || 0);
    p.category = res.category;
    p.duration = res.duration;
    p.features = res.features.split(',').map(x=>x.trim()).filter(Boolean);
    
    renderAdminPackages(pkgs);
    handleSavePackage();
};

window.deletePackage = async function(i) {
    if(!(await window.uiConfirm('Hapus paket ini?'))) return;
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
        if (typeof window.showToast === 'function') window.showToast('Paket disimpan!', 'gold');
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
        html += `
        <div class="ecc-card" style="background:var(--bg-surface); padding:0.9rem 1.1rem; border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <strong style="color:var(--gold-primary);">Q: ${f.q}</strong>
                <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;">A: ${f.a}</p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteFaq(${i})">Hapus</button>
        </div>`;
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
        html += `
        <div class="ecc-card" style="background:var(--bg-surface); padding:0.9rem 1.1rem; border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <strong style="color:var(--gold-primary);">${t.author}</strong> - ${t.role}
                <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;">"${t.text}"</p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteTestimonial(${i})">Hapus</button>
        </div>`;
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
        if (typeof window.showToast === 'function') window.showToast('Kebijakan & FAQ berhasil disimpan!', 'gold');
        
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
        if (typeof window.showToast === 'function') window.showToast('Pengaturan Kalender disimpan!', 'gold');
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
        if (typeof window.showToast === 'function') window.showToast('Press Kit disimpan!', 'gold');
    });
};
window.saveRidersFooterNote = function() {
    savePressKitData();
};

// Gallery
window.renderAdminGallery = function(gal) {
    window.cmsConfig.gallery = gal;
    const list = document.getElementById('cmsGalleryItemsList');
    if (!list) return;
    let html = '';
    gal.forEach((g, i) => {
        html += `<div style="display:flex; flex-direction:column; gap:0.5rem; background:var(--bg-surface); padding:1rem; border:1px solid var(--border-subtle); border-radius:8px;">
            <img src="${g.url}" style="width:100%; height:150px; object-fit:cover; border-radius:4px;">
            <input type="text" class="form-input" value="${g.caption || ''}" onchange="updateGalleryCaption(${i}, this.value)">
            <button class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteGalleryItem(${i})">Hapus</button>
        </div>`;
    });
    list.innerHTML = html;
};
window.updateGalleryCaption = function(i, cap) {
    window.cmsConfig.gallery[i].caption = cap;
    handleSaveCmsGallery();
};
window.deleteGalleryItem = function(i) {
    window.cmsConfig.gallery.splice(i, 1);
    renderAdminGallery(window.cmsConfig.gallery);
    handleSaveCmsGallery();
};
window.handleSaveCmsGallery = function() {
    fetch('/api/cms/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery: window.cmsConfig.gallery || [] })
    }).then(r => r.json()).then(res => {
        if (typeof window.showToast === 'function') window.showToast('Galeri disimpan!', 'gold');
    });
};
window.handleMultipleGalleryUpload = function(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    window.cmsConfig = window.cmsConfig || {};
    window.cmsConfig.gallery = window.cmsConfig.gallery || [];
    
    let processed = 0;
    const total = files.length;
    for (let i = 0; i < total; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
            if(typeof window.showToast==='function') window.showToast(`File ${file.name} terlalu besar (Max 5MB)`, 'red');
            processed++;
            if (processed === total) {
                renderAdminGallery(window.cmsConfig.gallery);
                handleSaveCmsGallery();
                e.target.value = ''; // reset input
            }
            continue;
        }
        const reader = new FileReader();
        reader.onload = function(evt) {
            window.cmsConfig.gallery.push({ url: evt.target.result, caption: 'Portofolio' });
            processed++;
            if (processed === total) {
                renderAdminGallery(window.cmsConfig.gallery);
                handleSaveCmsGallery();
                e.target.value = ''; // reset input
            }
        };
        reader.readAsDataURL(file);
    }
};

// Riders
window.renderAdminRiders = function(riders) {
    window.cmsConfig.riders = riders;
    const body = document.getElementById('ridersListContainer') || document.getElementById('ridersTableBody');
    if (!body) return;
    let html = '';
    riders.forEach((r, i) => {
        const notesHtml = (r.notes || '').split('\n').map(l => l.trim()).filter(l => l).map(l => `<div style="margin-bottom:0.25rem; padding-left:1rem; position:relative;"><span style="position:absolute; left:0; color:var(--gold-primary);">•</span> ${l.replace(/^[•\-]\s*/, '')}</div>`).join('');
        
        html += `
        <div class="ecc-card" style="background:var(--bg-surface); padding:1rem 1.25rem; border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:flex-start; transition: all 0.2s ease; margin-bottom:0;">
            <div style="flex:1; padding-right:1rem;">
                <h4 style="color:var(--gold-primary); font-size:1rem; font-weight:700; margin:0 0 0.5rem 0;">${r.title}</h4>
                <div style="font-size:0.85rem; color:var(--text-main); line-height:1.5;">${notesHtml}</div>
            </div>
            <div style="display:flex; gap:0.5rem; flex-shrink:0;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="editRider(${i})">Edit</button>
                <button type="button" class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteRider(${i})">Hapus</button>
            </div>
        </div>`;
    });
    body.innerHTML = html || '<div style="padding:1rem; text-align:center; color:var(--text-muted);">Belum ada data Event Riders.</div>';
};
window.openRiderModal = async function() {
    const res = await window.uiCustomForm([
        { id: 't', label: 'Judul Rider (misal: Hospitality)', type: 'text' },
        { id: 'n', label: 'Catatan (misal: 1x Ruang Tunggu)', type: 'textarea' }
    ], 'Tambah Rider');
    if (!res || !res.t) return;
    try {
        const resp = await fetch('/api/cms/riders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.CSRF_TOKEN || '' },
            body: JSON.stringify({ title: res.t, notes: res.n })
        });
        const result = await resp.json();
        if (result && result.success) {
            if (typeof window.showToast === 'function') window.showToast('Rider berhasil ditambahkan!', 'gold');
        }
        initAdminCms(true);
    } catch (err) {
        console.error('Error saving rider', err);
        if (typeof window.showToast === 'function') window.showToast('Gagal menambahkan rider', 'red');
    }
};
window.editRider = async function(i) {
    let r = window.cmsConfig && window.cmsConfig.riders ? window.cmsConfig.riders[i] : null;
    if (!r) return;
    const res = await window.uiCustomForm([
        { id: 't', label: 'Judul Rider', type: 'text', value: r.title || '' },
        { id: 'n', label: 'Catatan', type: 'textarea', value: r.notes || '' }
    ], 'Edit Rider');
    if (!res || !res.t) return;
    try {
        const resp = await fetch('/api/cms/riders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.CSRF_TOKEN || '' },
            body: JSON.stringify({ db_id: r.db_id, title: res.t, notes: res.n })
        });
        const result = await resp.json();
        if (result && result.success) {
            r.title = res.t;
            r.notes = res.n;
            if (typeof window.showToast === 'function') window.showToast('Rider berhasil diperbarui!', 'gold');
        }
        initAdminCms(true);
    } catch (err) {
        console.error('Error editing rider', err);
        if (typeof window.showToast === 'function') window.showToast('Gagal memperbarui rider', 'red');
    }
};
window.deleteRider = async function(i) {
    let r = window.cmsConfig && window.cmsConfig.riders ? window.cmsConfig.riders[i] : null;
    if (!r) return;
    if (!(await window.uiConfirm(`Hapus rider "${r.title || 'ini'}"?`))) return;
    try {
        if (r.db_id) {
            await fetch('/api/cms/riders/' + r.db_id, {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': window.CSRF_TOKEN || '' }
            });
        }
        if (window.cmsConfig && window.cmsConfig.riders) {
            window.cmsConfig.riders.splice(i, 1);
            if (typeof renderAdminRiders === 'function') renderAdminRiders(window.cmsConfig.riders);
        }
        if (typeof window.showToast === 'function') window.showToast('Rider berhasil dihapus!', 'gold');
        initAdminCms(true);
    } catch (err) {
        console.error('Error deleting rider', err);
        if (typeof window.showToast === 'function') window.showToast('Gagal menghapus rider', 'red');
    }
};


// Initial load is now lazy-loaded on demand when navigating to CMS section
// (document.addEventListener removed for sub-second dashboard performance)


window.handleCmsPhotoUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        if (typeof window.showToast === 'function') window.showToast('Ukuran foto maksimal 5MB', 'red');
        return;
    }
    
    // Preview langsung di UI
    const reader = new FileReader();
    reader.onload = function(evt) {
        const preview = document.getElementById('cmsFotoPreview');
        if (preview) preview.src = evt.target.result;
        const sidebarImg = document.getElementById('sidebarAvatarImg');
        if (sidebarImg) { sidebarImg.src = evt.target.result; sidebarImg.style.opacity = '1'; }
    };
    reader.readAsDataURL(file);

    // Langsung upload file ke backend
    const formData = new FormData();
    formData.append('photo_file', file);
    if (typeof window.showToast === 'function') window.showToast('Mengunggah foto profil...', 'info');

    fetch('/api/cms/biodata', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': window.CSRF_TOKEN || ''
        },
        body: formData
    })
    .then(r => r.json())
    .then(res => {
        if (res && res.success && res.data && res.data.photo) {
            const photoUrl = res.data.photo;
            const urlInput = document.getElementById('cmsFotoUrl');
            if (urlInput) urlInput.value = photoUrl;
            const preview = document.getElementById('cmsFotoPreview');
            if (preview) preview.src = photoUrl;
            const sidebarImg = document.getElementById('sidebarAvatarImg');
            if (sidebarImg) { sidebarImg.src = photoUrl; sidebarImg.style.opacity = '1'; }
            if (window.cmsConfig && window.cmsConfig.bio) {
                window.cmsConfig.bio.photo = photoUrl;
            }
            if (typeof window.showToast === 'function') window.showToast('Foto profil berhasil diunggah & tersimpan!', 'gold');
        } else {
            if (typeof window.showToast === 'function') window.showToast('Gagal mengunggah foto profil', 'red');
        }
    })
    .catch(err => {
        console.error('Upload error', err);
        if (typeof window.showToast === 'function') window.showToast('Gagal mengunggah foto profil', 'red');
    });
};

window.handleSaveCmsBio = function(e) {
    if (e) e.preventDefault();
    
    const btn = e.target ? e.target.querySelector('button[type="submit"]') : null;
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
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': window.CSRF_TOKEN || ''
        },
        body: JSON.stringify(bioData)
    }).then(r => r.json()).then(res => {
        if(btn) { btn.disabled = false; btn.innerHTML = originalText; }
        if (res && res.success) {
            if (typeof window.showToast === 'function') window.showToast('Biodata berhasil disimpan ke database!', 'gold');
            const savedPhoto = res.data?.photo;
            if (savedPhoto) {
                if (window.cmsConfig && window.cmsConfig.bio) {
                    window.cmsConfig.bio.photo = savedPhoto;
                }
                const preview = document.getElementById('cmsFotoPreview');
                if (preview) preview.src = savedPhoto;
                const urlInput = document.getElementById('cmsFotoUrl');
                if (urlInput) urlInput.value = savedPhoto;
                const sidebarImg = document.getElementById('sidebarAvatarImg');
                if (sidebarImg) { sidebarImg.src = savedPhoto; sidebarImg.style.opacity = '1'; }
            }
            initAdminCms(true);
        } else {
            if (typeof window.showToast === 'function') window.showToast(res.message || 'Gagal menyimpan biodata', 'red');
        }
    }).catch(err => {
        if(btn) { btn.disabled = false; btn.innerHTML = originalText; }
        if (typeof window.showToast === 'function') window.showToast('Gagal menyimpan biodata', 'red');
    });
};

window.switchPkSubTab = function(panelId, btnEl) {
    const parent = btnEl.closest('.ecc-card');
    if (parent) {
        parent.querySelectorAll('.cms-tab-btn').forEach(btn => btn.classList.remove('active'));
        parent.querySelectorAll('.pk-subpanel').forEach(panel => panel.style.display = 'none');
    }
    
    if (btnEl) btnEl.classList.add('active');
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) targetPanel.style.display = 'block';
};


function exportPressKitPDF() {
    if (typeof showToast !== 'function') {
        window.showToast = function(msg) {
            if (typeof uiAlert === 'function') uiAlert(msg);
            else console.log(msg); // fallback for public landing page
        };
    }
    
    if (typeof showToast === 'function') showToast('Menyiapkan PDF...');
    
    const pk = window.cmsConfig.presskit || {};
    const riders = window.cmsConfig.riders || [];
    
    if (!pk || !pk.stageName) {
        if (typeof showToast === 'function') showToast('Data Press Kit belum dimuat atau kosong.', 'red');
        return;
    }

    const esc = (s) => !s ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const riderFooter = pk.ridersFooter || 'Rider ini bersifat fleksibel dan dapat didiskusikan.';

    let ridersRowsHtml = '';
    if (riders && riders.length > 0) {
        ridersRowsHtml = riders.map(r => {
            const lines = (r.notes || '').split('\n').map(l => l.trim()).filter(l => l);
            const bulletHtml = lines.map(l => {
                const cleaned = l.replace(/^[•\-]\s*/, '');
                return `<div style="margin-bottom:6px; padding-left:14px; text-indent:-14px; position:relative;">
                    <span style="position:absolute; left:0; color:#D4AF37;">•</span> ${esc(cleaned)}
                </div>`;
            }).join('');
            return `<tr>
                <td style="background:#0B101E; color:#fff; padding:12px 15px; font-weight:700; width:30%; vertical-align:top; border-bottom:1px solid #e0e0e0; font-size:0.9rem;">
                    ${esc(r.title)}
                </td>
                <td style="padding:12px 15px; vertical-align:top; border-bottom:1px solid #e0e0e0; font-size:0.85rem; color:#444; line-height:1.5;">
                    ${bulletHtml}
                </td>
            </tr>`;
        }).join('');
    } else {
        ridersRowsHtml = `<tr><td colspan="2" style="padding:12px 15px; text-align:center; color:#888;">Belum ada data event riders yang ditambahkan.</td></tr>`;
    }

    const scopeSection = (num, color, title, text) => {
        if (!text) return '';
        const items = text.split('\n').map(l => l.trim()).filter(l => l);
        const bullets = items.map(l => `<div style="margin-bottom:4px; font-size:11px; padding-left:12px; text-indent:-12px; color:#444;">• ${esc(l.replace(/^[•\-]\s*/, ''))}</div>`).join('');
        return `<div style="background:#fff; border:1px solid #eaeaea; padding:12px; border-radius:6px;">
            <div style="color:${color}; font-weight:800; font-size:12.5px; margin-bottom:8px; border-bottom:1px solid #f0f0f0; padding-bottom:6px;">${num}. ${esc(title)}</div>
            ${bullets}
        </div>`;
    };

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Press Kit - ${esc(pk.stageName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page {
      size: A4 portrait;
      margin: 0; /* Menghapus header & footer bawaan browser (URL, Tanggal, Hal) */
  }
  @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; background: #fff !important; }
      .no-print { display: none !important; }
      /* Matikan padding .page saat print karena sudah dihandle oleh Master Table */
      .page { padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
      .page-break { page-break-after: always; }
      tr, .p1-box, .scope-box { page-break-inside: avoid; }
  }
  * { box-sizing: border-box; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; color: #222; background: #e5e7eb; padding: 0; margin: 0; }
  
  /* Untuk tampilan di layar (sebelum di-print) */
  .screen-container { width: 210mm; margin: 20px auto; background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
  
  .p1-header, .p2-header { background: #0B101E; color: #fff; padding: 28px 32px; border-radius: 8px; margin-bottom: 24px; }
  .p1-badge, .p2-badge { background: #D4AF37; color: #0B101E; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 12px; border-radius: 4px; display: inline-block; margin-bottom: 12px; }
  .p1-title, .p2-title { font-size: 26px; font-weight: 800; text-transform: uppercase; margin: 0 0 6px; letter-spacing: 0.5px; }
  .p1-subtitle, .p2-subtitle { color: #94A3B8; font-size: 13px; margin: 0; font-weight: 600; }
  
  .p1-section-title { font-size: 16px; font-weight: 800; border-left: 4px solid #D4AF37; padding-left: 14px; margin: 28px 0 16px; color:#0B101E; }
  
  .p1-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .p1-box { background: #fafafa; border: 1px solid #eaeaea; border-radius: 8px; padding: 18px; }
  .p1-box-title { font-size: 13px; font-weight: 800; margin-bottom: 12px; color:#0B101E; text-transform:uppercase; letter-spacing:0.5px; }
  
  .contact-table { width: 100%; border-collapse: collapse; }
  .contact-table td { font-size: 11.5px; padding: 6px 4px; border-bottom: 1px dashed #e0e0e0; }
  .contact-table tr:last-child td { border-bottom: none; }
  .contact-table td:first-child { font-weight: 700; width: 35%; color:#555; }
  
  .riders-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .riders-table thead tr { background: #0B101E; color: #fff; }
  .riders-table thead td { padding: 12px 14px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .riders-table tbody tr:nth-child(even) { background-color: #fafafa; }
  
  .print-btn { text-align: center; padding: 20px; background: #0B101E; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
  .print-btn button { background: #D4AF37; color: #0B101E; padding: 12px 24px; font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; border: none; border-radius: 6px; font-size: 14px; transition: 0.2s; }
  .print-btn button:hover { background: #E5C158; transform: translateY(-1px); }
  
  /* Master Table Hack untuk memberikan margin cetak buatan tanpa mengaktifkan header browser */
  .master-table { width: 100%; border-collapse: collapse; border: none; }
  .master-table thead td { height: 18mm; border: none; padding: 0; } /* Spacer Atas (Jarak Aman) */
  .master-table tfoot td { height: 18mm; border: none; padding: 0; } /* Spacer Bawah (Jarak Aman) */
  .master-content-td { border: none; padding: 0 20mm; } /* Padding Kiri Kanan */
</style>
</head>
<body>
<div class="print-btn no-print"><button onclick="window.print()">🖨️ Cetak / Simpan PDF Sekarang</button></div>

<div class="screen-container">
<table class="master-table">
    <thead><tr><td></td></tr></thead>
    <tbody><tr><td class="master-content-td">
    
        <!-- PAGE 1 CONTENT -->
        <div class="page">
            
            <div class="p1-header" style="display:flex; justify-content:space-between; align-items:center;">
                <div style="flex:1;">
                    <div class="p1-badge">Official Media Kit</div>
                    <h1 class="p1-title">${esc(pk.stageName)}</h1>
                    <p class="p1-subtitle">Professional Master of Ceremony</p>
                </div>
                ${window.cmsConfig && window.cmsConfig.bio && window.cmsConfig.bio.photo ? 
                    `<div style="margin-left: 20px;"><img src="${window.cmsConfig.bio.photo}" style="width:120px; height:120px; border-radius:50%; object-fit:cover; border: 3px solid #D4AF37;"></div>` 
                : ''}
                ${window.cmsConfig && window.cmsConfig.bio && window.cmsConfig.bio.webConfig && window.cmsConfig.bio.webConfig.logo_url ? 
                    `<div style="margin-left: 20px;"><img src="${window.cmsConfig.bio.webConfig.logo_url}" style="max-height:80px; max-width:120px; object-fit:contain;"></div>` 
                : ''}
            </div>
            <div class="p1-section-title">Bagian 1: Press Kit & Profil Lengkap</div>
            <div class="p1-two-col">
                <div class="p1-box">
                    <div class="p1-box-title">Persona & Identitas</div>
                    <div style="font-size:11.5px; color:#333;"><strong>Spesialisasi:</strong> <span style="color:#666;">${esc(pk.spesialisasi)}</span></div>
                    <div style="font-size:11.5px; margin-top:8px; color:#333;"><strong>Tagline:</strong> <span style="color:#666; font-style:italic;">"${esc(pk.tagline)}"</span></div>
                    <div style="font-size:11.5px; margin-top:12px; color:#555; line-height:1.6;">${esc(pk.bio)}</div>
                </div>
                <div class="p1-box">
                    <div class="p1-box-title">Informasi Kontak & Booking</div>
                    <table class="contact-table">
                        <tr><td>Nama PIC</td><td>${esc(pk.pic)}</td></tr>
                        <tr><td>WhatsApp</td><td>${esc(pk.wa)}</td></tr>
                        <tr><td>Email</td><td>${esc(pk.email)}</td></tr>
                        <tr><td>Media Sosial</td><td>${esc(pk.sosmed)}</td></tr>
                        <tr><td>Domisili Base</td><td>${esc(pk.domisili)}</td></tr>
                    </table>
                </div>
            </div>
            
            <div class="p1-section-title">Cakupan Layanan Profesional</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                ${scopeSection('1', '#D4AF37', 'Corporate & Formal Protocol', pk.scope1)}
                ${scopeSection('2', '#D4AF37', 'Wedding & Family Celebration', pk.scope2)}
                ${scopeSection('3', '#0B101E', 'Entertainment & Public Gathering', pk.scope3)}
                ${scopeSection('4', '#0B101E', 'Other Formats & Khusus', pk.scope4)}
            </div>
            
            ${pk.footerNote ? `<div style="font-size:10px; margin-top:30px; text-align:center; color:#888; border-top:1px solid #eaeaea; padding-top:15px;"><strong>Catatan Penting:</strong> ${esc(pk.footerNote)}</div>` : ''}
        </div>
        
        <!-- FORCE PAGE BREAK -->
        <div class="page-break" style="height:0;"></div>
        
        <!-- PAGE 2 CONTENT -->
        <div class="page">
            <div class="p2-header" style="margin-top: 10px;">
                <div class="p1-badge" style="background:#fff; color:#0B101E;">Hospitality & Technical Requirements</div>
                <h2 class="p2-title">Event Riders Specification</h2>
            </div>
            <div class="p1-section-title" style="margin-top:0;">Bagian 2: Kebutuhan Rider (Wajib)</div>
            <p style="font-size:11.5px; color:#555; margin-bottom:16px;">Sebagai standar kenyamanan dan kelancaran performa, mohon perhatikan dan penuhi kebutuhan rider teknis & non-teknis berikut:</p>
            
            <table class="riders-table">
                <thead><tr><td style="width:28%;">Kategori Rider</td><td>Rincian & Ketentuan</td></tr></thead>
                <tbody>${ridersRowsHtml}</tbody>
            </table>
            
            ${riderFooter ? `<div style="font-size:10px; margin-top:30px; text-align:center; color:#888; border-top:1px solid #eaeaea; padding-top:15px;"><strong>Catatan Tambahan:</strong> ${esc(riderFooter)}</div>` : ''}
        </div>

    </td></tr></tbody>
    <tfoot><tr><td></td></tr></tfoot>
</table>
</div>
<script>
    window.onload = function() {
        setTimeout(() => window.print(), 500);
    };
<\/script>
</body></html>`;
    
    const popupFeatures = 'width=900,height=800,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes';
    const win = window.open('', 'ExportPDF', popupFeatures);
    
    if (!win) {
        if (typeof showToast === 'function') showToast('Pop-up diblokir browser. Harap izinkan pop-up.', 'red');
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
}

window.exportPressKitPDF = exportPressKitPDF;


// ==========================================
// PENGATURAN WEB & INTEGRASI FINANSIAL
// ==========================================

// --- Pembayaran & QRIS ---
window.addBankAccount = function(bankName = '', accNumber = '', accName = '') {
    const container = document.getElementById('bankAccountsContainer');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'bank-account-item';
    div.style.display = 'flex';
    div.style.gap = '1rem';
    div.style.flexWrap = 'wrap';
    div.style.alignItems = 'flex-end';
    div.style.padding = '1rem';
    div.style.background = 'rgba(255,255,255,0.02)';
    div.style.border = '1px solid rgba(255,255,255,0.1)';
    div.style.borderRadius = 'var(--adm-radius-sm)';
    
    // Pastikan nomor rekening awal hanya angka
    const cleanNumber = String(accNumber || '').replace(/[^0-9]/g, '');

    div.innerHTML = `
        <div style="flex:1; min-width:150px;">
            <label style="display:block; margin-bottom:0.5rem; font-size:0.8rem; color:var(--text-secondary);">Nama Bank</label>
            <input type="text" class="form-input bank-name" placeholder="BCA / Mandiri" value="${bankName}">
        </div>
        <div style="flex:1; min-width:200px;">
            <label style="display:block; margin-bottom:0.5rem; font-size:0.8rem; color:var(--text-secondary);">Nomor Rekening (Angka Saja)</label>
            <input type="text" inputmode="numeric" pattern="[0-9]*" class="form-input bank-number" placeholder="1234567890" value="${cleanNumber}" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
        </div>
        <div style="flex:1; min-width:200px;">
            <label style="display:block; margin-bottom:0.5rem; font-size:0.8rem; color:var(--text-secondary);">Atas Nama</label>
            <input type="text" class="form-input bank-owner" placeholder="Nama Pemilik" value="${accName}">
        </div>
        <div>
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()" style="padding:0.4rem 0.8rem;">Hapus</button>
        </div>
    `;
    container.appendChild(div);
};

window.handleQrisPhotoUpload = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('previewQrisImg');
            const hiddenUrl = document.getElementById('paymentQrisUrl');
            const btnRemove = document.getElementById('btnRemoveQris');
            if (preview) preview.src = e.target.result;
            if (hiddenUrl) hiddenUrl.value = e.target.result; 
            if (btnRemove) btnRemove.style.display = 'inline-flex';
        };
        reader.readAsDataURL(file);
    }
};

window.removeQrisImage = function() {
    const preview = document.getElementById('previewQrisImg');
    const hiddenUrl = document.getElementById('paymentQrisUrl');
    const fileInput = document.getElementById('paymentQrisFile');
    const btnRemove = document.getElementById('btnRemoveQris');
    if (hiddenUrl) hiddenUrl.value = '';
    if (fileInput) fileInput.value = '';
    if (preview) {
        preview.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22bold%22%20fill%3D%22%2364748b%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EQRIS%20Preview%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
    if (btnRemove) btnRemove.style.display = 'none';
};

window.savePaymentSettings = async function() {
    const container = document.getElementById('bankAccountsContainer');
    const items = container ? container.querySelectorAll('.bank-account-item') : [];
    let hasInvalidNumber = false;
    const accounts = Array.from(items).map(item => {
        const rawNum = item.querySelector('.bank-number')?.value || '';
        const cleanNum = rawNum.replace(/[^0-9]/g, '').trim();
        if (rawNum.trim() !== '' && cleanNum === '') {
            hasInvalidNumber = true;
        }
        return {
            bank: item.querySelector('.bank-name')?.value.trim() || '',
            number: cleanNum,
            name: item.querySelector('.bank-owner')?.value.trim() || ''
        };
    }).filter(acc => acc.bank && acc.number);
    
    if (hasInvalidNumber) {
        if (typeof window.uiAlert === 'function') {
            window.uiAlert('Nomor rekening hanya boleh berisi angka (digit 0-9). Silakan periksa kembali nomor rekening Anda.', 'Peringatan');
        } else {
            alert('Nomor rekening hanya boleh berisi angka.');
        }
        return;
    }

    const qrisUrl = document.getElementById('paymentQrisUrl')?.value || '';
    const logoUrl = document.getElementById('ws_logo_url')?.value || ''; // gabung dengan web logo
    
    const data = { accounts, qrisUrl, logoUrl };
    try {
        const res = await fetch('/api/cms/payment-settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': window.CSRF_TOKEN || ''
            },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            try {
                const resJson = await res.json();
                if (resJson && resJson.qrisUrl) {
                    const qUrl = document.getElementById('paymentQrisUrl');
                    const qImg = document.getElementById('previewQrisImg');
                    const btnRemove = document.getElementById('btnRemoveQris');
                    if (qUrl) qUrl.value = resJson.qrisUrl;
                    if (qImg) qImg.src = resJson.qrisUrl;
                    if (btnRemove) btnRemove.style.display = 'inline-flex';
                }
            } catch(e) {}
            if (typeof window.uiAlert === 'function') window.uiAlert('Pengaturan Pembayaran & QRIS berhasil disimpan ke Server!', 'Sukses');
            else alert('Pengaturan Pembayaran & QRIS berhasil disimpan ke Server!');
        } else {
            if (typeof window.uiAlert === 'function') window.uiAlert('Gagal menyimpan ke server: ' + res.statusText, 'Gagal');
            else alert('Gagal menyimpan ke server: ' + res.statusText);
        }
    } catch(e) {
        if (typeof window.uiAlert === 'function') window.uiAlert('Gagal menyambung ke server. Pastikan server aktif.', 'Notifikasi');
        else alert('Gagal menyambung ke server. Pastikan server aktif.');
    }
};

// --- Kategori Acara ---
window.addCategoryInput = function(val = '', icon = '✨') {
    const list = document.getElementById('cmsCategoriesList');
    if (!list) return;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.innerHTML = `
        <input type="text" class="form-input" style="flex:1;" placeholder="Nama Kategori (misal: Wedding)" value="${val}">
        <select class="form-select" style="width:80px; padding:0.4rem;" title="Pilih Icon">${['✨','⭐','🎉','🥂','🎙️','💍','💼','🎓','🎵','🏆','🔥','👑','💎'].map(e => `<option value="${e}" ${e === icon ? 'selected' : ''}>${e}</option>`).join('')}</select>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Hapus</button>
    `;
    list.appendChild(div);
};

window.handleSaveEventCategories = async function() {
    const list = document.getElementById('cmsCategoriesList');
    if (!list) return;
    const items = list.querySelectorAll('div');
    const categories = Array.from(items).map(div => {
        const name = div.querySelector('input[type="text"]')?.value.trim();
        const icon = div.querySelector('select')?.value || '✨';
        return { name, icon };
    }).filter(c => c.name);
    
    try {
        const res = await fetch('/api/cms/event-categories', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ categories })
        });
        if (res.ok) { if (typeof window.uiAlert === 'function') window.uiAlert('Kategori acara berhasil disimpan ke Server!', 'Sukses'); else { if (typeof window.uiAlert === 'function') window.uiAlert('Kategori acara berhasil disimpan ke Server!', 'Gagal'); else alert('Kategori acara berhasil disimpan ke Server!'); } }
        else { if (typeof window.uiAlert === 'function') window.uiAlert('Gagal menyimpan ke server.', 'Gagal'); else alert('Gagal menyimpan ke server.'); }
    } catch (e) {
        if (typeof window.uiAlert === 'function') window.uiAlert('Koneksi server gagal.', 'Notifikasi'); else alert('Koneksi server gagal.');
    }
};

// --- Kategori Arus Kas ---
window.addCashflowIncomeCategoryInput = function(val = '', warna = '#10B981') {
    const list = document.getElementById('cmsIncomeCategoriesList');
    if (!list) return;
    const div = document.createElement('div');
    div.className = 'cashflow-category-row';
    div.style.display = 'flex';
    div.style.gap = '0.5rem';
    div.style.alignItems = 'center';
    div.style.background = 'rgba(255,255,255,0.02)';
    div.style.padding = '0.5rem';
    div.style.border = '1px solid rgba(255,255,255,0.05)';
    div.style.borderRadius = '8px';
    div.style.transition = 'all 0.2s ease';
    
    // Add hover effect via mouse events
    div.onmouseenter = () => { div.style.background = 'rgba(255,255,255,0.04)'; div.style.borderColor = 'rgba(16,185,129,0.3)'; };
    div.onmouseleave = () => { div.style.background = 'rgba(255,255,255,0.02)'; div.style.borderColor = 'rgba(255,255,255,0.05)'; };

    div.innerHTML = `
        <input type="text" class="form-input name-input" style="flex:1; border:none; background:transparent; font-weight:600; font-size:0.9rem;" placeholder="Nama Kategori" value="${val}">
        <div style="width:36px; height:36px; border-radius:6px; overflow:hidden; border:2px solid rgba(255,255,255,0.1); flex-shrink:0; position:relative;">
            <input type="color" class="form-input color-input" style="position:absolute; top:-10px; left:-10px; width:60px; height:60px; cursor:pointer; padding:0; border:none;" value="${warna}">
        </div>
        <button type="button" class="btn btn-secondary btn-sm" style="color:#EF4444; border-color:transparent; background:transparent; padding:0.4rem; flex-shrink:0;" onclick="this.parentElement.remove()" title="Hapus">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
    `;
    list.appendChild(div);
};

window.handleSaveIncomeCategories = async function() {
    await saveCashflowCategoriesBulk();
};

window.addCashflowExpenseCategoryInput = function(val = '', warna = '#EF4444') {
    const list = document.getElementById('cmsExpenseCategoriesList');
    if (!list) return;
    const div = document.createElement('div');
    div.className = 'cashflow-category-row';
    div.style.display = 'flex';
    div.style.gap = '0.5rem';
    div.style.alignItems = 'center';
    div.style.background = 'rgba(255,255,255,0.02)';
    div.style.padding = '0.5rem';
    div.style.border = '1px solid rgba(255,255,255,0.05)';
    div.style.borderRadius = '8px';
    div.style.transition = 'all 0.2s ease';
    
    div.onmouseenter = () => { div.style.background = 'rgba(255,255,255,0.04)'; div.style.borderColor = 'rgba(239,68,68,0.3)'; };
    div.onmouseleave = () => { div.style.background = 'rgba(255,255,255,0.02)'; div.style.borderColor = 'rgba(255,255,255,0.05)'; };

    div.innerHTML = `
        <input type="text" class="form-input name-input" style="flex:1; border:none; background:transparent; font-weight:600; font-size:0.9rem;" placeholder="Nama Kategori" value="${val}">
        <div style="width:36px; height:36px; border-radius:6px; overflow:hidden; border:2px solid rgba(255,255,255,0.1); flex-shrink:0; position:relative;">
            <input type="color" class="form-input color-input" style="position:absolute; top:-10px; left:-10px; width:60px; height:60px; cursor:pointer; padding:0; border:none;" value="${warna}">
        </div>
        <button type="button" class="btn btn-secondary btn-sm" style="color:#EF4444; border-color:transparent; background:transparent; padding:0.4rem; flex-shrink:0;" onclick="this.parentElement.remove()" title="Hapus">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
    `;
    list.appendChild(div);
};

window.handleSaveExpenseCategories = async function() {
    await saveCashflowCategoriesBulk();
};

async function saveCashflowCategoriesBulk() {
    const categories = [];
    const inContainer = document.getElementById('cmsIncomeCategoriesList');
    if (inContainer) {
        const inRows = inContainer.querySelectorAll('.cashflow-category-row, :scope > div');
        inRows.forEach(div => {
            const nameEl = div.querySelector('.name-input');
            const colorEl = div.querySelector('.color-input');
            if (nameEl && colorEl) {
                const name = nameEl.value.trim();
                const warna = colorEl.value || '#10B981';
                if (name) categories.push({ nama: name, tipe: 'in', warna });
            }
        });
    }
    const outContainer = document.getElementById('cmsExpenseCategoriesList');
    if (outContainer) {
        const outRows = outContainer.querySelectorAll('.cashflow-category-row, :scope > div');
        outRows.forEach(div => {
            const nameEl = div.querySelector('.name-input');
            const colorEl = div.querySelector('.color-input');
            if (nameEl && colorEl) {
                const name = nameEl.value.trim();
                const warna = colorEl.value || '#EF4444';
                if (name) categories.push({ nama: name, tipe: 'out', warna });
            }
        });
    }
    
    try {
        const res = await fetch('/api/cms/cashflow-categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': window.CSRF_TOKEN || ''
            },
            body: JSON.stringify({ categories })
        });
        if (res.ok) {
            window.cmsCashflowCategories = categories;
            if (typeof window.uiAlert === 'function') window.uiAlert('Kategori arus kas berhasil disimpan ke Server!', 'Sukses');
            else alert('Kategori arus kas berhasil disimpan ke Server!');
        } else {
            if (typeof window.uiAlert === 'function') window.uiAlert('Gagal menyimpan kategori ke server.', 'Gagal');
            else alert('Gagal menyimpan kategori ke server.');
        }
    } catch (e) {
        if (typeof window.uiAlert === 'function') window.uiAlert('Koneksi server terputus.', 'Notifikasi');
        else alert('Koneksi server terputus.');
    }
}

// --- Kategori Klien ---
window.addClientCategoryInput = function(val = '', icon = '⭐') {
    const list = document.getElementById('cmsClientCategoriesList');
    if (!list) return;
    const div = document.createElement('div');
    div.className = 'client-category-row';
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.innerHTML = `
        <input type="text" class="form-input" style="flex:1;" placeholder="VIP / Reguler" value="${val}">
        <select class="form-select" style="width:80px; padding:0.4rem;" title="Pilih Icon">${['✨','⭐','🎉','🥂','🎙️','💍','💼','🎓','🎵','🏆','🔥','👑','💎'].map(e => `<option value="${e}" ${e === icon ? 'selected' : ''}>${e}</option>`).join('')}</select>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Hapus</button>
    `;
    list.appendChild(div);
};

window.handleSaveClientCategories = async function() {
    const list = document.getElementById('cmsClientCategoriesList');
    if (!list) return;
    const items = list.querySelectorAll('.client-category-row, :scope > div');
    const categories = Array.from(items).map(div => {
        const input = div.querySelector('input');
        const select = div.querySelector('select');
        return {
            name: input ? input.value.trim() : '',
            icon: select ? select.value.trim() : '⭐'
        };
    }).filter(c => c.name);
    
    try {
        const res = await fetch('/api/cms/client-categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': window.CSRF_TOKEN || ''
            },
            body: JSON.stringify({ categories })
        });
        if (res.ok) {
            window.currentClientCategories = categories;
            if (window.cmsConfig) window.cmsConfig.client_categories = categories;
            const clientCatEl = document.getElementById('newCustClientCategory');
            if (clientCatEl) {
                const curVal = clientCatEl.value;
                clientCatEl.innerHTML = '<option value="" disabled selected>-- Pilih Kategori Klien --</option>';
                categories.forEach(cat => {
                    const catName = typeof cat === 'object' ? cat.name : cat;
                    const catIcon = typeof cat === 'object' ? cat.icon + ' ' : '';
                    clientCatEl.innerHTML += `<option value="${catName}">${catIcon}${catName}</option>`;
                });
                if (curVal) clientCatEl.value = curVal;
            }
            if (typeof window.renderCategoryFilters === 'function') window.renderCategoryFilters();
            if (typeof window.renderCustomersTable === 'function') window.renderCustomersTable();
            if (typeof window.updateCustomerMetrics === 'function') window.updateCustomerMetrics();
            if (typeof window.uiAlert === 'function') window.uiAlert('Kategori klien berhasil disimpan ke Server!', 'Sukses');
            else alert('Kategori klien berhasil disimpan ke Server!');
        } else {
            if (typeof window.uiAlert === 'function') window.uiAlert('Server gagal memproses.', 'Gagal');
            else alert('Server gagal memproses.');
        }
    } catch (e) {
        if (typeof window.uiAlert === 'function') window.uiAlert('Tidak ada koneksi ke server.', 'Notifikasi');
        else alert('Tidak ada koneksi ke server.');
    }
};

// --- Template WAA ---
window.addWaTemplateInput = function(title = '', msg = '') {
    const list = document.getElementById('cmsWaTemplatesList');
    if (!list) return;
    const div = document.createElement('div');
    div.className = 'wa-tpl-item';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.gap = '10px';
    div.style.padding = '10px';
    div.style.border = '1px solid rgba(255,255,255,0.1)';
    div.style.borderRadius = 'var(--adm-radius-sm)';
    div.style.background = 'rgba(255,255,255,0.02)';
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap: 10px;">
            <input type="text" class="form-input tpl-title" style="flex:1;" placeholder="Judul Template" value="${title}">
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">Hapus</button>
        </div>
        <textarea class="form-textarea tpl-msg" rows="3" placeholder="Halo {name}, terkait acara {event} Anda...">${msg}</textarea>
    `;
    list.appendChild(div);
};

window.handleSaveWaTemplates = async function() {
    const list = document.getElementById('cmsWaTemplatesList');
    if (!list) return;
    const items = list.querySelectorAll('.wa-tpl-item');
    const templates = Array.from(items).map(div => {
        return {
            title: div.querySelector('.tpl-title').value.trim(),
            message: div.querySelector('.tpl-msg').value.trim()
        };
    }).filter(t => t.title && t.message);
    
    try {
        const res = await fetch('/api/cms/wa-templates', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ templates })
        });
        if (res.ok) { if (typeof window.uiAlert === 'function') window.uiAlert('Template WA berhasil disimpan ke Server!', 'Sukses'); else { if (typeof window.uiAlert === 'function') window.uiAlert('Template WA berhasil disimpan ke Server!', 'Gagal'); else alert('Template WA berhasil disimpan ke Server!'); } }
        else { if (typeof window.uiAlert === 'function') window.uiAlert('Gagal menyimpan ke server.', 'Gagal'); else alert('Gagal menyimpan ke server.'); }
    } catch (e) {
        if (typeof window.uiAlert === 'function') window.uiAlert('Koneksi terputus.', 'Notifikasi'); else alert('Koneksi terputus.');
    }
};

// --- Logo Web & Invoice ---
window.handleWebLogoUpload = function(event) {
    const file = event.target.files[0];
    if (file) {
        // Cek ukuran max 500KB agar database tidak berat
        if (file.size > 500 * 1024) {
            if (typeof window.uiAlert === 'function') window.uiAlert('Ukuran file logo terlalu besar. Maksimal 500KB untuk logo.', 'Notifikasi'); else alert('Ukuran file logo terlalu besar. Maksimal 500KB untuk logo.');
            event.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('previewLogoImg');
            if(img) img.src = e.target.result;
            const input = document.getElementById('ws_logo_url');
            if(input) input.value = e.target.result; 
        }
        reader.readAsDataURL(file);
    }
};

window.saveWebSettings = async function() {
    // Karena savePaymentSettings memanggil api /api/cms/payment-settings yang menyimpan config utuh,
    // Kita jalankan savePaymentSettings untuk gabung Logo URL
    window.savePaymentSettings();
};

// ==========================================
// LOAD DATA FROM SERVER ONLY (NO LOCAL STORAGE)
// ==========================================
window.loadCmsWebSettings = async function(force = false) {
    if (!force && window._webSettingsLoaded) return;
    // Bersihkan local storage yang lama agar tidak nyangkut
    localStorage.removeItem('cms_event_categories');
    localStorage.removeItem('cms_client_categories');
    localStorage.removeItem('cms_wa_templates');
    localStorage.removeItem('cms_income_categories');
    localStorage.removeItem('cms_expense_categories');
    localStorage.removeItem('cms_payment_settings');
    localStorage.removeItem('cms_web_settings');

    try {
        // 1. Load Event Categories
        const evList = document.getElementById('cmsCategoriesList');
        if (evList) {
            evList.innerHTML = '';
            const res = await fetch('/api/cms/event-categories');
            if (res.ok) {
                const json = await res.json();
                const cats = json.data || [];
                cats.forEach(c => {
                    if (typeof c === 'string') window.addCategoryInput(c);
                    else window.addCategoryInput(c.name, c.icon);
                });
            }
        }

        // 2. Load Client Categories
        const clList = document.getElementById('cmsClientCategoriesList');
        if (clList) {
            clList.innerHTML = '';
            const res = await fetch('/api/cms/client-categories');
            if (res.ok) {
                const json = await res.json();
                const cats = json.data || [];
                cats.forEach(c => {
                    if (typeof c === 'string') window.addClientCategoryInput(c);
                    else window.addClientCategoryInput(c.name, c.icon);
                });
            }
        }

        // 3. Load WA Templates
        const waList = document.getElementById('cmsWaTemplatesList');
        if (waList) {
            waList.innerHTML = '';
            const res = await fetch('/api/cms/wa-templates');
            if (res.ok) {
                const json = await res.json();
                const tpls = json.data || [];
                tpls.forEach(t => {
                    if (typeof t === 'string') window.addWaTemplateInput('Sapaan', t);
                    else window.addWaTemplateInput(t.title, t.message);
                });
            }
        }

        // 4. Load Cashflow Categories
        const incList = document.getElementById('cmsIncomeCategoriesList');
        const expList = document.getElementById('cmsExpenseCategoriesList');
        if (incList) incList.innerHTML = '';
        if (expList) expList.innerHTML = '';
        
        const resCf = await fetch('/api/cms/cashflow-categories');
        if (resCf.ok) {
            const json = await resCf.json();
            const cats = json.data || [];
            cats.forEach(c => {
                if (c.tipe === 'in' || c.tipe === 'income') window.addCashflowIncomeCategoryInput(c.nama, c.warna);
                else window.addCashflowExpenseCategoryInput(c.nama, c.warna);
            });
        }

        // 5. Load Payment Settings & Web Logo
        const payList = document.getElementById('bankAccountsContainer');
        if (payList) payList.innerHTML = '';
        
        const resPay = await fetch('/api/cms/payment-settings');
        if (resPay.ok) {
            const json = await resPay.json();
            const paySet = json.data || {};
            window.mcGlobalPaymentSettings = paySet;
            
            if (paySet.accounts && paySet.accounts.length) {
                paySet.accounts.forEach(a => window.addBankAccount(a.bank, a.number, a.name));
            } else {
                window.addBankAccount(); // default
            }
            
            if (paySet.qrisUrl) {
                const qUrl = document.getElementById('paymentQrisUrl');
                const qImg = document.getElementById('previewQrisImg');
                const btnRemove = document.getElementById('btnRemoveQris');
                if (qUrl) qUrl.value = paySet.qrisUrl;
                if (qImg) qImg.src = paySet.qrisUrl;
                if (btnRemove) btnRemove.style.display = 'inline-flex';
            }
            
            if (paySet.logoUrl) {
                const wl = document.getElementById('ws_logo_url');
                const wlImg = document.getElementById('previewLogoImg');
                if (wl) wl.value = paySet.logoUrl;
                if (wlImg) wlImg.src = paySet.logoUrl;
            }
        }

        window._webSettingsLoaded = true;
    } catch (e) {
        console.error('Error fetching settings data from server:', e);
        if (typeof window.uiAlert === 'function') window.uiAlert('Gagal memuat beberapa data pengaturan dari server.', 'Notifikasi'); else alert('Gagal memuat beberapa data pengaturan dari server.');
    }
};

// Web settings now loaded on demand when opening Pengaturan Web (sec-web-settings)
