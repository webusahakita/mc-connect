<?php

namespace App\Http\Controllers;

use App\Models\UserMC;
use App\Models\Event;
use Illuminate\Http\Request;

class AiCoPilotController extends Controller
{
    public function generateScript(Request $request, $eventId)
    {
        $event = Event::with('client.mc')->findOrFail($eventId);
        $mc = $event->client->mc;

        // Validasi kuota token AI
        if ($mc->token_ai_tersisa <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Kuota Token AI Anda telah habis. Silakan upgrade tier ke Pro/Agency atau top-up token.',
                'token_ai_tersisa' => 0,
            ], 403);
        }

        $validated = $request->validate([
            'segment_type' => 'required|string|in:opening,entrance,cake_toast,dinner,games,closing,custom',
            'tone' => 'required|string|in:formal,romantic_warm,energetic_fun,elegant_luxury',
            'custom_notes' => 'nullable|string',
            'vip_names' => 'nullable|string',
        ]);

        // Kurangi token AI tersisa
        $mc->decrement('token_ai_tersisa', 1);

        $scriptResult = $this->buildAiScript(
            $event,
            $validated['segment_type'],
            $validated['tone'],
            $validated['custom_notes'] ?? '',
            $validated['vip_names'] ?? ''
        );

        return response()->json([
            'success' => true,
            'script' => $scriptResult['naskah'],
            'music_cue' => $scriptResult['music_cue'],
            'token_ai_tersisa' => $mc->token_ai_tersisa,
            'message' => 'Naskah panggung berhasil digenerate oleh AI MC Co-Pilot! (-1 Token)',
        ]);
    }

    private function buildAiScript($event, $segmentType, $tone, $customNotes, $vipNames)
    {
        $eventName = $event->nama_acara;
        $clientName = $event->client->nama_pic;

        $toneAdjective = match ($tone) {
            'formal' => 'sangat anggun, berwibawa, dan protokoler',
            'romantic_warm' => 'hangat, puitis, dan menyentuh hati',
            'energetic_fun' => 'ceria, penuh semangat, dan interaktif',
            'elegant_luxury' => 'berkelas tinggi, mewah, dan berkarisma',
            default => 'hangat dan profesional',
        };

        $naskah = "";
        $musicCue = "";

        switch ($segmentType) {
            case 'opening':
                $naskah = "Selamat malam bapak, ibu, serta seluruh tamu undangan yang kami muliakan. Selamat datang di " . $eventName . ". Sungguh sebuah kehormatan bagi saya untuk menyambut kehadiran Anda sekalian dalam malam istimewa ini. " . ($vipNames ? "Secara khusus, kami ucapkan selamat datang kepada yang terhormat " . $vipNames . ". " : "") . "Mari kita nikmati bersama setiap detik momentum penuh kenangan indah yang telah dipersiapkan dengan penuh cinta.";
                $musicCue = "Opening Ambience Instrumental, volume 25% fade to 10% under voice";
                break;

            case 'entrance':
                $naskah = "Hadirin sekalian, detak waktu sejenak melambat, mengantarkan kita pada momentum paling dinantikan. Arahkan pandangan dan sambutlah dengan tepuk tangan paling bergemuruh, kehadiran yang berbahagia: " . $clientName . "!";
                $musicCue = "Grand Entrance Majestic Brass & Strings, crescendo volume 75%";
                break;

            case 'cake_toast':
                $naskah = "Kemesraan dan komitmen bukanlah sebuah kebetulan, melainkan pilihan hati yang diikrarkan selamanya. Saat pisau ini memotong lambang manisnya kehidupan, mari kita semua mengangkat gelas kebanggaan kita. Cheers for endless love and joy!";
                $musicCue = "Romantic Acoustic Chime (Ed Sheeran vibe), sparkling high frequencies";
                break;

            case 'games':
                $naskah = "Baik, hadirin sekalian! Kini tiba saatnya kita sedikit mencairkan suasana. Saya butuh 5 orang sahabat paling berani dan berjiwa kompetitif untuk maju ke lantai panggung bersama saya sekarang juga! Akan ada kejutan spesial bagi pemenang malam ini!";
                $musicCue = "Upbeat Funk Groove / Drum roll build-up for countdown";
                break;

            case 'closing':
                $naskah = "Setiap awal yang indah selalu menyisakan kenangan tak lekang waktu. Atas nama seluruh keluarga besar dan penyelenggara " . $eventName . ", kami menyampaikan rasa terima kasih dan apresiasi terdalam. Semoga kebahagiaan malam ini senantiasa menyertai langkah kita. Saya pamit undur diri, have a safe journey home and good night!";
                $musicCue = "Grand Outro Theme, uplifting modern orchestra";
                break;

            default:
                $naskah = "Hadirin yang berbahagia, mari kita lanjutkan ke segmen berikutnya pada perhelatan " . $eventName . ". Pastikan Anda tetap nyaman menikmati sajian istimewa yang telah disiapkan.";
                $musicCue = "Subtle Lounge Jazz background music";
                break;
        }

        if (!empty($customNotes)) {
            $naskah .= " (Catatan Khusus: " . $customNotes . ")";
        }

        return [
            'naskah' => $naskah,
            'music_cue' => $musicCue,
        ];
    }
}
