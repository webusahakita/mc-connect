-- =======================================================
-- MC-Connect Database Schema & Seed Data (MySQL)
-- Versi Dokumen: 8.0 (Final - Lengkap dengan Skema Database)
-- Arsitektur: Event-Centric SaaS
-- =======================================================

CREATE DATABASE IF NOT EXISTS `mc_connect` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mc_connect`;

-- Drop existing tables in reverse foreign key order
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `communication_logs`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `wardrobes`;
DROP TABLE IF EXISTS `checklists`;
DROP TABLE IF EXISTS `rundown_items`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `clients`;
DROP TABLE IF EXISTS `cms_gallery`;
DROP TABLE IF EXISTS `cms_packages`;
DROP TABLE IF EXISTS `cms_riders`;
DROP TABLE IF EXISTS `cms_presskit`;
DROP TABLE IF EXISTS `cms_wardrobe_catalog`;
DROP TABLE IF EXISTS `cms_cashflow_categories`;
DROP TABLE IF EXISTS `cms_articles`;
DROP TABLE IF EXISTS `users_mc`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tabel Users_MC (Profil MC & Lisensi SaaS)
CREATE TABLE `users_mc` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `nama_panggung` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `tier_langganan` ENUM('Free', 'Pro', 'Agency') DEFAULT 'Pro',
    `custom_domain` VARCHAR(200) NULL,
    `token_ai_tersisa` INT DEFAULT 50,
    `bio` TEXT NULL,
    `no_telp` VARCHAR(30) NULL,
    `foto_profil` VARCHAR(500) NULL,
    `spesialisasi` VARCHAR(255) DEFAULT 'Wedding, Corporate Gala, Awarding Night, Festival',
    `showreel_youtube_id` VARCHAR(50) DEFAULT 'kJQP7kiw5Fk',
    `showreel_url` VARCHAR(255) NULL,
    `instagram_handle` VARCHAR(100) DEFAULT '@vanyaarsyad.mc',
    `tiktok_handle` VARCHAR(100) DEFAULT '@vanya_stage',
    `stat_events` VARCHAR(50) DEFAULT '500+ Events',
    `stat_years` VARCHAR(50) DEFAULT '8+ Tahun',
    `calendar_config` JSON NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Clients (PIC / Klien / EO / WO)
CREATE TABLE `clients` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mc_id` BIGINT UNSIGNED NOT NULL,
    `nama_pic` VARCHAR(150) NOT NULL,
    `no_wa` VARCHAR(30) NOT NULL,
    `email` VARCHAR(150) NULL,
    `tipe_klien` ENUM('Personal', 'EO', 'WO', 'Corporate') DEFAULT 'Personal',
    `instansi_atau_organisasi` VARCHAR(150) NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_clients_mc` FOREIGN KEY (`mc_id`) REFERENCES `users_mc` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Events (Pusat Komando Acara - Event-Centric Core)
CREATE TABLE `events` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `client_id` BIGINT UNSIGNED NOT NULL,
    `nama_acara` VARCHAR(255) NOT NULL,
    `lokasi` VARCHAR(255) NOT NULL,
    `tanggal_acara` DATE NOT NULL,
    `waktu_mulai` TIME NOT NULL,
    `waktu_selesai` TIME NOT NULL,
    `status` ENUM('Review', 'Tentative', 'Terkunci', 'Selesai') DEFAULT 'Review',
    `catatan_khusus` TEXT NULL,
    `total_budget` DECIMAL(15,2) DEFAULT 0.00,
    `tipe_acara` VARCHAR(100) DEFAULT 'Wedding Reception',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_events_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Invoices (Manajemen Keuangan & DP Otomatis)
CREATE TABLE `invoices` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `event_id` BIGINT UNSIGNED NOT NULL UNIQUE,
    `invoice_number` VARCHAR(50) NOT NULL UNIQUE,
    `total_biaya` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `nominal_dp` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `sisa_tagihan` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `status_bayar` ENUM('Unpaid', 'DP Paid', 'Fully Paid') DEFAULT 'Unpaid',
    `batas_waktu_bayar` TIMESTAMP NULL,
    `qris_url` VARCHAR(255) NULL,
    `catatan_pembayaran` TEXT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_invoices_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel Rundown_Items (Urutan Panggung, Naskah Prompter & Cue Musik)
CREATE TABLE `rundown_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `event_id` BIGINT UNSIGNED NOT NULL,
    `urutan` INT NOT NULL DEFAULT 1,
    `waktu_segmen` VARCHAR(50) NOT NULL,
    `judul_segmen` VARCHAR(200) NOT NULL,
    `naskah_prompter` LONGTEXT NULL,
    `instruksi_musik` VARCHAR(255) NULL,
    `is_completed` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_rundown_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel Checklists (Sticky Notes & To-Do List Per Acara)
