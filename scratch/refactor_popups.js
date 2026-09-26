const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../public/js/admin-core.js');
let content = fs.readFileSync(file, 'utf8');

// List of replacements
const replacements = [
    {
        from: `function handleLogout(e) {
    e.preventDefault();
    if (confirm('Apakah Anda yakin ingin keluar dari ruang kerja Admin MC?')) {`,
        to: `async function handleLogout(e) {
    e.preventDefault();
    if (await uiConfirm('Apakah Anda yakin ingin keluar dari ruang kerja Admin MC?')) {`
    },
    {
        from: `function togglePublicPackage(btn, isPublic) {
    const el = btn.closest('.ecc-card');
    if (el && confirm('Hapus paket layanan ini dari katalog publik?')) {`,
        to: `async function togglePublicPackage(btn, isPublic) {
    const el = btn.closest('.ecc-card');
    if (el && await uiConfirm('Hapus paket layanan ini dari katalog publik?')) {`
    },
    {
        from: `function deletePackage(idx) {
    if (!confirm('Hapus paket ini?')) return;`,
        to: `async function deletePackage(idx) {
    if (!await uiConfirm('Hapus paket ini?')) return;`
    },
    {
        from: `function promptAddFaq() {
    const q = prompt('Pertanyaan FAQ baru:');
    if (!q) return;
    const a = prompt('Jawaban FAQ:');`,
        to: `async function promptAddFaq() {
    const q = await uiPrompt('Pertanyaan FAQ baru:');
    if (!q) return;
    const a = await uiPrompt('Jawaban FAQ:');`
    },
    {
        from: `function deleteCmsFaq(idx) {
    if (!confirm('Hapus FAQ ini?')) return;`,
        to: `async function deleteCmsFaq(idx) {
    if (!await uiConfirm('Hapus FAQ ini?')) return;`
    },
    {
        from: `function promptAddTestimonial() {
    const text = prompt('Isi Testimoni:');
    if (!text) return;
    const author = prompt('Nama Klien:');
    if (!author) return;
    const role = prompt('Peran / Jabatan (contoh: Mempelai Wanita):', 'Klien');`,
        to: `async function promptAddTestimonial() {
    const text = await uiPrompt('Isi Testimoni:');
    if (!text) return;
    const author = await uiPrompt('Nama Klien:');
    if (!author) return;
    const role = await uiPrompt('Peran / Jabatan (contoh: Mempelai Wanita):', 'Klien');`
    },
    {
        from: `function deleteCmsTestimonial(idx) {
    if (!confirm('Hapus testimoni ini?')) return;`,
        to: `async function deleteCmsTestimonial(idx) {
    if (!await uiConfirm('Hapus testimoni ini?')) return;`
    },
    {
        from: `    promptAddCmsGallery() {
        const url = prompt("Masukkan URL Foto Galeri (contoh: https://.../foto1.jpg):");
        if (!url) return;
        const caption = prompt("Masukkan Judul / Caption singkat foto ini:");`,
        to: `    async promptAddCmsGallery() {
        const url = await uiPrompt("Masukkan URL Foto Galeri (contoh: https://.../foto1.jpg):");
        if (!url) return;
        const caption = await uiPrompt("Masukkan Judul / Caption singkat foto ini:");`
    },
    {
        from: `    deleteCmsGallery(idx) {
        if (!confirm('Hapus foto ini dari galeri publik?')) return;`,
        to: `    async deleteCmsGallery(idx) {
        if (!await uiConfirm('Hapus foto ini dari galeri publik?')) return;`
    },
    {
        from: `function deleteWardrobeItem(id) {
    if (!confirm('Hapus item busana ini dari katalog? Data di event yang menggunakannya juga akan hilang.')) return;`,
        to: `async function deleteWardrobeItem(id) {
    if (!await uiConfirm('Hapus item busana ini dari katalog? Data di event yang menggunakannya juga akan hilang.')) return;`
    },
    {
        from: `function handleRemoveWardrobeFromEvent(e) {
    const btn = e.currentTarget;
    if (!confirm('Lepaskan gaun ini dari acara?')) return;`,
        to: `async function handleRemoveWardrobeFromEvent(e) {
    const btn = e.currentTarget;
    if (!await uiConfirm('Lepaskan gaun ini dari acara?')) return;`
    },
    {
        from: `function addCashflowExpense() {
    const desc = prompt("Pengeluaran operasional:", "Sewa Mobil Kru Tambahan");
    if(!desc) return;
    const amt = prompt("Nominal (Rp):", "400000");`,
        to: `async function addCashflowExpense() {
    const desc = await uiPrompt("Pengeluaran operasional:", "Sewa Mobil Kru Tambahan");
    if(!desc) return;
    const amt = await uiPrompt("Nominal (Rp):", "400000");`
    },
    {
        from: `        alert('Belum ada file audio yang dipilih.');`,
        to: `        await uiAlert('Belum ada file audio yang dipilih.');`
    },
    {
        from: `        alert('Silakan masukkan tautan audio terlebih dahulu.');`,
        to: `        await uiAlert('Silakan masukkan tautan audio terlebih dahulu.');`
    },
    {
        from: `        alert('Gagal memutar audio dari tautan: ' + err.message);`,
        to: `        await uiAlert('Gagal memutar audio dari tautan: ' + err.message);`
    },
    {
        from: `        alert('Belum ada file audio SFX yang dipilih.');`,
        to: `        await uiAlert('Belum ada file audio SFX yang dipilih.');`
    },
    {
        from: `        alert('Silakan masukkan tautan audio SFX terlebih dahulu.');`,
        to: `        await uiAlert('Silakan masukkan tautan audio SFX terlebih dahulu.');`
    },
    {
        from: `        alert('Mohon masukkan nama sound effect.');`,
        to: `        await uiAlert('Mohon masukkan nama sound effect.');`
    },
    {
        from: `        alert('Token AI Co-Pilot Anda habis. Silakan hubungi admin atau upgrade paket.');`,
        to: `        await uiAlert('Token AI Co-Pilot Anda habis. Silakan hubungi admin atau upgrade paket.');`
    },
    {
        from: `            alert(\`Error fullscreen: \${err.message}\`);`,
        to: `            await uiAlert(\`Error fullscreen: \${err.message}\`);`
    },
    {
        from: `        alert('Mohon lengkapi judul lagu dan artis/musisi.');`,
        to: `        await uiAlert('Mohon lengkapi judul lagu dan artis/musisi.');`
    },
    {
        from: `        alert('Browser Anda tidak mendukung rendering offline audio.');`,
        to: `        await uiAlert('Browser Anda tidak mendukung rendering offline audio.');`
    },
    {
        from: `        alert('Belum ada lagu pada playlist acara.');`,
        to: `        await uiAlert('Belum ada lagu pada playlist acara.');`
    },
    {
        from: `    deleteCashflowCategory(id) {
        if (!confirm('Hapus kategori ini?')) return;`,
        to: `    async deleteCashflowCategory(id) {
        if (!await uiConfirm('Hapus kategori ini?')) return;`
    },
    {
        from: `function deleteCmsRider(id) {
    if (!confirm('Hapus rider ini secara permanen?')) return;`,
        to: `async function deleteCmsRider(id) {
    if (!await uiConfirm('Hapus rider ini secara permanen?')) return;`
    },
    {
        from: `function deleteCmsGalleryItem(id) {
    if (!confirm('Hapus foto ini dari galeri publik?')) return;`,
        to: `async function deleteCmsGalleryItem(id) {
    if (!await uiConfirm('Hapus foto ini dari galeri publik?')) return;`
    }
];

let replaced = 0;
for (const r of replacements) {
    if (content.includes(r.from)) {
        content = content.replace(r.from, r.to);
        replaced++;
    } else {
        console.log("NOT FOUND:", r.from.substring(0, 50));
    }
}

// Global alert replace if not covered (but wait, alert doesn't strictly need parent async unless we care about blocking. We do care though)
content = content.replace(/alert\(/g, "uiAlert(");

fs.writeFileSync(file, content);
console.log('Replaced', replaced, 'blocks.');
