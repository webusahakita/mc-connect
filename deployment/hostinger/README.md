# Hostinger: mc.webusaha.com

Paket ini untuk website PHP/Laravel dengan SSH. PHP CLI dan PHP website harus memakai versi 8.2 atau lebih baru, sesuai `composer.lock`.

Website aktif menggunakan [deployment otomatis lewat GitHub Actions](AUTO-DEPLOY.md). Panduan di bawah dipakai untuk pemasangan manual awal.

## Dua akun Hostinger

- Akun domain tetap mengelola DNS `webusaha.com`.
- Akun hosting aplikasi menampung website `mc.webusaha.com`, database, dan sertifikat SSL.
- Di DNS yang berwenang untuk `webusaha.com`, arahkan A record dengan host `mc` ke IP hosting aplikasi. Catat nilai record lama sebelum memperbaruinya. Hapus/ubah record lain hanya jika bertabrakan dengan nama `mc` dan setelah memeriksanya.
- Verifikasi kepemilikan melalui TXT bila diminta hPanel. Jika hPanel menolak subdomain karena sudah terkait akun lain, selesaikan pengaitan melalui dukungan Hostinger sebelum mengganti DNS.

## Tata letak upload

Ekstrak ZIP di direktori website yang menjadi induk `public_html`:

```text
direktori-website/
  mc-connect/       # source PHP dan .env, di luar public_html
  public_html/      # aset dan index.php khusus Hostinger
```

Periksa isi folder tujuan terlebih dahulu. Simpan cadangan website yang sudah ada; jangan mengekstrak paket di atas website aktif tanpa memeriksa dan mencadangkannya. Paket sumber tidak membawa `vendor`, `.env` lokal, isi database, atau file upload lokal.

## Pemasangan melalui SSH

Jalankan perintah satu per satu dari direktori `mc-connect` di server:

```bash
php -v
composer2 install --no-dev --prefer-dist --optimize-autoloader --no-interaction
cp .env.production.example .env
chmod 600 .env
```

Gunakan Composer 2 yang tersedia pada server; bila perintahnya `composer`, gunakan nama tersebut. Saat memperbarui instalasi yang sudah ada, pertahankan `.env` dan `APP_KEY` yang ada. Perintah `cp` dan pembuatan key berikut hanya untuk instalasi baru.

Isi `.env` lewat editor server: `APP_URL=https://mc.webusaha.com`, kredensial MySQL dari hPanel, serta `APP_ENV=production` dan `APP_DEBUG=false`. Pertahankan sesi/cache berbasis file. Aktifkan SSL sebelum menguji login karena cookie sesi memakai `Secure`.

```bash
php artisan key:generate --force
ln -s ../public_html public
mkdir -p storage/app/public storage/app/private storage/framework/cache/data storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R u+rwX storage bootstrap/cache
php artisan migrate --force
ln -s ../mc-connect/storage/app/public ../public_html/storage
bash deployment/hostinger/create-owner.sh
php artisan config:cache
php artisan route:cache
```

Periksa dahulu apakah `public` dan `../public_html/storage` sudah ada atau berupa symlink; buat tautan hanya jika belum ada. Tautan storage dibuat melalui shell karena fungsi PHP untuk symlink/exec dapat dinonaktifkan pada hosting. Jangan gunakan `migrate:fresh`, SQL dump yang menghapus tabel, atau demo seeder untuk produksi. Skrip `create-owner.sh` dijalankan melalui sesi SSH interaktif; Bash menyembunyikan password, lalu meneruskannya ke command `mc:create-owner` lewat stdin. Password tidak disimpan dalam file atau argumen proses. Akun yang sudah terdaftar tidak diubah, dan mode maintenance dibuka setelah akun baru berhasil dibuat.

Pada update selanjutnya, pertahankan `.env`, file upload di `public_html/uploads`, dan `storage/app`. Cadangkan database sebelum menjalankan migrasi.

## Verifikasi

- Portal publik, kalender, dan booking dapat dibuka tanpa login.
- `/admin`, `/stage`, dan `/vendor` mengarah ke login untuk pengunjung yang belum masuk.
- Setelah login: cek penyimpanan acara, upload, invoice, dan logout.
- Request tanpa sesi ke `/api/cms/events` ditolak dengan HTTP 401.
- Endpoint `/api/setup-db` sudah dihapus.

Referensi: [DNS subdomain Hostinger](https://www.hostinger.com/support/1583405-how-to-create-and-delete-subdomains-in-hostinger/), [SSH key Hostinger](https://www.hostinger.com/support/5634532-how-to-generate-ssh-keys-and-add-them-to-hostinger-dashboard/), [deployment Laravel 12](https://laravel.com/docs/12.x/deployment).