CREATE TABLE `checklists` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `event_id` BIGINT UNSIGNED NOT NULL,
    `deskripsi_tugas` VARCHAR(255) NOT NULL,
    `status_selesai` TINYINT(1) DEFAULT 0,
    `kategori` VARCHAR(100) DEFAULT 'Umum',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_checklists_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabel Wardrobes (Wardrobe Tracker & Palet Warna Busana)
CREATE TABLE `wardrobes` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `event_id` BIGINT UNSIGNED NOT NULL,
    `deskripsi` VARCHAR(255) NOT NULL,
    `foto_kostum_url` VARCHAR(255) NULL,
    `warna_dominan` VARCHAR(50) NOT NULL DEFAULT '#1A365D',
    `status_ready` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_wardrobes_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabel Expenses (Expense Tracker Operasional)
CREATE TABLE `expenses` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `event_id` BIGINT UNSIGNED NOT NULL,
    `deskripsi` VARCHAR(255) NOT NULL,
    `jumlah` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `kategori` VARCHAR(100) DEFAULT 'Transportasi',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_expenses_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabel Communication_Logs (Log Komunikasi & Log WA Otomatis)
CREATE TABLE `communication_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `event_id` BIGINT UNSIGNED NOT NULL,
    `tipe` ENUM('WA', 'Call', 'Meeting') DEFAULT 'WA',
    `catatan` TEXT NOT NULL,
    `waktu_log` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_comm_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabel Reviews (Review Harvester Post-Event)
CREATE TABLE `reviews` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `event_id` BIGINT UNSIGNED NOT NULL,
    `rating` INT NOT NULL DEFAULT 5,
    `komentar` TEXT NOT NULL,
    `nama_reviewer` VARCHAR(150) NOT NULL,
    `is_featured` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_reviews_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Tabel CMS_Articles (Mini CMS Blog, T&C, Refund Policy, FAQ)
CREATE TABLE `cms_articles` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mc_id` BIGINT UNSIGNED NOT NULL,
    `kategori` ENUM('Terms', 'Refund', 'Blog', 'Riders', 'FAQ') DEFAULT 'Blog',
    `judul` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `konten` LONGTEXT NOT NULL,
    `is_published` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cms_mc` FOREIGN KEY (`mc_id`) REFERENCES `users_mc` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Tabel CMS Gallery (Foto Portofolio Landing Page)
CREATE TABLE `cms_gallery` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mc_id` BIGINT UNSIGNED NOT NULL,
    `file_path` VARCHAR(500) NOT NULL COMMENT 'Path di storage/app/public/gallery/',
    `url` VARCHAR(500) NOT NULL COMMENT 'URL publik via storage link',
    `caption` VARCHAR(255) DEFAULT '',
    `urutan` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_gallery_mc` FOREIGN KEY (`mc_id`) REFERENCES `users_mc` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Tabel CMS Packages (Paket Harga Landing Page)
CREATE TABLE `cms_packages` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mc_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) DEFAULT 'Standard',
    `price` DECIMAL(15,2) DEFAULT 0.00,
    `duration` VARCHAR(100) DEFAULT 'Max. 4 Jam',
    `features` JSON NULL COMMENT 'Array of feature strings',
    `urutan` INT DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_packages_mc` FOREIGN KEY (`mc_id`) REFERENCES `users_mc` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Tabel CMS Press Kit (Profil Resmi untuk PDF Press Kit)
