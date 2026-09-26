
// === GALERI PORTOFOLIO LOGIC ===

let currentAdminGallery = [];

function getAdminGalleryData() {
    return currentAdminGallery;
}

async function handleMultipleGalleryUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files[]', files[i]);
    }

    try {
        const response = await fetch('/api/cms/gallery/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        
        if (result.success) {
            currentAdminGallery = currentAdminGallery.concat(result.data);
            renderAdminGallery();
            
            if (window.SyncEngine) {
                window.SyncEngine.push('/api/cms/gallery', { gallery: currentAdminGallery });
            }
            if (typeof showToast === 'function') showToast(result.message, 'success');
        } else {
            if (typeof showToast === 'function') showToast('Gagal upload: ' + (result.message || 'Error'), 'danger');
        }
    } catch (e) {
        console.error(e);
        if (typeof showToast === 'function') showToast('Terjadi kesalahan saat upload.', 'danger');
    }
    
    event.target.value = '';
}

function renderAdminGallery() {
    const list = document.getElementById('cmsGalleryItemsList');
    const label = document.getElementById('galleryCountLabel');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (!currentAdminGallery || currentAdminGallery.length === 0) {
        list.innerHTML = '<p style="color:var(--text-secondary); width:100%; text-align:center;">Belum ada foto galeri.</p>';
        if (label) label.innerText = '0 Foto';
        return;
    }
    
    currentAdminGallery.forEach((item, idx) => {
        const div = document.createElement('div');
        div.style.cssText = 'position:relative; border-radius:8px; overflow:hidden; border:1px solid var(--adm-border); background:var(--adm-surface-3); display:flex; flex-direction:column;';
        
        div.innerHTML = `
            <img src="${item.url}" style="width:100%; height:150px; object-fit:cover; border-bottom:1px solid var(--adm-border);">
            <div style="padding:0.5rem; flex:1; display:flex; flex-direction:column; gap:0.5rem;">
                <input type="text" class="form-control" style="font-size:0.8rem; padding:0.25rem;" value="${item.caption || ''}" placeholder="Caption (opsional)" onchange="updateGalleryCaption(${idx}, this.value)">
                <button type="button" class="btn btn-danger btn-sm" style="margin-top:auto;" onclick="removeGalleryItem(${idx})">Hapus</button>
            </div>
        `;
        list.appendChild(div);
    });
    
    if (label) label.innerText = currentAdminGallery.length + ' Foto';
}

function updateGalleryCaption(idx, value) {
    if (currentAdminGallery[idx]) {
        currentAdminGallery[idx].caption = value;
    }
}

function removeGalleryItem(idx) {
    if (confirm('Hapus foto ini?')) {
        currentAdminGallery.splice(idx, 1);
        renderAdminGallery();
    }
}

async function saveAdminGalleryData(data) {
    currentAdminGallery = data;
    try {
        const response = await fetch('/api/cms/gallery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gallery: data })
        });
        const result = await response.json();
        
        if (result.success) {
            if (window.SyncEngine) {
                window.SyncEngine.push('/api/cms/gallery', { gallery: data });
            }
        }
    } catch (e) {
        console.error(e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/cms/gallery')
        .then(res => res.json())
        .then(result => {
            if (result.success && result.data) {
                currentAdminGallery = result.data;
                renderAdminGallery();
            }
        }).catch(e => console.error("Could not load gallery:", e));
});
