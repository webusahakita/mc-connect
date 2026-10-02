<?php

namespace App\Http\Controllers;

use App\Models\UserMC;
use App\Models\CmsGallery;
use App\Models\CmsPackage;
use App\Models\CmsPressKit;
use App\Models\CmsRider;
use App\Models\CmsWardrobeCatalog;
use App\Models\CmsCashflowCategory;
use App\Models\Client;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CmsApiController extends Controller
{
    /**
     * Helper: Ambil MC pertama (ID=1) — untuk fase single-tenant.
     * Di multi-tenant production: gunakan auth()->user() atau session.
     */
    private function getMC(): UserMC
    {
        $mc = UserMC::first();
        if (!$mc) {
            abort(404, 'MC tidak ditemukan di database.');
        }
        return $mc;
    }

    // ============================================================
    // 1. BIODATA MC
    // ============================================================

    public function getBiodata()
    {
        $mc = $this->getMC();
        return response()->json([
            'success' => true,
            'data' => [
                'name'               => $mc->nama_panggung,
                'bio'                => $mc->bio,
                'photo'              => $mc->foto_profil,
                'spec'               => $mc->spesialisasi,
                'statEvents'         => $mc->stat_events ?? '500+ Events',
                'statYears'          => $mc->stat_years ?? '8+ Tahun',
                'showreel_youtube_id'=> $mc->showreel_youtube_id,
                'showreel_url'       => $mc->showreel_url,
                'ig'                 => $mc->instagram_handle,
                'tiktok'             => $mc->tiktok_handle,
                'fb'                 => $mc->facebook_handle,
                'email'              => $mc->email,
                'no_telp'            => $mc->no_telp,
                'calendarConfig' => is_string($mc->calendar_config) ? json_decode($mc->calendar_config, true) : $mc->calendar_config,
            
                'webConfig'      => is_string($mc->payment_config) ? json_decode($mc->payment_config, true) : $mc->payment_config,]
        ]);
    }

    public function updateBiodata(Request $request)
    {
        $mc = $this->getMC();

        // Handle foto profil upload (file)
        $photoPath = $mc->foto_profil;
        if ($request->hasFile('photo_file')) {
            $file = $request->file('photo_file');
            $filename = 'profile_' . time() . '.' . $file->getClientOriginalExtension();
            
            $destinationPath = public_path('uploads/profile');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $filename);
            
            // Delete old file if it's a local storage path
            if ($mc->foto_profil && \Illuminate\Support\Str::startsWith($mc->foto_profil, '/uploads/')) {
                $oldPath = public_path(ltrim($mc->foto_profil, '/'));
                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }
            $photoPath = '/uploads/profile/' . $filename;
        } elseif ($request->input('photo')) {
            $photoData = $request->input('photo');
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
            'nama_panggung'      => $request->input('name', $mc->nama_panggung),
            'bio'                => $request->input('bio', $mc->bio),
            'spesialisasi'       => $request->input('spec', $mc->spesialisasi),
            'foto_profil'        => $photoPath,
            'stat_events'        => $request->input('statEvents', $mc->stat_events),
            'stat_years'         => $request->input('statYears', $mc->stat_years),
            'showreel_youtube_id'=> $request->input('showreel_youtube_id', $mc->showreel_youtube_id),
            'showreel_url'       => $request->input('showreel_url', $mc->showreel_url),
            'instagram_handle'   => $request->input('ig', $mc->instagram_handle),
            'tiktok_handle'      => $request->input('tiktok', $mc->tiktok_handle),
            'no_telp'            => $request->input('no_telp', $mc->no_telp),
            'calendar_config'    => $request->input('calendarConfig') ? json_encode($request->input('calendarConfig')) : $mc->calendar_config,
            'payment_config'     => $request->input('webConfig') ? json_encode($request->input('webConfig')) : $mc->payment_config,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Biodata berhasil disimpan ke database!',
            'data'    => ['photo' => $mc->fresh()->foto_profil]
        ]);
    }

    // ============================================================
    // 2. GALLERY
    // ============================================================

    public function getGallery()
    {
        $mc = $this->getMC();
        $items = CmsGallery::where('mc_id', $mc->id)->orderBy('urutan')->get();
        return response()->json([
            'success' => true,
            'data' => $items->map(fn($g) => [
                'id'      => 'g_' . $g->id,
                'db_id'   => $g->id,
                'url'     => $g->url,
                'caption' => $g->caption,
            ])->values()
        ]);
    }

    public function uploadGallery(Request $request)
    {
        $mc = $this->getMC();
        $request->validate(['files' => 'required|array', 'files.*' => 'file|image|max:10240']);

        $maxOrder = CmsGallery::where('mc_id', $mc->id)->max('urutan') ?? 0;
        $uploaded = [];

        foreach ($request->file('files') as $i => $file) {
            $filename = 'gallery_' . time() . '_' . $i . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/gallery');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $filename);
            $url  = '/uploads/gallery/' . $filename;

            $gallery = CmsGallery::create([
                'mc_id'     => $mc->id,
                'file_path' => 'uploads/gallery/' . $filename,
                'url'       => $url,
                'caption'   => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'urutan'    => $maxOrder + $i + 1,
            ]);
            $uploaded[] = ['id' => 'g_' . $gallery->id, 'db_id' => $gallery->id, 'url' => $url, 'caption' => $gallery->caption];
        }

        return response()->json(['success' => true, 'message' => count($uploaded) . ' foto berhasil diunggah!', 'data' => $uploaded]);
    }

    public function saveGallery(Request $request)
    {
        $mc = $this->getMC();
        $gallery = $request->input('gallery', []);

        CmsGallery::where('mc_id', $mc->id)->delete();

        foreach ($gallery as $idx => $g) {
            $url = $g['url'];
            if ($url && preg_match('/^data:image\/(\w+);base64,/', $url, $type)) {
                $photoData = substr($url, strpos($url, ',') + 1);
                $ext = strtolower($type[1]);
                if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                    $photoData = base64_decode($photoData);
                    if ($photoData !== false) {
                        $filename = 'gallery_' . time() . '_' . $idx . '.' . $ext;
                        $destinationPath = public_path('uploads/gallery');
                        if (!file_exists($destinationPath)) {
                            mkdir($destinationPath, 0755, true);
                        }
                        file_put_contents($destinationPath . '/' . $filename, $photoData);
                        $url = '/uploads/gallery/' . $filename;
                    }
                }
            }

            CmsGallery::create([
                'mc_id'     => $mc->id,
                'file_path' => '', 
                'url'       => $url,
                'caption'   => $g['caption'],
                'urutan'    => $idx + 1,
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Galeri disimpan ke database!']);
    }

    public function updateGalleryCaption(Request $request, $id)
    {
        $item = CmsGallery::findOrFail($id);
        $item->update(['caption' => $request->input('caption', '')]);
        return response()->json(['success' => true]);
    }

    public function deleteGallery($id)
    {
        $item = CmsGallery::findOrFail($id);
        $item->delete(); // booted() handles file deletion
        return response()->json(['success' => true, 'message' => 'Foto dihapus.']);
    }

    // ============================================================
    // 3. PACKAGES (Paket Harga)
    // ============================================================

    public function getPackages()
    {
        $mc = $this->getMC();
        $pkgs = CmsPackage::where('mc_id', $mc->id)->orderBy('urutan')->get();
        return response()->json(['success' => true, 'data' => $pkgs->map(fn($p) => [
            'id'       => $p->id,
            'name'     => $p->name,
            'category' => $p->category,
            'price'    => $p->price,
            'duration' => $p->duration,
            'features' => $p->features ?? [],
            'badge'    => $p->badge,
        ])->values()]);
    }

    public function savePackages(Request $request)
    {
        $mc = $this->getMC();
        $packages = $request->input('packages', []);

        CmsPackage::where('mc_id', $mc->id)->delete();
        foreach ($packages as $i => $pkg) {
            CmsPackage::create([
                'mc_id'    => $mc->id,
                'name'     => $pkg['name'] ?? 'Paket ' . ($i + 1),
                'category' => $pkg['category'] ?? 'Standard',
                'price'    => $pkg['price'] ?? 0,
                'duration' => $pkg['duration'] ?? 'Max. 4 Jam',
                'features' => $pkg['features'] ?? [],
                'badge'    => $pkg['badge'] ?? null,
                'urutan'   => $i,
            ]);
        }
        return response()->json(['success' => true, 'message' => 'Paket harga disimpan ke database!']);
    }

    // ============================================================
    // 4. POLICIES (Terms, Refund, FAQ, Riders text)
    // ============================================================

    public function getPolicies()
    {
        $mc = $this->getMC();
        $articles = \App\Models\CmsArticle::where('mc_id', $mc->id)->get()->keyBy('kategori');
        $faqArticle = $articles->get('FAQ');
        $faqs = [];
        if ($faqArticle) {
            preg_match_all('/Q: (.+?)\nA: (.+?)(?=\n\nQ:|$)/s', $faqArticle->konten, $matches);
            for ($i = 0; $i < count($matches[1]); $i++) {
                $faqs[] = ['q' => trim($matches[1][$i]), 'a' => trim($matches[2][$i])];
            }
        }
        return response()->json(['success' => true, 'data' => [
            'terms'  => $articles->get('Terms')?->konten ?? '',
            'refund' => $articles->get('Refund')?->konten ?? '',
            'riders' => $articles->get('Riders')?->konten ?? '',
            'faqs'   => $faqs,
        ]]);
    }

    public function savePolicies(Request $request)
    {
        $mc = $this->getMC();
        $map = ['Terms' => 'terms', 'Refund' => 'refund', 'Riders' => 'riders'];

        foreach ($map as $kat => $field) {
            $content = $request->input($field, '');
            \App\Models\CmsArticle::updateOrCreate(
                ['mc_id' => $mc->id, 'kategori' => $kat],
                ['judul' => $kat, 'slug' => Str::slug($kat), 'konten' => $content, 'is_published' => 1]
            );
        }
        // Save FAQs
        $faqs = $request->input('faqs', []);
        $faqContent = collect($faqs)->map(fn($f) => "Q: {$f['q']}\nA: {$f['a']}")->implode("\n\n");
        \App\Models\CmsArticle::updateOrCreate(
            ['mc_id' => $mc->id, 'kategori' => 'FAQ'],
            ['judul' => 'FAQ', 'slug' => 'faq', 'konten' => $faqContent, 'is_published' => 1]
        );
        return response()->json(['success' => true, 'message' => 'Kebijakan & FAQ disimpan ke database!']);
    }

    // ============================================================
    // Payment Settings (Config in UsersMC)
    // ============================================================
    public function getPaymentSettings()
    {
        $mc = $this->getMC();
        $config = is_string($mc->payment_config) ? json_decode($mc->payment_config, true) : $mc->payment_config;
        return response()->json([
            'success' => true,
            'data' => $config ?: null
        ]);
    }

    public function savePaymentSettings(Request $request)
    {
        $mc = $this->getMC();
        $mc->payment_config = json_encode($request->all());
        $mc->save();

        return response()->json(['success' => true]);
    }

    // ============================================================
    // 4.5. TESTIMONIALS
    // ============================================================

    public function getTestimonials()
    {
        $items = \App\Models\CmsTestimonial::orderBy('urutan')->get();
        return response()->json(['success' => true, 'data' => $items->map(fn($t) => [
            'id' => $t->id,
            'rating' => $t->rating,
            'text' => $t->text,
            'author' => $t->author_name,
            'role' => $t->author_role,
        ])->values()]);
    }

    public function saveTestimonials(Request $request)
    {
        $testimonials = $request->input('testimonials', []);
        
        \App\Models\CmsTestimonial::truncate();
        
        foreach ($testimonials as $i => $testi) {
            \App\Models\CmsTestimonial::create([
                'rating' => $testi['rating'] ?? 5,
                'text' => $testi['text'],
                'author_name' => $testi['author'],
                'author_role' => $testi['role'],
                'urutan' => $i,
            ]);
        }
        
        return response()->json(['success' => true, 'message' => 'Testimoni disimpan ke database!']);
    }

    // ============================================================
    // 5. PRESS KIT
    // ============================================================

    public function getPressKit()
    {
        $mc = $this->getMC();
        $pk = CmsPressKit::where('mc_id', $mc->id)->first();
        if (!$pk) {
            return response()->json(['success' => true, 'data' => null]);
        }
        return response()->json(['success' => true, 'data' => [
            'stageName'   => $pk->stage_name,
            'spesialisasi'=> $pk->spesialisasi,
            'tagline'     => $pk->tagline,
            'bio'         => $pk->bio,
            'pic'         => $pk->pic_name,
            'wa'          => $pk->wa,
            'email'       => $pk->email,
            'sosmed'      => $pk->sosmed,
            'domisili'    => $pk->domisili,
            'scope1'      => $pk->scope_corporate,
            'scope2'      => $pk->scope_wedding,
            'scope3'      => $pk->scope_entertainment,
            'scope4'      => $pk->scope_nilai_tambah,
            'footerNote'  => $pk->footer_note,
            'ridersFooter'=> $pk->riders_footer_note,
        ]]);
    }

    public function savePressKit(Request $request)
    {
        $mc = $this->getMC();
        CmsPressKit::updateOrCreate(
            ['mc_id' => $mc->id],
            [
                'stage_name'          => $request->input('stageName', ''),
                'spesialisasi'        => $request->input('spesialisasi', ''),
                'tagline'             => $request->input('tagline', ''),
                'bio'                 => $request->input('bio', ''),
                'pic_name'            => $request->input('pic', ''),
                'wa'                  => $request->input('wa', ''),
                'email'               => $request->input('email', ''),
                'sosmed'              => $request->input('sosmed', ''),
                'domisili'            => $request->input('domisili', ''),
                'scope_corporate'     => $request->input('scope1', ''),
                'scope_wedding'       => $request->input('scope2', ''),
                'scope_entertainment' => $request->input('scope3', ''),
                'scope_nilai_tambah'  => $request->input('scope4', ''),
                'footer_note'         => $request->input('footerNote', ''),
                'riders_footer_note'  => $request->input('ridersFooter', ''),
            ]
        );
        return response()->json(['success' => true, 'message' => 'Press Kit disimpan ke database!']);
    }

    // ============================================================
    // 6. RIDERS (Event Riders)
    // ============================================================

    public function getRiders()
    {
        $mc = $this->getMC();
        $riders = CmsRider::where('mc_id', $mc->id)->orderBy('urutan')->get();
        return response()->json(['success' => true, 'data' => $riders->map(fn($r) => [
            'id'    => 'rv_' . $r->id,
            'db_id' => $r->id,
            'title' => $r->title,
            'notes' => $r->notes,
        ])->values()]);
    }

    public function saveRider(Request $request)
    {
        $mc = $this->getMC();
        $dbId = $request->input('db_id');
        $data = [
            'mc_id'      => $mc->id,
            'rider_key'  => $request->input('rider_key', ''),
            'title'      => $request->input('title', ''),
            'notes'      => $request->input('notes', ''),
        ];

        if ($dbId) {
            $rider = CmsRider::findOrFail($dbId);
            $rider->update($data);
        } else {
            $maxOrder = CmsRider::where('mc_id', $mc->id)->max('urutan') ?? 0;
            $data['urutan'] = $maxOrder + 1;
            $rider = CmsRider::create($data);
        }

        return response()->json(['success' => true, 'message' => 'Rider disimpan!', 'data' => [
            'id'    => 'rv_' . $rider->id,
            'db_id' => $rider->id,
            'title' => $rider->title,
            'notes' => $rider->notes,
        ]]);
    }

    public function deleteRider($id)
    {
        CmsRider::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Rider dihapus.']);
    }

    // ============================================================
    // 7. WARDROBE CATALOG
    // ============================================================

    public function getWardrobeCatalog()
    {
        $mc = $this->getMC();
        $items = CmsWardrobeCatalog::where('mc_id', $mc->id)->get();
        
        // AUTO-SEED DUMMY DATA JIKA KOSONG (SESUAI PERMINTAAN USER)
        if($items->count() === 0) {
            $dummyData = [
                ['mc_id' => $mc->id, 'nama' => 'Classic Black Tuxedo', 'deskripsi' => 'Jas formal hitam dengan kerah satin elegan.', 'warna' => '#000000', 'kategori' => 'Formal', 'is_active' => true, 'foto_url' => 'https://images.unsplash.com/photo-1594938291221-94f18cbb5660?q=80&w=200&auto=format&fit=crop'],
                ['mc_id' => $mc->id, 'nama' => 'Midnight Blue Suit', 'deskripsi' => 'Setelan jas warna biru dongker, cocok untuk acara malam.', 'warna' => '#191970', 'kategori' => 'Formal', 'is_active' => true, 'foto_url' => 'https://images.unsplash.com/photo-1594938328870-9623159c8c99?q=80&w=200&auto=format&fit=crop'],
                ['mc_id' => $mc->id, 'nama' => 'Maroon Velvet Blazer', 'deskripsi' => 'Blazer bahan velvet maroon untuk gaya semi-formal dan eksentrik.', 'warna' => '#800000', 'kategori' => 'Semi-Formal', 'is_active' => true, 'foto_url' => 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=200&auto=format&fit=crop'],
                ['mc_id' => $mc->id, 'nama' => 'White Floral Batik', 'deskripsi' => 'Kemeja batik motif floral putih, untuk acara resepsi siang.', 'warna' => '#FFFFFF', 'kategori' => 'Batik/Tradisional', 'is_active' => false, 'foto_url' => 'https://images.unsplash.com/photo-1620012253295-c15bc3e658e3?q=80&w=200&auto=format&fit=crop']
            ];
            foreach($dummyData as $d) {
                CmsWardrobeCatalog::create($d);
            }
            $items = CmsWardrobeCatalog::where('mc_id', $mc->id)->get();
        }
        
        return response()->json(['success' => true, 'data' => $items->map(fn($w) => [
            'id'       => 'w_' . $w->id,
            'db_id'    => $w->id,
            'imgUrl'   => $w->foto_url,
            'desc'     => $w->deskripsi,
            'colorHex' => $w->warna,
            'name'     => $w->nama,
            'colorName'=> $w->kategori,
            'status'   => $w->is_active ? 'Siap Pakai' : 'Sedang Dicuci/Diperbaiki'
        ])->values()]);
    }

    public function saveWardrobeCatalogItem(Request $request)
    {
        $mc = $this->getMC();
        $wardrobe = $request->input('wardrobe', []);

        CmsWardrobeCatalog::where('mc_id', $mc->id)->delete();

        foreach ($wardrobe as $idx => $w) {
            $url = $w['imgUrl'];
            if ($url && preg_match('/^data:image\/(\w+);base64,/', $url, $type)) {
                $photoData = substr($url, strpos($url, ',') + 1);
                $ext = strtolower($type[1]);
                if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                    $photoData = base64_decode($photoData);
                    if ($photoData !== false) {
                        $filename = 'wardrobe_' . time() . '_' . $idx . '.' . $ext;
                        $destinationPath = public_path('uploads/wardrobe');
                        if (!file_exists($destinationPath)) {
                            mkdir($destinationPath, 0755, true);
                        }
                        file_put_contents($destinationPath . '/' . $filename, $photoData);
                        $url = '/uploads/wardrobe/' . $filename;
                    }
                }
            }

            CmsWardrobeCatalog::create([
                'mc_id'     => $mc->id,
                'nama'      => $w['name'] ?? ($w['colorName'] ?? ''),
                'deskripsi' => $w['desc'] ?? '',
                'warna'     => $w['colorHex'] ?? '#1A365D',
                'file_path' => '',
                'foto_url'  => $url,
                'kategori'  => $w['colorName'] ?? 'Formal',
                'is_active' => ($w['status'] ?? 'Siap Pakai') === 'Siap Pakai'
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Wardrobe disimpan ke database!']);
    }

    public function deleteWardrobeCatalogItem($id)
    {
        CmsWardrobeCatalog::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Item wardrobe dihapus.']);
    }

    // ============================================================
    // 8. CASHFLOW CATEGORIES
    // ============================================================

    public function getCashflowCategories()
    {
        $mc = $this->getMC();
        $items = CmsCashflowCategory::where('mc_id', $mc->id)->get();
        return response()->json(['success' => true, 'data' => $items->map(fn($c) => [
            'id'    => 'cc_' . $c->id,
            'db_id' => $c->id,
            'nama'  => $c->nama,
            'tipe'  => $c->tipe,
            'warna' => $c->warna,
        ])->values()]);
    }

    public function saveCashflowCategories(Request $request)
    {
        $mc = $this->getMC();
        $categories = $request->input('categories', []);

        CmsCashflowCategory::where('mc_id', $mc->id)->delete();
        foreach ($categories as $cat) {
            CmsCashflowCategory::create([
                'mc_id' => $mc->id,
                'nama'  => $cat['nama'] ?? 'Kategori',
                'tipe'  => $cat['tipe'] ?? 'expense',
                'warna' => $cat['warna'] ?? '#4a9eff',
            ]);
        }
        return response()->json(['success' => true, 'message' => 'Kategori cashflow disimpan ke database!']);
    }

    // ============================================================
    // 9. CUSTOMERS (Data Pelanggan / Clients)
    // ============================================================

    public function getCustomers()
    {
        $mc = $this->getMC();
        
        $categoriesRaw = $mc->event_categories ? (is_string($mc->event_categories) ? json_decode($mc->event_categories, true) : $mc->event_categories) : [
            'Wedding', 'Corporate', 'Sweet 17', 'Gala Dinner'
        ];

        // Normalisasi untuk backward compatibility dan pencarian
        $categoriesNames = array_map(function($c) {
            return is_array($c) ? $c['name'] : $c;
        }, $categoriesRaw);

        $categoriesMap = [];
        foreach($categoriesRaw as $c) {
            if (is_array($c)) {
                $categoriesMap[$c['name']] = $c['icon'];
            } else {
                // Default icon jika masih berupa string lama
                $icon = '✨';
                if ($c === 'Wedding') $icon = '💍';
                if ($c === 'Corporate') $icon = '🏢';
                if ($c === 'Private Gala') $icon = '🎉';
                $categoriesMap[$c] = $icon;
            }
        }

        $clients = Client::with('events')->where('mc_id', $mc->id)->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $clients->map(function($c) use ($categoriesNames, $categoriesMap) {
            $cat = $c->kategori;
            // Jika kategori masih default 'Wedding', kita timpa dengan tipe_acara dari relasi Event (jika ada)
            if (empty($cat) || $cat === 'Wedding') {
                $eventCat = $c->events->first()?->tipe_acara;
                // Hanya timpa jika $eventCat adalah kategori yang valid (mencegah nama paket masuk)
                if ($eventCat && in_array($eventCat, $categoriesNames)) {
                    $cat = $eventCat;
                }
            }
            
            $catIcon = $categoriesMap[$cat ?? 'Wedding'] ?? '✨';

            return [
                'id'              => $c->id,
                'name'            => $c->nama_pic,
                'org'             => $c->instansi_atau_organisasi ?? '',
                'initials'        => $this->getInitials($c->nama_pic),
                'initialsBg'      => 'linear-gradient(135deg,#D4AF37,#F59E0B)',
                'initialsColor'   => '#000000',
                'category'        => $cat ?? 'Wedding',
                'categoryIcon'    => $catIcon,
                'wa'              => $c->no_wa,
            'email'           => $c->email ?? '',
            'event'           => $c->nama_acara ?? '',
            'startTime'       => $c->events->first()?->waktu_mulai ? substr($c->events->first()->waktu_mulai, 0, 5) : '18:00',
            'endTime'         => $c->events->first()?->waktu_selesai ? substr($c->events->first()->waktu_selesai, 0, 5) : '22:00',
            'date'            => $c->tanggal_acara ? $c->tanggal_acara->format('Y-m-d') : '',
            'formattedDate'   => $c->tanggal_acara ? $c->tanggal_acara->format('j M Y') : '',
            'price'           => (float) ($c->nilai_kontrak ?? 0),
            'paymentStatus'   => $c->status_pembayaran ?? 'Belum Bayar',
            'isVip'           => (bool) $c->is_vip,
            'client_category' => $c->client_category ?? '',
            'calendarStatus'  => $c->calendar_status ?? 'Review',
            'notes'           => $c->catatan_khusus ?? '',
            'created_at'      => $c->created_at ? $c->created_at->toISOString() : null,
            'updated_at'      => $c->updated_at ? $c->updated_at->toISOString() : null,
            ];
        })->values()]);
    }

    public function saveCustomer(Request $request)
    {
        $mc = $this->getMC();
        $id = $request->input('id');

        // Ensure calendar_status is never null — MySQL enum NOT NULL constraint
        $calendarStatus = $request->input('calendarStatus') ?: 'Review';
        $allowedStatuses = ['Review', 'Tentative', 'Terkunci', 'Selesai'];
        if (!in_array($calendarStatus, $allowedStatuses)) {
            $calendarStatus = 'Review';
        }

        // Preserve or calculate status_pembayaran dynamically from invoice if it exists
        $paymentStatus = 'Belum Bayar';
        $event = $id ? Event::where('client_id', $id)->first() : null;
        if ($event && $event->metadata) {
            $metadata = json_decode($event->metadata, true);
            if (isset($metadata['nominal_dp'])) {
                $dp = (int)$metadata['nominal_dp'];
                $totalForSync = $request->input('price') !== null ? (int)$request->input('price') : (int)$event->nilai_kontrak;
                if ($dp >= $totalForSync && $totalForSync > 0) {
                    $paymentStatus = 'Lunas 100%';
                    if ($calendarStatus === 'Review' || $calendarStatus === 'Tentative') {
                        $calendarStatus = 'Terkunci';
                    }
                } elseif ($dp > 0) {
                    $paymentStatus = 'DP Dibayar';
                    if ($calendarStatus === 'Review' || $calendarStatus === 'Tentative') {
                        $calendarStatus = 'Terkunci';
                    }
                }
            }
        } else {
            // Fallback to manual if no invoice logic
            if ($calendarStatus === 'Selesai') $paymentStatus = 'Lunas 100%';
            elseif ($calendarStatus === 'Tentative') $paymentStatus = 'Belum Bayar';
        }

        $data = [
            'mc_id'                    => $mc->id,
            'nama_pic'                 => $request->input('name', $request->input('nama_pic', '')) ?: '',
            'no_wa'                    => $request->input('wa', $request->input('no_wa', '')) ?: '',
            'email'                    => $request->input('email', '') ?: '',
            'tipe_klien'               => $request->input('tipe', 'Personal') ?: 'Personal',
            'instansi_atau_organisasi' => $request->input('org', $request->input('instansi', '')) ?: '',
            'kategori'                 => $request->input('category', 'Wedding') ?: 'Wedding',
            'client_category'          => $request->input('client_category', '') ?: '',
            'nilai_kontrak'            => $request->input('price') !== null ? $request->input('price') : 0,
            'status_pembayaran'        => $paymentStatus,
            'nama_acara'               => $request->input('event', '') ?: '',
            'tanggal_acara'            => $request->input('date') ?: null,
            'calendar_status'          => $calendarStatus,
            'is_vip'                   => $request->input('isVip', false),
            'catatan_khusus'           => $request->input('notes', '') ?: '',
        ];
        if ($id) {
            $client = Client::findOrFail($id);
            $client->update($data);
        } else {
            $client = Client::create($data);
        }

        // Sync to Event to ensure Calendar integration
        $eventData = [
            'client_id'         => $client->id,
            'nama_acara'        => $data['nama_acara'] ?: 'Acara Baru',
            'tanggal_acara'     => $data['tanggal_acara'],
            'status'            => $calendarStatus,
            'status_pembayaran' => $data['status_pembayaran'],
            'nilai_kontrak'     => $data['nilai_kontrak'],
            'total_budget'      => $data['nilai_kontrak'],
            'tipe_acara'        => $data['kategori'] ?: 'Wedding',
        ];

        // Append waktu if provided, with seconds suffix for DB format
        $waktuMulai = $request->input('startTime');
        if ($waktuMulai) {
            $eventData['waktu_mulai'] = strlen($waktuMulai) === 5 ? $waktuMulai . ':00' : $waktuMulai;
        }

        $waktuSelesai = $request->input('endTime');
        if ($waktuSelesai) {
            $eventData['waktu_selesai'] = strlen($waktuSelesai) === 5 ? $waktuSelesai . ':00' : $waktuSelesai;
        }

        $event = Event::where('client_id', $client->id)->first();
        if ($event) {
            $event->update($eventData);
        } else {
            if (!isset($eventData['waktu_mulai'])) $eventData['waktu_mulai'] = '18:00:00';
            if (!isset($eventData['waktu_selesai'])) $eventData['waktu_selesai'] = '22:00:00';
            $eventData['lokasi'] = 'Venue TBD';
            Event::create($eventData);
        }

        return response()->json(['success' => true, 'message' => 'Data pelanggan disimpan!', 'data' => ['id' => $client->id]]);
    }

    public function deleteCustomer($id)
    {
        $client = Client::findOrFail($id);
        // Cascade: hapus event terkait juga
        Event::where('client_id', $client->id)->delete();
        $client->delete();
        return response()->json(['success' => true, 'message' => 'Data pelanggan dihapus.']);
    }

    private function getInitials(string $name): string
    {
        $words = preg_split('/\s+/', trim($name));
        if (count($words) >= 2) {
            return strtoupper(mb_substr($words[0], 0, 1) . mb_substr($words[1], 0, 1));
        }
        return strtoupper(mb_substr($name, 0, 2));
    }

    // ==========================================
    // Cash Flow Transactions
    // ==========================================
    public function getCashflowTransactions()
    {
        $mc = $this->getMC();
        
        try {
            if (!\Illuminate\Support\Facades\Schema::hasColumn('cms_cashflow_transactions', 'bukti_file')) {
                \Illuminate\Support\Facades\Schema::table('cms_cashflow_transactions', function ($table) {
                    $table->string('bukti_file')->nullable();
                });
            }
        } catch (\Exception $e) {}

        $transactions = \App\Models\CmsCashflowTransaction::where('mc_id', $mc->id)->orderBy('tanggal', 'desc')->orderBy('id', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'data' => $transactions->map(fn($t) => [
                'id' => $t->id,
                'type' => $t->tipe,
                'category' => $t->kategori,
                'amount' => (float)$t->nominal,
                'date' => $t->tanggal ? $t->tanggal->format('Y-m-d') : null,
                'desc' => $t->deskripsi,
                'eventId' => $t->event_id,
                'proof' => $t->bukti_file ? url('storage/' . $t->bukti_file) : null
            ])->values()
        ]);
    }

    public function saveCashflowTransaction(Request $request)
    {
        $mc = $this->getMC();
        
        $validated = $request->validate([
            'id' => 'nullable|integer',
            'type' => 'required|in:in,out',
            'category' => 'required|string',
            'amount' => 'required|numeric',
            'date' => 'required|date',
            'desc' => 'required|string',
            'eventId' => 'nullable|integer'
        ]);

        $buktiPath = null;
        if ($request->hasFile('proof')) {
            $buktiPath = $request->file('proof')->store('cashflow_proofs', 'public');
        }

        if (!empty($validated['id'])) {
            $transaction = \App\Models\CmsCashflowTransaction::where('mc_id', $mc->id)->findOrFail($validated['id']);
            $updateData = [
                'tipe' => $validated['type'],
                'kategori' => $validated['category'],
                'nominal' => $validated['amount'],
                'tanggal' => $validated['date'],
                'deskripsi' => $validated['desc'],
                'event_id' => $validated['eventId'] ?? null
            ];
            if ($buktiPath) {
                $updateData['bukti_file'] = $buktiPath;
            }
            $transaction->update($updateData);
        } else {
            $transaction = \App\Models\CmsCashflowTransaction::create([
                'mc_id' => $mc->id,
                'tipe' => $validated['type'],
                'kategori' => $validated['category'],
                'nominal' => $validated['amount'],
                'tanggal' => $validated['date'],
                'deskripsi' => $validated['desc'],
                'event_id' => $validated['eventId'] ?? null,
                'is_verified' => true,
                'bukti_file' => $buktiPath
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Transaksi kas disimpan!', 'data' => [
            'id' => $transaction->id,
            'type' => $transaction->tipe,
            'category' => $transaction->kategori,
            'amount' => (float)$transaction->nominal,
            'date' => $transaction->tanggal->format('Y-m-d'),
            'desc' => $transaction->deskripsi,
            'eventId' => $transaction->event_id,
            'proof' => $transaction->bukti_file ? url('storage/' . $transaction->bukti_file) : null
        ]]);
    }

    public function deleteCashflowTransaction($id)
    {
        $mc = $this->getMC();
        \App\Models\CmsCashflowTransaction::where('id', $id)->where('mc_id', $mc->id)->delete();
        return response()->json(['success' => true]);
    }

    // ============================================================
    // 10. EVENTS ADMIN (Data Acara)
    // ============================================================

    public function getEventsAdmin()
    {
        $mc = $this->getMC();

        // Auto-delete tentative events older than 24 hours
        if ($mc) {
            Event::whereHas('client', function ($q) use ($mc) {
                $q->where('mc_id', $mc->id);
            })->where('status', 'Tentative')
              ->where('created_at', '<', now()->subHours(24))
              ->delete();
        }

        $events = Event::whereHas('client', fn($q) => $q->where('mc_id', $mc->id))
            ->with('client')
            ->orderBy('tanggal_acara', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $events->map(function($e) {
            $meta = $e->metadata ? (is_string($e->metadata) ? json_decode($e->metadata, true) : $e->metadata) : [];
            $client = $e->client;
            $timeStr = substr($e->waktu_mulai, 0, 5) . ' - ' . substr($e->waktu_selesai, 0, 5) . ' WIB';

            return [
                'id'            => $e->id,
                'customerId'    => $client?->id,
                'title'         => $e->nama_acara,
                'date'          => $e->tanggal_acara instanceof \Carbon\Carbon ? $e->tanggal_acara->format('Y-m-d') : (string) $e->tanggal_acara,
                'time'          => $timeStr,
                'startTime'     => substr($e->waktu_mulai, 0, 5),
                'endTime'       => substr($e->waktu_selesai, 0, 5),
                'venue'         => $e->lokasi,
                'pic'           => $client ? $client->nama_pic . ($client->no_wa ? " ({$client->no_wa})" : '') : '',
                'price'         => 'Rp ' . number_format((float) ($e->nilai_kontrak ?? $e->total_budget ?? 0), 0, ',', '.'),
                'rawPrice'      => (float) ($e->nilai_kontrak ?? $e->total_budget ?? 0),
                'status'        => $e->status,
                'paymentStatus' => $e->status_pembayaran ?? ($e->status === 'Terkunci' ? 'DP 50% Paid' : 'Tentative (Hold)'),
                'note'          => $e->catatan_khusus ?? '',
                'category'      => $e->tipe_acara ?? 'Wedding',
                'vipNotes'      => $meta['vipNotes'] ?? '',
                'vipProtocol'   => $meta['vipProtocol'] ?? [],
                'checklist'     => $meta['checklist'] ?? [],
                'expenses'      => $meta['expenses'] ?? [],
                'wardrobeIds'   => $meta['wardrobeIds'] ?? [],
                'invoiceItems'  => $meta['invoice_items'] ?? null,
                'metadata'      => $meta,
                'created_at'    => $e->created_at ? $e->created_at->toISOString() : null,
            ];
        })->values()]);
    }

    public function createEvent(Request $request)
    {
        $mc = $this->getMC();

        // Cari atau buat client baru berdasarkan nama PIC
        $namaPic = $request->input('nama_pic', 'Klien Baru');
        $noWa = $request->input('no_wa', '081234567890');

        $client = Client::firstOrCreate(
            ['mc_id' => $mc->id, 'nama_pic' => $namaPic],
            [
                'no_wa'    => $noWa,
                'email'    => $request->input('email', ''),
                'kategori' => $request->input('tipe_acara', 'Wedding'),
            ]
        );

        // Update client fields
        $client->update([
            'nama_acara'        => $request->input('nama_acara', 'Acara Baru'),
            'tanggal_acara'     => $request->input('tanggal_acara'),
            'kategori'          => $request->input('tipe_acara', $client->kategori ?? 'Wedding'),
            'nilai_kontrak'     => $request->input('nilai_kontrak', 0),
            'status_pembayaran' => $request->input('status_pembayaran', 'Tentative (Hold)'),
        ]);

        $event = Event::create([
            'client_id'         => $client->id,
            'nama_acara'        => $request->input('nama_acara', 'Acara Baru'),
            'lokasi'            => $request->input('lokasi', 'Venue TBD'),
            'tanggal_acara'     => $request->input('tanggal_acara'),
            'waktu_mulai'       => $request->input('waktu_mulai', '18:00:00'),
            'waktu_selesai'     => $request->input('waktu_selesai', '21:00:00'),
            'status'            => $request->input('status', 'Tentative'),
            'tipe_acara'        => $request->input('tipe_acara', 'Wedding Reception'),
            'catatan_khusus'    => $request->input('catatan_khusus', ''),
            'nilai_kontrak'     => $request->input('nilai_kontrak', 0),
            'status_pembayaran' => $request->input('status_pembayaran', 'Tentative (Hold)'),
            'metadata'          => $request->input('metadata') ? json_encode($request->input('metadata')) : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Acara berhasil disimpan ke database!',
            'data'    => [
                'id'             => $event->id,
                'client_id'      => $client->id,
                'nama_acara'     => $event->nama_acara,
                'tanggal_acara'  => $event->tanggal_acara,
                'waktu_mulai'    => $event->waktu_mulai,
                'waktu_selesai'  => $event->waktu_selesai,
                'status'         => $event->status,
                'lokasi'         => $event->lokasi,
            ]
        ]);
    }

    public function updateEvent(Request $request, $id)
    {
        if (str_starts_with($id, 'v_')) {
            $clientId = str_replace('v_', '', $id);
            $client = Client::findOrFail($clientId);
            $event = Event::create([
                'client_id'         => $client->id,
                'nama_acara'        => $client->nama_acara ?? ('Event ' . $client->nama_pic),
                'lokasi'            => 'Venue TBD',
                'tanggal_acara'     => $client->tanggal_acara ?? date('Y-m-d'),
                'waktu_mulai'       => '18:00:00',
                'waktu_selesai'     => '21:00:00',
                'status'            => 'Tentative',
                'tipe_acara'        => $client->kategori ?? 'Wedding',
                'nilai_kontrak'     => $client->nilai_kontrak ?? 0,
                'status_pembayaran' => $client->status_pembayaran ?? 'Tentative (Hold)',
                'metadata'          => null,
            ]);
        } else {
            $event = Event::findOrFail($id);
        }

        $allowedStatuses = ['Review', 'Tentative', 'Terkunci', 'Selesai'];

        $data = [];
        if ($request->has('nama_acara'))       $data['nama_acara'] = $request->input('nama_acara');
        if ($request->has('lokasi'))            $data['lokasi'] = $request->input('lokasi');
        if ($request->has('tanggal_acara'))     $data['tanggal_acara'] = $request->input('tanggal_acara');
        if ($request->has('waktu_mulai'))       $data['waktu_mulai'] = $request->input('waktu_mulai');
        if ($request->has('waktu_selesai'))     $data['waktu_selesai'] = $request->input('waktu_selesai');
        if ($request->has('status')) {
            $statusVal = $request->input('status');
            $data['status'] = in_array($statusVal, $allowedStatuses) ? $statusVal : $event->status;
        }
        if ($request->has('tipe_acara'))        $data['tipe_acara'] = $request->input('tipe_acara');
        if ($request->has('catatan_khusus'))    $data['catatan_khusus'] = $request->input('catatan_khusus');
        if ($request->has('nilai_kontrak')) {
            $data['nilai_kontrak'] = $request->input('nilai_kontrak');
            $data['total_budget'] = $request->input('nilai_kontrak');
        }
        if ($request->has('total_budget')) {
            $data['total_budget'] = $request->input('total_budget');
            $data['nilai_kontrak'] = $request->input('total_budget');
        }
        if ($request->has('status_pembayaran')) $data['status_pembayaran'] = $request->input('status_pembayaran');
        if ($request->has('metadata'))          $data['metadata'] = json_encode($request->input('metadata'));

        // Tentukan prioritas status_pembayaran berdasarkan nominal_dp di invoice (kasir)
        $totalForSync = isset($data['nilai_kontrak']) ? (int)$data['nilai_kontrak'] : (int)$event->nilai_kontrak;
        if ($request->has('metadata') && isset($request->input('metadata')['nominal_dp'])) {
            $inputMeta = $request->input('metadata');
            $newDp = (int)$inputMeta['nominal_dp'];
            $oldMeta = $event->metadata ? json_decode($event->metadata, true) : [];
            
            $oldDp = 0;
            if (isset($oldMeta['payment_history']) && is_array($oldMeta['payment_history'])) {
                foreach ($oldMeta['payment_history'] as $ph) {
                    $oldDp += (int)($ph['amount'] ?? 0);
                }
            } else {
                $oldDp = (int)($oldMeta['nominal_dp'] ?? 0);
            }
            
            $difference = $newDp - $oldDp;
            if ($difference > 0) {
                // Record to cashflow
                $mc = $this->getMC();
                \App\Models\CmsCashflowTransaction::create([
                    'mc_id' => $mc->id,
                    'tipe' => 'in',
                    'kategori' => 'Pendapatan Booking',
                    'nominal' => $difference,
                    'tanggal' => date('Y-m-d'),
                    'deskripsi' => 'Pelunasan/DP Invoice - ' . ($data['nama_acara'] ?? $event->nama_acara),
                    'status' => 'Berhasil'
                ]);
                
                // Save payment history
                $history = (isset($oldMeta['payment_history']) && is_array($oldMeta['payment_history'])) ? $oldMeta['payment_history'] : [];
                $history[] = [
                    'date' => date('Y-m-d'),
                    'amount' => $difference,
                    'label' => 'Pembayaran ke-' . (count($history) + 1)
                ];
                $inputMeta['payment_history'] = $history;
                $data['metadata'] = json_encode($inputMeta);
            }

            $dp = $newDp;
            if ($dp >= $totalForSync && $totalForSync > 0) {
                $data['status_pembayaran'] = 'Lunas 100%';
                if (!isset($data['status']) || $data['status'] === 'Review' || $data['status'] === 'Tentative') {
                    $data['status'] = 'Terkunci';
                }
            } elseif ($dp > 0) {
                $data['status_pembayaran'] = 'DP Dibayar';
                if (!isset($data['status']) || $data['status'] === 'Review' || $data['status'] === 'Tentative') {
                    $data['status'] = 'Terkunci';
                }
            } else {
                $data['status_pembayaran'] = 'Belum Bayar';
            }
        } elseif (isset($data['status'])) {
            // Fallback manual status calendar updates
            $status = $data['status'];
            if ($status === 'Selesai') {
                $data['status_pembayaran'] = 'Lunas 100%';
            } elseif ($status === 'Tentative') {
                $data['status_pembayaran'] = 'Belum Bayar';
            }
        }

        $event->update($data);

        // Update linked invoice if price changed
        if (isset($data['nilai_kontrak'])) {
            $inv = \App\Models\Invoice::where('event_id', $event->id)->first();
            if ($inv) {
                $dpNominal = $data['nilai_kontrak'] / 2;
                $inv->update([
                    'total_biaya' => $data['nilai_kontrak'],
                    'nominal_dp' => $dpNominal,
                    'sisa_tagihan' => $data['nilai_kontrak'] - $dpNominal,
                ]);
            }
        }

        // Also update linked client if relevant fields changed (bidirectional sync)
        if ($event->client) {
            $clientData = [];
            if ($request->has('nama_acara'))        $clientData['nama_acara'] = $request->input('nama_acara');
            if ($request->has('tanggal_acara'))     $clientData['tanggal_acara'] = $request->input('tanggal_acara');
            if (isset($data['nilai_kontrak']))      $clientData['nilai_kontrak'] = $data['nilai_kontrak'];
            if (isset($data['status_pembayaran']))  $clientData['status_pembayaran'] = $data['status_pembayaran'];
            if (isset($data['status']))             $clientData['calendar_status'] = $data['status'];
            
            if (!empty($clientData)) {
                $event->client->update($clientData);
            }
        }

        return response()->json(['success' => true, 'message' => 'Acara berhasil diperbarui!', 'data' => ['id' => $event->id]]);
    }

    public function deleteEvent($id)
    {
        $event = Event::findOrFail($id);
        $event->delete();
        return response()->json(['success' => true, 'message' => 'Acara berhasil dihapus dari database.']);
    }

    // ============================================================
    // 11. EVENT CATEGORIES (Kategori Acara)
    // ============================================================

    public function getEventCategories(Request $request)
    {
        // Handle public access via host or authenticated admin
        $host = $request->getHost();
        if (auth()->check()) {
            $mc = $this->getMC();
        } else {
            $mc = \App\Models\UserMC::where('custom_domain', $host)->first() ?? \App\Models\UserMC::first();
        }

        if (!$mc) {
            return response()->json(['success' => false, 'message' => 'MC not found']);
        }

        $categories = $mc->event_categories ? (is_string($mc->event_categories) ? json_decode($mc->event_categories, true) : $mc->event_categories) : [
            'Wedding', 'Corporate', 'Sweet 17', 'Gala Dinner'
        ];

        return response()->json(['success' => true, 'data' => $categories]);
    }

    public function saveEventCategories(Request $request)
    {
        $mc = $this->getMC();
        $categories = $request->input('categories', []);

        $cleanCategories = [];
        foreach ($categories as $cat) {
            if (is_array($cat) && isset($cat['name'])) {
                $name = trim($cat['name']);
                if ($name !== '') {
                    $cleanCategories[] = [
                        'icon' => trim($cat['icon'] ?? '✨'),
                        'name' => $name
                    ];
                }
            } elseif (is_string($cat)) {
                $name = trim($cat);
                if ($name !== '') {
                    $cleanCategories[] = [
                        'icon' => '✨',
                        'name' => $name
                    ];
                }
            }
        }

        $mc->event_categories = json_encode($cleanCategories);
        $mc->save();

        return response()->json(['success' => true, 'message' => 'Kategori Acara berhasil disimpan!', 'data' => $cleanCategories]);
    }

    // ============================================================
    // 12. CLIENT CATEGORIES (Kategori Klien)
    // ============================================================

    public function getClientCategories(Request $request)
    {
        $host = $request->getHost();
        if (auth()->check()) {
            $mc = $this->getMC();
        } else {
            $mc = \App\Models\UserMC::where('custom_domain', $host)->first() ?? \App\Models\UserMC::first();
        }

        if (!$mc) {
            return response()->json(['success' => false, 'message' => 'MC not found']);
        }

        $categories = $mc->client_categories ? (is_string($mc->client_categories) ? json_decode($mc->client_categories, true) : $mc->client_categories) : [
            ['icon' => '⭐', 'name' => 'VIP'],
            ['icon' => '🏢', 'name' => 'Corporate'],
            ['icon' => '👥', 'name' => 'Regular']
        ];

        return response()->json(['success' => true, 'data' => $categories]);
    }

    public function saveClientCategories(Request $request)
    {
        $mc = $this->getMC();
        $categories = $request->input('categories', []);

        $cleanCategories = [];
        foreach ($categories as $cat) {
            if (is_array($cat) && isset($cat['name'])) {
                $name = trim($cat['name']);
                if ($name !== '') {
                    $cleanCategories[] = [
                        'icon' => trim($cat['icon'] ?? '⭐'),
                        'name' => $name
                    ];
                }
            } elseif (is_string($cat)) {
                $name = trim($cat);
                if ($name !== '') {
                    $cleanCategories[] = [
                        'icon' => '⭐',
                        'name' => $name
                    ];
                }
            }
        }

        $mc->client_categories = json_encode($cleanCategories);
        $mc->save();

        return response()->json(['success' => true, 'message' => 'Kategori Klien berhasil disimpan!', 'data' => $cleanCategories]);
    }
    // ============================================================
    // 13. WA TEMPLATES (Template Pesan WhatsApp)
    // ============================================================

    public function getWaTemplates(Request $request)
    {
        $host = $request->getHost();
        if (auth()->check()) {
            $mc = $this->getMC();
        } else {
            $mc = \App\Models\UserMC::where('custom_domain', $host)->first() ?? \App\Models\UserMC::first();
        }

        if (!$mc) {
            return response()->json(['success' => false, 'message' => 'MC not found']);
        }

        $templates = $mc->wa_templates ? (is_string($mc->wa_templates) ? json_decode($mc->wa_templates, true) : $mc->wa_templates) : [
            [
                'title' => 'Sapaan Awal',
                'message' => "Halo Kak {name}, salam hangat dari Vanya Arsyad (Master of Ceremony).\n\nTerkait persiapan acara \"{event}\", kami siap berkoordinasi untuk rundown panggung, naskah prompter, serta kebutuhan teknis acara Anda. Ada detail khusus yang ingin dikoordinasikan hari ini?"
            ],
            [
                'title' => 'Follow Up H-7',
                'message' => "Halo Kak {name}, mengingatkan kembali bahwa acara \"{event}\" tinggal 7 hari lagi!\n\nMohon pastikan semua rundown dan daftar VIP sudah final. Hubungi kami jika butuh bantuan."
            ]
        ];

        return response()->json(['success' => true, 'data' => $templates]);
    }

    public function saveWaTemplates(Request $request)
    {
        $mc = $this->getMC();
        $templates = $request->input('templates', []);

        $cleanTemplates = [];
        foreach ($templates as $tpl) {
            if (is_array($tpl) && isset($tpl['title']) && isset($tpl['message'])) {
                $title = trim($tpl['title']);
                $message = trim($tpl['message']);
                if ($title !== '' && $message !== '') {
                    $cleanTemplates[] = [
                        'title' => $title,
                        'message' => $message
                    ];
                }
            }
        }

        $mc->wa_templates = json_encode($cleanTemplates);
        $mc->save();

        return response()->json(['success' => true, 'message' => 'Template WA berhasil disimpan!', 'data' => $cleanTemplates]);
    }

    public function getMusicBank(Request $request)
    {
        $host = $request->getHost();
        if (auth()->check()) {
            $mc = $this->getMC();
        } else {
            $mc = \App\Models\UserMC::where('custom_domain', $host)->first() ?? \App\Models\UserMC::first();
        }

        if (!$mc) {
            return response()->json(['success' => false, 'message' => 'MC not found']);
        }

        $data = $mc->music_bank ? (is_string($mc->music_bank) ? json_decode($mc->music_bank, true) : $mc->music_bank) : [];
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function saveMusicBank(Request $request)
    {
        $mc = $this->getMC();
        if (!$mc) return response()->json(['success' => false, 'message' => 'Not authenticated']);
        
        $mc->music_bank = json_encode($request->input('data', []));
        $mc->save();
        
        return response()->json(['success' => true]);
    }

    public function uploadMusicBankFile(Request $request)
    {
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/music'), $filename);
            return response()->json([
                'success' => true,
                'url' => '/uploads/music/' . $filename
            ]);
        }
        return response()->json(['success' => false, 'message' => 'No file uploaded']);
    }
}
