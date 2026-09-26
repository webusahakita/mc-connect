const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

html = html.replace('R Catatan Tambahan untuk Klien / EO', '📝 Catatan Tambahan untuk Klien / EO');
html = html.replace('secarmusyawarah', 'secara musyawarah');
html = html.replace('skalacara', 'skala acara');
html = html.replace('sertkondisi', 'serta kondisi');
html = html.replace('tanpmengurangi', 'tanpa mengurangi');
html = html.replace('Simpan Catatan Riders', '💾 Simpan Catatan Riders');

const tableHeaderSearch = `<tr style="cursor: pointer; user-select: none;">
                                    <th onclick="window.sortCustomersTable('name')">Klien & Kontak</th>
                                    <th onclick="window.sortCustomersTable('category')">Kategori Acara</th>
                                    <th onclick="window.sortCustomersTable('client_category')">Kategori Klien</th>
                                    <th onclick="window.sortCustomersTable('date')">Acara Terkait & Tanggal</th>
                                    <th onclick="window.sortCustomersTable('price')">Nilai Kontrak</th>
                                    <th onclick="window.sortCustomersTable('paymentStatus')">Status Pembayaran</th>
                                    <th onclick="window.sortCustomersTable('calendarStatus')">Status Kalender</th>
                                    <th style="text-align:right;">Aksi</th>
                                </tr>`;

const newTableHeader = `<tr>
                                    <th>Judul Rider</th>
                                    <th>Catatan Khusus</th>
                                    <th style="text-align:right;">Aksi</th>
                                </tr>`;

html = html.replace(tableHeaderSearch, newTableHeader);

fs.writeFileSync('public/admin.html', html);
console.log('Fixed admin.html Riders section');
