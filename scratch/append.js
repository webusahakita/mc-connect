function openRiderModal(id = null) {
    const riders = getRidersData();
    const titleEl = document.getElementById('riderModalTitle');
    const deleteBtn = document.getElementById('btnDeleteRider');
    const titleInput = document.getElementById('riderTitle');
    const notesInput = document.getElementById('riderNotes');
    const idInput = document.getElementById('riderId');
    
    document.getElementById('riderForm')?.reset();
    idInput.value = id || '';

    if (id) {
        if (titleEl) titleEl.textContent = '✏️ Edit Event Rider';
        if (deleteBtn) deleteBtn.style.display = 'block';
        const r = riders.find(x => x.id === id);
        if (r) {
            if (titleInput) titleInput.value = r.title;
            if (notesInput) notesInput.value = r.notes;
        }
    } else {
        if (titleEl) titleEl.textContent = '📝 Tambah Event Rider';
        if (deleteBtn) deleteBtn.style.display = 'none';
    }
    const modal = document.getElementById('addRiderModal');
    if (modal) modal.classList.add('active');
}
window.openRiderModal = openRiderModal;

function saveRider() {
    const id = document.getElementById('riderId')?.value;
    const title = document.getElementById('riderTitle')?.value?.trim();
    const notes = document.getElementById('riderNotes')?.value?.trim();
    if (!title) return;

    let riders = getRidersData();
    if (id) {
        const idx = riders.findIndex(x => x.id === id);
        if (idx !== -1) riders[idx] = { id, title, notes };
    } else {
        riders.push({ id: 'rv_' + Date.now(), title, notes });
    }
    saveRidersData(riders);
    if (typeof showToast === 'function') showToast('Rider berhasil disimpan!', 'gold');
    if (typeof closeModals === 'function') closeModals();
    renderRiders();
}
window.saveRider = saveRider;

async function deleteRider() {
    const id = document.getElementById('riderId')?.value;
    if (!id) return;
    if (!await uiConfirm('Hapus rider ini secara permanen?')) return;
    let riders = getRidersData();
    riders = riders.filter(x => x.id !== id);
    saveRidersData(riders);
    if (typeof showToast === 'function') showToast('Rider dihapus!', 'red');
    if (typeof closeModals === 'function') closeModals();
    renderRiders();
}
window.deleteRider = deleteRider;

