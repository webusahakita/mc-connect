const fs = require('fs');

let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

// 1. Fix the typo invClientW= -> invClientWa =
js = js.replace(/const invClientW=\s*document\.getElementById\('invModalClientWa'\);/, "const invClientWa = document.getElementById('invModalClientWa');");
if (js.includes('invClientWa =')) {
    console.log('Fixed invClientWa typo.');
}

// 2. Rewrite Cash Flow integration to TRULY sync with Calendar & CRM
// And also fix the HTML element IDs!
const newCashflowFn = `function loadCashflowTransactions() {
    // This is called on load
    if (typeof renderCashflowTable === 'function') {
        renderCashflowTable();
    }
}
window.loadCashflowTransactions = loadCashflowTransactions;

function renderCashflowTable() {
    try {
        const tbody = document.getElementById('cashflowTableBody');
        
        let transactions = [];
        
        // 1. Fetch Manual Transactions (Outflows like Transport, Wardrobe)
        try {
            const saved = localStorage.getItem('mc_cashflow_db');
            if (saved) {
                const manual = JSON.parse(saved);
                if (Array.isArray(manual)) {
                    transactions = transactions.concat(manual);
                }
            }
        } catch(e) {}

        // 2. Auto-sync INFLOW from Calendar Events (Terkunci/DP/Lunas)
        if (typeof adminEventsDb !== 'undefined' && Array.isArray(adminEventsDb)) {
            adminEventsDb.forEach(ev => {
                const isPaid = ev.status === 'Terkunci' || (ev.paymentStatus && (ev.paymentStatus.includes('Lunas') || ev.paymentStatus.includes('DP') || ev.paymentStatus.includes('100%')));
                if (isPaid && ev.rawPrice > 0) {
                    transactions.push({
                        id: 'ev_' + ev.id,
                        date: ev.date,
                        desc: 'Booking: ' + ev.title,
                        category: 'Kontrak Acara',
                        type: 'inflow',
                        amount: ev.rawPrice,
                        status: ev.paymentStatus || 'Lunas'
                    });
                }
                // Also pull expenses recorded directly on the event
                if (ev.expenses && Array.isArray(ev.expenses)) {
                    ev.expenses.forEach((exp, i) => {
                        transactions.push({
                            id: 'exp_' + ev.id + '_' + i,
                            date: ev.date,
                            desc: 'Biaya: ' + exp.name + ' (' + ev.title + ')',
                            category: 'Operasional',
                            type: 'outflow',
                            amount: exp.cost,
                            status: 'Paid'
                        });
                    });
                }
            });
        }
        
        // Sort by date descending
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let totalInflow = 0;
        let totalOutflow = 0;
        
        transactions.forEach(t => {
            const amount = Number(t.amount || 0);
            if (t.type === 'inflow') totalInflow += amount;
            else if (t.type === 'outflow') totalOutflow += amount;
        });
        
        // Fix Element IDs according to HTML
        const inEl = document.getElementById('cfTotalIn');
        const outEl = document.getElementById('cfTotalOut');
        const netEl = document.getElementById('cfNetCash');
        const marginEl = document.getElementById('cfNetMargin');
        
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
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Belum ada data transaksi kas (Otomatis dari Kalender atau Input Manual).</td></tr>';
            } else {
                tbody.innerHTML = transactions.map(t => {
                    const color = t.type === 'inflow' ? '#10B981' : '#EF4444';
                    const sign = t.type === 'inflow' ? '+' : '-';
                    const isAuto = String(t.id).startsWith('ev_') || String(t.id).startsWith('exp_');
                    const btn = isAuto ? 
                        '<span class="badge" style="background:#334155; color:#94A3B8; font-size:0.7rem;">Auto-Sync</span>' : 
                        '<button class="btn btn-secondary btn-sm" onclick="deleteCashflowTransaction(\\'' + t.id + '\\')">Hapus</button>';
                    
                    return '<tr>' +
                        '<td>' + t.date + '</td>' +
                        '<td><strong>' + escapeHtml(t.desc) + '</strong></td>' +
                        '<td><span class="badge" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);">' + escapeHtml(t.category) + '</span></td>' +
                        '<td style="color:' + color + '; font-weight:600;">' + sign + ' Rp ' + Number(t.amount).toLocaleString('id-ID') + '</td>' +
                        '<td><span style="color:var(--adm-gold);">' + escapeHtml(t.status) + '</span></td>' +
                        '<td>' + btn + '</td>' +
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
    if (!uiConfirm('Hapus transaksi manual ini?')) return;
    try {
        let saved = localStorage.getItem('mc_cashflow_db');
        if (saved) {
            let manual = JSON.parse(saved);
            manual = manual.filter(t => String(t.id) !== String(id));
            localStorage.setItem('mc_cashflow_db', JSON.stringify(manual));
        }
    } catch(e) {}
    renderCashflowTable();
}
window.deleteCashflowTransaction = deleteCashflowTransaction;
`;

// Find where loadCashflowTransactions is and replace the whole block
const startIdx = js.indexOf('function loadCashflowTransactions() {');
if (startIdx !== -1) {
    // Assuming it's at the end of the file as we appended it previously
    js = js.substring(0, startIdx) + newCashflowFn;
    console.log('Replaced cashflow block.');
} else {
    js += '\n' + newCashflowFn;
    console.log('Appended cashflow block.');
}

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
