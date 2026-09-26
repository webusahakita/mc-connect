<?php

namespace Database\Seeders;

use App\Models\UserMC;
use App\Models\CmsArticle;
use Illuminate\Database\Seeder;

class UserMCSeeder extends Seeder
{
    public function run(): void
    {
        $mc = UserMC::create([
            'id' => 1,
            'nama_panggung' => 'Vanya Arsyad, S.I.Kom',
            'email' => 'vanya@mcconnect.id',
            'password_hash' => bcrypt('password123'),
            'tier_langganan' => 'Pro',
            'custom_domain' => 'vanyaarsyad.com',
            'token_ai_tersisa' => 85,
            'bio' => 'Master of Ceremony profesional berbasis di Jakarta & Surabaya dengan jam terbang lebih dari 8 tahun membawakan 500+ pernikahan mewah, gala dinner korporat, dan awarding night kenegaraan. Pembawaan elegan, bilingual (ID/EN), adaptif, dan berkarisma.',
            'no_telp' => '081298765432',
            'foto_profil' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
            'spesialisasi' => 'Luxury Wedding, Corporate Gala, Tech Summit, Festival Musik',
            'showreel_youtube_id' => 'dQw4w9WgXcQ',
            'instagram_handle' => '@vanyaarsyad.mc',
            'tiktok_handle' => '@vanyastage_official',
        ]);

        CmsArticle::create([
            'mc_id' => $mc->id,
            'kategori' => 'Terms',
            'judul' => 'Syarat & Ketentuan Booking MC Vanya Arsyad',
            'slug' => 'syarat-ketentuan-booking',
            'konten' => "1. Booking tanggal dianggap sah (Terkunci) setelah pembayaran DP 50% dari total nilai kontrak.\n2. Pelunasan sisa tagihan 50% wajib diselesaikan selambat-lambatnya H-2 sebelum hari acara.\n3. Durasi performa MC maksimal 4 jam per sesi acara. Kelebihan durasi dihitung overtime.\n4. Klien wajib menyediakan waktu Soundcheck/Gladi Bersih minimal 45 menit sebelum acara.",
            'is_published' => true,
        ]);

        CmsArticle::create([
            'mc_id' => $mc->id,
            'kategori' => 'Refund',
            'judul' => 'Kebijakan Pembatalan & Refund (Refund Policy)',
            'slug' => 'kebijakan-pembatalan-refund',
            'konten' => "1. Pembatalan >30 hari sebelum hari H: DP dapat dialihkan ke jadwal lain (reschedule) dalam waktu 6 bulan.\n2. Pembatalan H-30 s/d H-14: DP dapat dipindahtangankan dengan persetujuan manajemen MC.\n3. Pembatalan <14 hari: DP tidak dapat dikembalikan sebagai biaya kompensasi penolakan penawaran lain.\n4. Force Majeure: Tanggal acara dijadwalkan ulang tanpa penalti biaya.",
            'is_published' => true,
        ]);

        CmsArticle::create([
            'mc_id' => $mc->id,
            'kategori' => 'Riders',
            'judul' => 'Hospitality & Technical Riders Panggung',
            'slug' => 'hospitality-technical-riders',
            'konten' => "Kebutuhan Teknis:\n- 2 unit Wireless Microphone berkualitas tinggi (Shure Axient / Sennheiser EW-D).\n- 1 unit Stage Monitor speaker khusus menghadap posisi MC.\n\nKebutuhan Hospitality:\n- Ruang transit ber-AC (Green Room) dengan cermin rias dan colokan listrik.\n- Air mineral suhu ruang, lemon segar, dan madu.",
            'is_published' => true,
        ]);

        CmsArticle::create([
            'mc_id' => $mc->id,
            'kategori' => 'FAQ',
            'judul' => 'Pertanyaan Umum Seputar Layanan MC (FAQ)',
            'slug' => 'faq-layanan-mc',
            'konten' => "Q: Apakah Kak Vanya bisa membawakan acara bilingual (Inggris-Indonesia)?\nA: Ya, sangat fasih untuk corporate event multinasional maupun pernikahan multikultural.\n\nQ: Kapan naskah panggung teleprompter disiapkan?\nA: Maksimal 2x24 jam setelah rundown final disepakati bersama WO/EO.",
            'is_published' => true,
        ]);
    }
}
