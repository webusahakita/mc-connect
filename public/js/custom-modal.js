// Custom Modal Engine
// Replaces native alert, confirm, and prompt with async UI modals

function createModalDOM() {
    if (document.getElementById('customModalOverlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'customModalOverlay';
    overlay.className = 'custom-modal-overlay';
    
    overlay.innerHTML = `
        <div class="custom-modal-box">
            <div id="customModalTitle" class="custom-modal-title"></div>
            <div id="customModalMessage" class="custom-modal-message"></div>
            <input type="text" id="customModalInput" class="custom-modal-input" style="display:none;">
            <div id="customModalFormContainer" style="display:none; text-align:left; margin-bottom:1.5rem; max-height:60vh; overflow-y:auto; padding-right:5px;"></div>
            <div class="custom-modal-actions">
                <button id="customModalBtnCancel" class="custom-modal-btn secondary">Batal</button>
                <button id="customModalBtnOk" class="custom-modal-btn primary">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

function buildFormFields(formContainer, fields) {
    formContainer.innerHTML = '';
    fields.forEach(field => {
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '1rem';
        
        const label = document.createElement('label');
        label.textContent = field.label;
        label.style.display = 'block';
        label.style.marginBottom = '0.5rem';
        label.style.color = 'var(--gold-primary, #D4AF37)';
        label.style.fontSize = '0.9rem';
        
        let input;
        if (field.type === 'gallery') {
            input = document.createElement('div');
            input.style.display = 'grid';
            input.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
            input.style.gap = '10px';
            input.style.maxHeight = '40vh';
            input.style.overflowY = 'auto';
            input.style.padding = '5px';
            input.style.marginBottom = '0';
            
            const hiddenValue = document.createElement('input');
            hiddenValue.type = 'hidden';
            hiddenValue.id = 'cm_field_' + field.id;
            wrapper.appendChild(hiddenValue);
            
            let selectedItem = null;
            if (field.options && field.options.length > 0) {
                field.options.forEach(opt => {
                    if (opt.value === '') return;
                    const card = document.createElement('div');
                    card.style.border = '2px solid transparent';
                    card.style.borderRadius = '8px';
                    card.style.padding = '8px';
                    card.style.cursor = 'pointer';
                    card.style.textAlign = 'center';
                    card.style.background = 'rgba(255,255,255,0.05)';
                    card.style.transition = 'all 0.2s';
                    
                    const val = opt.value !== undefined ? opt.value : opt;
                    const lbl = opt.label !== undefined ? opt.label : opt;
                    const imgUrl = opt.imgUrl;
                    
                    let mediaHtml = '';
                    if (imgUrl) {
                        mediaHtml = `<img src="${imgUrl}" style="width:100%; height:80px; object-fit:cover; border-radius:6px; margin-bottom:5px;">`;
                    } else {
                        mediaHtml = `<div style="width:100%; height:80px; display:flex; align-items:center; justify-content:center; background:#444; border-radius:6px; font-size:2rem; margin-bottom:5px;">👔</div>`;
                    }
                    
                    card.innerHTML = `${mediaHtml}<div style="font-size:0.75rem; font-weight:600; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${lbl}">${lbl}</div>`;
                    
                    card.onclick = () => {
                        if (selectedItem) selectedItem.style.border = '2px solid transparent';
                        selectedItem = card;
                        card.style.border = '2px solid var(--gold-primary, #D4AF37)';
                        hiddenValue.value = val;
                    };
                    
                    if (field.value !== undefined && String(val) === String(field.value)) {
                        setTimeout(() => card.onclick(), 0);
                    }
                    
                    input.appendChild(card);
                });
            } else {
                input.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:1rem; color:#888;">Belum ada data gaun. Buka menu Wardrobe Tracker untuk menambah data.</div>';
            }
        } else {
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.rows = 4;
            } else if (field.type === 'select') {
                input = document.createElement('select');
                if (field.options) {
                    field.options.forEach(opt => {
                        const o = document.createElement('option');
                        o.value = opt.value !== undefined ? opt.value : opt;
                        o.textContent = opt.label !== undefined ? opt.label : opt;
                        input.appendChild(o);
                    });
                }
            } else {
                input = document.createElement('input');
                input.type = field.type || 'text';
            }
            input.id = 'cm_field_' + field.id;
            input.className = 'custom-modal-input';
            input.style.marginBottom = '0';
            input.value = field.value !== undefined ? field.value : '';
        }
        
        wrapper.appendChild(label);
        wrapper.appendChild(input);
        formContainer.appendChild(wrapper);
    });
}

function showModal({ title = 'Perhatian', message = '', type = 'alert', defaultText = '', fields = [] }) {
    return new Promise((resolve) => {
        createModalDOM();
        
        const overlay = document.getElementById('customModalOverlay');
        const titleEl = document.getElementById('customModalTitle');
        const messageEl = document.getElementById('customModalMessage');
        const inputEl = document.getElementById('customModalInput');
        const formContainer = document.getElementById('customModalFormContainer');
        const btnCancel = document.getElementById('customModalBtnCancel');
        const btnOk = document.getElementById('customModalBtnOk');
        
        // Set content
        titleEl.textContent = title;
        messageEl.innerHTML = message;
        
        // Reset visibility
        btnCancel.style.display = type === 'alert' ? 'none' : 'inline-block';
        inputEl.style.display = type === 'prompt' ? 'block' : 'none';
        formContainer.style.display = type === 'form' ? 'block' : 'none';
        messageEl.style.display = message ? 'block' : 'none';
        
        // Build form fields if needed
        if (type === 'form') {
            buildFormFields(formContainer, fields);
        }
        
        // Set prompt default value
        if (type === 'prompt') {
            inputEl.value = defaultText;
        }
        
        // Set button labels
        if (type === 'confirm') {
            btnOk.textContent = 'Ya';
            btnCancel.textContent = 'Tidak';
        } else {
            btnOk.textContent = 'OK';
            btnCancel.textContent = 'Batal';
        }
        
        const cleanup = () => {
            overlay.classList.remove('active');
            btnOk.onclick = null;
            btnCancel.onclick = null;
        };
        
        btnOk.onclick = () => {
            // IMPORTANT: Read values BEFORE cleanup/clearing anything
            let result;
            if (type === 'form') {
                result = {};
                fields.forEach(f => {
                    const el = document.getElementById('cm_field_' + f.id);
                    if (el) {
                        if (el.type === 'file') {
                            result[f.id] = el.files.length > 0 ? el.files[0] : null;
                        } else {
                            result[f.id] = el.value;
                        }
                    } else {
                        result[f.id] = '';
                    }
                });
            } else if (type === 'prompt') {
                result = inputEl.value;
            } else {
                result = true;
            }
            
            cleanup();
            resolve(result);
        };
        
        btnCancel.onclick = () => {
            cleanup();
            if (type === 'prompt') {
                resolve(null);
            } else if (type === 'form') {
                resolve(false);
            } else {
                resolve(false);
            }
        };
        
        overlay.classList.add('active');
        
        // Focus appropriate element
        if (type === 'prompt') {
            setTimeout(() => inputEl.focus(), 100);
        } else if (type === 'form') {
            setTimeout(() => {
                const firstInput = formContainer.querySelector('input, textarea');
                if (firstInput) firstInput.focus();
            }, 100);
        } else {
            setTimeout(() => btnOk.focus(), 100);
        }
    });
}

window.uiAlert = (message, title = 'Perhatian') => {
    return showModal({ type: 'alert', message, title });
};

window.uiConfirm = (message, title = 'Konfirmasi') => {
    return showModal({ type: 'confirm', message, title });
};

window.uiPrompt = (message, defaultText = '', title = 'Input Diperlukan') => {
    return showModal({ type: 'prompt', message, defaultText, title });
};

window.uiCustomForm = (fields, title = 'Input Diperlukan') => {
    return showModal({ type: 'form', fields, title });
};
