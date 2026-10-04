const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');
const scriptTagIndex = html.indexOf('js/admin-core.js');

if (scriptTagIndex !== -1) {
    const musicBankSection = `
            <!-- ================= MENU 7: MUSIC BANK (GLOBAL) ================= -->
            <div id="sec-musicbank" class="admin-section" style="display:none;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <div style="color:var(--gold-primary); font-size:0.85rem; font-weight:700; text-transform:uppercase;">
                            Koleksi Musik & Audio
                        </div>
                        <h1 style="font-size:2rem; font-weight:800;">Master Bank Musik</h1>
                        <p style="color:var(--text-secondary); font-size:0.9rem;">
                            Kelola seluruh koleksi bank lagu, musik latar, dan soundboard di sini.
                        </p>
                    </div>
                    <button class="btn btn-primary" onclick="window.uiAlert('Untuk menambah lagu ke bank, gunakan tombol + Tambah Lagu pada acara, dan pilih Opsi \\'Simpan ke Bank Musik Master\\'.')">+ Cara Tambah Lagu</button>
                </div>
                
                <div class="ecc-card" style="padding:1.5rem;">
                    <div id="musicBankSectionBody"></div>
                </div>
            </div>
    `;
    let injectionIndex = html.lastIndexOf('</div>', scriptTagIndex);
    if (injectionIndex !== -1) {
        html = html.slice(0, injectionIndex) + musicBankSection + html.slice(injectionIndex);
    }
    html = html.replace(/onclick="window\.openManageMusicBank\(\)"/g, 'onclick="navigateToSection(\'sec-musicbank\', this); window.renderMusicBankSection();"');
    fs.writeFileSync('public/admin.html', html);
    console.log('Successfully injected sec-musicbank');
}
