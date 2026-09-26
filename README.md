# MC-Connect (Sistem Manajemen & Booking MC Terpadu)

**Versi Dokumen**: 8.0 (Final - Lengkap dengan Skema Database)  
**Target Platform**: Web Application (Responsive / Mobile-First / PWA)  
**Tech Stack**: Laravel 11, Vite, MySQL  

---

## Ringkasan Eksekutif
MC-Connect adalah platform SaaS (B2C & B2B) berbasis web dengan arsitektur **Event-Centric**. Platform ini menyediakan portal personal branding bagi Master of Ceremony (Dynamic Landing Page) dan ruang kerja operasional komprehensif (**Event Command Center**) per `Event_ID`.

Platform ini mengeliminasi risiko bentrok jadwal dengan alur *Request to Book*, mengotomatisasi keuangan dan pembuatan invoice resmi ber-QRIS, menyediakan asisten naskah panggung berbasis **AI MC Co-Pilot**, serta memastikan presisi panggung melalui **Voice-Activated Teleprompter** dan **Web Audio Soundboard**.

---

## Fitur Unggulan Sesuai PRD v8.0

### 1. Dynamic Landing Page (Portal Publik)
- **Interactive MC Biodata & Showreel**: Profil karier, statistik jam terbang (500+ acara, 99% review positif), chip spesialisasi panggung, dan pemutar video showreel YouTube/Reels.
- **Katalog Layanan & Investasi**: Etalase paket (*Silver*, *Gold Luxury*, *Platinum Royal*) lengkap dengan deliverables dan durasi panggung.
- **Interactive Availability Calendar Widget**: Kalender real-time penanda status jadwal:
  - 🟢 **Hijau (Available)**: Tersedia untuk dibooking.
  - 🟡 **Kuning (Tentative)**: Sedang dalam tahap peninjauan MC / menunggu DP.
  - 🔴 **Merah (Terkunci)**: Jadwal sudah dibayar DP dan terkunci permanen.
  - Klik tanggal langsung memicu modal formulir **Request to Book**.
- **CMS Mini (Blog, T&C, Refund Policy, Riders, FAQ)**: Modul CMS publik untuk menampilkan syarat kontrak, kebijakan pembatalan/refund, riders teknis & hospitality, serta FAQ.
- **Downloadable Press Kit**: Unduhan profil portofolio PDF dan rincian riders panggung.

### 2. Event Command Center (Pusat Komando Acara)
Ruang kerja terisolasi per `Event_ID` dengan 5 tab operasional:
- **Panel Drawer Sticky Notes & Checklists**:
  - Sticky notes kuning untuk catatan penting (larangan roasting VIP, nama gelar kehormatan pejabat).
  - Checklists tugas persiapan MC interaktif dengan bar indikator persentase kesiapan acara.
- **Tab 1: Ikhtisar & CRM**:
  - Metadata acara, PIC klien, timeline waktu panggung.
  - **WhatsApp Automation Gateway**: Tombol sekali klik untuk meluncurkan pesan template WhatsApp (Konfirmasi Booking, Penagihan DP, Pengingat H-2, Ucapan Terima Kasih).
  - **Wardrobe Tracker**: Pratinjau foto gaun/tuxedo dan lingkaran palet warna dominan (Hex color swatch e.g. Navy `#0F2B5C`, Champagne Gold `#D4AF37`).
- **Tab 2: Keuangan**:
  - Ringkasan Total Kontrak, Nominal DP Diterima, Sisa Tagihan, dan Estimasi Net Profit MC.
  - Invoice PDF cetak resmi berstandar korporat dilengkapi kode QRIS dinamis.
  - **Expense Tracker**: Pencatatan pengeluaran operasional (transportasi Alphard, laundry gaun, honor kru asisten) dan kalkulasi laba bersih.
- **Tab 3: Stage & Rundown**:
  - Urutan panggung terintegrasi dengan penanda segmen selesai.
  - **AI MC Co-Pilot**: Generator naskah cerdas untuk teks pembuka (Opening), entrance pengantin/VIP, toast, ice breaking games, dan closing dengan pilihan tone (*Formal, Hangat, Ceria, Elegan*). Otomatis mengurangi kuota `token_ai_tersisa`.
  - **Built-in Soundboard**: Generator efek suara instan berbasis Web Audio API (Applause, Drum Roll, Fanfare, Chime, Buzzer, Suspense Sting) tanpa delay unduh file audio eksternal.
