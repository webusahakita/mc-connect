const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const fixes = {
    'metcharset': 'meta charset',
    'AgendTerjadwal': 'Agenda Terjadwal',
    'MasTunggu': 'Masa Tunggu',
    'Acarterdaftar': 'Acara terdaftar',
    'secarreal-time': 'secara real-time',
    'DatPelanggan': 'Data Pelanggan',
    'Harg': 'Harga ',
    'Biay': 'Biaya ',
    'Nam': 'Nama ',
    'Hany': 'Hanya ',
    'secar': 'secara ',
    'pad': 'pada ',
    'bis': 'bisa ',
    'jik': 'jika ',
    'ad': 'ada ',
    'Semu': 'Semua ',
    'And': 'Anda ',
    'Merek': 'Mereka ',
    'karen': 'karena ',
    'bahw': 'bahwa ',
    'jug': 'juga ',
    'pertam': 'pertama ',
    'kedu': 'kedua ',
    'ketig': 'ketiga ',
    'sam': 'sama ',
    'utam': 'utama ',
    'kerj': 'kerja ',
    'mas': 'masa ',
    'lam': 'lama ',
    'car': 'cara ',
    'man': 'mana ',
    'san': 'sana ',
    'berap': 'berapa ',
    'Acar': 'Acara ',
    'Dat': 'Data '
};

// We will only replace whole words (using word boundaries or specific matches) to avoid destroying other things!
// But wait, "Dat" is a word?
// Let's manually replace the known UI texts that were broken.

html = html.replace(/metcharset/g, 'meta charset');
html = html.replace(/AgendTerjadwal/g, 'Agenda Terjadwal');
html = html.replace(/MasTunggu/g, 'Masa Tunggu');
html = html.replace(/Acarterdaftar/g, 'Acara terdaftar');
html = html.replace(/secarreal-time/g, 'secara real-time');
html = html.replace(/>DatPelanggan/g, '>Data Pelanggan');
html = html.replace(/DatPelanggan/g, 'Data Pelanggan');

// Specific text matches based on common Indonesian words that end in 'a'
// We replace 'Nam' with 'Nama ' only if it's followed by a capital letter or something?
// Actually, 'a ' was literally stripped. 
// So "Nama Klien" became "NamKlien"
// Let's replace "Nam" followed by a capital letter with "Nama "
html = html.replace(/([a-z]+) ([A-Z])/g, (match, p1, p2) => {
    // If it's a known missing 'a'
    const missingA = ['Nam', 'Dat', 'Harg', 'Biay', 'Hany', 'Acar', 'Semu'].includes(p1);
    if (missingA) return p1 + 'a ' + p2;
    return match;
});

// "NamKlien"
html = html.replace(/Nam([A-Z])/g, 'Nama ');
html = html.replace(/Dat([A-Z])/g, 'Data ');
html = html.replace(/Harg([A-Z])/g, 'Harga ');
html = html.replace(/Biay([A-Z])/g, 'Biaya ');
html = html.replace(/Hany([A-Z])/g, 'Hanya ');
html = html.replace(/Acar([A-Z])/g, 'Acara ');
html = html.replace(/Semu([A-Z])/g, 'Semua ');
html = html.replace(/And([A-Z])/g, 'Anda ');
html = html.replace(/Merek([A-Z])/g, 'Mereka ');
html = html.replace(/Biy([A-Z])/g, 'Biaya ');
html = html.replace(/pad([A-Z])/g, 'pada ');
html = html.replace(/jik([A-Z])/g, 'jika ');
html = html.replace(/bis([A-Z])/g, 'bisa ');
html = html.replace(/ad([A-Z])/g, 'ada ');
html = html.replace(/secar([A-Z])/g, 'secara ');
html = html.replace(/karen([A-Z])/g, 'karena ');
html = html.replace(/bahw([A-Z])/g, 'bahwa ');
html = html.replace(/jug([A-Z])/g, 'juga ');
html = html.replace(/car([A-Z])/g, 'cara ');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Restored text in admin.html');
