const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Replace specific td definitions inside the globalWardrobeTableBody loop
// using targeted string replacements.

let newCode = code;

// 1. Column 1 (Foto)
newCode = newCode.replace('<td style="padding:1rem 0.5rem;">\' + (item.imgUrl ?', '<td style="padding:1rem 0.5rem; min-width:70px;">\' + (item.imgUrl ?');

// 2. Column 2 (Nama/ID)
newCode = newCode.replace('<td style="padding:1rem 0.5rem;"><div style="font-weight:700; font-size:1.05rem; color:var(--adm-gold, #D4AF37);">\' + escapeHtml(item.name || \'-\')', '<td style="padding:1rem 0.5rem; min-width:180px; white-space:nowrap;"><div style="font-weight:700; font-size:1.05rem; color:var(--adm-gold, #D4AF37);">\' + escapeHtml(item.name || \'-\')');

// 3. Column 3 (Deskripsi)
newCode = newCode.replace('<td style="padding:1rem 0.5rem; max-width:250px; line-height:1.4; color:rgba(255,255,255,0.8);">\' + escapeHtml(item.desc || \'-\')', '<td style="padding:1rem 0.5rem; min-width:250px; max-width:300px; line-height:1.5; color:rgba(255,255,255,0.8); white-space:normal; word-wrap:break-word;">\' + escapeHtml(item.desc || \'-\')');

// 4. Column 4 (Kategori)
newCode = newCode.replace('<td style="padding:1rem 0.5rem;"><span style="display:inline-block; padding:0.4rem 0.8rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:20px; font-size:0.8rem; font-weight:600;">\' + escapeHtml(item.colorName || \'-\')', '<td style="padding:1rem 0.5rem; min-width:140px; white-space:nowrap;"><span style="display:inline-block; padding:0.4rem 0.8rem; text-align:center; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:20px; font-size:0.8rem; font-weight:600;">\' + escapeHtml(item.colorName || \'-\')');

// 5. Column 5 (Warna)
newCode = newCode.replace('<td style="padding:1rem 0.5rem;"><span style="display:inline-flex; align-items:center; gap:6px; font-size:0.85rem; font-weight:600;">\' + (item.colorHex', '<td style="padding:1rem 0.5rem; min-width:120px; white-space:nowrap;"><span style="display:inline-flex; align-items:center; gap:6px; font-size:0.85rem; font-weight:600;">\' + (item.colorHex');

// 6. Column 6 (Status)
newCode = newCode.replace('<td style="padding:1rem 0.5rem;"><span class="badge" style="background:\'+ (item.status === \'Siap Pakai\'', '<td style="padding:1rem 0.5rem; min-width:140px; white-space:nowrap; text-align:center;"><span class="badge" style="background:\'+ (item.status === \'Siap Pakai\'');

// 7. Column 7 (Frekuensi)
newCode = newCode.replace('<td style="padding:1rem 0.5rem; text-align:center;"><div style="font-size:1.2rem; font-weight:800; color:#fff;">\' + freq + \'x</div>', '<td style="padding:1rem 0.5rem; text-align:center; min-width:120px; white-space:nowrap;"><div style="font-size:1.2rem; font-weight:800; color:#fff;">\' + freq + \'x</div>');

// 8. Column 8 (Aksi)
newCode = newCode.replace('<td style="padding:1rem 0.5rem; text-align:right;">\' +\n                            `<button', '<td style="padding:1rem 0.5rem; text-align:right; min-width:180px; white-space:nowrap;">\' +\n                            `<button');


if (newCode !== code) {
    fs.writeFileSync('public/js/admin-core.js', newCode, 'utf8');
    console.log('Successfully patched wardrobe table layout.');
} else {
    console.log('No replacements were made. String mismatch.');
}
