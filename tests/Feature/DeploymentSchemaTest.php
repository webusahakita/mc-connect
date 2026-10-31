<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DeploymentSchemaTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Schema::create('users_mc', fn (Blueprint $table) => $table->id());
        Schema::create('cms_cashflow_transactions', fn (Blueprint $table) => $table->id());
    }

    public function test_deployment_adds_missing_columns_and_can_be_repeated(): void
    {
        $migration = require database_path('migrations/2026_10_18_000001_add_music_bank_and_cashflow_proof_columns.php');
        $migration->up();
        $migration->up();

        $this->assertTrue(Schema::hasColumn('users_mc', 'music_bank'));
        $this->assertTrue(Schema::hasColumn('cms_cashflow_transactions', 'bukti_file'));
    }

    public function test_existing_columns_and_file_references_are_preserved(): void
    {
        Schema::table('users_mc', fn (Blueprint $table) => $table->longText('music_bank')->nullable());
        Schema::table('cms_cashflow_transactions', fn (Blueprint $table) => $table->string('bukti_file')->nullable());
        DB::table('users_mc')->insert(['id' => 1, 'music_bank' => '[{"title":"Existing track"}]']);
        DB::table('cms_cashflow_transactions')->insert(['id' => 1, 'bukti_file' => 'cashflow_proofs/existing.jpg']);

        $migration = require database_path('migrations/2026_10_18_000001_add_music_bank_and_cashflow_proof_columns.php');
        $migration->up();

        $this->assertSame('[{"title":"Existing track"}]', DB::table('users_mc')->value('music_bank'));
        $this->assertSame('cashflow_proofs/existing.jpg', DB::table('cms_cashflow_transactions')->value('bukti_file'));
    }
}
