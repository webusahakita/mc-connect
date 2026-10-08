const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'public', 'js', 'admin-core.js');
let content = fs.readFileSync(filePath, 'utf-8');

const regex = /window\.openRundownPrintModal\s*=\s*(?:async\s*)?function\(\)\s*\{[\s\S]*?rdContainer\.classList\.add\('open'\);\n\s*\} catch \(err\) \{[\s\S]*?\n\s*\};?/m;

const replacement = `window.openRundownPrintModal = async function() {
    const eventId = window.activeCommandCenterEventId || (window.currentEventObj ? window.currentEventObj.id : null);
    if (!eventId) {
        if(typeof uiAlert === 'function') uiAlert('Belum ada acara yang dipilih!', 'Peringatan');
        else alert('Belum ada acara yang dipilih!');
        return;
    }

    try {
        // Fetch all events from server and find the specific event (since /api/cms/events/{id} might not exist)
        const evRes = await fetch('/api/cms/events');
        if (!evRes.ok) throw new Error('Gagal memuat acara');
        const evData = await evRes.json();
        const eventsList = evData.data || evData || [];
        const ev = eventsList.find(e => String(e.id) === String(eventId));
        
        if (!ev || !ev.rundown || ev.rundown.length === 0) {
            if(typeof uiAlert === 'function') uiAlert('Rundown masih kosong atau belum ada data dari server!', 'Info');
            else alert('Rundown masih kosong atau belum ada data dari server!');
            return;
        }

        // Fetch biodata (MC Info) from server
        const bioRes = await fetch('/api/cms/biodata');
        const bio = bioRes.ok ? await bioRes.json() : {};

        let rdContainer = document.getElementById('rd-print-overlay');
        if (!rdContainer) {
            rdContainer = document.createElement('div');
            rdContainer.id = 'rd-print-overlay';
            
            // Inject CSS for printing
            const style = document.createElement('style');
            style.innerHTML = \`
                #rd-print-overlay { display:none; position:fixed; inset:0; z-index:999990; background:rgba(15,23,42,0.9); backdrop-filter:blur(5px); align-items:center; justify-content:center; padding:1.5rem; }
                #rd-print-overlay.open { display:flex !important; }
                .rd-m { background:#fff; color:#1e293b; width:100%; max-width:1200px; max-height:90vh; overflow-y:auto; border-radius:12px; font-family:'Inter', sans-serif; position:relative; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); }
                
                /* Print Top Bar (Screen Only) */
                .rd-top-bar { display:flex; justify-content:space-between; align-items:center; padding:1rem 2rem; background:#f8fafc; border-bottom:1px dashed #cbd5e1; position:sticky; top:0; z-index:10; }
                .rd-tips { font-size:0.85rem; color:#64748b; display:flex; align-items:center; gap:0.5rem; }
                .rd-actions { display:flex; gap:1rem; align-items:center; }
                .rd-btn-close { background:transparent; color:#94a3b8; border:none; cursor:pointer; font-size:0.9rem; font-weight:600; padding:0.5rem 1rem; border-radius:6px; transition:all 0.2s; }
                .rd-btn-close:hover { background:#f1f5f9; color:#475569; }
                .rd-btn-print { background:linear-gradient(135deg,#D4AF37,#B8960C); color:#000; padding:0.6rem 1.2rem; border-radius:6px; font-weight:700; cursor:pointer; border:none; display:flex; align-items:center; gap:0.5rem; box-shadow:0 4px 6px -1px rgba(212,175,55,0.3); transition:all 0.2s; }
                .rd-btn-print:hover { transform:translateY(-1px); box-shadow:0 6px 8px -1px rgba(212,175,55,0.4); }

                /* Print Document Body */
                .rd-bd { padding:3rem; background:#fff; }
                
                /* Header Document */
                .rd-doc-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; }
                .rd-doc-title h1 { margin:0 0 0.25rem 0; font-size:1.8rem; font-weight:800; color:#0f172a; letter-spacing:-0.5px; }
                .rd-doc-title h2 { margin:0 0 0.5rem 0; font-size:1.1rem; font-weight:700; color:#d97706; text-transform:uppercase; letter-spacing:0.5px; }
                .rd-doc-title p { margin:0; font-size:0.9rem; color:#64748b; }
                .rd-doc-meta { text-align:right; }
                .rd-doc-id { display:inline-block; border:1px solid #cbd5e1; padding:0.4rem 1rem; border-radius:6px; font-weight:700; color:#334155; font-size:0.9rem; margin-bottom:0.5rem; background:#f8fafc; }
                .rd-doc-date { font-size:0.8rem; color:#94a3b8; }

                /* Info Box */
                .rd-info-box { border:1px solid #e2e8f0; border-radius:8px; padding:1.5rem; display:flex; margin-bottom:2rem; background:#f8fafc; }
                .rd-info-left { flex:1; border-right:1px dashed #cbd5e1; padding-right:1.5rem; }
                .rd-info-right { flex:1; padding-left:1.5rem; }
                .rd-info-label { font-size:0.75rem; font-weight:700; color:#94a3b8; text-transform:uppercase; margin-bottom:0.25rem; letter-spacing:0.5px; }
                .rd-info-val-large { font-size:1.25rem; font-weight:700; color:#0f172a; margin-bottom:0.75rem; word-break:break-word; }
                .rd-info-val-large-client { font-size:1.1rem; font-weight:700; color:#0f172a; margin-bottom:0.5rem; word-break:break-word; }
                .rd-info-row { display:flex; gap:1.5rem; font-size:0.9rem; color:#475569; margin-bottom:0.5rem; }
                .rd-info-row span { display:flex; align-items:center; gap:0.4rem; }

                /* Table - added print-table class and white-space normal */
                .rd-table-print { width:100% !important; max-width:100%; border-collapse:collapse; font-size:0.85rem; table-layout:fixed; word-wrap:break-word; overflow-wrap:break-word; }
                .rd-table-print th { background:#0f172a !important; color:#f8fafc !important; font-weight:600; padding:0.75rem 0.5rem; text-align:left; border:1px solid #0f172a; white-space:normal !important; word-break:break-word !important; }
                .rd-table-print td { border:1px solid #e2e8f0; padding:0.75rem 0.5rem; vertical-align:top; color:#334155; line-height:1.4; word-wrap:break-word; overflow-wrap:break-word; white-space:normal !important; word-break:break-word !important; }
                .rd-table-print tr:nth-child(even) { background:#f8fafc; }
                .rd-table-print td.rd-time { font-weight:600; color:#0f172a; word-break:normal !important; }
                .rd-table-print td.rd-dur { color:#94a3b8; word-break:normal !important; }
                .rd-table-print td.rd-seg { font-weight:700; color:#0f172a; }
                .rd-table-print td.rd-script { color:#64748b; font-style:italic; }
                .rd-table-print td.rd-music { color:#0ea5e9; font-weight:500; font-size:0.8rem; }
                .rd-table-print td.rd-pic { color:#64748b; font-size:0.8rem; }

                /* Footer Signatures */
                .rd-footer { margin-top:3rem; padding-top:2rem; border-top:2px dashed #e2e8f0; display:flex; justify-content:space-between; text-align:center; page-break-inside: avoid; }
                .rd-sign-box { flex:1; padding:0 1rem; }
                .rd-sign-label { font-size:0.85rem; color:#64748b; margin-bottom:4rem; }
                .rd-sign-line { border-bottom:1px solid #0f172a; margin-bottom:0.5rem; margin-inline:auto; max-width:80%; }
                .rd-sign-name { font-weight:700; font-size:0.9rem; color:#0f172a; }

                @media print {
                    @page { size: A4 portrait; margin: 15mm 10mm; }
                    body > *:not(#rd-print-overlay) { display:none !important; }
                    #rd-print-overlay { position:static !important; background:transparent !important; display:block !important; padding:0 !important; overflow:visible !important; }
                    .rd-m { max-height:none !important; overflow:visible !important; border-radius:0 !important; max-width:100% !important; box-shadow:none !important; }
                    .rd-top-bar { display:none !important; }
                    .rd-bd { padding:0 !important; }
                    .rd-info-box { break-inside: avoid; }
                    .rd-table-print th { background:#0f172a !important; color:#fff !important; }
                    .rd-table-print tr { break-inside: avoid; page-break-inside: avoid; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            \`;
            document.head.appendChild(style);
            document.body.appendChild(rdContainer);
        }

        const mcName = bio.name || window.currentUser?.name || "Master of Ceremony";
        const mcPhone = bio.contact_whatsapp || bio.phone || window.currentUser?.phone || "-";
        
        let metadata = {};
        try {
            metadata = typeof ev.metadata === 'string' ? JSON.parse(ev.metadata) : (ev.metadata || {});
        } catch(e) {}
        
        const eventName = ev.title || 'Untitled Event';
        const eventDate = ev.date || '-';
        const eventTime = ev.time || '-';
        const eventVenue = metadata.venue || ev.venue || 'Venue TBD';
        const eventClient = metadata.client_name || ev.client || eventName;
        const eventPic = ev.pic || '-';
        const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const docId = 'DOC-RDN-' + (ev.id || Math.floor(Math.random()*1000).toString().padStart(3, '0'));

        let rowsHtml = '';
        ev.rundown.forEach((r, idx) => {
            let startTime = r.start_time || '';
            let endTime = r.end_time || '';
            let timeDisplay = startTime;
            if(startTime && endTime) timeDisplay = \`\${startTime} - \${endTime}\`;
            if(!timeDisplay) timeDisplay = '-';
            
            let durDisplay = r.time || '';
            if(durDisplay && !durDisplay.toLowerCase().includes('menit')) durDisplay += ' Menit';
            
            let titleDisplay = r.title || '-';
            let statusTag = '';
            if(r.status === 'done' || r.status === 'selesai' || String(r.status) === '1' || r.status === true) {
                 statusTag = '&nbsp;<span style="display:inline-block; padding:0.15rem 0.4rem; background:#dcfce7; color:#166534; font-size:0.65rem; font-weight:700; border-radius:4px; text-transform:uppercase; margin-top:4px;">✓ Selesai</span>';
            }

            const musicNote = r.cue_music ? \`🎵 \${r.cue_music}\` : '';
            
            rowsHtml += \`
                <tr>
                    <td style="text-align:center;">\${idx+1}</td>
                    <td class="rd-time">\${timeDisplay}</td>
                    <td class="rd-dur">\${durDisplay}</td>
                    <td class="rd-seg">\${titleDisplay}<br>\${statusTag}<div style="font-weight:400; font-size:0.8rem; color:#64748b; margin-top:4px;">\${r.notes || ''}</div></td>
                    <td class="rd-script">\${(r.prompter || '-').replace(/\\n/g, '<br>')}</td>
                    <td class="rd-music">\${musicNote}</td>
                    <td class="rd-pic">\${r.pic || '-'}</td>
                </tr>
            \`;
        });

        rdContainer.innerHTML = \`
            <div class="rd-m">
                <div class="rd-top-bar">
                    <div class="rd-tips">
                        💡 Tips: Gunakan opsi printer "Save as PDF" untuk mengunduh berkas PDF A4 siap cetak.
                    </div>
                    <div class="rd-actions">
                        <button class="rd-btn-close" onclick="document.getElementById('rd-print-overlay').classList.remove('open')">Tutup ✕</button>
                        <button class="rd-btn-print" onclick="window.print()">🖨️ Cetak Rundown Sekarang</button>
                    </div>
                </div>
                <div class="rd-bd">
                    <div class="rd-doc-header">
                        <div class="rd-doc-title">
                            <h1>MC-CONNECT PRO STAGE</h1>
                            <h2>LEMBAR KERJA RUNDOWN PANGGUNG & CUE SHEET RESMI</h2>
                            <p>Master of Ceremony: <strong>\${mcName}</strong> | WhatsApp: \${mcPhone}</p>
                        </div>
                        <div class="rd-doc-meta">
                            <div class="rd-doc-id">\${docId}</div>
                            <div class="rd-doc-date">Dicetak: \${today}</div>
                        </div>
                    </div>

                    <div class="rd-info-box">
                        <div class="rd-info-left">
                            <div class="rd-info-label">NAMA ACARA:</div>
                            <div class="rd-info-val-large">\${eventName}</div>
                            <div class="rd-info-row">
                                <span>📅 \${eventDate}</span>
                                <span>⏰ \${eventTime} WIB</span>
                            </div>
                            <div class="rd-info-row">
                                <span>📍 \${eventVenue}</span>
                            </div>
                        </div>
                        <div class="rd-info-right">
                            <div class="rd-info-label">KLIEN / PENYELENGGARA:</div>
                            <div class="rd-info-val-large-client">\${eventClient}</div>
                            <div style="font-size:0.85rem; color:#64748b; margin-top:0.5rem;">Kategori: Event &nbsp;&middot;&nbsp; PIC: \${eventPic}</div>
                        </div>
                    </div>

                    <table class="rd-table-print print-table">
                        <thead>
                            <tr>
                                <th style="width:4%; text-align:center;">No</th>
                                <th style="width:11%;">Waktu</th>
                                <th style="width:7%;">Durasi</th>
                                <th style="width:20%;">Segmen Acara</th>
                                <th style="width:34%;">Naskah & Panduan MC</th>
                                <th style="width:14%;">Cue Musik / Sound</th>
                                <th style="width:10%;">PIC</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${rowsHtml}
                        </tbody>
                    </table>

                    <div class="rd-footer">
                        <div class="rd-sign-box">
                            <div class="rd-sign-label">Master of Ceremony (MC):</div>
                            <div class="rd-sign-line"></div>
                            <div class="rd-sign-name">\${mcName}</div>
                        </div>
                        <div class="rd-sign-box">
                            <div class="rd-sign-label">Stage Manager / WO PIC:</div>
                            <div class="rd-sign-line"></div>
                            <div class="rd-sign-name">( ........................................ )</div>
                        </div>
                        <div class="rd-sign-box">
                            <div class="rd-sign-label">Klien / Tuan Rumah:</div>
                            <div class="rd-sign-line"></div>
                            <div class="rd-sign-name">( \${eventClient} )</div>
                        </div>
                    </div>
                </div>
            </div>
        \`;

        rdContainer.classList.add('open');
    } catch (err) {
        console.error(err);
        if(typeof uiAlert === 'function') uiAlert('Gagal mengambil data dari server. Pastikan koneksi stabil.', 'Error');
        else alert('Gagal mengambil data dari server.');
    }
};`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully applied patch_print_ui_v3.');
} else {
    console.log('Regex not found!');
}