// PDF EXPORT
function exportPressKitPDF() {
    if (typeof showToast === 'function') showToast('Menyiapkan PDF...', 'gold');
    
    const pk = getPressKitData();
    const riders = getRidersData();
    
    if (!pk.stageName) {
        if (typeof showToast === 'function') showToast("Data Press Kit belum dimuat atau kosong.", 'red');
        return;
    }

    const esc = (s) => !s ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const riderFooter = localStorage.getItem('mc_riders_footer') || pk.ridersFooter || 'Rider ini bersifat fleksibel dan dapat didiskusikan.';

    const ridersRowsHtml = riders.map(r => {
        const lines = (r.notes || '').split('\n').map(l => l.trim()).filter(l => l);
        const bulletHtml = lines.map(l => {
            const cleaned = l.replace(/^[•\-]\s*/, '');
            return `<div style="margin-bottom:6px; padding-left:14px; text-indent:-14px; position:relative;">
                <span style="position:absolute; left:0; color:#D4AF37;">•</span> ${esc(cleaned)}
            </div>`;
        }).join('');
        return `<tr>
            <td style="font-weight:700; vertical-align:top; font-size:12px; padding:12px 14px; border:1px solid #eaeaea; width:28%; color:#1a1a2e;">${esc(r.title)}</td>
            <td style="font-size:11.5px; vertical-align:top; padding:12px 14px; border:1px solid #eaeaea; line-height:1.6; color:#444;">${bulletHtml}</td>
        </tr>`;
    }).join('');

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
      margin: 0;
  }
  @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; background: #fff !important; }
      .no-print { display: none !important; }
      .page { padding: 20mm !important; margin: 0 !important; box-shadow: none !important; page-break-after: always; }
      .page:last-child { page-break-after: auto; }
      tr, .p1-box, .scope-box { page-break-inside: avoid; }
  }
  * { box-sizing: border-box; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; color: #222; background: #e5e7eb; padding: 0; margin: 0; }
  
  .page { 
      width: 210mm; 
      min-height: 297mm; 
      padding: 20mm; 
      margin: 20px auto; 
      background: #fff; 
      box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
      position: relative; 
  }
  
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
</style>
</head>
<body>
<div class="print-btn no-print"><button onclick="window.print()">🖨 Cetak / Simpan PDF Sekarang</button></div>
<div class="page">
    <div class="p1-header">
        <div class="p1-badge">Official Media Kit</div>
        <h1 class="p1-title">${esc(pk.stageName)}</h1>
        <p class="p1-subtitle">Professional Master of Ceremony</p>
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

<div class="page">
    <div class="p2-header">
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
<script>
    window.onload = function() {
        setTimeout(() => window.print(), 500);
    };
</script>
</body></html>`;

    const popupFeatures = 'width=900,height=800,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes';
    const win = window.open('', 'ExportPDF', popupFeatures);
    
    if (!win) {
        if (typeof showToast === 'function') showToast('Pop-up diblokir browser. Harap izinkan pop-up (Allow Pop-ups).', 'red');
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
}
window.exportPressKitPDF = exportPressKitPDF;
window.generateAndDownloadPressKit = exportPressKitPDF; // backward compat

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loadPressKitFormData();
        renderRiders();
        const footerEl = document.getElementById('riders_footerNote');
        if (footerEl) { const s = localStorage.getItem(RIDERS_FOOTER_KEY); if (s) footerEl.value = s; }
    }, 500);
});

// --- GALLERY MULTIPLE UPLOAD CRUD ---
function getAdminGalleryData() {
    const data = localStorage.getItem('mc_gallery_config');
    if (data) {
        try { return JSON.parse(data); } catch(e) {}
    }
    const dummy = [
        { id: 'g1', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80', caption: 'Wedding Reception - Grand Hyatt' },
        { id: 'g2', url: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=600&q=80', caption: 'Corporate Gala - Ritz Carlton' }
    ];
    saveAdminGalleryData(dummy);
    return dummy;
}

function saveAdminGalleryData(data) {
    localStorage.setItem('mc_gallery_config', JSON.stringify(data));
}

function renderAdminGallery() {
    const container = document.getElementById('cmsGalleryItemsList');
    if (!container) return;

    const items = getAdminGalleryData();
    if (items.length === 0) {
        container.innerHTML = \`<div style="grid-column: 1 / -1; text-align:center; padding:2rem; color:var(--text-muted);">Belum ada foto galeri. Silakan klik + Upload Banyak Foto.</div>\`;
        return;
    }

    container.innerHTML = items.map(item => \`
        <div class="ecc-card" style="padding:0; overflow:hidden; border:1px solid var(--adm-border); position:relative;">
            <div style="height:150px; overflow:hidden; background:#000;">
                <img src="\${item.url}" alt="Gallery" style="width:100%; height:100%; object-fit:cover; opacity:0.9;">
            </div>
            <div style="padding:0.75rem;">
                <input type="text" class="form-input" style="font-size:0.8rem; padding:0.4rem; margin-bottom:0.5rem;" value="\${escapeHtml(item.caption || '')}" onchange="updateGalleryCaption('\${item.id}', this.value)" placeholder="Keterangan foto...">
                <button type="button" class="btn btn-danger btn-sm" style="width:100%; font-size:0.75rem; padding:0.3rem;" onclick="deleteGalleryItem('\${item.id}')">Hapus</button>
            </div>
        </div>
    \`).join('');

    const countLabel = document.getElementById('galleryCountLabel');
    if (countLabel) countLabel.textContent = \`\${items.length} foto tersimpan\`;
}

function updateGalleryCaption(id, newCaption) {
    let items = getAdminGalleryData();
    const idx = items.findIndex(x => x.id === id);
    if (idx !== -1) {
        items[idx].caption = newCaption;
        saveAdminGalleryData(items);
        if (typeof showToast !== 'undefined') showToast('Keterangan foto disimpan.', 'gold');
    }
}
window.updateGalleryCaption = updateGalleryCaption;

async function deleteGalleryItem(id) {
    if (!await uiConfirm('Hapus foto ini dari galeri publik?')) return;
    let items = getAdminGalleryData();
    items = items.filter(x => x.id !== id);
    saveAdminGalleryData(items);
    renderAdminGallery();
    if (typeof showToast !== 'undefined') showToast('Foto dihapus!', 'red');
}
window.deleteGalleryItem = deleteGalleryItem;

function handleMultipleGalleryUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (typeof showToast !== 'undefined') showToast(\`Mengunggah \${files.length} foto ke server...\`, 'gold');

    const formData = new FormData();
    Array.from(files).forEach((file, index) => {
        formData.append('files[]', file);
    });

    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    
    fetch('/api/cms/gallery/upload', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': token,
            'Accept': 'application/json'
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            let items = getAdminGalleryData();
            
            data.data.forEach(uploaded => {
                items.push({
                    id: uploaded.id,
                    url: uploaded.url,
                    caption: uploaded.caption
                });
            });
            
            saveAdminGalleryData(items);
            renderAdminGallery();
            if (typeof showToast !== 'undefined') showToast(\`\${files.length} foto berhasil diunggah dan disimpan!\`, 'green');
        } else {
            console.error('Upload failed:', data);
            if (typeof showToast !== 'undefined') showToast('Gagal mengunggah foto. Pastikan ukuran file tidak terlalu besar.', 'red');
        }
    })
    .catch(err => {
        console.error('Upload error:', err);
        if (typeof showToast !== 'undefined') showToast('Terjadi kesalahan saat mengunggah foto.', 'red');
    })
    .finally(() => {
        event.target.value = ''; // reset input
    });
}
window.handleMultipleGalleryUpload = handleMultipleGalleryUpload;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderAdminGallery, 500);
});
