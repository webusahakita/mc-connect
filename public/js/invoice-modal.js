/**
 * MC-Connect Invoice Modal System v1.0
 * Standalone - no CSS variables needed. Overrides openEditInvoiceModal & openInvoicePrintModal.
 */
(function () {
    'use strict';
    var CSS = '#inv-bd{display:none;position:fixed;inset:0;z-index:999990;background:rgba(0,0,0,.82);backdrop-filter:blur(8px);align-items:center;justify-content:center;padding:1rem;}' +
        '#inv-bd.open{display:flex!important;}' +
        '@keyframes inv-in{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:none}}' +
        '.inv-m{background:#111827;border:1px solid rgba(255,255,255,.10);border-radius:16px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 30px 80px rgba(0,0,0,.8);animation:inv-in .22s ease;color:#e2e8f0;font-family:Inter,Segoe UI,sans-serif;}' +
        '.inv-m.edit{max-width:680px;}.inv-m.print{max-width:880px;background:#fff;color:#0f172a;border:none;}' +
        '.inv-hd{display:flex;align-items:center;justify-content:space-between;padding:1.4rem 2rem;border-bottom:1px solid rgba(255,255,255,.08);gap:1rem;}' +
        '.inv-m.print .inv-hd{border-bottom:2px solid #e2e8f0;background:#fff;border-radius:16px 16px 0 0;}' +
        '.inv-ttl{font-size:1.15rem;font-weight:700;color:#D4AF37;}' +
        '.inv-x{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#94a3b8;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
        '.inv-x:hover{background:rgba(239,68,68,.15);color:#ef4444;}' +
        '.inv-m.print .inv-x{background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;}' +
        '.inv-bd2{padding:1.4rem 2rem;}' +
        '.inv-row{display:flex;gap:10px;margin-bottom:8px;align-items:center;}' +
        '.inv-inp{background:#0f172a;border:1px solid rgba(255,255,255,.12);border-radius:8px;color:#e2e8f0;padding:.5rem .7rem;font-size:.88rem;outline:none;width:100%;}' +
        '.inv-inp:focus{border-color:#D4AF37;}' +
        '.inv-inp.d{flex:1;}.inv-inp.p{width:140px!important;flex:none;}' +
        '.inv-del{background:transparent;border:none;color:#ef4444;font-size:1rem;cursor:pointer;padding:0 5px;opacity:.7;flex-shrink:0;}.inv-del:hover{opacity:1;}' +
        '.inv-add{width:100%;margin-top:8px;padding:.55rem;background:transparent;border:2px dashed rgba(212,175,55,.35);border-radius:8px;color:#D4AF37;cursor:pointer;font-size:.84rem;font-weight:600;}' +
        '.inv-add:hover{background:rgba(212,175,55,.06);border-color:rgba(212,175,55,.6);}' +
        '.inv-tot{display:flex;justify-content:space-between;align-items:center;padding:.9rem 1.2rem;background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.2);border-radius:10px;margin-top:1.2rem;}' +
        '.inv-tot-lbl{font-size:.8rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.05em;}' +
        '.inv-tot-val{font-size:1.3rem;font-weight:800;color:#D4AF37;}' +
        '.inv-ft{display:flex;justify-content:flex-end;gap:.7rem;padding:1rem 2rem 1.4rem;border-top:1px solid rgba(255,255,255,.06);flex-wrap:wrap;}' +
        '.inv-m.print .inv-ft{border-top:1px solid #e2e8f0;background:#fff;border-radius:0 0 16px 16px;}' +
        '.inv-btn{padding:.55rem 1.3rem;border-radius:8px;font-size:.88rem;font-weight:600;cursor:pointer;border:none;transition:all .18s;}' +
        '.inv-btn.sec{background:rgba(255,255,255,.06);color:#cbd5e1;border:1px solid rgba(255,255,255,.12);}.inv-btn.sec:hover{background:rgba(255,255,255,.12);}' +
        '.inv-m.print .inv-btn.sec{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;}' +
        '.inv-btn.pri{background:linear-gradient(135deg,#D4AF37,#B8960C);color:#0f172a;font-weight:700;}.inv-btn.pri:hover{transform:translateY(-1px);}' +
        '.inv-hint{font-size:.8rem;color:#64748b;margin-bottom:1rem;}' +
        '.inv-pi{display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;margin-bottom:1.4rem;font-size:.88rem;}' +
        '.inv-tbl{width:100%;border-collapse:collapse;margin-bottom:1.4rem;font-size:.88rem;}' +
        '.inv-tbl th{background:#f8fafc;padding:.55rem 1rem;text-align:left;border-bottom:2px solid #e2e8f0;font-weight:700;color:#475569;}' +
        '.inv-tbl td{padding:.7rem 1rem;border-bottom:1px solid #f1f5f9;color:#1e293b;}' +
        '.inv-sum{background:#f8fafc;border-radius:10px;padding:1rem 1.2rem;width:250px;margin-left:auto;font-size:.88rem;}' +
        '.inv-sum-r{display:flex;justify-content:space-between;margin-bottom:.35rem;}' +
        '.inv-sum-t{display:flex;justify-content:space-between;padding-top:.5rem;border-top:2px solid #e2e8f0;font-size:1rem;font-weight:800;color:#dc2626;margin-top:.35rem;}' +
        '.inv-qr{display:flex;gap:1.4rem;align-items:flex-start;background:#f8fafc;border-radius:10px;padding:1rem 1.2rem;margin-top:1rem;}' +
        '.inv-bpaid{display:inline-block;background:#dcfce7;color:#166534;padding:.18rem .65rem;border-radius:999px;font-size:.75rem;font-weight:700;}' +
        '.inv-bunpaid{display:inline-block;background:#fee2e2;color:#991b1b;padding:.18rem .65rem;border-radius:999px;font-size:.75rem;font-weight:700;}' +
        '@media print{#inv-bd{background:transparent!important;position:static!important;display:block!important;padding:0!important;}' +
        '.inv-m{box-shadow:none!important;max-height:none!important;overflow:visible!important;border:none!important;animation:none!important;}' +
        '.inv-x,.inv-ft,.inv-hint{display:none!important;}}';

    function injectCSS() {
        if (document.getElementById('inv-css')) return;
        var s = document.createElement('style'); s.id = 'inv-css'; s.textContent = CSS;
        document.head.appendChild(s);
    }
    var bd = null;
    function getBd() {
        if (bd && bd.isConnected) return bd;
        injectCSS();
        bd = document.createElement('div'); bd.id = 'inv-bd';
        bd.addEventListener('click', function(e) { if (e.target === bd) closeAll(); });
        document.body.appendChild(bd); return bd;
    }
    function closeAll() {
        if (!bd) return; bd.classList.remove('open');
        setTimeout(function() { if (bd) bd.innerHTML = ''; }, 180);
    }
    function fmt(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
    function getCurEv() {
        var id = window.activeCommandCenterEventId, db = window.adminEventsDb;
        if (!id || !db) return null;
        return db.find(function(e) { return String(e.id) === String(id); }) || null;
    }
    function getSett() {
        var s = window.adminCmsSettings || {};
        var bio = (window.cmsConfig && window.cmsConfig.bio) ? window.cmsConfig.bio : {};
        var pay = window.mcGlobalPaymentSettings || {};
        var account = (pay.accounts && pay.accounts.length > 0) ? pay.accounts[0] : {};
        
        return { 
            co: s.companyName || 'MC Connect', 
            artist: bio.name || s.artistName || '',
            ph: bio.no_telp || s.phone || '-', 
            em: bio.email || s.email || '-',
            bk: account.bank || s.bankName || 'BCA', 
            ac: account.number || s.bankAccount || '-', 
            ho: account.name || s.bankHolder || '-' 
        };
    }
    
    function getClientPkg(ev) {
        if (!ev) return 'Jasa MC & Entertainment';
        var cust = null;
        try {
            var custs = window.mcCustomers || [];
            cust = custs.find(function(c) { return String(c.id) === String(ev.customerId) || String(c.id) === String(ev.id) || (c.date === ev.date && c.event === ev.title); });
        } catch(e) {}
        var pkg = cust ? (cust.category || cust.package) : ev.category;
        return pkg ? 'Paket ' + pkg : 'Jasa MC & Entertainment';
    }

    // ── EDIT MODAL ──────────────────────────────
    function mkRow(list, desc, price) {
        var row = document.createElement('div'); row.className = 'inv-row';
        var di = document.createElement('input'); di.type = 'text'; di.className = 'inv-inp d';
        di.value = desc || ''; di.placeholder = 'Deskripsi layanan';
        var pi = document.createElement('input'); pi.type = 'number'; pi.className = 'inv-inp p'; pi.value = price || 0;
        pi.addEventListener('input', calcTot);
        var del = document.createElement('button'); del.className = 'inv-del'; del.textContent = '\u2715';
        del.addEventListener('click', function() { row.remove(); calcTot(); });
        row.appendChild(di); row.appendChild(pi); row.appendChild(del); list.appendChild(row);
    }
    function calcTot() {
        var modal = document.querySelector('#inv-bd .edit'); if (!modal) return 0;
        var t = 0; modal.querySelectorAll('.inv-inp.p').forEach(function(i) { t += parseInt(i.value) || 0; });
        var d = modal.querySelector('#inv-tot-v'); if (d) d.textContent = fmt(t);
        
        // Update cashier calc
        var dpInp = modal.querySelector('#inv-dp-manual');
        var sisaEl = modal.querySelector('#inv-sisa-v');
        var sisaLbl = modal.querySelector('#inv-sisa-lbl');
        if (dpInp && sisaEl && sisaLbl) {
            var addedPayment = dpInp.value ? parseInt(dpInp.value) : 0;
            var histDp = dpInp.dataset.histDp ? parseInt(dpInp.dataset.histDp) : 0;
            var dibayar = histDp + addedPayment;
            var sisa = t - dibayar;
            if (sisa < 0) {
                sisaLbl.textContent = 'Kembalian';
                sisaLbl.style.color = '#10b981';
                sisaEl.textContent = fmt(Math.abs(sisa));
                sisaEl.style.color = '#10b981';
            } else {
                sisaLbl.textContent = 'Sisa Tagihan';
                sisaLbl.style.color = '#94a3b8';
                sisaEl.textContent = fmt(sisa);
                sisaEl.style.color = '#f8fafc';
            }
        }
        return t;
    }
    function buildEdit(ev) {
        var items = (ev && ev.invoiceItems && ev.invoiceItems.length > 0)
            ? ev.invoiceItems : [{ desc: ev ? getClientPkg(ev) : '', price: (ev && ev.rawPrice) || 0 }];
        var m = document.createElement('div'); m.className = 'inv-m edit';
        var hd = document.createElement('div'); hd.className = 'inv-hd';
        var ttl = document.createElement('div'); ttl.className = 'inv-ttl'; 
        if (ev) {
            var invN = 'INV-MC-' + String(ev.dbEventId || ev.id).replace('v_', '').padStart(4, '0');
            ttl.innerHTML = 'Edit Rincian Invoice <div style="font-size:0.8rem;color:#64748b;font-weight:400;margin-top:6px;line-height:1.4;">' + invN + ' <br> ' + (ev.title||'Acara') + ' &bull; ' + (ev.pic||'PIC') + '</div>';
        } else {
            ttl.textContent = 'Edit Rincian Invoice';
        }
        var xb = document.createElement('button'); xb.className = 'inv-x'; xb.textContent = '\u2715'; xb.addEventListener('click', closeAll);
        hd.appendChild(ttl); hd.appendChild(xb); m.appendChild(hd);
        var body = document.createElement('div'); body.className = 'inv-bd2';
        var hint = document.createElement('p'); hint.className = 'inv-hint'; hint.textContent = 'Tambah, ubah, atau hapus baris. Total dihitung otomatis.';
        body.appendChild(hint);
        var list = document.createElement('div'); items.forEach(function(it) { mkRow(list, it.desc, it.price); }); body.appendChild(list);
        var addBtn = document.createElement('button'); addBtn.className = 'inv-add'; addBtn.textContent = '+ Tambah Baris Item';
        addBtn.addEventListener('click', function() { mkRow(list, '', 0); calcTot(); }); body.appendChild(addBtn);
        var tb = document.createElement('div'); tb.className = 'inv-tot';
        var tl = document.createElement('div'); tl.className = 'inv-tot-lbl'; tl.textContent = 'Total Nilai Kontrak';
        var tv = document.createElement('div'); tv.className = 'inv-tot-val'; tv.id = 'inv-tot-v'; tv.textContent = fmt(0);
        tb.appendChild(tl); tb.appendChild(tv); body.appendChild(tb); 

        var paymentHistory = (ev && ev.metadata && Array.isArray(ev.metadata.payment_history)) ? ev.metadata.payment_history : [];
        if (paymentHistory.length > 0) {
            var histHtml = '<div style="margin-top:1.5rem; margin-bottom:0.5rem; padding:1rem; border-radius:8px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05);">';
            histHtml += '<div style="font-size:0.75rem; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-bottom:0.8rem; letter-spacing:0.5px;">Riwayat Pembayaran (' + paymentHistory.length + ' Transaksi)</div>';
            
            paymentHistory.forEach(function(ph, idx) {
                var lbl = ph.label ? ph.label : ('Pembayaran ke-' + (idx+1));
                var dateStr = ph.date ? ph.date : '';
                histHtml += '<div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0; border-bottom:' + (idx < paymentHistory.length-1 ? '1px dotted rgba(255,255,255,0.1)' : 'none') + ';">' + 
                    '<div style="color:#cbd5e1; font-size:0.85rem;">' + lbl + ' <span style="color:#64748b; font-size:0.75rem; margin-left:0.5rem;">' + dateStr + '</span></div>' +
                    '<div style="color:#10B981; font-weight:700; font-size:0.9rem;">+ ' + fmt(ph.amount) + '</div>' +
                    '</div>';
            });
            
            histHtml += '</div>';
            
            var histContainer = document.createElement('div');
            histContainer.innerHTML = histHtml;
            body.appendChild(histContainer);
        }

        // Fixed DP Input -> JUMLAH DIBAYAR
        var dpContainer = document.createElement('div');
        dpContainer.style.marginTop = '1rem';
        dpContainer.innerHTML = '<label style="display:block; font-size:0.85rem; color:#D4AF37; margin-bottom:0.6rem; font-weight:800; text-transform:uppercase;">TAMBAH PEMBAYARAN BARU</label>' +
            '<input type="number" id="inv-dp-manual" class="inv-inp-dp" placeholder="Ketik nominal bayar (misal: 1000000)" style="width:100%; border:2px solid rgba(212,175,55,0.4); background:rgba(0,0,0,0.3); color:#f8fafc; padding:0.8rem 1rem; border-radius:8px; font-weight:800; font-size:1.4rem; text-align:right; letter-spacing:1px; outline:none; transition:all 0.2s;">' + 
            '<div style="font-size:0.75rem; color:#64748b; margin-top:0.5rem; text-align:right;">Kosongkan jika hanya ingin mengedit rincian tanpa menambah pembayaran.</div>';
        
        var trueHistDp = paymentHistory.reduce(function(sum, ph) { return sum + Number(ph.amount); }, 0);
        var initDp = trueHistDp > 0 ? trueHistDp : ((ev && ev.metadata && typeof ev.metadata.nominal_dp !== 'undefined') ? Number(ev.metadata.nominal_dp) : 0);
        var dpInpEl = dpContainer.querySelector('#inv-dp-manual');
        dpInpEl.dataset.histDp = initDp;
        dpInpEl.value = '';
        dpInpEl.addEventListener('input', calcTot);
        body.appendChild(dpContainer);
        
        // Sisa Tagihan / Kembalian Calculation
        var sisaContainer = document.createElement('div');
        sisaContainer.className = 'inv-tot';
        sisaContainer.style.marginTop = '0.5rem';
        sisaContainer.style.background = 'rgba(0,0,0,0.4)';
        sisaContainer.style.borderTop = 'none';
        
        var sisaLbl = document.createElement('div');
        sisaLbl.className = 'inv-tot-lbl';
        sisaLbl.id = 'inv-sisa-lbl';
        sisaLbl.textContent = 'Sisa Tagihan';
        
        var sisaVal = document.createElement('div');
        sisaVal.className = 'inv-tot-val';
        sisaVal.id = 'inv-sisa-v';
        sisaVal.style.fontSize = '1.3rem';
        sisaVal.textContent = fmt(0);
        
        sisaContainer.appendChild(sisaLbl);
        sisaContainer.appendChild(sisaVal);
        body.appendChild(sisaContainer);
        
        m.appendChild(body);

        var ft = document.createElement('div'); ft.className = 'inv-ft';
        var can = document.createElement('button'); can.className = 'inv-btn sec'; can.textContent = 'Batal'; can.addEventListener('click', closeAll);
        var sav = document.createElement('button'); sav.className = 'inv-btn pri'; sav.textContent = 'Simpan & Update';
        sav.addEventListener('click', function() { doSave(m, ev, sav); });
        ft.appendChild(can); ft.appendChild(sav); m.appendChild(ft);
        setTimeout(calcTot, 0); return m;
    }
    async function doSave(modal, ev, btn) {
        btn.textContent = 'Menyimpan...'; btn.disabled = true;
        var t = calcTot(); var descs = modal.querySelectorAll('.inv-inp.d'); var prices = modal.querySelectorAll('.inv-inp.p');
        var items = []; for (var i = 0; i < descs.length; i++) { if(!descs[i].value && !prices[i].value) continue; items.push({ desc: descs[i].value, price: parseInt(prices[i].value) || 0 }); }
        
        var dpInp = modal.querySelector('#inv-dp-manual');
        var addedPayment = dpInp.value ? parseInt(dpInp.value) : 0;
        var histDp = dpInp.dataset.histDp ? parseInt(dpInp.dataset.histDp) : 0;
        var customDp = histDp + addedPayment;
        if (!ev) { closeAll(); return; }
        ev.invoiceItems = items; ev.rawPrice = t;
        try {
            var tm = document.querySelector('meta[name="csrf-token"]'); var tk = tm ? tm.getAttribute('content') : '';
            var payload = { nilai_kontrak: t, metadata: Object.assign({}, ev.metadata, { invoice_items: items, nominal_dp: customDp }) };
            var res = await fetch('/api/cms/events/' + ev.id, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': tk }, body: JSON.stringify(payload) });
            if (res.ok) {
                var json = await res.json().catch(function(){return {};});
                var newId = (json.data && json.data.id) ? json.data.id : ev.id;
                closeAll();
                if (typeof window.showToast === 'function') window.showToast('Invoice diperbarui! Total: ' + fmt(t)); else alert('Invoice disimpan! Total: ' + fmt(t));
                if (typeof window.loadCustomersData === 'function') { await window.loadCustomersData(); }
                if (typeof window.loadUnifiedEventsDatabase === 'function') { await window.loadUnifiedEventsDatabase(); }
                if (typeof window.switchCommandCenterEvent === 'function') window.switchCommandCenterEvent(newId);
            } else { throw new Error('HTTP ' + res.status); }
        } catch(err) { alert('Gagal: ' + err.message); btn.textContent = 'Simpan & Update'; btn.disabled = false; }
    }

    // ── PRINT MODAL ─────────────────────────────
    function buildPrint(ev) {
        var s = getSett(); var total = Number(ev.rawPrice || 0);
        var paymentHistory = (ev.metadata && Array.isArray(ev.metadata.payment_history)) ? ev.metadata.payment_history : [];
        var trueHistDp = paymentHistory.reduce(function(sum, ph) { return sum + Number(ph.amount); }, 0);
        var dp = trueHistDp > 0 ? trueHistDp : ((ev.metadata && typeof ev.metadata.nominal_dp !== 'undefined') ? Number(ev.metadata.nominal_dp) : 0);
        var isLunas = ev.paymentStatus && ev.paymentStatus.toLowerCase().includes('lunas');
        if (isLunas && dp < total && total > 0) dp = total; // Fallback if manually marked lunas
        var sisa = total - dp;
        var paid = sisa <= 0;
        var invN = 'INV-MC-' + String(ev.dbEventId || ev.id).replace('v_', '').padStart(4, '0');
        var items = (ev.invoiceItems && ev.invoiceItems.length > 0) ? ev.invoiceItems : [{ desc: getClientPkg(ev), price: total }];
        var rows = items.map(function(it) { return '<tr><td>' + (it.desc || '-') + '</td><td style="text-align:right;font-weight:700;">' + fmt(it.price) + '</td></tr>'; }).join('');
        var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(invN);
        var wa = (ev.metadata && ev.metadata.pic_wa) ? 'WA: ' + ev.metadata.pic_wa : '';
        var venue = (ev.metadata && ev.metadata.venue) ? ' \u00b7 ' + ev.metadata.venue : '';
        var paymentRows = '';
        if (ev.metadata && ev.metadata.payment_history && ev.metadata.payment_history.length > 0) {
            paymentRows = ev.metadata.payment_history.map(function(ph) {
                var d = ph.date.split(' ')[0]; // Ensure just date
                return '<div class="inv-sum-r" style="color:#64748b; font-size:0.82rem; margin-top:0.2rem;"><span>' + (ph.label || 'Pembayaran') + ' (' + d + '):</span><strong>- ' + fmt(ph.amount) + '</strong></div>';
            }).join('');
        }
        var m = document.createElement('div'); m.className = 'inv-m print';
        m.innerHTML = '<div class="inv-hd"><div><div style="font-size:1.45rem;font-weight:800;color:#D4AF37;">' + s.co + '</div>' + (s.artist ? '<div style="font-size:1.05rem;font-weight:700;color:#1e293b;margin-bottom:0.2rem;margin-top:0.1rem;">' + s.artist + '</div>' : '') + '<div style="font-size:.78rem;color:#64748b;">' + s.ph + ' \u00b7 ' + s.em + '</div></div><div style="text-align:right;margin-right:.5rem;"><div style="font-size:1rem;font-weight:800;color:#1e293b;">' + invN + '</div><span class="' + (paid ? 'inv-bpaid' : 'inv-bunpaid') + '">' + (paid ? 'LUNAS' : 'UNPAID') + '</span></div><button class="inv-x" id="inv-xp" style="background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;">\u2715</button></div><div class="inv-bd2"><div class="inv-pi"><div><div style="font-size:.72rem;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:.2rem;">Ditujukan Kepada</div><div style="font-size:.95rem;font-weight:700;color:#1e293b;">' + (ev.pic || 'Nama Klien') + '</div><div style="font-size:.82rem;color:#64748b;">' + wa + '</div></div><div><div style="font-size:.72rem;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:.2rem;">Detail Acara</div><div style="font-size:.95rem;font-weight:700;color:#1e293b;">' + (ev.title || '-') + '</div><div style="font-size:.82rem;color:#64748b;">' + (ev.date || '') + ' ' + (ev.time || '') + venue + '</div></div></div><table class="inv-tbl"><thead><tr><th>Deskripsi Layanan</th><th style="text-align:right;">Subtotal</th></tr></thead><tbody>' + rows + '</tbody></table><div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;"><div class="inv-qr" style="flex:1;min-width:210px;"><img style="width:88px;height:88px;" src="' + qrUrl + '" alt="QRIS"><div style="font-size:.8rem;color:#475569;line-height:1.6;"><strong style="color:#0f172a;">Transfer / QRIS:</strong><br>Bank: ' + s.bk + '<br>No. Rek: ' + s.ac + '<br>A/N: ' + s.ho + '</div></div><div class="inv-sum"><div class="inv-sum-r"><span>Total Kontrak:</span><strong>' + fmt(total) + '</strong></div>' + paymentRows + '<div class="inv-sum-r" style="color:#16a34a; border-top:1px dashed #e2e8f0; padding-top:0.4rem; margin-top:0.4rem;"><span>Total Telah Dibayar:</span><strong>- ' + fmt(dp) + '</strong></div><div class="inv-sum-t"><span style="color:' + (sisa < 0 ? '#16a34a' : '') + '">' + (sisa < 0 ? 'Kembalian:' : 'Sisa Tagihan:') + '</span><span style="color:' + (sisa < 0 ? '#16a34a' : '') + '">' + fmt(Math.abs(sisa)) + '</span></div></div></div></div><div class="inv-ft"><button class="inv-btn sec" id="inv-cp" style="background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;">Tutup</button><button class="inv-btn pri" onclick="window.print()">Cetak / Simpan PDF</button></div>';
        m.querySelector('#inv-xp').addEventListener('click', closeAll);
        m.querySelector('#inv-cp').addEventListener('click', closeAll);
        return m;
    }

    // ── PUBLIC API ───────────────────────────────
    window.openEditInvoiceModal = function() {
        var b = getBd(); b.innerHTML = ''; b.appendChild(buildEdit(getCurEv())); b.classList.add('open');
    };
    window.openInvoicePrintModal = function() {
        var ev = getCurEv();
        if (!ev) { (typeof window.uiAlert === 'function' ? window.uiAlert : alert)('Pilih acara terlebih dahulu!'); return; }
        var b = getBd(); b.innerHTML = ''; b.appendChild(buildPrint(ev)); b.classList.add('open');
    };
    window.openInvoiceForEvent = function(ev) {
        if (!ev) return;
        var b = getBd(); b.innerHTML = ''; b.appendChild(buildPrint(ev)); b.classList.add('open');
    };
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeAll(); });
    console.log('[InvoiceModal v1.0] Ready.');
})();

