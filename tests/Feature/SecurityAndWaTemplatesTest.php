<?php

namespace Tests\Feature;

use App\Models\UserMC;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SecurityAndWaTemplatesTest extends TestCase
{
    protected UserMC $mc;

    protected function setUp(): void
    {
        parent::setUp();

        foreach ([
            '2026_09_04_000001_create_users_mc_table.php',
            '2026_09_22_155400_add_wa_templates_to_users_mc_table.php',
        ] as $file) {
            (require database_path('migrations/'.$file))->up();
        }
        
        $this->mc = UserMC::firstOrCreate(
            ['email' => 'test_qa@mcconnect.id'],
            [
                'nama_panggung' => 'Radja MC Pro',
                'password_hash' => Hash::make('oldSecret123!'),
                'tier_langganan' => 'Pro'
            ]
        );
    }

    public function test_wa_templates_endpoint_returns_dynamic_mc_name()
    {
        $response = $this->actingAsMc($this->mc)->getJson('/api/cms/wa-templates');

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true
        ]);

        $content = $response->getContent();
        $this->assertStringContainsString('Radja MC Pro', $content);
        $this->assertStringNotContainsString('Vanya Arsyad', $content);
    }

    public function test_change_password_validates_and_updates_successfully()
    {
        // 1. Wrong old password should fail
        $response = $this->actingAsMc($this->mc)->postJson('/api/mc/change-password', [
            'current_password' => 'wrongPassword!',
            'new_password' => 'newSecret456@',
            'new_password_confirmation' => 'newSecret456@'
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
            'message' => 'Password saat ini (lama) tidak sesuai.'
        ]);

        // 2. Mismatched confirmation should fail
        $response = $this->actingAsMc($this->mc)->postJson('/api/mc/change-password', [
            'current_password' => 'oldSecret123!',
            'new_password' => 'newSecret456@',
            'new_password_confirmation' => 'differentPassword@'
        ]);

        $response->assertStatus(422);

        // 3. Correct change should succeed
        $response = $this->actingAsMc($this->mc)->postJson('/api/mc/change-password', [
            'current_password' => 'oldSecret123!',
            'new_password' => 'newSecret456@',
            'new_password_confirmation' => 'newSecret456@'
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true
        ]);

        // Verify updated hash in DB
        $fresh = $this->mc->fresh();
        $this->assertTrue(Hash::check('newSecret456@', $fresh->password_hash));
    }

    protected function actingAsMc(UserMC $mc): self
    {
        return $this->withSession([
            'mc_user_id' => $mc->id,
            'mc_user_email' => $mc->email,
        ]);
    }
}