CREATE TABLE `cms_presskit` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mc_id` BIGINT UNSIGNED NOT NULL,
    `stage_name` VARCHAR(150) DEFAULT '',
    `spesialisasi` VARCHAR(255) DEFAULT '',
    `tagline` VARCHAR(255) DEFAULT '',
    `bio` TEXT NULL,
    `pic_name` VARCHAR(150) DEFAULT '',
    `wa` VARCHAR(50) DEFAULT '',
    `email` VARCHAR(150) DEFAULT '',
    `sosmed` VARCHAR(255) DEFAULT '',
    `domisili` VARCHAR(255) DEFAULT '',
    `scope_corporate` TEXT NULL,
    `scope_wedding` TEXT NULL,
    `scope_entertainment` TEXT NULL,
    `scope_nilai_tambah` TEXT NULL,
    `footer_note` TEXT NULL,
    `riders_footer_note` TEXT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_presskit_mc` FOREIGN KEY (`mc_id`) REFERENCES `users_mc` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Tabel CMS Riders (Event Riders / Technical Riders per MC)
CREATE TABLE `cms_riders` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mc_id` BIGINT UNSIGNED NOT NULL,
    `rider_key` VARCHAR(50) NULL COMMENT 'Identifier unik misal rv_1',
    `title` VARCHAR(255) NOT NULL,
    `notes` LONGTEXT NULL,
    `urutan` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_riders_mc` FOREIGN KEY (`mc_id`) REFERENCES `users_mc` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Tabel CMS Wardrobe Catalog (Katalog Kostum Global MC)
CREATE TABLE `cms_wardrobe_catalog` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mc_id` BIGINT UNSIGNED NOT NULL,
    `nama` VARCHAR(255) NOT NULL,
    `deskripsi` TEXT NULL,
    `warna` VARCHAR(50) DEFAULT '#1A365D',
    `file_path` VARCHAR(500) NULL COMMENT 'Path di storage/app/public/wardrobe/',
    `foto_url` VARCHAR(500) NULL,
    `kategori` VARCHAR(100) DEFAULT 'Formal',
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_wardrobe_cat_mc` FOREIGN KEY (`mc_id`) REFERENCES `users_mc` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Tabel CMS Cashflow Categories (Kategori Arus Kas)
CREATE TABLE `cms_cashflow_categories` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mc_id` BIGINT UNSIGNED NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `tipe` ENUM('income', 'expense') DEFAULT 'expense',
    `warna` VARCHAR(50) DEFAULT '#4a9eff',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cashflow_cat_mc` FOREIGN KEY (`mc_id`) REFERENCES `users_mc` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =======================================================
-- SEED DATA (Realistic Data for Indonesian Professional MC)
-- =======================================================

