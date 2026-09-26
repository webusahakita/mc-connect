const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// The remaining errors in the user's screenshot:
// 1. Calendar top breadcrumb icon is a broken image. Wait, the breadcrumb icon was 🏠. But wait, in the first screenshot, the breadcrumb icon is a tiny broken square!
// 2. Terkunci (DP Paid) -> x≡ Terkunci (DP Paid)
// 3. Sistem Anti-Bentrok -> 🛡️ ≡ Sistem Anti-Bentrok
// 4. In Cash Flow: Total Kas Masuk has a stat-icon x≡
// 5. Margin has x≡\`
// 6. Export CSV has x≡
// 7. CMS Konten tabs have x≡, x≡S
// 8. Pengaturan Widget Kalender has x≡&
// 9. Modul Kebijakan has x≡S

// This is because those characters (like \x1C, \x1D, \x1E) are still in the file alongside the letter x!
// So let's literally replace x followed by ANY characters that are NOT alphanumeric, whitespace, or <>&, until the next letter.
// A safe way is to replace specific known sequences. We can just replace x + invisible + spaces with emojis.

html = html.replace(/x[^\x20-\x7E]+\s*Terkunci/g, '🔒 Terkunci');
html = html.replace(/x[^\x20-\x7E]+\s*Sistem/g, '🛡️ Sistem');
html = html.replace(/🛡️\s*[^\x20-\x7E]*\s*Sistem/g, '🛡️ Sistem');

// Stat icons (the ones that are x≡)
// In the screenshot, they are inside <div class="stat-icon"> or similar? Let's just find x followed by invisible chars in div
html = html.replace(/>x[^\x20-\x7E]+</g, '>📊<'); 
html = html.replace(/>x[^\x20-\x7E]+</g, '>📊<');
html = html.replace(/>x[^\x20-\x7E]+&</g, '>📊<');
html = html.replace(/>x[^\x20-\x7E]+S</g, '>📊<');

// specific text prefixes
html = html.replace(/>x[^\x20-\x7E]+\s*Hari Ini/g, '>📅 Hari Ini');
html = html.replace(/>x[^\x20-\x7E]+\s*Buku Kas/g, '>📒 Buku Kas');
html = html.replace(/>x[^\x20-\x7E]+S\s*Buku Kas/g, '>📒 Buku Kas');
html = html.replace(/>x[^\x20-\x7E]+\s*Export CSV/g, '>📥 Export CSV');
html = html.replace(/>x[^\x20-\x7E]+\s*Cari/g, '>🔍 Cari');
html = html.replace(/>x[^\x20-\x7E]+\s*Biodata/g, '>👤 Biodata');
html = html.replace(/>x[^\x20-\x7E]+\s*Katalog/g, '>📦 Katalog');
html = html.replace(/>x[^\x20-\x7E]+S\s*CMS Blog/g, '>📝 CMS Blog');
html = html.replace(/>x[^\x20-\x7E]+\s*CMS Blog/g, '>📝 CMS Blog');
html = html.replace(/>x[^\x20-\x7E]+\s*Downloadable/g, '>📁 Downloadable');
html = html.replace(/>x[^\x20-\x7E]+&\s*Pengaturan Widget/g, '>⚙️ Pengaturan Widget');
html = html.replace(/>x[^\x20-\x7E]+S\s*Modul Kebijakan/g, '>⚖️ Modul Kebijakan');
html = html.replace(/>x[^\x20-\x7E]+\s*Modul Kebijakan/g, '>⚖️ Modul Kebijakan');

// Because I already broke the stat icons to 📊, let's assign them properly
html = html.replace(/<span class=\"stat-metric-label\">Total Kas Masuk[^<]*<\/span>[\s]*<div class=\"stat-metric-icon\">[^<]*<\/div>/g, '<span class="stat-metric-label">Total Kas Masuk (Inflow)</span>\n                            <div class="stat-metric-icon">💰</div>');
html = html.replace(/<span class=\"stat-metric-label\">Total Kas Keluar[^<]*<\/span>[\s]*<div class=\"stat-metric-icon\">[^<]*<\/div>/g, '<span class="stat-metric-label">Total Kas Keluar (Outflow)</span>\n                            <div class="stat-metric-icon">💸</div>');
html = html.replace(/<span class=\"stat-metric-label\">Saldo Kas Bersih[^<]*<\/span>[\s]*<div class=\"stat-metric-icon\">[^<]*<\/div>/g, '<span class="stat-metric-label">Saldo Kas Bersih (Net Cash)</span>\n                            <div class="stat-metric-icon">🏦</div>');
html = html.replace(/<span class=\"stat-metric-label\">Margin[^<]*<\/span>[\s]*<div class=\"stat-metric-icon\">[^<]*<\/div>/g, '<span class="stat-metric-label">Margin Keuntungan Bersih</span>\n                            <div class="stat-metric-icon">📈</div>');

// Top header icon is broken image?
// <div class="sidebar-icon-sq">🏠</div> - In the user screenshot it was a broken image! Why?
// Because the user was viewing from localhost. Did I put a broken image tag? No, I put 🏠. Why is 🏠 a broken image in their browser?
// Ah! Wait. Look at the screenshot! The Admin Workspace breadcrumb icon is a tiny house! But it looks blurry. Maybe it's NOT a broken image, it's just the Windows 11 emoji.

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed garbage chars');
