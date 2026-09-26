const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Dashboard / CRM metrics
html = html.replace(/<div class="stat-metric-icon">[^<]*<\/div>(\s*)<div class="stat-metric-info">(\s*)<span class="stat-metric-label">Total Kas Masuk/g, '<div class="stat-metric-icon">💰</div><div class="stat-metric-info"><span class="stat-metric-label">Total Kas Masuk');
html = html.replace(/<div class="stat-metric-icon">[^<]*<\/div>(\s*)<div class="stat-metric-info">(\s*)<span class="stat-metric-label">Total Kas Keluar/g, '<div class="stat-metric-icon">💸</div><div class="stat-metric-info"><span class="stat-metric-label">Total Kas Keluar');
html = html.replace(/<div class="stat-metric-icon">[^<]*<\/div>(\s*)<div class="stat-metric-info">(\s*)<span class="stat-metric-label">Saldo Kas Bersih/g, '<div class="stat-metric-icon">🏦</div><div class="stat-metric-info"><span class="stat-metric-label">Saldo Kas Bersih');
html = html.replace(/<div class="stat-metric-icon">[^<]*<\/div>(\s*)<div class="stat-metric-info">(\s*)<span class="stat-metric-label">Margin/g, '<div class="stat-metric-icon">📈</div><div class="stat-metric-info"><span class="stat-metric-label">Margin');

// If there are other stat-metric-icon
html = html.replace(/<div class="stat-metric-icon">[^<]*<\/div>/g, '<div class="stat-metric-icon">📊</div>');

// Terkunci
html = html.replace(/x[^\s\w]*(\s*)Terkunci/g, '🔒');
// Tentative
html = html.replace(/a[^\s\w]*(\s*)Tentative/g, '⏳');
// Sistem Anti-Bentrok
html = html.replace(/[ax][^\s\w]*(\s*)Sistem Anti/g, '🛡️ Anti');
// Hari Ini
html = html.replace(/x[^\s\w]*(\s*)Hari Ini/g, '📅 Ini');
// Export CSV
html = html.replace(/x[^\s\w]*(\s*)Export CSV/g, '📥 CSV');
// Cari transaksi
html = html.replace(/x[^\s\w]*(\s*)Cari transaksi/g, '🔍 transaksi');
// Buku Kas Keluar-Masuk
html = html.replace(/[ax][^\s\wS]*S(\s*)Buku Kas/g, '📒 Kas');
html = html.replace(/[ax][^\s\w]*(\s*)Buku Kas/g, '📒 Kas');

// CMS Konten Tabs
html = html.replace(/[ax][^\s\w]*(\s*)Biodata, Showreel/g, '👤, Showreel');
html = html.replace(/[ax][^\s\w]*(\s*)Katalog Layanan/g, '📦 Layanan');
html = html.replace(/[ax][^\s\wS]*S(\s*)CMS Blog/g, '📝 Blog');
html = html.replace(/[ax][^\s\w]*(\s*)CMS Blog/g, '📝 Blog');
html = html.replace(/[ax][^\s\w]*(\s*)Downloadable Press Kit/g, '📁 Press Kit');
html = html.replace(/[ax][^\s\wS]*S(\s*)Modul Kebijakan/g, '⚖️ Kebijakan');
html = html.replace(/[ax][^\s\w]*(\s*)Modul Kebijakan/g, '⚖️ Kebijakan');

// Widget Kalender
html = html.replace(/[ax][^\s\w]*(\s*)Pengaturan Widget Kalender/g, '⚙️ Widget Kalender');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed remaining icons');
