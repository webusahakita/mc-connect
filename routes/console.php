<?php

use App\Models\UserMC;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

Artisan::command('mc:create-owner {email?} {--name=}', function () {
    $email = $this->argument('email') ?: $this->ask('Email owner');
    $name = $this->option('name') ?: $this->ask('Nama panggung');
    $validator = Validator::make(['email' => $email, 'name' => $name], [
        'email' => 'required|email|max:150',
        'name' => 'required|string|max:150',
    ]);
    if ($validator->fails()) {
        $this->error($validator->errors()->first());
        return 1;
    }
    if (UserMC::where('email', $email)->exists()) {
        $this->error('Email sudah terdaftar. Akun yang ada tidak diubah.');
        return 1;
    }

    $password = $this->secret('Password owner (minimal 12 karakter)', false);
    if (!is_string($password) || strlen($password) < 12) {
        $this->error('Password harus berisi minimal 12 karakter.');
        return 1;
    }
    if ($password !== $this->secret('Ulangi password owner', false)) {
        $this->error('Konfirmasi password tidak cocok.');
        return 1;
    }

    UserMC::create([
        'nama_panggung' => $name,
        'email' => $email,
        'password_hash' => Hash::make($password),
        'custom_domain' => parse_url(config('app.url'), PHP_URL_HOST),
        'tier_langganan' => 'Pro',
        'token_ai_tersisa' => 50,
    ]);

    $this->info('Owner berhasil dibuat. Password tidak ditampilkan.');
    return 0;
})->purpose('Create an MC owner interactively without installing demo accounts');
