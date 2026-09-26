const fs = require('fs');

let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

const restoreFn = `
function loadCashflowTransactions() {
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
`;

// It might be completely missing. Let's append it.
if (!js.includes('function loadCashflowTransactions')) {
    js += '\n' + restoreFn;
    fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
    console.log('Restored loadCashflowTransactions');
}

// 2. The user also asked: "apakah data pelanggan yang ada di dashboard data fake ? perbaiki bug tersebut dan buat semua data dashboard dari database"
// In admin.html, the Dashboard's "Data Pelanggan & Klien Aktif Terbaru" is rendered. Let's see what renders it.
