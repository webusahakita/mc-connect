const fs = require('fs');

let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

// ============================================================
// FIX WARDROBE RENDERER
// ============================================================
let wardrobeReplacement = `function renderWardrobe() {
    try {
        const container = document.getElementById('wardrobeGrid');
        if (!container) return;
        
        // Coba ambil dari AdminDB dulu (sinkronisasi dari server)
        let rawData = null;
        if (typeof AdminDB !== 'undefined') {
            rawData = AdminDB.getItem('mc_wardrobe_catalog');
        }
        // Fallback ke localStorage jika sedang offline
        if (!rawData) {
            rawData = localStorage.getItem('mc_wardrobe_db');
        }
        
        let items = [];
        if (rawData) {
            try { items = typeof rawData === 'string' ? JSON.parse(rawData) : rawData; } catch(e) {}
        }
        
        if (!Array.isArray(items) || items.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Belum ada item wardrobe. Klik + untuk menambahkan.</div>';
            return;
        }
        
        container.innerHTML = items.map(item => {
            return '<div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:1rem; border:1px solid rgba(255,255,255,0.06);">' +
                '<div style="font-weight:700;">' + escapeHtml(item.name || 'Item') + '</div>' +
                '<div style="font-size:0.8rem; color:var(--adm-text-muted); margin-top:0.25rem;">' + escapeHtml(item.category || '') + '</div>' +
                (item.notes ? '<div style="font-size:0.75rem; color:var(--adm-text-secondary); margin-top:0.25rem;">' + escapeHtml(item.notes) + '</div>' : '') +
            '</div>';
        }).join('');
    } catch(e) {
        console.warn('renderWardrobe error:', e.message);
    }
}`;

js = js.replace(/function renderWardrobe\(\) \{[\s\S]*?window\.renderWardrobe = renderWardrobe;/g, wardrobeReplacement + '\nwindow.renderWardrobe = renderWardrobe;');


// ============================================================
// INTEGRATED CASH FLOW RENDERER
// ============================================================
// Since there's no backend for cashflow transactions (only categories), we MUST compute from adminEventsDb!
let cashflowReplacement = `
// ============================================================
// Integrated Cash Flow Computations
// ============================================================
function renderCashflowTable() {
    try {
        const tbody = document.getElementById('cashflowTableBody');
        const evs = window.adminEventsDb || [];
        
        let totalInflow = 0;
        let totalOutflow = 0;
        let transactions = [];
        
        // Kumpulkan data dari setiap acara
        evs.forEach(ev => {
            // 1. Inflow dari acara yang dikonfirmasi/lunas
            if (ev.status === 'Terkunci' || ev.paymentStatus === 'Lunas' || ev.paymentStatus === 'DP') {
                const val = Number(ev.rawPrice || ev.price || 0);
                if (val > 0) {
                    totalInflow += val;
                    transactions.push({
                        date: ev.date,
                        desc: 'Pembayaran Acara: ' + (ev.title || 'Event'),
                        category: 'Pendapatan Jasa MC',
                        amount: val,
                        type: 'inflow',
                        status: ev.paymentStatus || 'Terkunci'
                    });
                }
            }
            
            // 2. Outflow dari pengeluaran terkait acara
            if (Array.isArray(ev.expenses)) {
                ev.expenses.forEach(exp => {
                    const expVal = Number(exp.amount || 0);
                    if (expVal > 0) {
                        totalOutflow += expVal;
                        transactions.push({
                            date: exp.date || ev.date,
                            desc: exp.desc || 'Pengeluaran Acara: ' + (ev.title || 'Event'),
                            category: exp.category || 'Operasional',
                            amount: expVal,
                            type: 'outflow',
                            status: 'Selesai'
                        });
                    }
                });
            }
        });
        
        // Update metric cards
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
        
        // Urutkan transaksi dari terbaru ke terlama
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Render tabel
        if (tbody) {
            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Tidak ada data transaksi. Semua data otomatis ditarik dari Acara yang Terkunci.</td></tr>';
            } else {
                tbody.innerHTML = transactions.map(t => {
                    const color = t.type === 'inflow' ? '#10B981' : '#EF4444';
                    const sign = t.type === 'inflow' ? '+' : '-';
                    return \`<tr>
                        <td>\${t.date}</td>
                        <td><strong>\${escapeHtml(t.desc)}</strong></td>
                        <td><span class="badge" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);">\${escapeHtml(t.category)}</span></td>
                        <td style="color:\${color}; font-weight:600;">\${sign} Rp \${t.amount.toLocaleString('id-ID')}</td>
                        <td><span style="color:var(--adm-gold);">\${escapeHtml(t.status)}</span></td>
                        <td><button class="btn btn-secondary btn-sm" disabled>Detail</button></td>
                    </tr>\`;
                }).join('');
            }
        }
    } catch(e) {
        console.warn('renderCashflowTable error:', e.message);
    }
}
window.renderCashflowTable = renderCashflowTable;
`;

// Insert renderCashflowTable if it doesn't exist, or replace it if it does
if (js.includes('function renderCashflowTable()')) {
    js = js.replace(/function renderCashflowTable\(\) \{[\s\S]*?window\.renderCashflowTable = renderCashflowTable;/g, cashflowReplacement.trim());
} else {
    // Insert before DOMContentLoaded
    let idx = js.lastIndexOf("document.addEventListener('DOMContentLoaded'");
    if (idx !== -1) {
        js = js.substring(0, idx) + '\n' + cashflowReplacement + '\n' + js.substring(idx);
    } else {
        js += '\n' + cashflowReplacement;
    }
}

// Modify loadCashflowTransactions to just trigger render
let loadCfReplacement = `function loadCashflowTransactions() {
    if (typeof renderCashflowTable === 'function') {
        renderCashflowTable();
    }
}`;
js = js.replace(/function loadCashflowTransactions\(\) \{[\s\S]*?window\.loadCashflowTransactions = loadCashflowTransactions;/g, loadCfReplacement + '\nwindow.loadCashflowTransactions = loadCashflowTransactions;');


fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
console.log('Fixed Wardrobe and Cash Flow Integrations');
