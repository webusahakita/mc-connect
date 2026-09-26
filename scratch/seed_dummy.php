<?php
$mc = \App\Models\UserMC::first();
if (!$mc) {
    echo "No UserMC found.\n";
    exit;
}

$mc_id = $mc->id;

// Seed Press Kit
\App\Models\CmsPressKit::updateOrCreate(
    ['mc_id' => $mc_id],
    [
        'stage_name' => 'Radja Maulana',
        'spesialisasi' => 'Professional Master of Ceremony, Host & Moderator',
        'tagline' => 'Bringing Energy, Precision, and Elegance to Your Stage.',
        'bio' => "Praktisi pembawa acara profesional dengan pengalaman lebih dari 5 tahun di berbagai skala panggung nasional dan internasional. Dikenal karena kemampuannya dalam mengendalikan atmosfer acara, menjembatani audiens, dan menyampaikan pesan dengan artikulasi yang jernih serta elegan.",
        'pic_name' => 'Arkanza Management (Dinda)',
        'wa' => '+62 812-3456-7890',
        'email' => 'booking@radjamaulana.id',
        'sosmed' => '@radjamaulana.mc',
        'domisili' => 'Jakarta (Available Nationwide)',
        'scope_corporate' => "- National & International Conferences\n- Product Launching & Brand Activation\n- Corporate Gala Dinners & Awarding",
        'scope_wedding' => "- Akad Nikah / Holy Matrimony & Resepsi\n- Lamaran / Engagement\n- Private & Intimate Celebrations",
        'scope_entertainment' => "- Music Festival & Concerts\n- Sport Events & Fun Runs\n- Exhibition, Expo & Roadshow",
        'scope_nilai_tambah' => "- Bilingual Capability (Bahasa Indonesia & English)\n- Adaptif (Regal/Formal, Energic, Interaktif)\n- Crowd Control & Time Management",
        'footer_note' => 'Video dokumentasi panggung dan foto resolusi tinggi tersedia berdasarkan permintaan ke pihak manajemen.',
        'riders_footer_note' => 'Rider ini bersifat fleksibel dan dapat didiskusikan secara kekeluargaan atau musyawarah tanpa mengurangi standar kualitas.',
    ]
);

// Clear old riders
\App\Models\CmsRider::where('mc_id', $mc_id)->delete();

// Seed Riders
$riders = [
    [
        'title' => 'Technical Rider (Sistem Audio)',
        'notes' => "- 1 (satu) buah Mic Wireless Profesional (Shure Axient / Sennheiser ew500 G4 atau setara)\n- 1 (satu) buah Mic Wireless cadangan (standby di FOH)\n- Monitor speaker yang menghadap ke area panggung (jika di atas panggung besar)",
        'urutan' => 1
    ],
    [
        'title' => 'Hospitality Rider (Akomodasi & Konsumsi)',
        'notes' => "- Ruang tunggu privat / VIP Room yang ber-AC dan dekat dengan panggung\n- 1 (satu) box air mineral kemasan kecil bersuhu ruang (tidak dingin)\n- 2 (dua) porsi makanan berat (prasmanan/box) untuk MC & Asisten",
        'urutan' => 2
    ],
    [
        'title' => 'Transportasi (Luar Kota)',
        'notes' => "- Tiket pesawat PP (kelas ekonomi prioritas) untuk 2 orang (MC & Asisten)\n- Penjemputan eksklusif dari Bandara ke Hotel dan Venue acara\n- Akomodasi hotel setara bintang 4/5 (1 Kamar Deluxe / Twin Bed)",
        'urutan' => 3
    ]
];

foreach ($riders as $rider) {
    \App\Models\CmsRider::create(array_merge($rider, ['mc_id' => $mc_id]));
}

echo "Berhasil mengisi dummy data untuk Press Kit & Event Riders!\n";
