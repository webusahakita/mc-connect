<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Invoice;
use App\Models\RundownItem;
use App\Models\Checklist;
use App\Models\Wardrobe;
use App\Models\Expense;
use App\Models\CommunicationLog;
use App\Models\Review;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Event 1: Wedding Farhan & Natasha (Status: Terkunci)
        $event1 = Event::create([
            'id' => 1,
            'client_id' => 1,
            'nama_acara' => 'Wedding Reception Farhan & Natasha',
            'lokasi' => 'Grand Ballroom Hotel Mulia Senayan, Jakarta',
            'tanggal_acara' => '2026-09-18',
            'waktu_mulai' => '19:00:00',
            'waktu_selesai' => '22:00:00',
            'status' => 'Terkunci',
            'catatan_khusus' => 'Pengantin menginginkan vibes romantic-warm. Ada tamu kehormatan Menteri BUMN. Dilarang roasting tamu VIP. Naskah bilingual Indonesia-English saat opening speech.',
            'total_budget' => 12500000.00,
            'tipe_acara' => 'Wedding',
        ]);

        Invoice::create([
            'id' => 1,
            'event_id' => $event1->id,
            'invoice_number' => 'INV-202609-001',
            'total_biaya' => 12500000.00,
            'nominal_dp' => 6250000.00,
            'sisa_tagihan' => 6250000.00,
            'status_bayar' => 'DP Paid',
            'batas_waktu_bayar' => '2026-09-16 23:59:59',
            'qris_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=INV202609001',
            'catatan_pembayaran' => 'DP 50% telah diterima via BCA Virtual Account. Pelunasan selambat-lambatnya H-2 sebelum acara.',
        ]);

        $rundowns = [
            [
                'urutan' => 1,
                'waktu_segmen' => '19:00 - 19:10',
                'judul_segmen' => 'Opening Greeting & Welcoming VIP',
                'naskah_prompter' => 'Selamat malam para hadirin yang kami hormati, selamat datang di Grand Ballroom Hotel Mulia Senayan Jakarta. Selamat datang di malam perayaan cinta yang penuh kebahagiaan, The Wedding Reception of Farhan & Natasha! Sungguh suatu kehormatan malam ini saya, Vanya Arsyad, hadir menemani anda sekalian.',
                'instruksi_musik' => 'Fade-in Orchestral Romance Theme, volume 30%',
                'is_completed' => true,
            ],
            [
                'urutan' => 2,
                'waktu_segmen' => '19:10 - 19:25',
                'judul_segmen' => 'Grand Entrance of Bride & Groom',
                'naskah_prompter' => 'Hadirin sekalian yang berbahagia, mari kita berdiri dan arahkan seluruh perhatian kita ke pintu utama. Mari kita sambut dengan tepuk tangan yang paling meriah, kedua mempelai yang berbahagia, Farhan & Natasha!',
                'instruksi_musik' => 'Epic Romantic Crescendo, fanfare sting saat pintu terbuka lebar',
                'is_completed' => false,
            ],
            [
                'urutan' => 3,
                'waktu_segmen' => '19:25 - 19:40',
                'judul_segmen' => 'Wedding Cake Cutting & Toast',
                'naskah_prompter' => 'Cinta adalah komitmen untuk terus melangkah bersama. Farhan dan Natasha kini memegang pisau kue pernikahan, simbol awal berbagi manisnya kehidupan berdua. Mari angkat gelas kita, Cheers for everlasting love!',
                'instruksi_musik' => 'Acoustic Love Song (Ed Sheeran - Perfect), flute upbeat',
                'is_completed' => false,
            ],
            [
                'urutan' => 4,
                'waktu_segmen' => '19:40 - 20:30',
                'judul_segmen' => 'Dinner & Mingling Session',
                'naskah_prompter' => 'Kepada seluruh tamu undangan yang terhormat, jamuan makan malam telah kami persiapkan. Sembari menikmati hidangan spesial, nikmati penampilan alunan musik indah dari The Groove Chamber.',
                'instruksi_musik' => 'Soft Jazz / Bossa Nova Lounge, volume 20%',
                'is_completed' => false,
            ],
            [
                'urutan' => 5,
                'waktu_segmen' => '20:30 - 21:00',
                'judul_segmen' => 'Bouquet Toss & Interactive Games',
                'naskah_prompter' => 'Bagi seluruh sahabat lajang yang hadir malam ini, inilah momen yang ditunggu-tunggu! Segera merapat ke area dansa depan panggung untuk Flower Bouquet Toss!',
                'instruksi_musik' => 'Upbeat Funk / Bruno Mars - Treasure, sound effect drum roll',
                'is_completed' => false,
            ],
            [
                'urutan' => 6,
                'waktu_segmen' => '21:00 - 21:30',
                'judul_segmen' => 'Closing & Photo Session VIP',
                'naskah_prompter' => 'Atas nama keluarga besar kedua mempelai, kami mengucapkan terima kasih tak terhingga atas kehadiran, doa, dan cinta yang telah anda berikan malam ini. Saya Vanya Arsyad pamit undur diri, have a wonderful night!',
                'instruksi_musik' => 'Emotional Instrumental Outro, volume crescendo',
                'is_completed' => false,
            ],
        ];

        foreach ($rundowns as $item) {
            RundownItem::create(array_merge(['event_id' => $event1->id], $item));
        }

        Checklist::create(['event_id' => $event1->id, 'deskripsi_tugas' => 'Konfirmasi pelafalan nama gelar kehormatan orang tua mempelai', 'status_selesai' => true, 'kategori' => 'Protokoler']);
        Checklist::create(['event_id' => $event1->id, 'deskripsi_tugas' => 'Cek sound & gladi mic wireless Shure Axient Digital di FOH', 'status_selesai' => true, 'kategori' => 'Teknis']);
        Checklist::create(['event_id' => $event1->id, 'deskripsi_tugas' => 'Briefing sinyal cue musik dengan Mas Dimas (Sound Operator)', 'status_selesai' => true, 'kategori' => 'Koordinasi']);
        Checklist::create(['event_id' => $event1->id, 'deskripsi_tugas' => 'Ambil gaun malam dari desainer & pastikan dry clean siap', 'status_selesai' => true, 'kategori' => 'Wardrobe']);
        Checklist::create(['event_id' => $event1->id, 'deskripsi_tugas' => 'Cek ketersediaan air mineral hangat & lemon di green room MC', 'status_selesai' => false, 'kategori' => 'Hospitality']);

        Wardrobe::create([
            'event_id' => $event1->id,
            'deskripsi' => 'Navy Blue Velvet Evening Gown with Silver Sequin Accents',
            'foto_kostum_url' => 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80',
            'warna_dominan' => '#0F2B5C',
            'status_ready' => true,
        ]);

        Expense::create(['event_id' => $event1->id, 'deskripsi' => 'Transportasi Alphard Antar-Jemput Venue', 'jumlah' => 850000.00, 'kategori' => 'Transportasi']);
        Expense::create(['event_id' => $event1->id, 'deskripsi' => 'Honor Asisten MC / Stage Runner (Rian)', 'jumlah' => 750000.00, 'kategori' => 'Kru']);

        CommunicationLog::create([
            'event_id' => $event1->id,
            'tipe' => 'WA',
            'catatan' => 'Kirim draft awal rundown acara ke Natasha via WhatsApp. Klien senang dan memberi catatan khusus tentang tamu VIP.',
            'waktu_log' => '2026-09-01 10:15:00',
        ]);

        Review::create([
            'event_id' => $event1->id,
            'rating' => 5,
            'komentar' => 'Suasana wedding kami jadi luar biasa hidup dan berkelas berkat Kak Vanya. Semua tamu memuji keanggunan dan kehangatan pembawaannya. Sangat recommended!',
            'nama_reviewer' => 'Natasha Hendrawan (Mempelai Wanita)',
            'is_featured' => true,
        ]);

        // 2. Event 2: Telkomsel Enterprise Gala (Status: Tentative)
        Event::create([
            'id' => 2,
            'client_id' => 3,
            'nama_acara' => 'Telkomsel Enterprise Gala & Awarding Night 2026',
            'lokasi' => 'The Ritz-Carlton Pacific Place Ballroom, Jakarta',
            'tanggal_acara' => '2026-09-24',
            'waktu_mulai' => '18:30:00',
            'waktu_selesai' => '21:30:00',
            'status' => 'Tentative',
            'catatan_khusus' => 'Dress code Black Tie / Formal Tuxedo. Naskah sambutan Direksi harus sangat presisi sesuai teleprompter.',
            'total_budget' => 16000000.00,
            'tipe_acara' => 'Corporate Gala',
        ]);

        Invoice::create([
            'id' => 2,
            'event_id' => 2,
            'invoice_number' => 'INV-202609-002',
            'total_biaya' => 16000000.00,
            'nominal_dp' => 8000000.00,
            'sisa_tagihan' => 8000000.00,
            'status_bayar' => 'Unpaid',
            'batas_waktu_bayar' => '2026-09-10 17:00:00',
            'qris_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=INV202609002',
        ]);
    }
}
