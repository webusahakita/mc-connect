const fs = require('fs');

// 1. Update admin.html to add hidden id field
let htmlContent = fs.readFileSync('public/admin.html', 'utf8');
const formTarget = '<form onsubmit="handleSaveCashEntry(event)">';
const formReplacement = `<form onsubmit="handleSaveCashEntry(event)">
                <input type="hidden" id="editCfId" value="">`;
if (htmlContent.includes(formTarget) && !htmlContent.includes('id="editCfId"')) {
    htmlContent = htmlContent.replace(formTarget, formReplacement);
    fs.writeFileSync('public/admin.html', htmlContent, 'utf8');
    console.log('Updated admin.html with hidden editCfId');
}

// 2. Update admin-core.js
let jsContent = fs.readFileSync('public/js/admin-core.js', 'utf8');

const normalize = (str) => str.replace(/\r\n/g, '\n');
jsContent = normalize(jsContent);

// A. Add Edit button to table rows
const btnTarget = `        const delBtn = item.isManual 
            ? \`<button class="btn btn-secondary btn-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="deleteCashflowTransaction(\${item.id})">Hapus</button>\`
            : \`<span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">Otomatis</span>\`;`;

const btnReplacement = `        const delBtn = item.isManual 
            ? \`<div style="display:flex; gap:0.4rem; justify-content:flex-end;">
                 <button class="btn btn-primary btn-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="editCashflowTransaction(\${item.id})">Edit</button>
                 <button class="btn btn-secondary btn-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="deleteCashflowTransaction(\${item.id})">Hapus</button>
               </div>\`
            : \`<span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">Otomatis</span>\`;`;

if (jsContent.includes(btnTarget)) {
    jsContent = jsContent.replace(btnTarget, btnReplacement);
    console.log('Added Edit button to rows');
} else {
    console.log('Failed to find button target');
}

// B. Add editCashflowTransaction function globally (append at bottom)
const editFunction = `
window.editCashflowTransaction = function(id) {
    const rawData = AdminDB.getItem('mc_manual_cashflow');
    if (!rawData) return;
    const transactions = JSON.parse(rawData);
    const txn = transactions.find(t => String(t.id) === String(id));
    if (!txn) return;
    
    // Set fields
    document.getElementById('editCfId').value = txn.id;
    document.getElementById('newCfType').value = txn.type === 'masuk' ? 'in' : 'out';
    
    // Trigger category render and then set the category
    if (typeof renderCashflowCategories === 'function') {
        renderCashflowCategories();
    }
    
    document.getElementById('newCfCategory').value = txn.category;
    document.getElementById('newCfAmount').value = txn.amount;
    document.getElementById('newCfDesc').value = txn.desc;
    
    // Show modal
    document.getElementById('addCashModal').classList.add('active');
};
`;
if (!jsContent.includes('window.editCashflowTransaction =')) {
    jsContent += editFunction;
    console.log('Added editCashflowTransaction function');
}

// C. Update handleSaveCashEntry to handle updates
const saveTarget = `    const newEntry = {
        id: Date.now(),
        date: today,
        type: typeRaw === 'in' ? 'masuk' : 'keluar',
        category: document.getElementById('newCfCategory').value,
        amount: Number(document.getElementById('newCfAmount').value) || 0,
        desc: document.getElementById('newCfDesc').value || '-',
        isManual: true
    };

    let existing = [];
    const raw = AdminDB.getItem('mc_manual_cashflow');
    if (raw) existing = JSON.parse(raw);

    existing.push(newEntry);
    AdminDB.setItem('mc_manual_cashflow', JSON.stringify(existing));`;

const saveReplacement = `    const editId = document.getElementById('editCfId') ? document.getElementById('editCfId').value : '';
    
    let existing = [];
    const raw = AdminDB.getItem('mc_manual_cashflow');
    if (raw) existing = JSON.parse(raw);
    
    if (editId) {
        // Update existing entry
        const idx = existing.findIndex(t => String(t.id) === String(editId));
        if (idx !== -1) {
            existing[idx].type = typeRaw === 'in' ? 'masuk' : 'keluar';
            existing[idx].category = document.getElementById('newCfCategory').value;
            existing[idx].amount = Number(document.getElementById('newCfAmount').value) || 0;
            existing[idx].desc = document.getElementById('newCfDesc').value || '-';
        }
    } else {
        // Create new entry
        const newEntry = {
            id: Date.now(),
            date: today,
            type: typeRaw === 'in' ? 'masuk' : 'keluar',
            category: document.getElementById('newCfCategory').value,
            amount: Number(document.getElementById('newCfAmount').value) || 0,
            desc: document.getElementById('newCfDesc').value || '-',
            isManual: true
        };
        existing.push(newEntry);
    }

    AdminDB.setItem('mc_manual_cashflow', JSON.stringify(existing));`;

if (jsContent.includes(saveTarget)) {
    jsContent = jsContent.replace(saveTarget, saveReplacement);
    console.log('Updated handleSaveCashEntry');
} else {
    console.log('Failed to find handleSaveCashEntry target');
}

// D. Add cleanup to openAddCashModal (if it exists) to clear editCfId
const openModalTarget = `function openAddCashModal() {
    const modal = document.getElementById('addCashModal');
    if (modal) {`;
const openModalReplacement = `function openAddCashModal() {
    if (document.getElementById('editCfId')) document.getElementById('editCfId').value = '';
    const modal = document.getElementById('addCashModal');
    if (modal) {`;
if (jsContent.includes(openModalTarget)) {
    jsContent = jsContent.replace(openModalTarget, openModalReplacement);
    console.log('Updated openAddCashModal to clear editCfId');
}

fs.writeFileSync('public/js/admin-core.js', jsContent, 'utf8');
console.log('Done');
