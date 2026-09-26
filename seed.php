<?php
$mc = \App\Models\UserMC::first();
if (\App\Models\CmsGallery::count() == 0) {
    \App\Models\CmsGallery::create(['mc_id' => $mc->id, 'file_path' => '', 'url' => 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80', 'caption' => 'Wedding Reception - Grand Hyatt', 'urutan' => 1]);
    \App\Models\CmsGallery::create(['mc_id' => $mc->id, 'file_path' => '', 'url' => 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=600&q=80', 'caption' => 'Corporate Gala - Ritz Carlton', 'urutan' => 2]);
}
if (\App\Models\CmsPackage::count() == 0) {
    \App\Models\CmsPackage::create(['mc_id' => $mc->id, 'name' => 'Premium Wedding', 'category' => 'Most Popular', 'price' => 7500000, 'duration' => '5 Jam', 'features' => ['Pemanduan acara full', 'Konsultasi konsep', 'Bilingual'], 'urutan' => 1]);
    \App\Models\CmsPackage::create(['mc_id' => $mc->id, 'name' => 'Corporate Gala', 'category' => 'Corporate', 'price' => 10000000, 'duration' => '6 Jam', 'features' => ['Formal MC', 'Ice breaking', 'Doorprize session'], 'urutan' => 2]);
}
