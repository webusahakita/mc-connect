const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

const rendererCode = `
window.renderMusicBankSection = async function() {
    const bank = window.getGlobalMusicBank();
    let html = '<div style="width:100%;">';
    if (bank.length === 0) {
        html += '<div style="text-align:center; padding:3rem; background:rgba(255,255,255,0.02); border-radius:12px; color:var(--adm-text-muted);">Bank musik masih kosong.<br><br>Untuk menambah lagu, silakan gunakan tombol + Tambah Lagu pada Acara.</div>';
    } else {
        html += '<table class="ecc-table" style="width:100%; text-align:left; border-collapse:collapse;">';
        html += '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><th style="padding:1rem;">Detail Musik / Audio</th><th style="padding:1rem;">Tipe</th><th style="padding:1rem; text-align:right;">Aksi</th></tr></thead>';
        html += '<tbody>';
        
        bank.forEach((m, idx) => {
            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background=\\'rgba(255,255,255,0.02)\\'" onmouseout="this.style.background=\\'transparent\\'">';
            html += '<td style="padding:1rem;">';
            html += '<div style="font-weight:700; font-size:1.05rem; color:#FFF; margin-bottom:0.3rem;">' + m.title + '</div>';
            html += '<div style="font-size:0.85rem; color:var(--adm-gold);">' + (m.artist || 'Unknown') + '</div>';
            html += '<div style="font-size:0.75rem; color:var(--adm-text-secondary); margin-top:0.3rem;">' + (m.url_link ? '&#128279; ' + m.url_link : (m.file_upload ? '&#128194; ' + m.file_upload : '')) + '</div>';
            html += '</td>';
            html += '<td style="padding:1rem;"><span style="background:rgba(255,255,255,0.1); color:#E5E7EB; padding:0.25rem 0.6rem; border-radius:9999px; font-size:0.75rem;">' + (m.type || 'Lainnya') + '</span></td>';
            html += '<td style="padding:1rem; text-align:right; white-space:nowrap;">';
            html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteMusicBankItemSection(' + idx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);" title="Hapus">🗑️ Hapus</button>';
            html += '</td>';
            html += '</tr>';
        });
        html += '</tbody></table>';
    }
    html += '</div>';
    
    document.getElementById('musicBankSectionBody').innerHTML = html;
};

window.deleteMusicBankItemSection = async function(idx) {
    const bank = window.getGlobalMusicBank();
    if (await window.uiConfirm('Hapus lagu ini dari Master Bank Musik? Lagu yang sudah terpakai di Acara tidak akan terpengaruh.')) {
        bank.splice(idx, 1);
        window.saveGlobalMusicBank(bank);
        window.renderMusicBankSection();
        if (typeof window.showToast === 'function') window.showToast('Lagu berhasil dihapus dari bank', 'red');
    }
};
`;

code += '\n' + rendererCode;
fs.writeFileSync('public/js/admin-core.js', code);
console.log('Appended renderMusicBankSection to admin-core.js');
