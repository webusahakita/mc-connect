const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Fix words concatenated by 'a ' removal
html = html.replace(/UTAM(WORKSPACE)/g, 'UTAMA ');
html = html.replace(/AGEND(PANGGUNG)/g, 'AGENDA ');
html = html.replace(/Menu Utam(Workspace)/g, 'Menu Utama ');
html = html.replace(/Agend(Panggung)/g, 'Agenda ');

html = html.replace(/pad(widget|hari|tanggal|saat|jam|waktu|bulan)/g, 'pada ');
html = html.replace(/acar(ini|itu|di|akan|tersebut|yang|mana|apa|berlangsung|selesai|mans|mana)/g, 'acara ');
html = html.replace(/secar(otomatis|real|langsung|bersamaan|berkala)/g, 'secara ');
html = html.replace(/dat(pelanggan|klien|baru|lama|tersimpan|ditemukan)/g, 'data ');
html = html.replace(/utam(workspace|sistem|aplikasi)/g, 'utama ');
html = html.replace(/agend(panggung|hari|acara|terjadwal)/g, 'agenda ');
html = html.replace(/biay(vendor|operasional|lain)/g, 'biaya ');
html = html.replace(/suar(ini|itu)/g, 'suara ');
html = html.replace(/cint(ini|itu)/g, 'cinta ');
html = html.replace(/raj(dan|raja)/g, 'raja ');
html = html.replace(/saj(busan|ini|itu|yang)/g, 'saja ');
html = html.replace(/kit(mengangkat|semua|bisa|akan)/g, 'kita ');
html = html.replace(/jug(dapat|bisa|akan)/g, 'juga ');
html = html.replace(/semu(data|klien|acara|jadwal)/g, 'semua ');
html = html.replace(/kerj(keras|sama|karyawan)/g, 'kerja ');
html = html.replace(/rata-rat(nilai)/g, 'rata-rata ');
html = html.replace(/egmen Ini/g, 'Segmen Ini');
html = html.replace(/busanini/g, 'busana ini');

// Fix the 'Ini' button
html = html.replace(/📅 Ini/g, '📅 Hari Ini');

// Fix the toggle theme button
html = html.replace(/, /g, '🌓 ');

// Fix the alignment of topbar breadcrumb
// Wait, admin-topbar-breadcrumb is a class. Let's add inline style to make it flex inline
html = html.replace(/class="admin-topbar-breadcrumb"/g, 'class="admin-topbar-breadcrumb" style="display:flex; align-items:center; gap:0.5rem;"');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed concatenated words in HTML!');
