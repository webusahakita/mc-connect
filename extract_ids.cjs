const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');
let match = html.match(/id="cms-bio"[\s\S]*?<\/form>/);
if (match) {
    let inputs = match[0].match(/id="([^"]+)"/g);
    console.log("Bio inputs:", inputs);
}

let packageMatch = html.match(/id="cms-packages"[\s\S]*?<\/form>/);
if (packageMatch) {
    let pInputs = packageMatch[0].match(/id="([^"]+)"/g);
    console.log("Package inputs:", pInputs);
}

// Let's also fix the typos directly in the HTML
html = html.replace('unting Profil', 'Sunting Profil');
html = html.replace('Nama anggung', 'Nama Panggung');
html = html.replace('Acara ukses', 'Acara Sukses');
html = html.replace('Acara ukses', 'Acara Sukses'); // There are two

// Add icon to Galeri Portofolio
html = html.replace('Galeri Portofolio', '🖼️ Galeri Portofolio');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed typos and added icon in admin.html');
