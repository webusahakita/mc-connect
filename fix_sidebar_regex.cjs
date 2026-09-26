const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// First, fix the menu icons
html = html.replace(/<div class=\"sidebar-icon-sq\">[^<]*<\/div>(\s*)<span>Dashboard<\/span>/g, '<div class=\"sidebar-icon-sq\">📊</div>$1<span>Dashboard</span>');
html = html.replace(/<div class=\"sidebar-icon-sq\">[^<]*<\/div>(\s*)<span>Kalender Acara<\/span>/g, '<div class=\"sidebar-icon-sq\">📅</div>$1<span>Kalender Acara</span>');
html = html.replace(/<div class=\"sidebar-icon-sq\">[^<]*<\/div>(\s*)<span>Data Pelanggan<\/span>/g, '<div class=\"sidebar-icon-sq\">👥</div>$1<span>Data Pelanggan</span>');
html = html.replace(/<div class=\"sidebar-icon-sq\">[^<]*<\/div>(\s*)<span>Cash Flow<\/span>/g, '<div class=\"sidebar-icon-sq\">💰</div>$1<span>Cash Flow</span>');
html = html.replace(/<div class=\"sidebar-icon-sq\">[^<]*<\/div>(\s*)<span>Pengaturan<\/span>/g, '<div class=\"sidebar-icon-sq\">⚙️</div>$1<span>Pengaturan</span>');
html = html.replace(/<div class=\"sidebar-icon-sq\">[^<]*<\/div>(\s*)<span>Event Command Center<\/span>/g, '<div class=\"sidebar-icon-sq\">⚡</div>$1<span>Event Command Center</span>');
html = html.replace(/<div class=\"sidebar-icon-sq\">[^<]*<\/div>(\s*)<span>Wardrobe Tracker<\/span>/g, '<div class=\"sidebar-icon-sq\">👔</div>$1<span>Wardrobe Tracker</span>');

html = html.replace(/x[^\s]* Logout \/ Keluar/g, '🚪 Logout / Keluar');
html = html.replace(/a[^\s]* Logout \/ Keluar/g, '🚪 Logout / Keluar');
html = html.replace(/x[^\s]* Logout/g, '🚪 Logout');

// Top header: ~° Admin Workspace
html = html.replace(/a[^A]*Admin Workspace/g, '🏠 Admin Workspace');
// Clock: x" 21:46:01 WIB
html = html.replace(/[ax][^\s]* (\d{2}:\d{2}:\d{2} WIB)/g, '⏰ $1');
// Portal publik: xR Portal Publik a+-
html = html.replace(/[ax][^\s]* Portal Publik [^<]*/g, '🌐 Portal Publik ↗');

// Calendar section titles:
// x≡ Hari Ini
html = html.replace(/x[^\s\w]*Hari Ini/g, '📅 Hari Ini');
// x≡ Terkunci
html = html.replace(/x[^\s\w]*Terkunci/g, '🔒 Terkunci');
// ≡ Tentative
html = html.replace(/a[^\s\w]*Tentative/g, '⏳ Tentative');
// x: Sistem Anti-Bentrok
html = html.replace(/[ax][^\s\w]*Sistem Anti-Bentrok/g, '🛡️ Sistem Anti-Bentrok');
html = html.replace(/[ax][^\s]* Sistem Anti-Bentrok/g, '🛡️ Sistem Anti-Bentrok');
html = html.replace(/Sistem Anti-[\s]*Bentrok/g, 'Sistem Anti-Bentrok');

// Also the button + Tambah Jadwal Baru might have an icon
html = html.replace(/x[^\s\w]* Tambah Jadwal Baru/g, '➕ Tambah Jadwal Baru');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed using wildcard matching!');
