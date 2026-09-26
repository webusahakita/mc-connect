const fs = require('fs');
let files = ['public/js/admin-core.js', 'public/js/customers.js'];

for (let file of files) {
    let js = fs.readFileSync(file, 'utf8');

    js = js.replace(/Semudatdisimpan/g, 'Semua data disimpan');
    js = js.replace(/datdari/g, 'data dari');
    js = js.replace(/datke/g, 'data ke');
    js = js.replace(/kerjAdmin/g, 'kerja Admin');
    js = js.replace(/DatPelanggan/g, 'Data Pelanggan');
    js = js.replace(/SemuKategori/g, 'Semua Kategori');
    js = js.replace(/datpelanggan/g, 'data pelanggan');
    js = js.replace(/DatKlien/g, 'Data Klien');
    js = js.replace(/Datmurni/g, 'Data murni');
    
    // There might be others like 'pad' or 'jug'
    js = js.replace(/pad(waktu|saat|tanggal|hari)/g, 'pada ');
    js = js.replace(/jug(bisa|dapat)/g, 'juga ');

    fs.writeFileSync(file, js, 'utf8');
}
console.log('Fixed JS concatenated words!');
