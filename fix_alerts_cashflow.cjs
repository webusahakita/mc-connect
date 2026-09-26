const fs = require('fs');

// ===============================================
// 1. Fix alert() in calendar.js
// ===============================================
let calJs = fs.readFileSync('public/js/calendar.js', 'utf8');
calJs = calJs.replace(/alert\(`/g, 'uiAlert(`');
fs.writeFileSync('public/js/calendar.js', calJs, 'utf8');
console.log('Fixed alert in calendar.js');

// ===============================================
// 2. Fix alert() in public-cms.js
// ===============================================
let pubJs = fs.readFileSync('public/js/public-cms.js', 'utf8');
pubJs = pubJs.replace(/alert\(/g, 'uiAlert(');
fs.writeFileSync('public/js/public-cms.js', pubJs, 'utf8');
console.log('Fixed alert in public-cms.js');

// ===============================================
// 3. Restore Cashflow logic in admin-core.js
// ===============================================
let coreJs = fs.readFileSync('public/js/admin-core.js', 'utf8');

const newCashflowFn = `function loadCashflowTransactions() {
    try {
        const saved = localStorage.getItem('mc_cashflow_db');
        if (saved) {
            window.cashflowTransactions = JSON.parse(saved);
        } else {
            window.cashflowTransactions = [];
        }
    } catch(e) {
        window.cashflowTransactions = [];
    }
    if (typeof renderCashflowTable === 'function') {
        renderCashflowTable();
    }
}
window.loadCashflowTransactions = loadCashflowTransactions;

function renderCashflowTable() {
    try {
        const tbody = document.getElementById('cashflowTableBody');
        const transactions = window.cashflowTransactions || [];
        
        let totalInflow = 0;
        let totalOutflow = 0;
        
        transactions.forEach(t => {
            const amount = Number(t.amount || 0);
            if (t.type === 'inflow') totalInflow += amount;
            else if (t.type === 'outflow') totalOutflow += amount;
        });
        
        const inEl = document.getElementById('cfTotalInflow');
        const outEl = document.getElementById('cfTotalOutflow');
        const netEl = document.getElementById('cfNetCash');
        const marginEl = document.getElementById('cfMargin');
        
        if (inEl) inEl.textContent = 'Rp ' + totalInflow.toLocaleString('id-ID');
        if (outEl) outEl.textContent = 'Rp ' + totalOutflow.toLocaleString('id-ID');
        
        const netCash = totalInflow - totalOutflow;
        if (netEl) netEl.textContent = 'Rp ' + netCash.toLocaleString('id-ID');
        
        if (marginEl) {
            const margin = totalInflow > 0 ? ((netCash / totalInflow) * 100).toFixed(1) : 0;
            marginEl.textContent = margin + '%';
        }
        
        if (tbody) {
            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Belum ada data transaksi kas. Klik Catat Transaksi Kas.</td></tr>';
            } else {
                tbody.innerHTML = transactions.map(t => {
                    const color = t.type === 'inflow' ? '#10B981' : '#EF4444';
                    const sign = t.type === 'inflow' ? '+' : '-';
                    return '<tr>' +
                        '<td>' + t.date + '</td>' +
                        '<td><strong>' + escapeHtml(t.desc) + '</strong></td>' +
                        '<td><span class="badge" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);">' + escapeHtml(t.category) + '</span></td>' +
                        '<td style="color:' + color + '; font-weight:600;">' + sign + ' Rp ' + Number(t.amount).toLocaleString('id-ID') + '</td>' +
                        '<td><span style="color:var(--adm-gold);">' + escapeHtml(t.status) + '</span></td>' +
                        '<td><button class="btn btn-secondary btn-sm" onclick="deleteCashflowTransaction(\\'' + t.id + '\\')">Hapus</button></td>' +
                    '</tr>';
                }).join('');
            }
        }
    } catch(e) {
        console.warn('renderCashflowTable error:', e.message);
    }
}
window.renderCashflowTable = renderCashflowTable;

function deleteCashflowTransaction(id) {
    if (!uiConfirm('Hapus transaksi ini?')) return;
    window.cashflowTransactions = window.cashflowTransactions.filter(t => String(t.id) !== String(id));
    localStorage.setItem('mc_cashflow_db', JSON.stringify(window.cashflowTransactions));
    renderCashflowTable();
}
window.deleteCashflowTransaction = deleteCashflowTransaction;
`;

// Replace the auto-computed version from previous step with the local DB version
coreJs = coreJs.replace(/function renderCashflowTable\(\) \{[\s\S]*?window\.renderCashflowTable = renderCashflowTable;/g, newCashflowFn.trim());
coreJs = coreJs.replace(/function loadCashflowTransactions\(\) \{[\s\S]*?window\.loadCashflowTransactions = loadCashflowTransactions;/g, ''); 

fs.writeFileSync('public/js/admin-core.js', coreJs, 'utf8');
console.log('Restored Cashflow UI');
