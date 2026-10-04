const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// First, strip ALL occurrences of sec-musicbank (we might have two)
// This regex removes from <!-- ================= MENU 7: MUSIC BANK (GLOBAL) ================= --> down to the closing </div> of sec-musicbank
// Wait, regex matching over multiple lines can be tricky. Let's just find the indexes.

function removeSection() {
    let startIdx = html.indexOf('<!-- ================= MENU 7: MUSIC BANK (GLOBAL) ================= -->');
    if (startIdx !== -1) {
        // Find the end of this div block. It has 3 nested divs, but we know it ends with:
        // <div id="musicBankSectionBody"></div>
        // </div>
        // </div>
        let endIdx = html.indexOf('</div>', html.indexOf('id="musicBankSectionBody"'));
        // this is the closing for musicBankSectionBody
        endIdx = html.indexOf('</div>', endIdx + 1); // closing for ecc-card
        endIdx = html.indexOf('</div>', endIdx + 1); // closing for sec-musicbank
        
        if (endIdx !== -1) {
            html = html.substring(0, startIdx) + html.substring(endIdx + 6);
            return true;
        }
    }
    return false;
}

while (removeSection()) {}

// Now properly inject it inside admin-content-pad.
// The end of admin-content-pad is the last </div> before </main>.
const musicBankSection = `
                <!-- ================= MENU 7: MUSIC BANK (GLOBAL) ================= -->
                <div id="sec-musicbank" class="admin-section">
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
                    
                    <div class="ecc-card" style="padding:0; overflow:hidden;">
                        <div id="musicBankSectionBody"></div>
                    </div>
                </div>
`;

// Find the last </div> before </main>
let mainEnd = html.lastIndexOf('</main>');
let padEnd = html.lastIndexOf('</div>', mainEnd);

html = html.substring(0, padEnd) + musicBankSection + '\n            ' + html.substring(padEnd);

fs.writeFileSync('public/admin.html', html);
console.log('Fixed sec-musicbank location');
