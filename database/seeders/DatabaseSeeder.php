<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserMCSeeder::class,
            ClientSeeder::class,
            EventSeeder::class,
        ]);
    }
}
