const fs = require('fs');
let c = fs.readFileSync('public/js/public-cms.js', 'utf8');
const startIdx = c.indexOf('function exportPressKitPDF');
const endIdx = c.indexOf('// Execute', startIdx);
const newCode = `function exportPressKitPDF() {
    if (typeof uiAlert === 'function' && typeof showToast === 'undefined') {
        window.showToast = uiAlert; // fallback
    } else if (typeof showToast !== 'function') {
        window.showToast = (msg) => alert(msg);
    }
    
    if (typeof showToast === 'function') showToast('Menyiapkan PDF...');
    
    const pk = cachedPressKitData;
    const riders = cachedRidersData;
    
    if (!pk || !pk.stageName) {
        if (typeof showToast === 'function') showToast('Data Press Kit belum dimuat atau kosong.', 'red');
        return;
    }

    const esc = (s) => !s ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const riderFooter = pk.ridersFooter || 'Rider ini bersifat fleksibel dan dapat didiskusikan.';

    let ridersRowsHtml = '';
    if (riders && riders.length > 0) {
        ridersRowsHtml = riders.map(r => {
            const lines = (r.notes || '').split('\\n').map(l => l.trim()).filter(l => l);
            const bulletHtml = lines.map(l => {
                const cleaned = l.replace(/^[•\\-]\\s*/, '');
                return \`<div style="margin-bottom:6px; padding-left:14px; text-indent:-14px; position:relative;">
                    <span style="position:absolute; left:0; color:#D4AF37;">•</span> \${esc(cleaned)}
                </div>\`;
            }).join('');
            return \`<tr>
                <td style="background:#0B101E; color:#fff; padding:12px 15px; font-weight:700; width:30%; vertical-align:top; border-bottom:1px solid #e0e0e0; font-size:0.9rem;">
                    \${esc(r.title)}
                </td>
                <td style="padding:12px 15px; vertical-align:top; border-bottom:1px solid #e0e0e0; font-size:0.85rem; color:#444; line-height:1.5;">
                    \${bulletHtml}
                </td>
            </tr>\`;
        }).join('');
    } else {
        ridersRowsHtml = \`<tr><td colspan="2" style="padding:12px 15px; text-align:center; color:#888;">Belum ada data event riders yang ditambahkan.</td></tr>\`;
    }

    // Call getPrintHtml which is available globally via utils.js
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

`;
c = c.substring(0, startIdx) + newCode + c.substring(endIdx);
fs.writeFileSync('public/js/public-cms.js', c);
