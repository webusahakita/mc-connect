# Update otomatis MC-Connect

Repository: `webusahakita/mc-connect`. Website: https://mc.webusaha.com.

Push ke `main` menjalankan workflow **Test and deploy Hostinger**. Pull request menjalankan tes saja. Jika tes gagal, deployment tidak dimulai. Status dan log ada di [GitHub Actions](https://github.com/webusahakita/mc-connect/actions).

## Alur kerja di laptop

Mulai dari folder proyek dengan perubahan sebelumnya sudah di-commit:

```powershell
git pull --ff-only origin main
# Kerjakan perubahan, lalu uji di lokal.
php vendor/bin/phpunit
node --test tests/JavaScript/*.test.mjs
git add .
git commit -m "Jelaskan perubahan"
git push origin main
```

Tunggu workflow menjadi hijau, lalu tes website. `git push` berhasil berarti kode sudah terkirim ke GitHub; website diperbarui setelah job deployment selesai. Jika `pull` menolak karena perubahan lokal atau cabang berbeda, selesaikan perubahan/konfliknya dahulu. Untuk pekerjaan lebih besar, gunakan branch dan pull request; merge ke `main` akan memicu deployment.

Tidak perlu `git pull` di Hostinger atau upload ZIP lagi. Workflow juga bisa dijalankan ulang dari **Actions → Test and deploy Hostinger → Run workflow**, pilih `main`.

## Yang dikerjakan deployment

1. Menguji PHP dengan SQLite terisolasi dan menguji JavaScript/paket rilis.
2. Membuat arsip dari daftar file aplikasi yang diizinkan, dengan manifest hash dan versi URL aset sesuai commit.
3. Mengunggah melalui key SSH khusus CI. Key ini hanya menerima perintah `upload <commit>` dan `deploy <commit>`.
4. Memeriksa arsip di server dan menyiapkan dependensi produksi dari `composer.lock` sebelum maintenance.
5. Mencadangkan database dan kode aktif, memasang rilis selama maintenance, menjalankan migrasi serta cache Laravel, lalu membuka website dan memeriksa HTTP publik serta penolakan akses API privat tanpa login.

Deployment mempertahankan `.env`, `APP_KEY`, seluruh storage/sesi, upload pengguna, sertifikat challenge `.well-known`, dan `.user.ini` server. File aturan `uploads/.htaccess` ikut diperbarui. Tidak ada seeder demo atau penghapusan tabel. Perubahan skema berikutnya harus berupa migrasi yang mempertahankan data dan kompatibel dengan versi aplikasi sebelumnya.

`.env`, `vendor`, file runtime, profil browser, dan skrip percobaan yang sudah diabaikan `.gitignore` dikeluarkan dari tracking Git; salinan lokal tetap ada. Penghapusan dari tracking tidak menghapus versi yang pernah masuk riwayat commit lama.

## Konfigurasi yang sudah dipasang

- Repository variables: `HOSTINGER_HOST`, `HOSTINGER_PORT`, `HOSTINGER_USER`.
- Repository secrets: `HOSTINGER_SSH_KEY`, `HOSTINGER_KNOWN_HOSTS`.
- Key CI terpisah dari key laptop; host key diambil dari host SSH yang sudah dipercaya.
- Gateway dan helper server berada di `/home/u333915259/.mc-connect-deploy/` dan dipasang melalui key admin laptop. Isinya tidak ditimpa arsip CI. Jika mengubah skrip deployment/helper di repository, pasang versi yang sudah diperiksa ke direktori tersebut melalui akses admin sebelum menggunakannya.
- Aplikasi: `/home/u333915259/domains/mc.webusaha.com/mc-connect`.
- Publik: `/home/u333915259/domains/mc.webusaha.com/public_html`.
- Commit terakhir yang berhasil: `/home/u333915259/.mc-connect-deploy/current-revision`.

Jangan memasukkan private key, password database, atau isi `.env` ke repository/log. Jika mengganti host/key, perbarui secrets melalui GitHub Settings → Secrets and variables → Actions.

## Jika deployment gagal

Lihat job yang merah di GitHub Actions. Kegagalan tes, verifikasi paket, instalasi dependensi, atau backup terjadi sebelum kode aktif ditimpa. Jika pemasangan atau pemeriksaan website gagal, skrip mencoba mengembalikan file aplikasi sebelumnya. Kegagalan pemulihan file membutuhkan pemeriksaan lewat key admin laptop; maintenance dipertahankan bila pemulihan tidak berhasil.

Backup berada di `domains/mc.webusaha.com/deployment-backups/<waktu-UTC>-<commit>/`:

- `database.sql`: snapshot MySQL sebelum deployment.
- `app/`, `public_html/`, `bootstrap-cache/`: kode/dependensi dan cache sebelum deployment, tanpa `.env`, upload atau sesi.

Database **tidak dipulihkan otomatis** karena hal itu dapat menghapus data yang masuk setelah snapshot. Untuk perubahan kode biasa, buat commit perbaikan atau `git revert <commit>` lalu push; migrasi yang sudah berjalan tetap perlu diperiksa. Pemulihan SQL dilakukan secara terpisah setelah memeriksa dampaknya terhadap data. Backup tidak dihapus otomatis; kelola cadangan lama setelah memastikan rilis sudah baik dan kapasitas hosting mencukupi.
