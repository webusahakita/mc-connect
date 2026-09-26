const fs = require('fs');

let content = fs.readFileSync('public/js/cms-overrides.js', 'utf8');

const markerStart = '// ==========================================';
const markerSub = '// PENGATURAN WEB & INTEGRASI FINANSIAL';

const startIndex = content.indexOf(markerStart + '\n' + markerSub);

if (startIndex !== -1) {
    content = content.substring(0, startIndex);
}

const dbOnlyCode = `
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
    const logoUrl = document.getElementById('ws_logo_url')?.value || ''; // gabung dengan web logo
    
    const data = { accounts, qrisUrl, logoUrl };
    try {
        const res = await fetch('/api/cms/payment-settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (res.ok) alert('Pengaturan Pembayaran & QRIS berhasil disimpan ke Server!');
        else alert('Gagal menyimpan ke server: ' + res.statusText);
    } catch(e) {
        alert('Gagal menyambung ke server. Pastikan server aktif.');
    }
};

// --- Kategori Acara ---
window.addCategoryInput = function(val = '', icon = '✨') {
    const list = document.getElementById('cmsCategoriesList');
    if (!list) return;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.innerHTML = \`
        <input type="text" class="form-input" style="flex:1;" placeholder="Nama Kategori (misal: Wedding)" value="\${val}">
        <input type="text" class="form-input" style="width:60px;" placeholder="Icon" value="\${icon}">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Hapus</button>
    \`;
    list.appendChild(div);
};

window.handleSaveEventCategories = async function() {
    const list = document.getElementById('cmsCategoriesList');
    if (!list) return;
    const items = list.querySelectorAll('div');
    const categories = Array.from(items).map(div => {
        const inputs = div.querySelectorAll('input');
        return { name: inputs[0].value.trim(), icon: inputs[1]?.value.trim() || '✨' };
    }).filter(c => c.name);
    
    try {
        const res = await fetch('/api/cms/event-categories', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ categories })
        });
        if (res.ok) alert('Kategori acara berhasil disimpan ke Server!');
        else alert('Gagal menyimpan ke server.');
    } catch (e) {
        alert('Koneksi server gagal.');
    }
};

// --- Kategori Arus Kas ---
window.addCashflowIncomeCategoryInput = function(val = '', warna = '#10B981') {
    const list = document.getElementById('cmsIncomeCategoriesList');
    if (!list) return;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.innerHTML = \`
        <input type="text" class="form-input name-input" style="flex:1;" placeholder="Kategori Pemasukan" value="\${val}">
        <input type="color" class="form-input color-input" style="width:50px; padding:0;" value="\${warna}">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>
    \`;
    list.appendChild(div);
};

window.handleSaveIncomeCategories = async function() {
    await saveCashflowCategoriesBulk();
};

window.addCashflowExpenseCategoryInput = function(val = '', warna = '#EF4444') {
    const list = document.getElementById('cmsExpenseCategoriesList');
    if (!list) return;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.innerHTML = \`
        <input type="text" class="form-input name-input" style="flex:1;" placeholder="Kategori Pengeluaran" value="\${val}">
        <input type="color" class="form-input color-input" style="width:50px; padding:0;" value="\${warna}">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>
    \`;
    list.appendChild(div);
};

window.handleSaveExpenseCategories = async function() {
    await saveCashflowCategoriesBulk();
};

async function saveCashflowCategoriesBulk() {
    const categories = [];
    const inList = document.getElementById('cmsIncomeCategoriesList')?.querySelectorAll('div');
    if (inList) {
        inList.forEach(div => {
            const name = div.querySelector('.name-input').value.trim();
            const warna = div.querySelector('.color-input').value;
            if (name) categories.push({ nama: name, tipe: 'in', warna });
        });
    }
    const outList = document.getElementById('cmsExpenseCategoriesList')?.querySelectorAll('div');
    if (outList) {
        outList.forEach(div => {
            const name = div.querySelector('.name-input').value.trim();
            const warna = div.querySelector('.color-input').value;
            if (name) categories.push({ nama: name, tipe: 'out', warna });
        });
    }
    
    try {
        const res = await fetch('/api/cms/cashflow-categories', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ categories })
        });
        if (res.ok) alert('Kategori arus kas berhasil disimpan ke Server!');
        else alert('Gagal menyimpan kategori ke server.');
    } catch (e) {
        alert('Koneksi server terputus.');
    }
}

// --- Kategori Klien ---
window.addClientCategoryInput = function(val = '', icon = '⭐') {
    const list = document.getElementById('cmsClientCategoriesList');
    if (!list) return;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.innerHTML = \`
        <input type="text" class="form-input" style="flex:1;" placeholder="VIP / Reguler" value="\${val}">
        <input type="text" class="form-input" style="width:60px;" placeholder="Icon" value="\${icon}">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Hapus</button>
    \`;
    list.appendChild(div);
};

window.handleSaveClientCategories = async function() {
    const list = document.getElementById('cmsClientCategoriesList');
    if (!list) return;
    const items = list.querySelectorAll('div');
    const categories = Array.from(items).map(div => {
        const inputs = div.querySelectorAll('input');
        return { name: inputs[0].value.trim(), icon: inputs[1]?.value.trim() || '⭐' };
    }).filter(c => c.name);
    
    try {
        const res = await fetch('/api/cms/client-categories', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ categories })
        });
        if (res.ok) alert('Kategori klien berhasil disimpan ke Server!');
        else alert('Server gagal memproses.');
    } catch (e) {
        alert('Tidak ada koneksi ke server.');
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
    div.innerHTML = \`
        <div style="display:flex; justify-content:space-between; gap: 10px;">
            <input type="text" class="form-input tpl-title" style="flex:1;" placeholder="Judul Template" value="\${title}">
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">Hapus</button>
        </div>
        <textarea class="form-textarea tpl-msg" rows="3" placeholder="Halo {name}, terkait acara {event} Anda...">\${msg}</textarea>
    \`;
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
        if (res.ok) alert('Template WA berhasil disimpan ke Server!');
        else alert('Gagal menyimpan ke server.');
    } catch (e) {
        alert('Koneksi terputus.');
    }
};

// --- Logo Web & Invoice ---
window.saveWebSettings = async function() {
    // Karena savePaymentSettings memanggil api /api/cms/payment-settings yang menyimpan config utuh,
    // Kita jalankan savePaymentSettings untuk gabung Logo URL
    window.savePaymentSettings();
};

// ==========================================
// LOAD DATA FROM SERVER ONLY (NO LOCAL STORAGE)
// ==========================================
window.loadCmsWebSettings = async function() {
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
            
            if (paySet.accounts && paySet.accounts.length) {
                paySet.accounts.forEach(a => window.addBankAccount(a.bank, a.number, a.name));
            } else {
                window.addBankAccount(); // default
            }
            
            if (paySet.qrisUrl) {
                const qUrl = document.getElementById('paymentQrisUrl');
                const qImg = document.getElementById('previewQrisImg');
                if (qUrl) qUrl.value = paySet.qrisUrl;
                if (qImg) qImg.src = paySet.qrisUrl;
            }
            
            if (paySet.logoUrl) {
                const wl = document.getElementById('ws_logo_url');
                if (wl) wl.value = paySet.logoUrl;
            }
        }

    } catch (e) {
        console.error('Error fetching settings data from server:', e);
        alert('Gagal memuat beberapa data pengaturan dari server.');
    }
};

// Call loading when page is ready
setTimeout(() => {
    if (typeof window.loadCmsWebSettings === 'function') {
        window.loadCmsWebSettings();
    }
}, 1500);
`;

content += dbOnlyCode;
fs.writeFileSync('public/js/cms-overrides.js', content, 'utf8');
console.log('Update cms-overrides.js completely from DB');
