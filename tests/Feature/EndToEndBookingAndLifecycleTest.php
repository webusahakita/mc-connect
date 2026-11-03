<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Event;
use App\Models\Invoice;
use App\Models\UserMC;
use App\Models\CashflowTransaction;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EndToEndBookingAndLifecycleTest extends TestCase
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
                'bio' => 'Professional Master of Ceremony',
                'spesialisasi' => 'Wedding, Corporate',
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

    public function test_full_hulu_ke_hilir_booking_lifecycle_and_features(): void
    {
        // -------------------------------------------------------------
        // FASE 1: Hulu (Public Client Booking Request)
        // -------------------------------------------------------------
        $bookingDate = now()->addDays(20)->format('Y-m-d');
        $bookingPayload = [
            'nama_pic' => 'Bapak Dimas Pratama',
            'no_wa' => '081298765432',
            'email' => 'dimas.pratama@example.com',
            'tipe_klien' => 'Corporate',
            'tipe_acara' => 'Corporate Gala Dinner',
            'nama_acara' => 'Annual Corporate Gala Night 2026',
            'lokasi' => 'Grand Ballroom Hotel Mulia Senayan',
            'tanggal_acara' => $bookingDate,
            'waktu_mulai' => '18:30',
            'waktu_selesai' => '22:00',
            'catatan_khusus' => 'Undangan VIP Direksi & Kementerian BUMN',
            'paket_layanan' => 'Gold Luxury Wedding Package',
        ];

        $response = $this->postJson('/api/book/request', $bookingPayload);
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'status' => 'Tentative',
        ]);

        $eventId = $response->json('event_id');
        $this->assertNotNull($eventId);

        $event = Event::find($eventId);
        $this->assertNotNull($event);
        $this->assertEquals('Tentative', $event->status);
        $this->assertEquals('Annual Corporate Gala Night 2026', $event->nama_acara);

        // Verify auto-generated invoice
        $invoice = Invoice::where('event_id', $eventId)->first();
        $this->assertNotNull($invoice);
        $this->assertEquals('Unpaid', $invoice->status_bayar);
        $this->assertGreaterThan(0, $invoice->nominal_dp);

        // -------------------------------------------------------------
        // FASE 2: Public Calendar Availability (Must show Tentative yellow)
        // -------------------------------------------------------------
        $calResponse = $this->getJson('/api/calendar/availability');
        $calResponse->assertStatus(200);
        $calendarData = collect($calResponse->json());
        $calItem = $calendarData->firstWhere('id', $eventId);
        $this->assertNotNull($calItem);
        $this->assertEquals('Tentative Booking', $calItem['title']);
        $this->assertEquals('#eab308', $calItem['color']); // Yellow for Tentative

        // -------------------------------------------------------------
        // FASE 3: Admin Operations (Check events list)
        // -------------------------------------------------------------
        $adminEventsRes = $this->actingAsMc($this->mc)->getJson('/api/cms/events');
        $adminEventsRes->assertStatus(200);
        $adminEvents = collect($adminEventsRes->json('data'));
        $adminEventItem = $adminEvents->firstWhere('id', $eventId);
        $this->assertNotNull($adminEventItem);

        // -------------------------------------------------------------
        // FASE 4: DP Paid & Locking Schedule (Anti-Bentrok)
        // -------------------------------------------------------------
        $updateEventRes = $this->actingAsMc($this->mc)->putJson("/api/cms/events/{$eventId}", [
            'status' => 'Terkunci',
            'status_pembayaran' => 'DP Dibayar',
            'nominal_dp' => 6250000,
        ]);
        $updateEventRes->assertStatus(200);

        $freshEvent = Event::find($eventId);
        $this->assertEquals('Terkunci', $freshEvent->status);

        // Check that public calendar is now LOCKED (Red #ef4444)
        $calResponse2 = $this->getJson('/api/calendar/availability');
        $calendarData2 = collect($calResponse2->json());
        $calItem2 = $calendarData2->firstWhere('id', $eventId);
        $this->assertNotNull($calItem2);
        $this->assertEquals('Booked (Terkunci)', $calItem2['title']);
        $this->assertEquals('#ef4444', $calItem2['color']);

        // -------------------------------------------------------------
        // FASE 5: Rundown Setup & Music Cue Mapping
        // -------------------------------------------------------------
        $rundownSegments = [
            [
                'start_time' => '18:30',
                'end_time' => '19:00',
                'title' => 'Open Gate & Welcoming VIP',
                'prompter' => 'Selamat malam tamu kehormatan.',
                'cue_music' => 'Romantic Lounge BGM',
                'cue_instruction' => 'Volume 30% fade-in',
                'pic' => 'Tim WO'
            ],
            [
                'start_time' => '19:00',
                'end_time' => '19:15',
                'title' => 'Grand Entrance Direksi',
                'prompter' => 'Hadirin yang terhormat, mari kita sambut jajaran direksi...',
                'cue_music' => 'Orchestral Fanfare',
                'cue_instruction' => 'Volume 80% saat pintu dibuka',
                'pic' => 'MC & Stage Runner'
            ]
        ];

        $metadata = $freshEvent->metadata ?? [];
        if (is_string($metadata)) $metadata = json_decode($metadata, true);
        $metadata['rundown'] = $rundownSegments;

        $saveRundownRes = $this->actingAsMc($this->mc)->putJson("/api/cms/events/{$eventId}", [
            'metadata' => $metadata
        ]);
        $saveRundownRes->assertStatus(200);

        $eventWithRundown = Event::find($eventId);
        $savedMeta = is_string($eventWithRundown->metadata) ? json_decode($eventWithRundown->metadata, true) : $eventWithRundown->metadata;
        $this->assertCount(2, $savedMeta['rundown']);
        $this->assertEquals('Grand Entrance Direksi', $savedMeta['rundown'][1]['title']);

        // -------------------------------------------------------------
        // FASE 6: Cash Flow Recording (Income DP & Expense)
        // -------------------------------------------------------------
        $cashflowIncome = $this->actingAsMc($this->mc)->postJson('/api/cms/cashflow-transactions', [
            'type' => 'in',
            'amount' => 6250000,
            'category' => 'DP Acara',
            'date' => now()->format('Y-m-d'),
            'desc' => 'DP 50% Acara Gala Night Dimas Pratama',
            'eventId' => $eventId,
        ]);
        $cashflowIncome->assertStatus(200);

        $cashflowExpense = $this->actingAsMc($this->mc)->postJson('/api/cms/cashflow-transactions', [
            'type' => 'out',
            'amount' => 1200000,
            'category' => 'Honor Asisten & Kru',
            'date' => now()->format('Y-m-d'),
            'desc' => 'Honor 2 Stage Runners & Transport',
            'eventId' => $eventId,
        ]);
        $cashflowExpense->assertStatus(200);

        $transactionsRes = $this->actingAsMc($this->mc)->getJson('/api/cms/cashflow-transactions');
        $transactionsRes->assertStatus(200);
        $allTx = collect($transactionsRes->json('data'));
        $this->assertNotEmpty($allTx->where('eventId', $eventId));

        // -------------------------------------------------------------
        // FASE 7: CMS Biodata (Facebook, Instagram, TikTok)
        // -------------------------------------------------------------
        $biodataRes = $this->actingAsMc($this->mc)->postJson('/api/cms/biodata', [
            'name' => 'Arkanza Radja Maulana',
            'bio' => 'Professional Master of Ceremony bilingual',
            'spec' => 'Wedding, Gala Dinner, Awarding Night',
            'ig' => '@arkanza.mc',
            'tiktok' => '@arkanza_official',
            'fb' => 'https://facebook.com/arkanzamc.official',
            'statEvents' => '550+ Events',
            'statYears' => '9+ Tahun'
        ]);
        $biodataRes->assertStatus(200);

        // Check that Facebook handle is returned in public bootstrap
        $pubBootstrap = $this->getJson('/api/cms/public-bootstrap');
        $pubBootstrap->assertStatus(200);
        $pubBio = $pubBootstrap->json('data.biodata');
        $this->assertEquals('https://facebook.com/arkanzamc.official', $pubBio['fb']);
        $this->assertEquals('@arkanza.mc', $pubBio['ig']);

        // -------------------------------------------------------------
        // FASE 8: Payment Settings (Static QRIS & Clean Account Number)
        // -------------------------------------------------------------
        $paymentSettingsRes = $this->actingAsMc($this->mc)->postJson('/api/cms/payment-settings', [
            'bankName' => 'BCA',
            'bankAccount' => '880-123 4567', // dirty formatting
            'bankHolder' => 'Arkanza Radja Maulana',
            'dpPercent' => 50,
            'qrisUrl' => '/uploads/qris/official-static-qris.png',
            'accounts' => [
                ['bank' => 'BCA', 'number' => '880-123 4567', 'name' => 'Arkanza Radja Maulana']
            ]
        ]);
        $paymentSettingsRes->assertStatus(200);

        $getPaymentSettings = $this->actingAsMc($this->mc)->getJson('/api/cms/payment-settings');
        $getPaymentSettings->assertStatus(200);
        $psData = $getPaymentSettings->json('data');
        $this->assertEquals('/uploads/qris/official-static-qris.png', $psData['qrisUrl']);
        $this->assertEquals('8801234567', $psData['accounts'][0]['number']); // Cleaned digits only!

        // -------------------------------------------------------------
        // FASE 9: Hilir (Event Completion & Pelunasan 100%)
        // -------------------------------------------------------------
        $completeEventRes = $this->actingAsMc($this->mc)->putJson("/api/cms/events/{$eventId}", [
            'status' => 'Selesai',
            'status_pembayaran' => 'Lunas 100%',
        ]);
        $completeEventRes->assertStatus(200);

        $completedEvent = Event::find($eventId);
        $this->assertEquals('Selesai', $completedEvent->status);
        $this->assertEquals('Lunas 100%', $completedEvent->status_pembayaran);
    }
}