-- 1. Insert User MC
INSERT INTO `users_mc` (`id`, `nama_panggung`, `email`, `password_hash`, `tier_langganan`, `custom_domain`, `token_ai_tersisa`, `bio`, `no_telp`, `foto_profil`, `spesialisasi`, `showreel_youtube_id`, `instagram_handle`, `tiktok_handle`) VALUES
(1, 'Vanya Arsyad, S.I.Kom', 'vanya@mcconnect.id', '$2y$12$eKo1b0N5k...mockhash', 'Pro', 'vanyaarsyad.com', 85, 'Master of Ceremony profesional berbasis di Jakarta & Surabaya dengan jam terbang lebih dari 8 tahun membawakan 500+ pernikahan mewah, gala dinner korporat, dan awarding night kenegaraan. Pembawaan elegan, bilingual (ID/EN), adaptif, dan berkarisma.', '081298765432', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', 'Luxury Wedding, Corporate Gala, Tech Summit, Festival Musik', 'dQw4w9WgXcQ', '@vanyaarsyad.mc', '@vanyastage_official');

-- 2. Insert Clients
INSERT INTO `clients` (`id`, `mc_id`, `nama_pic`, `no_wa`, `email`, `tipe_klien`, `instansi_atau_organisasi`) VALUES
(1, 1, 'Farhan & Natasha', '081122334455', 'natasha.farhan@gmail.com', 'Personal', 'Keluarga Besar Bpk. Hendrawan'),
(2, 1, 'Clarissa Tan (Harmony WO)', '081299887766', 'clarissa@harmonywo.com', 'WO', 'Harmony Wedding Organizer Jakarta'),
(3, 1, 'Budi Santoso', '081377889900', 'budi.santoso@telkomsel.co.id', 'Corporate', 'PT Telkomsel Digital Ecosystem'),
(4, 1, 'Jessica Wijaya (Epic EO)', '081765432100', 'jessica@epicevent.id', 'EO', 'Epic Event Indonesia');

-- 3. Insert Events
INSERT INTO `events` (`id`, `client_id`, `nama_acara`, `lokasi`, `tanggal_acara`, `waktu_mulai`, `waktu_selesai`, `status`, `catatan_khusus`, `total_budget`, `tipe_acara`) VALUES
(1, 1, 'Wedding Reception Farhan & Natasha', 'Grand Ballroom Hotel Mulia Senayan, Jakarta', '2026-09-18', '19:00:00', '22:00:00', 'Terkunci', 'Pengantin menginginkan vibes romantic-warm. Ada tamu kehormatan Menteri BUMN. Dilarang roasting tamu VIP. Naskah bilingual Indonesia-English saat opening speech.', 12500000.00, 'Wedding'),
(2, 3, 'Telkomsel Enterprise Gala & Awarding Night 2026', 'The Ritz-Carlton Pacific Place Ballroom, Jakarta', '2026-09-24', '18:30:00', '21:30:00', 'Tentative', 'Dress code Black Tie / Formal Tuxedo. Naskah sambutan Direksi harus sangat presisi sesuai teleprompter. Ada sesi pembagian 12 nominasi piala.', 16000000.00, 'Corporate Gala'),
(3, 2, 'The Grand Wedding of Kevin & Stephanie', 'JW Marriott Grand Ballroom, Surabaya', '2026-10-05', '18:00:00', '21:30:00', 'Review', 'Klien meminta penyesuaian harga khusus paket bundling akad & resepsi malam. Sedang menunggu konfirmasi rundown dari WO Harmony.', 14000000.00, 'Wedding'),
(4, 4, 'Fintech Innovations Summit & Expo 2026', 'ICE BSD Hall 3, Tangerang', '2026-08-15', '09:00:00', '17:00:00', 'Selesai', 'Acara sukses besar, rating bintang 5 didapatkan dari client PIC Jessica.', 15000000.00, 'Conference');

-- 4. Insert Invoices
INSERT INTO `invoices` (`id`, `event_id`, `invoice_number`, `total_biaya`, `nominal_dp`, `sisa_tagihan`, `status_bayar`, `batas_waktu_bayar`, `qris_url`, `catatan_pembayaran`) VALUES
(1, 1, 'INV-202609-001', 12500000.00, 6250000.00, 6250000.00, 'DP Paid', '2026-09-16 23:59:59', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226580016ID.CO.QRIS.WWW01189360000000000000000215INV202609001520458125303360540762500005802ID5913Vanya%20Arsyad6007JAKARTA6304ABCD', 'DP 50% telah diterima via BCA Virtual Account. Pelunasan sisa tagihan selambat-lambatnya H-2 sebelum acara dimulai.'),
(2, 2, 'INV-202609-002', 16000000.00, 8000000.00, 8000000.00, 'Unpaid', '2026-09-10 17:00:00', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=INV202609002', 'Menunggu persetujuan PO korporat dari Finance Telkomsel.'),
(3, 3, 'INV-202610-003', 14000000.00, 7000000.00, 7000000.00, 'Unpaid', '2026-09-20 23:59:59', NULL, 'Draft penawaran harga custom.');

-- 5. Insert Rundown Items (Event 1: Wedding Farhan & Natasha)
INSERT INTO `rundown_items` (`id`, `event_id`, `urutan`, `waktu_segmen`, `judul_segmen`, `naskah_prompter`, `instruksi_musik`, `is_completed`) VALUES
(1, 1, 1, '19:00 - 19:10', 'Opening Greeting & Welcoming VIP', 'Selamat malam para hadirin yang kami hormati, selamat datang di Grand Ballroom Hotel Mulia Senayan Jakarta. Selamat datang di malam perayaan cinta yang penuh kebahagiaan, The Wedding Reception of Farhan & Natasha! Sungguh suatu kehormatan malam ini saya, Vanya Arsyad, hadir menemani anda sekalian.', 'Fade-in Orchestral Romance Theme, volume 30%', 1),
(2, 1, 2, '19:10 - 19:25', 'Grand Entrance of Bride & Groom', 'Hadirin sekalian yang berbahagia, mari kita berdiri dan arahkan seluruh perhatian kita ke pintu utama. Mari kita sambut dengan tepuk tangan yang paling meriah, kedua mempelai yang berbahagia, Farhan & Natasha!', 'Epic Romantic Crescendo, fanfare sting saat pintu terbuka lebar', 0),
(3, 1, 3, '19:25 - 19:40', 'Wedding Cake Cutting & Toast', 'Cinta adalah komitmen untuk terus melangkah bersama. Farhan dan Natasha kini memegang pisau kue pernikahan, simbol awal berbagi manisnya kehidupan berdua. Mari angkat gelas kita, Cheers for everlasting love!', 'Acoustic Love Song (Ed Sheeran - Perfect), flute upbeat', 0),
(4, 1, 4, '19:40 - 20:30', 'Dinner & Mingling Session', 'Kepada seluruh tamu undangan yang terhormat, jamuan makan malam telah kami persiapkan. Sembari menikmati hidangan spesial, nikmati penampilan alunan musik indah dari The Groove Chamber.', 'Soft Jazz / Bossa Nova Lounge, volume 20%', 0),
(5, 1, 5, '20:30 - 21:00', 'Bouquet Toss & Interactive Games', 'Bagi seluruh sahabat lajang yang hadir malam ini, inilah momen yang ditunggu-tunggu! Segera merapat ke area dansa depan panggung untuk Flower Bouquet Toss!', 'Upbeat Funk / Bruno Mars - Treasure, sound effect drum roll', 0),
(6, 1, 6, '21:00 - 21:30', 'Closing & Photo Session VIP', 'Atas nama keluarga besar kedua mempelai, kami mengucapkan terima kasih tak terhingga atas kehadiran, doa, dan cinta yang telah anda berikan malam ini. Saya Vanya Arsyad pamit undur diri, have a wonderful night!', 'Emotional Instrumental Outro, volume crescendo', 0);

-- 6. Insert Checklists (Event 1)
INSERT INTO `checklists` (`id`, `event_id`, `deskripsi_tugas`, `status_selesai`, `kategori`) VALUES
(1, 1, 'Konfirmasi pelafalan nama gelar kehormatan orang tua mempelai', 1, 'Protokoler'),
(2, 1, 'Cek sound & gladi mic wireless Shure Axient Digital di FOH', 1, 'Teknis'),
(3, 1, 'Briefing sinyal cue musik dengan Mas Dimas (Sound Operator)', 1, 'Koordinasi'),
(4, 1, 'Ambil gaun malam dari desainer & pastikan dry clean siap', 1, 'Wardrobe'),
(5, 1, 'Cek ketersediaan air mineral hangat & lemon di green room MC', 0, 'Hospitality');

-- 7. Insert Wardrobes (Event 1)
INSERT INTO `wardrobes` (`id`, `event_id`, `deskripsi`, `foto_kostum_url`, `warna_dominan`, `status_ready`) VALUES
(1, 1, 'Navy Blue Velvet Evening Gown with Silver Sequin Accents', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80', '#0F2B5C', 1),
(2, 1, 'Cadangan: Champagne Gold Sparkle Satin Dress', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80', '#D4AF37', 1);

-- 8. Insert Expenses (Event 1)
INSERT INTO `expenses` (`id`, `event_id`, `deskripsi`, `jumlah`, `kategori`) VALUES
(1, 1, 'Transportasi Alphard Antar-Jemput Venue', 850000.00, 'Transportasi'),
(2, 1, 'Laundry Gaun & Dry Clean Express', 350000.00, 'Wardrobe'),
(3, 1, 'Honor Asisten MC / Stage Runner (Rian)', 750000.00, 'Kru'),
(4, 1, 'Print Binder Cue Card Hologram & Stiker', 150000.00, 'Logistik');

-- 9. Insert Communication Logs (Event 1)
INSERT INTO `communication_logs` (`id`, `event_id`, `tipe`, `catatan`, `waktu_log`) VALUES
(1, 1, 'WA', 'Kirim draft awal rundown acara ke Natasha via WhatsApp. Klien senang dan memberi catatan khusus tentang tamu VIP.', '2026-09-01 10:15:00'),
(2, 1, 'Meeting', 'Technical Meeting via Zoom bersama Clarissa (WO Harmony) dan Vendor Sound. Menyelaraskan cue entrance.', '2026-09-03 14:00:00'),
(3, 1, 'WA', 'Konfirmasi penerimaan bukti transfer DP 50% dan mengirim invoice resmi status DP Paid.', '2026-09-03 16:45:00');

-- 10. Insert Reviews
INSERT INTO `reviews` (`id`, `event_id`, `rating`, `komentar`, `nama_reviewer`, `is_featured`) VALUES
(1, 4, 5, 'Kak Vanya luar biasa profesional! Menguasai materi fintech dengan sangat baik, artikulasi jelas, bilingual-nya sangat natural saat memandu panelis dari Singapura.', 'Jessica Wijaya (Lead PM Epic EO)', 1),
(2, 1, 5, 'Suasana wedding kami jadi luar biasa hidup dan berkelas berkat Kak Vanya. Semua tamu memuji keanggunan dan kehangatan pembawaannya. Sangat recommended!', 'Natasha Hendrawan (Mempelai Wanita)', 1);

-- 11. Insert CMS Articles
INSERT INTO `cms_articles` (`id`, `mc_id`, `kategori`, `judul`, `slug`, `konten`, `is_published`) VALUES
(1, 1, 'Terms', 'Syarat & Ketentuan Booking MC Vanya Arsyad', 'syarat-ketentuan-booking', '1. Booking tanggal dianggap sah (Terkunci) setelah klien melakukan pembayaran Down Payment (DP) minimal 50% dari total nilai kontrak.\n2. Pelunasan sisa tagihan 50% wajib diselesaikan selambat-lambatnya H-2 sebelum hari acara berlangsung.\n3. Durasi standar performa MC adalah maksimal 4 jam per sesi acara. Kelebihan durasi akan dikenakan biaya overtime sesuai kesepakatan tertulis.\n4. Klien berkewajiban menyediakan waktu Gladi Bersih / Soundcheck minimal 45 menit sebelum acara dibuka untuk memastikan kualitas audio dan koordinasi musik panggung.', 1),
(2, 1, 'Refund', 'Kebijakan Pembatalan & Refund (Refund Policy)', 'kebijakan-pembatalan-refund', '1. Pembatalan oleh pihak klien lebih dari 30 hari sebelum hari H: Uang DP dapat dialihkan ke tanggal lain yang masih tersedia (reschedule) dalam kurun waktu 6 bulan kalender.\n2. Pembatalan antara H-30 hingga H-14: DP tidak dapat dikembalikan namun dapat dipindahtangankan ke event lain dengan persetujuan manajemen MC.\n3. Pembatalan kurang dari 14 hari sebelum hari H: DP dianggap hangus sebagai biaya kompensasi penolakan penawaran klien lain.\n4. Force Majeure (bencana alam, regulasi darurat pemerintah): Tanggal acara dapat dijadwalkan ulang tanpa penalti biaya apapun.', 1),
(3, 1, 'Riders', 'Hospitality & Technical Riders Panggung', 'hospitality-technical-riders', 'Kebutuhan Teknis:\n- 2 unit Wireless Microphone berkualitas tinggi (Shure Axient / Sennheiser EW-D) dengan baterai baru cadangan di panggung.\n- 1 unit Stage Monitor speaker khusus menghadap posisi MC dengan mixing vokal jernih.\n- Koneksi kabel HDMI atau wireless casting jika menggunakan prompter digital eksternal.\n\nKebutuhan Hospitality:\n- Ruang tunggu / transit ber-AC (Green Room) dengan cermin rias, stopkontak, dan gantungan busana.\n- Air mineral hangat bersuhu ruang serta irisan lemon segar dan madu.', 1),
(4, 1, 'FAQ', 'Pertanyaan Umum Seputar Layanan MC (FAQ)', 'faq-layanan-mc', 'Q: Apakah Kak Vanya bisa memandu acara dengan bahasa Inggris penuh (Bilingual)?\nA: Ya, Kak Vanya sangat fasih berbahasa Inggris profesional untuk corporate event internasional maupun pernikahan multikultural.\n\nQ: Berapa lama waktu yang dibutuhkan untuk pembuatan naskah acara?\nA: Setelah technical meeting dan rundown final diterima dari WO/EO, naskah panggung prompter akan disiapkan dalam 2x24 jam.', 1);
