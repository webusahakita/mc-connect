const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

const replacement = `window.openRundownPrintModal = function() {
    const ev = window.dbEvents ? window.dbEvents.find(e => e.id === window.adminCurrentEventId) : null;
    if (!ev || !ev.rundown || ev.rundown.length === 0) {
        if(typeof uiAlert === 'function') uiAlert('Rundown masih kosong atau belum ada acara yang dipilih!', 'Info');
        else alert('Rundown masih kosong atau belum ada acara yang dipilih!');
        return;
    }

    let rdContainer = document.getElementById('rd-print-overlay');
    if (!rdContainer) {
        rdContainer = document.createElement('div');
        rdContainer.id = 'rd-print-overlay';
        
        // Inject CSS for printing
        const style = document.createElement('style');
        style.innerHTML = \`
            #rd-print-overlay { display:none; position:fixed; inset:0; z-index:999990; background:rgba(0,0,0,0.85); backdrop-filter:blur(5px); align-items:center; justify-content:center; padding:1rem; }
            #rd-print-overlay.open { display:flex !important; }
            .rd-m { background:#fff; color:#000; width:100%; max-width:1100px; max-height:95vh; overflow-y:auto; border-radius:12px; font-family:sans-serif; }
            .rd-hd { display:flex; justify-content:space-between; align-items:center; padding:1.5rem; border-bottom:2px solid #eee; position:sticky; top:0; background:#fff; z-index:10; }
            .rd-bd { padding:2rem; }
            .rd-tbl { width:100%; border-collapse:collapse; margin-top:1.5rem; font-size:13px; }
            .rd-tbl th, .rd-tbl td { border:1px solid #ccc; padding:10px; text-align:left; vertical-align:top; }
            .rd-tbl th { background:#f4f4f4; font-weight:bold; }
            .rd-btn { padding:0.6rem 1.2rem; border-radius:6px; font-weight:bold; cursor:pointer; border:none; }
            .rd-btn-close { background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; margin-right:10px; }
            .rd-btn-close:hover { background:#e2e8f0; }
            .rd-btn-print { background:linear-gradient(135deg,#D4AF37,#B8960C); color:#000; }
            .rd-btn-print:hover { filter: brightness(1.1); }
            
            @media print {
                @page { margin: 10mm; }
                body > *:not(#rd-print-overlay) { display:none !important; }
                #rd-print-overlay { position:static !important; background:transparent !important; display:block !important; padding:0 !important; }
                .rd-m { max-height:none !important; overflow:visible !important; border-radius:0 !important; max-width:100% !important; box-shadow:none !important; }
                .rd-hd { display:none !important; }
                .rd-bd { padding:0 !important; }
                .rd-tbl th, .rd-tbl td { border:1px solid #000; }
                .rd-tbl tr { page-break-inside: avoid; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
        \`;
        document.head.appendChild(style);
        document.body.appendChild(rdContainer);
    }

    let rowsHtml = '';
    ev.rundown.forEach((r, idx) => {
        const musicNote = r.music ? \`<br><small style="color:#2563eb;">🎵 \${r.music}</small>\` : '';
        rowsHtml += \`
            <tr>
                <td style="text-align:center;">\${idx+1}</td>
                <td style="white-space:nowrap;">\${r.time || '-'}</td>
                <td>
                    <strong>\${r.title || '-'}</strong>
                    <div style="font-size:0.9em; color:#444; margin-top:4px;">\${r.notes || ''}</div>
                    \${musicNote}
                </td>
                <td style="font-style:italic; color:#333;">\${r.teleprompter || ''}</td>
                <td>\${r.pic || ''}</td>
            </tr>
        \`;
    });

    const venue = ev.metadata && ev.metadata.venue ? ev.metadata.venue : '-';
    
    rdContainer.innerHTML = \`
        <div class="rd-m">
            <div class="rd-hd">
                <h2 style="margin:0; font-size:1.5rem; color:#000;">Preview Cetak Rundown</h2>
                <div>
                    <button class="rd-btn rd-btn-close" onclick="document.getElementById('rd-print-overlay').classList.remove('open')">Tutup</button>
                    <button class="rd-btn rd-btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
                </div>
            </div>
            <div class="rd-bd">
                <div style="text-align:center; margin-bottom:2rem; color:#000;">
                    <h1 style="margin:0 0 10px 0; font-size:1.8rem; text-transform:uppercase;">RUNDOWN ACARA</h1>
                    <h2 style="margin:0 0 8px 0; font-size:1.4rem; color:#333;">\${ev.title || 'Untitled Event'}</h2>
                    <p style="margin:0 0 5px 0; font-size:14px;"><strong>Tanggal:</strong> \${ev.date || '-'} | <strong>Waktu:</strong> \${ev.time || '-'} | <strong>Venue:</strong> \${venue}</p>
                    <p style="margin:0; font-size:14px;"><strong>PIC Acara:</strong> \${ev.pic || '-'}</p>
                </div>
                <table class="rd-tbl">
                    <thead>
                        <tr>
                            <th style="width:40px; text-align:center;">No</th>
                            <th style="width:100px;">Waktu</th>
                            <th style="width:250px;">Kegiatan & Catatan</th>
                            <th>Panduan MC (Cue Sheet)</th>
                            <th style="width:120px;">PIC</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${rowsHtml}
                    </tbody>
                </table>
            </div>
        </div>
    \`;

    rdContainer.classList.add('open');
};`;

code = code.replace(/window\.openRundownPrintModal\s*=\s*function\(\)\s*\{[\s\S]*?\};/, replacement);
fs.writeFileSync('public/js/admin-core.js', code);
console.log("Done updating window.openRundownPrintModal!");
