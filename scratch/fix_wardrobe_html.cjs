const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

const oldTableHeaders = `                                <tr style="cursor: pointer; user-select: none;">
                                    <th onclick="window.sortCustomersTable('name')">Klien & Kontak</th>
                                    <th onclick="window.sortCustomersTable('category')">Kategori Acara</th>
                                    <th onclick="window.sortCustomersTable('client_category')">Kategori Klien</th>
                                    <th onclick="window.sortCustomersTable('date')">Acara Terkait & Tanggal</th>
                                    <th onclick="window.sortCustomersTable('price')">Nilai Kontrak</th>
                                    <th onclick="window.sortCustomersTable('paymentStatus')">Status Pembayaran</th>
                                    <th onclick="window.sortCustomersTable('calendarStatus')">Status Kalender</th>
                                    <th style="text-align:right;">Aksi</th>
                                </tr>`;

const newTableHeaders = `                                <tr>
                                    <th style="width:70px;">Gambar</th>
                                    <th>Nama Busana</th>
                                    <th>Deskripsi</th>
                                    <th>Warna</th>
                                    <th>Status</th>
                                    <th style="text-align:center;">Dipakai</th>
                                    <th style="text-align:right;">Aksi</th>
                                </tr>`;

html = html.replace(oldTableHeaders, newTableHeaders);
fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed Wardrobe table headers in admin.html');
