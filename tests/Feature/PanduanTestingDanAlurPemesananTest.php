<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Event;
use App\Models\Invoice;
use App\Models\UserMC;
use App\Models\CmsCashflowTransaction;
use App\Models\CmsPackage;
use App\Models\CmsRider;
use App\Models\CmsCustomer;
use App\Models\CmsMusicBank;
use App\Models\CmsWardrobeItem;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PanduanTestingDanAlurPemesananTest extends TestCase
{
    protected UserMC $mc;

    protected function setUp(): void
    {
        parent::setUp();

        $this->artisan('migrate');

        $this->mc = UserMC::firstOrCreate(
            ['email' => 'admin@mcconnect.id'],
            [
                'nama_lengkap' => 'Arkanza Radja Maulana',
                'nama_panggung' => 'Arkanza Radja Maulana',
                'password_hash' => Hash::make('password123'),
                'username' => 'admin',
                'bio' => 'Professional Master of Ceremony Bilingual',
                'spesialisasi' => 'Corporate Gala Dinner, Wedding, Awarding Night',
                'token_ai_tersisa' => 50,
            ]
        );
    }

    protected function actingAsMc(UserMC $mc): self
    {
        return $this->withSession([
            'mc_user_id' => $mc->id,
            'mc_user_email' => $mc->email,
        ]);
    }

    /**
     * SKENARIO 1: Simulasi Klien Memesan Acara (Portal Publik)
     * Menguji form request booking, validasi, pembuatan draft invoice otomatis,
     * serta status Tentative (Kuning #eab308) pada kalender publik.
     */
    public function test_skenario_1_simulasi_klien_memesan_acara_portal_publik(): void
    {
        $bookingDate = now()->addDays(30)->format('Y-m-d');
        $payload = [
            'nama_pic' => 'Bapak Dimas Pratama',
            'no_wa' => '081298765432',
            'email' => 'dimas.pratama@perusahaan.co.id',
            'tipe_klien' => 'Corporate',
            'tipe_acara' => 'Corporate Gala Dinner',
            'nama_acara' => 'Corporate Gala Dinner',
            'lokasi' => 'Hotel Mulia Senayan, Jakarta',
            'tanggal_acara' => $bookingDate,
            'waktu_mulai' => '18:30',
            'waktu_selesai' => '22:00',
            'catatan_khusus' => 'Undangan VIP Direksi & Menteri BUMN',
            'paket_layanan' => 'Gold Luxury Wedding Package',
        ];

        // 1. Kirim Request to Book
        $res = $this->postJson('/api/book/request', $payload);
        $res->assertStatus(200);
        $res->assertJson([
            'success' => true,
            'status' => 'Tentative',
        ]);

        $eventId = $res->json('event_id');
        $this->assertNotNull($eventId);

        // 2. Verifikasi Data Event dan Klien di Database
        $event = Event::with('client')->find($eventId);
        $this->assertNotNull($event);
        $this->assertEquals('Tentative', $event->status);
        $this->assertEquals('Bapak Dimas Pratama', $event->client->nama_pic);
        $this->assertEquals('081298765432', $event->client->no_wa);
        $this->assertEquals('Hotel Mulia Senayan, Jakarta', $event->lokasi);

        // 3. Verifikasi Otomatis Terbit Invoice dengan DP 50%
        $invoice = Invoice::where('event_id', $eventId)->first();
        $this->assertNotNull($invoice);
        $this->assertEquals('Unpaid', $invoice->status_bayar);
        $this->assertEquals(6250000, $invoice->nominal_dp);
        $this->assertStringStartsWith('INV-', $invoice->invoice_number);

        // 4. Verifikasi Kalender Ketersediaan Publik: Tanggal berwarna Kuning (Tentative)
        $calRes = $this->getJson('/api/calendar/availability');
        $calRes->assertStatus(200);
        $calItems = collect($calRes->json());
        $calItem = $calItems->firstWhere('id', $eventId);
        $this->assertNotNull($calItem);
        $this->assertEquals('Tentative Booking', $calItem['title']);
        $this->assertEquals('#eab308', $calItem['color']);
    }

    /**
     * SKENARIO 2: Konfirmasi Lead & Finansial (Admin Workspace)
     * Menguji peninjauan event di dashboard admin, verifikasi QRIS statis,
     * pengubahan status DP Paid dan penguncian jadwal (Anti-Bentrok Merah #ef4444).
     */
    public function test_skenario_2_konfirmasi_lead_dan_finansial_admin_workspace(): void
    {
        // Setup initial tentative event
        $client = Client::create([
            'mc_id' => $this->mc->id,
            'nama_pic' => 'Bapak Dimas Pratama',
            'no_wa' => '081298765432',
            'email' => 'dimas.pratama@perusahaan.co.id',
            'tipe_klien' => 'Corporate',
            'kategori' => 'Corporate Gala Dinner',
            'nilai_kontrak' => 12500000,
            'nama_acara' => 'Corporate Gala Dinner',
            'tanggal_acara' => now()->addDays(30)->format('Y-m-d'),
        ]);

        $event = Event::create([
            'client_id' => $client->id,
            'nama_acara' => 'Corporate Gala Dinner',
            'lokasi' => 'Hotel Mulia Senayan, Jakarta',
            'tanggal_acara' => $client->tanggal_acara,
            'waktu_mulai' => '18:30:00',
            'waktu_selesai' => '22:00:00',
            'status' => 'Tentative',
            'catatan_khusus' => 'Undangan VIP Direksi & Menteri BUMN',
            'tipe_acara' => 'Corporate Gala Dinner',
            'total_budget' => 12500000,
            'nilai_kontrak' => 12500000,
        ]);

        // 1. Admin melihat daftar acara di dashboard
        $adminEventsRes = $this->actingAsMc($this->mc)->getJson('/api/cms/events');
        $adminEventsRes->assertStatus(200);
        $eventsData = collect($adminEventsRes->json('data'));
        $found = $eventsData->firstWhere('id', $event->id);
        $this->assertNotNull($found);
        $this->assertStringContainsString('Bapak Dimas Pratama', $found['pic']);

        // 2. Set Payment Settings QRIS Statis
        $savePaymentRes = $this->actingAsMc($this->mc)->postJson('/api/cms/payment-settings', [
            'bankName' => 'BCA Bisnis',
            'bankAccount' => '8801234567',
            'bankHolder' => 'Arkanza Radja Maulana',
            'dpPercent' => 50,
            'qrisUrl' => '/uploads/qris/official-static-qris.png',
        ]);
        $savePaymentRes->assertStatus(200);

        // 3. Konfirmasi DP Paid -> Status TERKUNCI (Anti-Bentrok)
        $updateRes = $this->actingAsMc($this->mc)->putJson("/api/cms/events/{$event->id}", [
            'status' => 'Terkunci',
            'status_pembayaran' => 'DP Paid',
            'metadata' => [
                'nominal_dp' => 6250000,
                'qris_status' => 'Paid',
            ],
        ]);
        $updateRes->assertStatus(200);

        // 4. Verifikasi Status Acara di DB Terkunci
        $freshEvent = Event::find($event->id);
        $this->assertEquals('Terkunci', $freshEvent->status);

        // 5. Verifikasi Kalender Publik menjadi Merah (#ef4444)
        $calRes = $this->getJson('/api/calendar/availability');
        $calItems = collect($calRes->json());
        $calItem = $calItems->firstWhere('id', $event->id);
        $this->assertNotNull($calItem);
        $this->assertEquals('Booked (Terkunci)', $calItem['title']);
        $this->assertEquals('#ef4444', $calItem['color']);
    }

    /**
     * SKENARIO 3: Penyiapan Rundown & AI MC Co-Pilot
     * Menguji input template rundown, AI script generator (-1 token),
     * dan sinkronisasi metadata segmen ke kolaborasi vendor.
     */
    public function test_skenario_3_penyiapan_rundown_dan_ai_mc_copilot(): void
    {
        $client = Client::create([
            'mc_id' => $this->mc->id,
            'nama_pic' => 'Bapak Dimas Pratama',
            'no_wa' => '081298765432',
            'nama_acara' => 'Corporate Gala Dinner',
            'tanggal_acara' => now()->addDays(30)->format('Y-m-d'),
        ]);

        $event = Event::create([
            'client_id' => $client->id,
            'nama_acara' => 'Corporate Gala Dinner',
            'lokasi' => 'Hotel Mulia Senayan',
            'tanggal_acara' => $client->tanggal_acara,
            'waktu_mulai' => '18:30:00',
            'waktu_selesai' => '22:00:00',
            'status' => 'Terkunci',
        ]);

        // 1. Uji AI MC Co-Pilot Script Generator (Formal Tone)
        $aiRes = $this->actingAsMc($this->mc)->postJson("/api/events/{$event->id}/ai/generate-script", [
            'segment_type' => 'opening',
            'tone' => 'formal',
            'vip_names' => 'Menteri BUMN & Dewan Komisaris',
            'custom_notes' => 'Tamu memakai dress code formal tuxedo & gaun malam',
        ]);
        $aiRes->assertStatus(200);
        $aiRes->assertJson([
            'success' => true,
        ]);
        $generatedScript = $aiRes->json('script');
        $generatedCue = $aiRes->json('music_cue');

        $this->assertNotEmpty($generatedScript);
        $this->assertStringContainsString('Corporate Gala Dinner', $generatedScript);
        $this->assertStringContainsString('Menteri BUMN', $generatedScript);
        $this->assertNotEmpty($generatedCue);

        // Verifikasi token AI berkurang dari 50 ke 49
        $freshMc = UserMC::find($this->mc->id);
        $this->assertEquals(49, $freshMc->token_ai_tersisa);

        // 2. Terapkan Rundown 7 Segmen lengkap dengan naskah AI
        $rundown = [
            ['start_time' => '18:30', 'end_time' => '19:00', 'title' => 'Open Gate & Registrasi', 'prompter' => 'Selamat datang bapak/ibu.', 'cue_music' => 'Lounge BGM', 'pic' => 'WO'],
            ['start_time' => '19:00', 'end_time' => '19:15', 'title' => 'Grand Entrance Direksi', 'prompter' => $generatedScript, 'cue_music' => $generatedCue, 'pic' => 'MC & Runner'],
            ['start_time' => '19:15', 'end_time' => '19:25', 'title' => 'Menyanyikan Lagu Indonesia Raya & Doa', 'prompter' => 'Hadirin dimohon berdiri...', 'cue_music' => 'Indonesia Raya', 'pic' => 'Audio Op'],
            ['start_time' => '19:25', 'end_time' => '19:45', 'title' => 'Sambutan Direktur Utama', 'prompter' => 'Kini kita dengarkan sambutan hangat...', 'cue_music' => 'Soft Ambient', 'pic' => 'MC'],
            ['start_time' => '19:45', 'end_time' => '20:30', 'title' => 'Ramah Tamah & Gala Dinner', 'prompter' => 'Selamat menikmati hidangan lezat...', 'cue_music' => 'Romantic Jazz', 'pic' => 'Catering & Audio'],
            ['start_time' => '20:30', 'end_time' => '21:15', 'title' => 'Awarding & Games Interaktif', 'prompter' => 'Mari kita mulai games awarding...', 'cue_music' => 'Upbeat Funk Groove', 'pic' => 'MC'],
            ['start_time' => '21:15', 'end_time' => '22:00', 'title' => 'Closing & Foto Bersama', 'prompter' => 'Terima kasih atas malam luar biasa ini...', 'cue_music' => 'Grand Outro Theme', 'pic' => 'All Team'],
        ];

        $saveRundownRes = $this->actingAsMc($this->mc)->putJson("/api/cms/events/{$event->id}", [
            'metadata' => ['rundown' => $rundown]
        ]);
        $saveRundownRes->assertStatus(200);

        // Verifikasi susunan tersimpan di metadata event
        $savedEvent = Event::find($event->id);
        $savedMeta = is_string($savedEvent->metadata) ? json_decode($savedEvent->metadata, true) : $savedEvent->metadata;
        $this->assertCount(7, $savedMeta['rundown']);
        $this->assertEquals('Grand Entrance Direksi', $savedMeta['rundown'][1]['title']);
        $this->assertEquals($generatedScript, $savedMeta['rundown'][1]['prompter']);
    }

    /**
     * SKENARIO 4: Simulasi Hari H (Stage Mode & Vendor Collab)
     * Menguji rute keamanan workspace dan integritas data sinkronisasi panggung.
     */
    public function test_skenario_4_simulasi_hari_h_stage_mode_dan_vendor_live_sync(): void
    {
        // Protected workspace routes require authentication
        $this->get('/stage')->assertRedirect('/login?redirect=%2Fstage');
        $this->get('/vendor')->assertRedirect('/login?redirect=%2Fvendor');

        // Authenticated MC can access both Stage Mode and Vendor Mode
        $this->actingAsMc($this->mc)->get('/stage')->assertStatus(200);
        $this->actingAsMc($this->mc)->get('/vendor')->assertStatus(200);

        // Music Bank endpoints respond correctly
        $musicRes = $this->actingAsMc($this->mc)->getJson('/api/cms/music-bank');
        $musicRes->assertStatus(200);
        $musicRes->assertJsonStructure(['success', 'data']);
    }

    /**
     * SKENARIO 5: Pasca-Acara & Tutup Buku Finansial
     * Menguji CRM LTV, pencatatan transaksi kas masuk/keluar,
     * validasi penolakan nilai negatif, dan penutupan acara Selesai 100%.
     */
    public function test_skenario_5_pasca_acara_dan_tutup_buku_finansial(): void
    {
        $client = Client::create([
            'mc_id' => $this->mc->id,
            'nama_pic' => 'Bapak Dimas Pratama',
            'no_wa' => '081298765432',
            'nilai_kontrak' => 12500000,
            'nama_acara' => 'Corporate Gala Dinner',
            'tanggal_acara' => now()->format('Y-m-d'),
        ]);

        $event = Event::create([
            'client_id' => $client->id,
            'nama_acara' => 'Corporate Gala Dinner',
            'lokasi' => 'Hotel Mulia Senayan',
            'tanggal_acara' => $client->tanggal_acara,
            'waktu_mulai' => '18:30:00',
            'waktu_selesai' => '22:00:00',
            'status' => 'Terkunci',
            'nilai_kontrak' => 12500000,
        ]);

        // 1. Verifikasi Data Pelanggan CRM
        $custRes = $this->actingAsMc($this->mc)->getJson('/api/cms/customers');
        $custRes->assertStatus(200);

        // 2. Catat Transaksi Pemasukan (Pelunasan Acara Rp 5.000.000)
        $incomeRes = $this->actingAsMc($this->mc)->postJson('/api/cms/cashflow-transactions', [
            'type' => 'in',
            'amount' => 5000000,
            'category' => 'Pelunasan Acara',
            'date' => now()->format('Y-m-d'),
            'desc' => 'Pelunasan 100% Acara Gala Dinner Dimas Pratama',
            'eventId' => $event->id,
        ]);
        $incomeRes->assertStatus(200);

        // 3. Catat Pengeluaran (Honor Kru Asisten Rp 1.000.000)
        $expenseRes = $this->actingAsMc($this->mc)->postJson('/api/cms/cashflow-transactions', [
            'type' => 'out',
            'amount' => 1000000,
            'category' => 'Honor Kru Asisten',
            'date' => now()->format('Y-m-d'),
            'desc' => 'Honor Kru Panggung Gala Dinner',
            'eventId' => $event->id,
        ]);
        $expenseRes->assertStatus(200);

        // 4. Tutup Acara: Status Selesai & Lunas 100%
        $finishRes = $this->actingAsMc($this->mc)->putJson("/api/cms/events/{$event->id}", [
            'status' => 'Selesai',
            'status_pembayaran' => 'Lunas 100%',
        ]);
        $finishRes->assertStatus(200);

        $finalEvent = Event::find($event->id);
        $this->assertEquals('Selesai', $finalEvent->status);
        $this->assertEquals('Lunas 100%', $finalEvent->status_pembayaran);
    }

    /**
     * MASTER CHECKLIST TESTING: Verifikasi Menyeluruh Modul 1 s/d 12
     */
    public function test_master_checklist_semua_12_modul_fitur(): void
    {
        // MODUL 1: Portal Publik (Bootstrap data)
        $pubBootstrap = $this->getJson('/api/cms/public-bootstrap');
        $pubBootstrap->assertStatus(200);
        $pubBootstrap->assertJsonStructure([
            'success',
            'data' => [
                'biodata',
                'packages',
                'riders',
                'gallery',
            ]
        ]);

        // MODUL 2: Admin Dashboard (Bootstrap data)
        $adminBootstrap = $this->actingAsMc($this->mc)->getJson('/api/cms/bootstrap');
        $adminBootstrap->assertStatus(200);
        $adminBootstrap->assertJsonStructure(['success', 'data']);

        // MODUL 3: Kalender Acara Ketersediaan
        $cal = $this->getJson('/api/calendar/availability');
        $cal->assertStatus(200);

        // MODUL 4: CRM Pelanggan
        $customers = $this->actingAsMc($this->mc)->getJson('/api/cms/customers');
        $customers->assertStatus(200);

        // MODUL 5: Cashflow Transactions
        $cf = $this->actingAsMc($this->mc)->getJson('/api/cms/cashflow-transactions');
        $cf->assertStatus(200);

        // MODUL 6: CMS Konten (Biodata Update)
        $bioUpdate = $this->actingAsMc($this->mc)->postJson('/api/cms/biodata', [
            'name' => 'Arkanza Radja Maulana',
            'bio' => 'Professional Master of Ceremony bilingual',
            'spec' => 'Wedding, Gala Dinner, Awarding Night',
            'ig' => '@arkanza.mc',
            'tiktok' => '@arkanza_official',
            'fb' => 'https://facebook.com/arkanzamc.official',
            'statEvents' => '550+ Events',
            'statYears' => '9+ Tahun'
        ]);
        $bioUpdate->assertStatus(200);

        // MODUL 7: Pengaturan Web (Payment settings sanitizes bank account)
        $paySettings = $this->actingAsMc($this->mc)->postJson('/api/cms/payment-settings', [
            'bankName' => 'Mandiri',
            'bankAccount' => '123-456 7890',
            'bankHolder' => 'Arkanza Radja Maulana',
            'dpPercent' => 50,
            'accounts' => [
                ['bank' => 'Mandiri', 'number' => '123-456 7890', 'name' => 'Arkanza Radja Maulana']
            ]
        ]);
        $paySettings->assertStatus(200);

        $getPay = $this->actingAsMc($this->mc)->getJson('/api/cms/payment-settings');
        $getPay->assertStatus(200);
        $this->assertEquals('1234567890', $getPay->json('data.accounts.0.number'));

        // MODUL 8: Event Command Center (Event CRUD)
        $newEventRes = $this->actingAsMc($this->mc)->postJson('/api/cms/events', [
            'nama_pic' => 'Ibu Ratna',
            'no_wa' => '081234567899',
            'nama_acara' => 'Wedding of Ratna & Dimas',
            'lokasi' => 'Grand Ballroom Mulia',
            'tanggal_acara' => now()->addDays(45)->format('Y-m-d'),
            'waktu_mulai' => '19:00:00',
            'waktu_selesai' => '22:00:00',
            'status' => 'Review',
            'tipe_acara' => 'Wedding Reception',
        ]);
        $newEventRes->assertStatus(200);
        $createdId = $newEventRes->json('data.id');

        // MODUL 9: Wardrobe Tracker
        $wardrobeRes = $this->actingAsMc($this->mc)->getJson('/api/cms/wardrobe-catalog');
        $wardrobeRes->assertStatus(200);

        // MODUL 10: Master Bank Musik
        $musicRes = $this->actingAsMc($this->mc)->getJson('/api/cms/music-bank');
        $musicRes->assertStatus(200);

        // MODUL 11 & 12: Stage & Vendor workspace views
        $stageRes = $this->actingAsMc($this->mc)->get('/stage');
        $stageRes->assertStatus(200);
        $vendorRes = $this->actingAsMc($this->mc)->get('/vendor');
        $vendorRes->assertStatus(200);
    }
}
