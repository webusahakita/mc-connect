<?php
// Script to seed the cms_testimonials table

// Assuming we are in a Laravel environment, we can bootstrap the app
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\CmsTestimonial;

CmsTestimonial::truncate();

CmsTestimonial::create([
    'rating' => 5,
    'text' => '"Kak Vanya luar biasa profesional! Menguasai materi fintech dengan sangat baik, artikulasi jelas, bilingual-nya sangat natural saat memandu panelis dari Singapura."',
    'author_name' => 'Jessica Wijaya',
    'author_role' => 'Lead PM Epic Event Organizer',
    'urutan' => 1
]);

CmsTestimonial::create([
    'rating' => 5,
    'text' => '"Suasana wedding kami jadi luar biasa hidup dan berkelas berkat Kak Vanya. Semua tamu memuji keanggunan dan kehangatan pembawaannya. Sangat recommended!"',
    'author_name' => 'Natasha Hendrawan',
    'author_role' => 'Mempelai Wanita',
    'urutan' => 2
]);

echo "Testimonials seeded successfully!\n";
