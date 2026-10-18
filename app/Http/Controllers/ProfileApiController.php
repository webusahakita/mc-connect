<?php

namespace App\Http\Controllers;

use App\Models\UserMC;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileApiController extends Controller
{
    /**
     * API untuk mengambil data profil MC
     * Identitas MC berasal dari sesi yang diperiksa middleware.
     */
    public function getProfile(Request $request)
    {
        $mc = $request->attributes->get('mc');
        
        if (!$mc) {
            return response()->json(['error' => 'MC not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'name' => $mc->nama_panggung,
                'email' => $mc->email,
                'bio' => $mc->bio,
                'statEvents' => $mc->stat_events,
                'statYears' => $mc->stat_years,
                'spec' => $mc->spesialisasi,
                'photo' => $mc->foto_profil ?: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
                'ig' => $mc->instagram_handle,
                'tiktok' => $mc->tiktok_handle,
                'webConfig' => is_string($mc->payment_config) ? json_decode($mc->payment_config, true) : $mc->payment_config,
            ]
        ]);
    }

    /**
     * API untuk memperbarui profil MC dari formulir di admin.html
     */
    public function updateProfile(Request $request)
    {
        $mc = $request->attributes->get('mc');
        
        if (!$mc) {
            return response()->json(['error' => 'MC not found'], 404);
        }

        $photoData = $request->input('photo');
        $photoPath = $mc->foto_profil;

        if ($photoData) {
            if (strpos($photoData, 'data:image/') === 0) {
                $start = strlen('data:image/');
                $end = strpos($photoData, ';', $start);
                if ($end !== false) {
                    $type = strtolower(substr($photoData, $start, $end - $start));
                    $base64Start = strpos($photoData, ',', $end);
                    
                    if ($base64Start !== false && in_array($type, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                        $base64Data = substr($photoData, $base64Start + 1);
                        $decodedData = base64_decode($base64Data);
                        
                        if ($decodedData !== false) {
                            $filename = 'profile_' . time() . '.' . $type;
                            $destinationPath = public_path('uploads/profile');
                            if (!file_exists($destinationPath)) {
                                mkdir($destinationPath, 0755, true);
                            }
                            file_put_contents($destinationPath . '/' . $filename, $decodedData);
                            
                            if ($mc->foto_profil && \Illuminate\Support\Str::startsWith($mc->foto_profil, '/uploads/')) {
                                $oldPath = public_path(ltrim($mc->foto_profil, '/'));
                                if (file_exists($oldPath)) {
                                    @unlink($oldPath);
                                }
                            }
                            
                            $photoPath = '/uploads/profile/' . $filename;
                        }
                    }
                }
            } elseif (filter_var($photoData, FILTER_VALIDATE_URL) && strlen($photoData) <= 255) {
                $photoPath = $photoData;
            }
        }

        $mc->update([
            'nama_panggung' => $request->input('name', $mc->nama_panggung),
            'email' => $request->input('email', $mc->email),
            'bio' => $request->input('bio', $mc->bio),
            'spesialisasi' => $request->input('spec', $mc->spesialisasi),
            'stat_events' => $request->input('statEvents', $mc->stat_events),
            'stat_years' => $request->input('statYears', $mc->stat_years),
            'foto_profil' => $photoPath,
            'instagram_handle' => $request->input('ig', $mc->instagram_handle),
            'tiktok_handle' => $request->input('tiktok', $mc->tiktok_handle),
            'facebook_handle' => $request->input('fb', $mc->facebook_handle),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui di Database!',
            'data' => [
                'photo' => $mc->foto_profil
            ]
        ]);
    }

    /**
     * API untuk memvalidasi login dari login.html statis
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);
        $mc = UserMC::where('email', $validated['email'])->first();

        if ($mc && Hash::check($validated['password'], $mc->password_hash)) {
            $request->session()->regenerate();
            $request->session()->put('mc_user_id', $mc->id);

            return response()->json([
                'success' => true,
                'message' => 'Login Berhasil',
                'user' => [
                    'id' => $mc->id,
                    'name' => $mc->nama_panggung,
                    'email' => $mc->email,
                    'tier' => $mc->tier_langganan
                ],
                'csrf_token' => $request->session()->token(),
            ])->header('Cache-Control', 'no-store, private');
        }

        return response()->json([
            'success' => false,
            'message' => 'Email atau kata sandi tidak cocok.'
        ], 401)->header('Cache-Control', 'no-store, private');
    }

    public function session(Request $request)
    {
        $mc = $request->attributes->get('mc');

        return response()->json(['success' => true, 'user' => [
            'id' => $mc->id,
            'name' => $mc->nama_panggung,
            'email' => $mc->email,
            'tier' => $mc->tier_langganan,
        ]]);
    }

    public function logout(Request $request)
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['success' => true]);
    }
}
