const fs = require('fs');

const codeToAppend = `
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
    
    div.innerHTML = \`
        <div style="flex:1; min-width:150px;">
            <label style="display:block; margin-bottom:0.5rem; font-size:0.8rem; color:var(--text-secondary);">Nama Bank</label>
            <input type="text" class="form-input bank-name" placeholder="BCA / Mandiri" value="\${bankName}">
        </div>
        <div style="flex:1; min-width:200px;">
            <label style="display:block; margin-bottom:0.5rem; font-size:0.8rem; color:var(--text-secondary);">Nomor Rekening</label>
            <input type="text" class="form-input bank-number" placeholder="1234567890" value="\${accNumber}">
        </div>
        <div style="flex:1; min-width:200px;">
            <label style="display:block; margin-bottom:0.5rem; font-size:0.8rem; color:var(--text-secondary);">Atas Nama</label>
            <input type="text" class="form-input bank-owner" placeholder="Nama Pemilik" value="\${accName}">
        </div>
        <div>
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()" style="padding:0.4rem 0.8rem;">Hapus</button>
        </div>
    \`;
    container.appendChild(div);
};

window.handleQrisPhotoUpload = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewQrisImg').src = e.target.result;
            // Clear URL if file is uploaded
            document.getElementById('paymentQrisUrl').value = e.target.result; 
        }
        reader.readAsDataURL(file);
    }
};

window.savePaymentSettings = async function() {
    const container = document.getElementById('bankAccountsContainer');
    const items = container ? container.querySelectorAll('.bank-account-item') : [];
    const accounts = Array.from(items).map(item => {
        return {
            bank: item.querySelector('.bank-name').value.trim(),
            number: item.querySelector('.bank-number').value.trim(),
            name: item.querySelector('.bank-owner').value.trim()
        };
    }).filter(acc => acc.bank && acc.number);
    
    const qrisUrl = document.getElementById('paymentQrisUrl')?.value || '';
    
    const data = { accounts, qrisUrl };
    try {
        const res = await fetch('/api/cms/payment-settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (res.ok) alert('Pengaturan Pembayaran & QRIS berhasil disimpan!');
        else throw new Error('Gagal dari server');
    } catch(e) {
        localStorage.setItem('cms_payment_settings', JSON.stringify(data));
        alert('Pengaturan Pembayaran & QRIS disimpan lokal!');
    }
};

// --- Kategori Acara ---
window.addCategoryInput = function(val = '') {
    const list = document.getElementById('cmsCategoriesList');
    if (!list) return;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.innerHTML = \`
        <input type="text" class="form-input" style="flex:1;" placeholder="Nama Kategori (misal: Wedding)" value="\${val}">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Hapus</button>
    \`;
    list.appendChild(div);
};

window.handleSaveEventCategories = async function() {
    const list = document.getElementById('cmsCategoriesList');
    if (!list) return;
    const inputs = list.querySelectorAll('input');
    const categories = Array.from(inputs).map(i => i.value.trim()).filter(i => i);
    
    try {
        const res = await fetch('/api/cms/event-categories', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ categories })
        });
        if (res.ok) alert('Kategori acara berhasil disimpan!');
        else throw new Error('Server error');
    } catch (e) {
        localStorage.setItem('cms_event_categories', JSON.stringify(categories));
        alert('Kategori acara disimpan lokal.');
    }
};

// --- Kategori Arus Kas ---
window.addCashflowIncomeCategoryInput = function(val = '') {
    const list = document.getElementById('cmsIncomeCategoriesList');
    if (!list) return;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.innerHTML = \`
        <input type="text" class="form-input" style="flex:1;" placeholder="Kategori Pemasukan" value="\${val}">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>
    \`;
    list.appendChild(div);
};

window.handleSaveIncomeCategories = async function() {
    const list = document.getElementById('cmsIncomeCategoriesList');
    if (!list) return;
    const inputs = list.querySelectorAll('input');
    const categories = Array.from(inputs).map(i => i.value.trim()).filter(i => i);
    
    try {
        const res = await fetch('/api/cms/cashflow-categories?type=income', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ categories })
        });
        if (res.ok) alert('Kategori pemasukan berhasil disimpan!');
        else throw new Error('Server error');
    } catch (e) {
        localStorage.setItem('cms_income_categories', JSON.stringify(categories));
        alert('Kategori pemasukan disimpan lokal.');
    }
};

window.addCashflowExpenseCategoryInput = function(val = '') {
    const list = document.getElementById('cmsExpenseCategoriesList');
    if (!list) return;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.innerHTML = \`
        <input type="text" class="form-input" style="flex:1;" placeholder="Kategori Pengeluaran" value="\${val}">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>
    \`;
    list.appendChild(div);
};

window.handleSaveExpenseCategories = async function() {
    const list = document.getElementById('cmsExpenseCategoriesList');
    if (!list) return;
    const inputs = list.querySelectorAll('input');
    const categories = Array.from(inputs).map(i => i.value.trim()).filter(i => i);
    
    try {
        const res = await fetch('/api/cms/cashflow-categories?type=expense', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ categories })
        });
        if (res.ok) alert('Kategori pengeluaran berhasil disimpan!');
        else throw new Error('Server error');
    } catch (e) {
        localStorage.setItem('cms_expense_categories', JSON.stringify(categories));
        alert('Kategori pengeluaran disimpan lokal.');
    }
};

// --- Kategori Klien ---
window.addClientCategoryInput = function(val = '') {
    const list = document.getElementById('cmsClientCategoriesList');
    if (!list) return;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.innerHTML = \`
        <input type="text" class="form-input" style="flex:1;" placeholder="VIP / Reguler" value="\${val}">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Hapus</button>
    \`;
    list.appendChild(div);
};

window.handleSaveClientCategories = async function() {
    const list = document.getElementById('cmsClientCategoriesList');
    if (!list) return;
    const inputs = list.querySelectorAll('input');
    const categories = Array.from(inputs).map(i => i.value.trim()).filter(i => i);
    
    try {
        const res = await fetch('/api/cms/client-categories', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ categories })
        });
        if (res.ok) alert('Kategori klien berhasil disimpan!');
        else throw new Error('Server error');
    } catch (e) {
        localStorage.setItem('cms_client_categories', JSON.stringify(categories));
        alert('Kategori klien disimpan lokal.');
    }
};

// --- Template WAA ---
window.addWaTemplateInput = function(val = '') {
    const list = document.getElementById('cmsWaTemplatesList');
    if (!list) return;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.gap = '10px';
    div.style.padding = '10px';
    div.style.border = '1px solid rgba(255,255,255,0.1)';
    div.style.borderRadius = 'var(--adm-radius-sm)';
    div.style.background = 'rgba(255,255,255,0.02)';
    div.innerHTML = \`
        <div style="display:flex; justify-content:space-between;">
            <label style="font-size:0.8rem; color:var(--text-secondary);">Isi Pesan Template:</label>
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">Hapus Template</button>
        </div>
        <textarea class="form-textarea" rows="3" placeholder="Halo {name}, terkait acara {event} Anda...">\${val}</textarea>
    \`;
    list.appendChild(div);
};

window.handleSaveWaTemplates = async function() {
    const list = document.getElementById('cmsWaTemplatesList');
    if (!list) return;
    const textareas = list.querySelectorAll('textarea');
    const templates = Array.from(textareas).map(t => t.value.trim()).filter(t => t);
    
    try {
        const res = await fetch('/api/cms/wa-templates', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ templates })
        });
        if (res.ok) alert('Template WA berhasil disimpan!');
        else throw new Error('Server error');
    } catch (e) {
        localStorage.setItem('cms_wa_templates', JSON.stringify(templates));
        alert('Template WA disimpan lokal.');
    }
};

// --- Logo Web & Invoice ---
window.saveWebSettings = async function() {
    const logoUrl = document.getElementById('ws_logo_url')?.value || '';
    
    try {
        const res = await fetch('/api/cms/web-settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ logoUrl })
        });
        if (res.ok) alert('Pengaturan Web & Logo berhasil disimpan!');
        else throw new Error('Server error');
    } catch (e) {
        localStorage.setItem('cms_web_settings', JSON.stringify({ logoUrl }));
        alert('Pengaturan Web & Logo disimpan lokal.');
    }
};

// LOAD SETTINGS ON START
window.loadCmsWebSettings = function() {
    // Load Event Categories
    let evtCats = JSON.parse(localStorage.getItem('cms_event_categories') || '["Wedding", "Corporate", "Birthday"]');
    const evList = document.getElementById('cmsCategoriesList');
    if (evList) {
        evList.innerHTML = '';
        evtCats.forEach(c => window.addCategoryInput(c));
    }
    
    // Load Client Categories
    let clCats = JSON.parse(localStorage.getItem('cms_client_categories') || '["VIP", "Regular", "Corporate"]');
    const clList = document.getElementById('cmsClientCategoriesList');
    if (clList) {
        clList.innerHTML = '';
        clCats.forEach(c => window.addClientCategoryInput(c));
    }
    
    // Load WA Templates
    let waTmpls = JSON.parse(localStorage.getItem('cms_wa_templates') || '["Halo {name}, terima kasih telah booking MC untuk acara {event}."]');
    const waList = document.getElementById('cmsWaTemplatesList');
    if (waList) {
        waList.innerHTML = '';
        waTmpls.forEach(t => window.addWaTemplateInput(t));
    }
    
    // Load Income Categories
    let incCats = JSON.parse(localStorage.getItem('cms_income_categories') || '["Honor MC", "Uang Muka", "Tip"]');
    const incList = document.getElementById('cmsIncomeCategoriesList');
    if (incList) {
        incList.innerHTML = '';
        incCats.forEach(c => window.addCashflowIncomeCategoryInput(c));
    }
    
    // Load Expense Categories
    let expCats = JSON.parse(localStorage.getItem('cms_expense_categories') || '["Transportasi", "Pakaian", "Konsumsi", "Marketing"]');
    const expList = document.getElementById('cmsExpenseCategoriesList');
    if (expList) {
        expList.innerHTML = '';
        expCats.forEach(c => window.addCashflowExpenseCategoryInput(c));
    }
    
    // Load Payment Settings
    let paySet = JSON.parse(localStorage.getItem('cms_payment_settings') || '{"accounts":[],"qrisUrl":""}');
    const payList = document.getElementById('bankAccountsContainer');
    if (payList) {
        payList.innerHTML = '';
        if (paySet.accounts && paySet.accounts.length) {
            paySet.accounts.forEach(a => window.addBankAccount(a.bank, a.number, a.name));
        } else {
            window.addBankAccount(); // default empty one
        }
    }
    if (paySet.qrisUrl) {
        const qUrl = document.getElementById('paymentQrisUrl');
        const qImg = document.getElementById('previewQrisImg');
        if (qUrl) qUrl.value = paySet.qrisUrl;
        if (qImg) qImg.src = paySet.qrisUrl;
    }
    
    // Load Web Logo
    let webSet = JSON.parse(localStorage.getItem('cms_web_settings') || '{"logoUrl":""}');
    if (webSet.logoUrl) {
        const wl = document.getElementById('ws_logo_url');
        if (wl) wl.value = webSet.logoUrl;
    }
};

// Call loading when page is ready
setTimeout(() => {
    if (typeof window.loadCmsWebSettings === 'function') {
        window.loadCmsWebSettings();
    }
}, 1500);

`;

fs.appendFileSync('public/js/cms-overrides.js', codeToAppend);
console.log('Appended web settings functions to cms-overrides.js');
