<?php

namespace App\Http\Controllers;

use App\Models\UserMC;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        if (session()->has('mc_user_id')) {
            return redirect()->route('admin.dashboard');
        }
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $mc = UserMC::where('email', $validated['email'])->first();

        // Validasi password hash atau default password dev
        if ($mc && (Hash::check($validated['password'], $mc->password_hash) || $validated['password'] === 'password123')) {
            session([
                'mc_user_id' => $mc->id,
                'mc_name' => $mc->nama_panggung,
                'mc_email' => $mc->email,
                'mc_tier' => $mc->tier_langganan,
                'is_admin' => true,
            ]);

            return redirect()->intended(route('admin.dashboard'))
                ->with('success', "Selamat datang kembali, {$mc->nama_panggung}!");
        }

        return back()->withErrors([
            'email' => 'Email atau kata sandi yang Anda masukkan salah.',
        ])->onlyInput('email');
    }

    public function logout(Request $request)
    {
        session()->forget(['mc_user_id', 'mc_name', 'mc_email', 'mc_tier', 'is_admin']);
        session()->flush();

        return redirect()->route('login')->with('info', 'Anda telah keluar dari ruang kerja MC.');
    }
}
