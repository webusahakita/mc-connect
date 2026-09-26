import sys
import re

with open(r'c:\Users\Nawakara\.gemini\antigravity-ide\scratch\mc-connect\public\admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''    <!-- MODAL: Tambah Transaksi Kas (Cash Flow) -->
    <div class="modal-overlay" id="addCashModal">
        <div class="modal-content" style="max-width:520px;">
            <div class="modal-header">
                <h3 class="modal-title">💰 Catat Transaksi Arus Kas Baru</h3>
                <button class="btn-close" onclick="closeModals()">&times;</button>
            </div>
            <form onsubmit="handleSaveCashEntry(event)">
                <div class="grid-2col" style="gap:1rem; margin-bottom:1rem;">
                    <div class="form-group">
                        <label class="form-label">Jenis Transaksi *</label>
                        <select class="form-select" id="newCfType" required>
                            <option value="in">Kas Masuk (Pendapatan)</option>
                            <option value="out">Kas Keluar (Pengeluaran)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nominal (Rp) *</label>
                        <input type="number" class="form-input" id="newCfAmount" placeholder="Contoh: 1500000" required>
                    </div>
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label class="form-label">Kategori / Acara Terkait *</label>
                    <select class="form-select" id="newCfCategory" required>
                        <option value="The Grand Wedding Kevin & Stephanie">The Grand Wedding Kevin & Stephanie</option>
                        <option value="Operasional Umum MC">Operasional Umum MC</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Keterangan / Deskripsi</label>
                    <input type="text" class="form-input" id="newCfDesc" placeholder="Misal: Pelunasan klien, bayar transport, dll">
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="closeModals()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan Transaksi Kas</button>
                </div>
            </form>
        </div>
    </div>'''

pattern = r'<!-- MODAL: Tambah Transaksi Kas \(Cash Flow\) -->.*?<div class="modal-overlay" id="addCashModal">.*?<div class="modal-content".*?<div class="modal-header">.*?<h3 class="modal-title">💰 Catat Transaksi Arus Kas Baru</h3>.*?</form>\s*</div>\s*</div>'

if re.search(pattern, content, re.DOTALL):
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    with open(r'c:\Users\Nawakara\.gemini\antigravity-ide\scratch\mc-connect\public\admin.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Failed to match")
