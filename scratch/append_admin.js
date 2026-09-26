function exportPressKitPDF() {
    if (typeof showToast === 'function') showToast('Menyiapkan PDF...', 'gold');
    
    const pk = getPressKitData();
    const riders = getRidersData();
    
    if (!pk.stageName) {
        if (typeof showToast === 'function') showToast('Data Press Kit belum dimuat atau kosong.', 'red');
        return;
    }

    const esc = (s) => !s ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const riderFooter = localStorage.getItem('appRidersFooter') || pk.ridersFooter || 'Rider ini bersifat fleksibel dan dapat didiskusikan.';

    const ridersRowsHtml = riders.map(r => {
        const lines = (r.notes || '').split('\n').map(l => l.trim()).filter(l => l);
        const bulletHtml = lines.map(l => {
            const cleaned = l.replace(/^[•\-]\s*/, '');
            return `<div style="margin-bottom:6px; padding-left:14px; text-indent:-14px; position:relative;">
                <span style="position:absolute; left:0; color:#D4AF37;">•</span> ${esc(cleaned)}
            </div>`;
        }).join('');
        return `<tr>
            <td style="background:#0B101E; color:#fff; padding:12px 15px; font-weight:700; width:30%; vertical-align:top; border-bottom:1px solid #e0e0e0; font-size:0.9rem;">
                ${esc(r.title)}
            </td>
            <td style="padding:12px 15px; vertical-align:top; border-bottom:1px solid #e0e0e0; font-size:0.85rem; color:#444; line-height:1.5;">
                ${bulletHtml}
            </td>
        </tr>`;
    }).join('');

    const html = getPrintHtml(pk, ridersRowsHtml, riderFooter);
    
    const popupFeatures = 'width=900,height=800,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes';
    const win = window.open('', 'ExportPDF', popupFeatures);
    
    if (!win) {
        if (typeof showToast === 'function') showToast('Pop-up diblokir browser. Harap izinkan pop-up.', 'red');
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
}
window.exportPressKitPDF = exportPressKitPDF;
window.generateAndDownloadPressKit = exportPressKitPDF;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        let localRiders = getRidersData();
        let needsSave = false;
        for (let r of localRiders) {
            if (!r.db_id && r.id !== 'rv_1' && r.id !== 'rv_2') {
                const formData = new FormData();
                formData.append('rider_key', r.id);
                formData.append('title', r.title);
                formData.append('notes', r.notes);
                const res = await fetch('/api/cms/riders', { method: 'POST', body: formData });
                const json = await res.json();
                if (json.success && json.data) {
                    r.db_id = json.data.db_id;
                    r.id = json.data.id;
                    needsSave = true;
                }
            }
        }
        if (needsSave) {
            saveRidersData(localRiders);
            console.log('Migrasi sinkronisasi riders lokal ke backend sukses!');
        }
    } catch(e) {
        console.error('Auto-sync riders gagal', e);
    }

    setTimeout(() => {
        loadPressKitFormData();
        renderRiders();
        const footerEl = document.getElementById('riders_footerNote');
        if (footerEl) { const s = localStorage.getItem(RIDERS_FOOTER_KEY); if (s) footerEl.value = s; }
    }, 500);
});

function navigateToSection(sectionId, btnElement) {
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(sec => sec.classList.remove('active'));
    const btns = document.querySelectorAll('.sidebar-item-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    const targetSec = document.getElementById(sectionId);
    if (targetSec) targetSec.classList.add('active');
    if (btnElement) {
        btnElement.classList.add('active');
    }
}
window.navigateToSection = navigateToSection;