- **Tab 4: Kolaborasi Vendor (Operator Musik / Soundman / DJ)**:
  - Matriks instruksi cue musik panggung per segmen.
  - Layar khusus operator musik (`/events/{id}/operator-music`) yang tersinkronisasi langsung secara real-time via `BroadcastChannel`.
- **Tab 5: Post-Event**:
  - Review Harvester: Generator pesan WhatsApp otomatis meminta ulasan bintang 5 dan formulir ulasan klien yang langsung dipublikasikan ke portal publik.

### 3. Stage Mode (Khusus Layar Tablet / HP)
- Tampilan Fullscreen Dark Mode dengan tata letak optimal:
  - **70% Layar**: Teleprompter teks naskah aktif, kontrol ukuran teks (A- / A+), mode cermin (Mirror mode untuk kaca teleprompter), dan **Voice Auto-Advance** (bergulir otomatis saat mendeteksi suara bicara MC).
  - **30% Layar**: Pad tombol Soundboard cepat, Jam Digital panggung, dan Stopwatch durasi segmen.

---

## Struktur Berkas Proyek

```
mc-connect/
├── app/
│   ├── Http/Controllers/
│   │   ├── PublicController.php
│   │   ├── DashboardController.php
│   │   ├── EventCommandCenterController.php
│   │   ├── StageModeController.php
│   │   ├── VendorOperatorController.php
│   │   ├── AiCoPilotController.php
│   │   └── InvoiceController.php
│   └── Models/
│       ├── UserMC.php
│       ├── Client.php
│       ├── Event.php
│       ├── Invoice.php
│       ├── RundownItem.php
│       ├── Checklist.php
│       ├── Wardrobe.php
│       ├── Expense.php
│       ├── CommunicationLog.php
│       ├── Review.php
│       └── CmsArticle.php
├── database/
│   ├── migrations/             (11 Berkas Migrasi Skema Lengkap)
│   ├── seeders/                (Seeder Data Realistis MC Indonesia)
│   └── schema.sql              (DDL & SQL Dump Lengkap untuk MySQL)
├── resources/
│   ├── css/                    (Design System Tokens, Glassmorphism, Layouts)
│   ├── js/                     (Soundboard Web Audio, Prompter Voice, Live Sync)
│   └── views/                  (Blade Layouts & Views Admin, Public, Stage, Vendor)
├── routes/
│   ├── web.php                 (Routing Halaman & Aksi)
│   └── api.php                 (REST API Endpoints)
├── public/
│   ├── index.html              (Instant Interactive Web App Ready-to-Run)
│   ├── css/ & js/              (Asset Bundles)
│   ├── manifest.json           (PWA Manifest)
│   └── sw.js                   (Service Worker Caching)
├── serve.ps1                   (Lightweight Local HTTP Server Runner)
├── composer.json
├── package.json
├── vite.config.js
└── .env.example & .env
```

---

## Cara Menjalankan Aplikasi

### Opsi 1: Menjalankan Instant Interactive Preview (Zero Dependencies)
Aplikasi telah dilengkapi server mandiri dan antarmuka interaktif yang langsung dapat diuji coba tanpa instalasi tambahan:
1. Buka PowerShell di folder `mc-connect`.
2. Jalankan perintah:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\serve.ps1
   ```
3. Buka peramban di `http://localhost:8000`.

### Opsi 2: Menjalankan dengan Stack Lengkap Laravel & MySQL
1. Pastikan Anda memiliki runtime **PHP 8.2+**, **Composer**, dan server **MySQL** (misalnya melalui Laragon, XAMPP, atau Docker).
2. Impor database:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
3. Instal dependensi PHP & jalankan migrasi/seeder:
   ```bash
   composer install
   php artisan key:generate
   php artisan migrate --seed
   ```
4. Jalankan frontend asset Vite & Laravel dev server:
   ```bash
   npm install
   npm run dev
   php artisan serve
   ```
5. Akses portal publik di `http://localhost:8000` dan dashboard admin di `http://localhost:8000/admin/dashboard`.
