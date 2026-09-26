<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        Client::create([
            'id' => 1,
            'mc_id' => 1,
            'nama_pic' => 'Farhan & Natasha',
            'no_wa' => '081122334455',
            'email' => 'natasha.farhan@gmail.com',
            'tipe_klien' => 'Personal',
            'instansi_atau_organisasi' => 'Keluarga Besar Bpk. Hendrawan',
        ]);

        Client::create([
            'id' => 2,
            'mc_id' => 1,
            'nama_pic' => 'Clarissa Tan (Harmony WO)',
            'no_wa' => '081299887766',
            'email' => 'clarissa@harmonywo.com',
            'tipe_klien' => 'WO',
            'instansi_atau_organisasi' => 'Harmony Wedding Organizer Jakarta',
        ]);

        Client::create([
            'id' => 3,
            'mc_id' => 1,
            'nama_pic' => 'Budi Santoso',
            'no_wa' => '081377889900',
            'email' => 'budi.santoso@telkomsel.co.id',
            'tipe_klien' => 'Corporate',
            'instansi_atau_organisasi' => 'PT Telkomsel Digital Ecosystem',
        ]);

        Client::create([
            'id' => 4,
            'mc_id' => 1,
            'nama_pic' => 'Jessica Wijaya (Epic EO)',
            'no_wa' => '081765432100',
            'email' => 'jessica@epicevent.id',
            'tipe_klien' => 'EO',
            'instansi_atau_organisasi' => 'Epic Event Indonesia',
        ]);
    }
}
