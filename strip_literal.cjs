const fs = require('fs');

function cleanFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace specific known bad strings from screenshots
    content = content.replace(/x} Kategori/g, 'Kategori');
    content = content.replace(/x\} Kelola/g, 'Kelola');
    content = content.replace(/x" 18:00/g, '18:00');
    content = content.replace(/x≡ /g, '');
    content = content.replace(/a /g, '');
    
    // Look at the dropdown screenshot for Kategori Klien:
    // x, x≡, x≡, x, x≡}, x≡≡, x, S
    // They are inside <option> tags. Let's clean the options in admin.html
    // E.g. <option>x} Engagement</option>
    // Wait, the dropdown has S Engagement. Let's just strip 'S ' from the beginning of dropdown text
    content = content.replace(/<option([^>]*)>[xSa]\s*(.*?)/g, '<option>');
    content = content.replace(/<option([^>]*)>[xSa][^\w\s]+\s*(.*?)/g, '<option>');

    // Button x Lihat di Grid
    content = content.replace(/x Lihat di Grid/g, 'Lihat di Grid');
    content = content.replace(/a Command Center/g, 'Command Center');
    
    // 9 Agenda Acara
    content = content.replace(/9 Agenda Acara/g, 'Agenda Acara');

    // Galeri Portofolio buttons
    content = content.replace(/S Edit/g, 'Edit');
    content = content.replace(/x Hapus/g, 'Hapus');
    // What if it is x≡ Hapus? Let's just strip x  and anything non-word before Hapus
    content = content.replace(/[xSa][^\w\s]*\s*Hapus/g, 'Hapus');

    // Any other x followed by non-word chars and space before a Capital letter
    content = content.replace(/>\s*[xSa][^\w\s]*\s*([A-Z])/g, '>');
    content = content.replace(/>\s*[xSa]\s+([A-Z])/g, '>');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Cleaned', filePath);
}

cleanFile('public/admin.html');
cleanFile('public/js/admin-core.js');
cleanFile('public/js/customers.js');

