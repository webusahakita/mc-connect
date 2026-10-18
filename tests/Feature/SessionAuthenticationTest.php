<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureMcAuthenticated;
use App\Models\Client;
use App\Models\Event;
use App\Models\UserMC;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class SessionAuthenticationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        foreach ([
            '2026_09_04_000001_create_users_mc_table.php',
            '2026_09_04_000002_create_clients_table.php',
            '2026_09_04_000003_create_events_table.php',
            '2026_09_04_000004_create_invoices_table.php',
            '2026_09_13_184800_add_metadata_to_events_and_clients.php',
        ] as $file) {
            (require database_path('migrations/'.$file))->up();
        }
    }

    private function mc(string $email = 'owner@example.test'): UserMC
    {
        return UserMC::create([
            'nama_panggung' => 'Test MC', 'email' => $email,
            'password_hash' => Hash::make('correct-test-password'),
        ]);
    }

    public function test_login_creates_a_server_session_and_logout_revokes_it(): void
    {
        $mc = $this->mc();
        $this->postJson('/api/mc/login', ['email' => $mc->email, 'password' => 'correct-test-password'])
            ->assertOk()->assertJsonPath('user.id', $mc->id)->assertSessionHas('mc_user_id', $mc->id);
        $this->getJson('/api/mc/session')->assertOk()->assertJsonPath('user.id', $mc->id);
        $this->getJson('/api/mc/profile')->assertOk()->assertJsonPath('data.email', $mc->email);
        $this->postJson('/api/mc/logout')->assertOk()->assertSessionMissing('mc_user_id');
        $this->getJson('/api/mc/session')->assertUnauthorized();
        $this->getJson('/api/cms/events')->assertUnauthorized();
    }

    public function test_wrong_passwords_and_previous_demo_bypasses_are_rejected(): void
    {
        $mc = $this->mc('vanya@mcconnect.id');
        foreach (['wrong-password', 'password123', 'admin'] as $password) {
            $this->postJson('/api/mc/login', ['email' => $mc->email, 'password' => $password])
                ->assertUnauthorized()->assertSessionMissing('mc_user_id');
        }
        $mc->delete();
        $this->postJson('/api/mc/login', ['email' => 'vanya@mcconnect.id', 'password' => 'password123'])
            ->assertUnauthorized()->assertSessionMissing('mc_user_id');
    }

    public function test_every_private_api_rejects_guests(): void
    {
        foreach (Route::getRoutes() as $route) {
            if (!str_starts_with($route->uri(), 'api/') ||
                !in_array(EnsureMcAuthenticated::class, $route->gatherMiddleware(), true)) continue;

            $uri = '/'.preg_replace('/\{[^}]+\}/', '1', $route->uri());
            foreach (array_diff($route->methods(), ['HEAD']) as $method) {
                $this->json($method, $uri)->assertUnauthorized();
            }
        }
    }

    public function test_workspace_urls_require_login_and_html_files_are_not_public(): void
    {
        foreach (['admin', 'stage', 'vendor'] as $page) {
            $this->assertFileDoesNotExist(public_path($page.'.html'));
            foreach (['/'.$page, '/'.$page.'.html'] as $url) {
                $this->get($url)->assertRedirect(route('login', ['redirect' => $url]));
            }
        }
        $mc = $this->mc();
        foreach (['admin', 'stage', 'vendor'] as $page) {
            $response = $this->withSession(['mc_user_id' => $mc->id])->get('/'.$page.'.html');
            $response->assertOk()->assertSee('/js/session-client.js', false);
            $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        }
    }

    public function test_public_calendar_profile_and_booking_remain_available(): void
    {
        $this->mc();
        $this->get('/')->assertOk();
        $this->get('/login')->assertOk();
        $this->getJson('/api/cms/biodata')->assertOk()->assertJsonPath('data.name', 'Test MC');
        $this->getJson('/api/calendar/availability')->assertOk()->assertExactJson([]);
        $this->postJson('/api/book/request', [
            'nama_pic' => 'Public Client', 'no_wa' => '0800000000', 'tipe_klien' => 'Personal',
            'tipe_acara' => 'Wedding', 'nama_acara' => 'Public booking', 'lokasi' => 'Test venue',
            'tanggal_acara' => '2026-12-01', 'waktu_mulai' => '18:00', 'waktu_selesai' => '21:00',
        ])->assertOk()->assertJsonPath('success', true);
        $this->assertDatabaseCount('events', 1);
    }

    public function test_login_and_admin_mutations_require_csrf_outside_test_bypass(): void
    {
        $mc = $this->mc();
        $this->app['env'] = 'local';
        try {
            $this->postJson('/api/mc/login', ['email' => $mc->email, 'password' => 'correct-test-password'])
                ->assertStatus(419);
            $this->withSession(['_token' => 'valid-test-csrf'])->withHeader('X-CSRF-TOKEN', 'valid-test-csrf')
                ->postJson('/api/mc/login', ['email' => $mc->email, 'password' => 'correct-test-password'])
                ->assertOk()->assertSessionHas('mc_user_id', $mc->id);
            $this->withHeader('X-CSRF-TOKEN', 'invalid-token')->postJson('/api/mc/logout')->assertStatus(419);
        } finally {
            $this->app['env'] = 'testing';
        }
    }

    public function test_a_deleted_account_cannot_keep_using_its_old_session(): void
    {
        $mc = $this->mc();
        $id = $mc->id;
        $mc->delete();
        $this->withSession(['mc_user_id' => $id])->getJson('/api/cms/events')->assertUnauthorized();
    }

    public function test_event_updates_cannot_cross_account_boundaries(): void
    {
        $owner = $this->mc();
        $other = $this->mc('other@example.test');
        $client = Client::create(['mc_id' => $other->id, 'nama_pic' => 'Other client', 'no_wa' => '0800000000']);
        $event = Event::create([
            'client_id' => $client->id, 'nama_acara' => 'Private event', 'lokasi' => 'Test venue',
            'tanggal_acara' => '2026-12-01', 'waktu_mulai' => '18:00:00', 'waktu_selesai' => '21:00:00',
        ]);
        $this->withSession(['mc_user_id' => $owner->id])
            ->putJson('/api/cms/events/'.$event->id, ['nama_acara' => 'Changed'])->assertNotFound();
        $this->deleteJson('/api/cms/events/'.$event->id)->assertNotFound();
        $this->getJson('/api/mc/profile')->assertJsonPath('data.email', $owner->email);
        $this->assertDatabaseHas('events', ['id' => $event->id, 'nama_acara' => 'Private event']);
    }

    public function test_login_is_rate_limited(): void
    {
        $this->mc();
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->postJson('/api/mc/login', ['email' => 'owner@example.test', 'password' => 'wrong-password'])
                ->assertUnauthorized();
        }
        $this->postJson('/api/mc/login', ['email' => 'owner@example.test', 'password' => 'wrong-password'])
            ->assertStatus(429);
    }

    public function test_an_authenticated_owner_can_keep_editing_event_metadata(): void
    {
        $this->mc('default@example.test');
        $owner = $this->mc('second-owner@example.test');
        $client = Client::create(['mc_id' => $owner->id, 'nama_pic' => 'Client', 'no_wa' => '0800000000']);
        $event = Event::create([
            'client_id' => $client->id, 'nama_acara' => 'Owner event', 'lokasi' => 'Test venue',
            'tanggal_acara' => '2026-12-01', 'waktu_mulai' => '18:00:00', 'waktu_selesai' => '21:00:00',
            'metadata' => ['rundown' => [['title' => 'Opening']], 'vipNotes' => 'Keep this note'],
        ]);
        $this->withSession(['mc_user_id' => $owner->id])
            ->putJson('/api/cms/events/'.$event->id, ['metadata' => ['checklist' => [['text' => 'Ready', 'done' => true]]]])
            ->assertOk();
        $this->getJson('/api/cms/events')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $event->id)
            ->assertJsonPath('data.0.metadata.vipNotes', 'Keep this note')
            ->assertJsonPath('data.0.rundown.0.title', 'Opening')
            ->assertJsonPath('data.0.checklist.0.done', true);
    }

    public function test_production_owner_is_created_with_a_hashed_password(): void
    {
        $this->artisan('mc:create-owner', ['email' => 'production@example.test', '--name' => 'Production MC'])
            ->expectsQuestion('Password owner (minimal 12 karakter)', 'unique-owner-password')
            ->expectsQuestion('Ulangi password owner', 'unique-owner-password')
            ->assertExitCode(0);

        $owner = UserMC::where('email', 'production@example.test')->firstOrFail();
        $this->assertTrue(Hash::check('unique-owner-password', $owner->password_hash));
        $this->assertSame('Production MC', $owner->nama_panggung);
        $this->assertDatabaseCount('users_mc', 1);
    }

    public function test_production_owner_command_never_overwrites_an_existing_account(): void
    {
        $owner = $this->mc();
        $originalHash = $owner->password_hash;
        $this->artisan('mc:create-owner', ['email' => $owner->email, '--name' => 'Changed name'])
            ->assertExitCode(1);
        $this->assertSame($originalHash, $owner->fresh()->password_hash);
        $this->assertSame('Test MC', $owner->fresh()->nama_panggung);
    }
}
