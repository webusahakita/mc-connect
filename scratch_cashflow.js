// ==========================================
// DATA CASH FLOW (BACKEND API INTEGRATION)
// ==========================================
window.loadCashflowTransactions = function() {
    fetch('/api/cms/cashflow_transactions')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.cashflowTransactions = data.data || [];
                renderCashflowTable();
            }
        })
        .catch(err => {
            console.error('Failed to load cashflow', err);
            window.cashflowTransactions = [];
            renderCashflowTable();
        });
};

window.renderCashflowTable = function() {
    try {
        const tbody = document.getElementById('cashFlowTableBody') || document.getElementById('cashflowTableBody');
        
        let transactions = [...(window.cashflowTransactions || [])];
        
        // Auto-sync INFLOW from Calendar Events
        if (typeof adminEventsDb !== 'undefined' && Array.isArray(adminEventsDb)) {
            adminEventsDb.forEach(ev => {
                const isPaid = ev.status === 'Terkunci' || (ev.paymentStatus && (ev.paymentStatus.includes('Lunas') || ev.paymentStatus.includes('DP') || ev.paymentStatus.includes('100%')));
                if (isPaid && ev.rawPrice > 0) {
                    transactions.push({
                        id: 'ev_' + ev.id,
                        date: ev.date,
                        desc: 'Booking: ' + ev.title,
                        category: 'Kontrak Acara',
                        type: 'in',
                        amount: ev.rawPrice,
                        status: ev.paymentStatus || 'Lunas'
                    });
                }
                if (ev.expenses && Array.isArray(ev.expenses)) {
                    ev.expenses.forEach((exp, i) => {
                        transactions.push({
                            id: 'exp_' + ev.id + '_' + i,
                            date: ev.date,
                            desc: 'Biaya: ' + exp.name + ' (' + ev.title + ')',
                            category: 'Operasional',
                            type: 'out',
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
            if (t.type === 'in' || t.type === 'inflow') totalInflow += amount;
            else if (t.type === 'out' || t.type === 'outflow') totalOutflow += amount;
        });
        
        const inEl = document.getElementById('cfTotalIn') || document.getElementById('cfTotalInflow');
        const outEl = document.getElementById('cfTotalOut') || document.getElementById('cfTotalOutflow');
        const netEl = document.getElementById('cfNetCash');
        const marginEl = document.getElementById('cfNetMargin') || document.getElementById('cfMargin');
        
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
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Belum ada data transaksi kas.</td></tr>';
            } else {
                tbody.innerHTML = transactions.map(t => {
                    const isIn = (t.type === 'in' || t.type === 'inflow');
                    const color = isIn ? '#10B981' : '#EF4444';
                    const sign = isIn ? '+' : '-';
                    const isAuto = String(t.id).startsWith('ev_') || String(t.id).startsWith('exp_');
                    const btn = isAuto ? 
                        '<span class="badge" style="background:#334155; color:#94A3B8; font-size:0.7rem;">Auto-Sync</span>' : 
                        '<button class="btn btn-secondary btn-sm" onclick="deleteCashflowTransaction(\'' + t.id + '\')">Hapus</button>';
                    
                    return '<tr>' +
                        '<td>' + t.date + '</td>' +
                        '<td><strong>' + (t.desc || '') + '</strong></td>' +
                        '<td><span class="badge" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);">' + (t.category || '') + '</span></td>' +
                        '<td style="color:' + color + '; font-weight:600;">' + sign + ' Rp ' + Number(t.amount).toLocaleString('id-ID') + '</td>' +
                        '<td><span style="color:var(--adm-gold);">' + (t.status || 'Berhasil') + '</span></td>' +
                        '<td>' + btn + '</td>' +
                    '</tr>';
                }).join('');
            }
        }
    } catch(e) {
        console.warn('renderCashflowTable error:', e.message);
    }
};

window.handleSaveCashEntry = function(e) {
    e.preventDefault();
    const type = document.getElementById('newCfType')?.value;
    const category = document.getElementById('newCfCategory')?.value;
    const amount = document.getElementById('newCfAmount')?.value;
    const desc = document.getElementById('newCfDesc')?.value;
    const date = document.getElementById('newCfDate')?.value;
    
    if (!type || !category || !amount || !desc || !date) {
        uiAlert('Semua kolom wajib diisi!');
        return;
    }

    const payload = { type, category, amount, date, desc };

    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    fetch('/api/cms/cashflow_transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(res => res.json())
      .then(data => {
          if (data.success) {
              uiAlert('Transaksi kas berhasil dicatat!');
              closeModals();
              e.target.reset();
              loadCashflowTransactions();
          } else {
              uiAlert('Gagal mencatat transaksi: ' + (data.message || 'Error'));
          }
      }).catch(err => {
          console.error(err);
          uiAlert('Terjadi kesalahan jaringan.');
      }).finally(() => {
          if (btn) btn.disabled = false;
      });
};

window.deleteCashflowTransaction = function(id) {
    if (!uiConfirm('Hapus transaksi kas ini?')) return;
    
    fetch('/api/cms/cashflow_transactions/' + id, {
        method: 'DELETE'
    }).then(res => res.json())
      .then(data => {
          if (data.success) {
              uiAlert('Transaksi berhasil dihapus');
              loadCashflowTransactions();
          } else {
              uiAlert('Gagal menghapus transaksi: ' + (data.message || 'Error'));
          }
      }).catch(err => {
          console.error(err);
          uiAlert('Terjadi kesalahan jaringan.');
      });
};
