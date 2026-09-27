const fs = require('fs');

function fixCsv(filePath) {
    if (!fs.existsSync(filePath)) return;
    let txt = fs.readFileSync(filePath, 'utf8');
    
    // Replace commas in header with semicolons
    txt = txt.replace(
        /"ID,NamPelanggan,Instansi,Kategori,No WhatsApp,Email,NamAcara,Tanggal Acara,Nilai Kontrak,Status Pembayaran,Catatan Khusus\\n"/,
        '"ID;Nama Pelanggan;Instansi;Kategori;No WhatsApp;Email;Nama Acara;Tanggal Acara;Nilai Kontrak;Status Pembayaran;Catatan Khusus\\n"'
    );
    
    // Replace the join(',') with join(';')
    txt = txt.replace(
        /\.join\(\s*','\s*\)\s*\+\s*"\\n"/g,
        '.join(\';\') + "\\n"'
    );
    
    fs.writeFileSync(filePath, txt);
    console.log('Fixed', filePath);
}

fixCsv('c:/Users/Nawakara/.gemini/antigravity-ide/scratch/mc-connect/public/js/bundle-test.js');
fixCsv('c:/Users/Nawakara/.gemini/antigravity-ide/scratch/mc-connect/public/js/customers.js');
