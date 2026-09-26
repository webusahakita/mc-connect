<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Invoice;
use App\Models\RundownItem;
use App\Models\Checklist;
use App\Models\Wardrobe;
use App\Models\Expense;
use App\Models\CommunicationLog;
use App\Models\Review;
use App\Models\EventMusic;
use Illuminate\Http\Request;

class EventCommandCenterController extends Controller
{
    public function show($id)
    {
        $event = Event::with([
            'client.mc',
            'invoice',
            'rundownItems',
            'checklists',
            'wardrobes',
            'expenses',
            'communicationLogs',
            'review',
            'musics'
        ])->findOrFail($id);

        $mc = $event->client->mc;

        return view('admin.command-center', compact('event', 'mc'));
    }

    // Update Catatan Khusus (Sticky Notes)
    public function updateNotes(Request $request, $id)
    {
        $event = Event::findOrFail($id);
        $event->update([
            'catatan_khusus' => $request->input('catatan_khusus', '')
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Catatan khusus berhasil diperbarui',
            'catatan_khusus' => $event->catatan_khusus
        ]);
    }

    // Toggle / Tambah Checklist
    public function toggleChecklist(Request $request, $checklistId)
    {
        $checklist = Checklist::findOrFail($checklistId);
        $checklist->status_selesai = !$checklist->status_selesai;
        $checklist->save();

        return response()->json([
            'success' => true,
            'status_selesai' => $checklist->status_selesai,
            'checklist_id' => $checklist->id
        ]);
    }

    public function addChecklist(Request $request, $eventId)
    {
        $validated = $request->validate([
            'deskripsi_tugas' => 'required|string|max:255',
            'kategori' => 'nullable|string|max:100',
        ]);

        $item = Checklist::create([
            'event_id' => $eventId,
            'deskripsi_tugas' => $validated['deskripsi_tugas'],
            'kategori' => $validated['kategori'] ?? 'Umum',
            'status_selesai' => false,
        ]);

        return response()->json([
            'success' => true,
            'item' => $item
        ]);
    }

    // Update Status Acara (Review -> Tentative -> Terkunci -> Selesai)
    public function updateStatus(Request $request, $id)
    {
        $event = Event::findOrFail($id);
        $validated = $request->validate([
            'status' => 'required|in:Review,Tentative,Terkunci,Selesai'
        ]);

        $event->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => "Status acara berhasil diubah menjadi {$event->status}",
            'status' => $event->status
        ]);
    }

    // Tab 1: Tambah Wardrobe & Swatch
    public function addWardrobe(Request $request, $id)
    {
        $validated = $request->validate([
            'deskripsi' => 'required|string|max:255',
            'warna_dominan' => 'required|string|max:50',
            'foto_kostum_url' => 'nullable|url',
        ]);

        $wardrobe = Wardrobe::create([
            'event_id' => $id,
            'deskripsi' => $validated['deskripsi'],
            'warna_dominan' => $validated['warna_dominan'],
            'foto_kostum_url' => $validated['foto_kostum_url'] ?? 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80',
            'status_ready' => true,
        ]);

        return response()->json([
            'success' => true,
            'wardrobe' => $wardrobe
        ]);
    }

    // Tab 2: Keuangan & Invoice
    public function updateInvoice(Request $request, $id)
    {
        $invoice = Invoice::where('event_id', $id)->firstOrFail();
        $validated = $request->validate([
            'total_biaya' => 'required|numeric|min:0',
            'nominal_dp' => 'required|numeric|min:0',
            'status_bayar' => 'required|in:Unpaid,DP Paid,Fully Paid',
        ]);

        $sisaTagihan = $validated['total_biaya'] - $validated['nominal_dp'];
        if ($validated['status_bayar'] === 'Fully Paid') {
            $sisaTagihan = 0;
        }

        $invoice->update([
            'total_biaya' => $validated['total_biaya'],
            'nominal_dp' => $validated['nominal_dp'],
            'sisa_tagihan' => $sisaTagihan,
            'status_bayar' => $validated['status_bayar'],
        ]);

        // Alur otomatis: Jika DP Paid, kunci acara secara otomatis
        if (in_array($validated['status_bayar'], ['DP Paid', 'Fully Paid'])) {
            $invoice->event->update(['status' => 'Terkunci']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status keuangan berhasil diperbarui',
            'invoice' => $invoice,
            'event_status' => $invoice->event->status,
        ]);
    }

    // Tab 2: Tambah Expense
    public function addExpense(Request $request, $id)
    {
        $validated = $request->validate([
            'deskripsi' => 'required|string|max:255',
            'jumlah' => 'required|numeric|min:0',
            'kategori' => 'required|string|max:100',
        ]);

        $expense = Expense::create([
            'event_id' => $id,
            'deskripsi' => $validated['deskripsi'],
            'jumlah' => $validated['jumlah'],
            'kategori' => $validated['kategori'],
        ]);

        return response()->json([
            'success' => true,
            'expense' => $expense
        ]);
    }

    // Tab 3: Reorder / Tambah Rundown
    public function addRundownItem(Request $request, $id)
    {
        $validated = $request->validate([
            'waktu_segmen' => 'required|string|max:50',
            'judul_segmen' => 'required|string|max:200',
            'naskah_prompter' => 'nullable|string',
            'instruksi_musik' => 'nullable|string|max:255',
        ]);

        $lastUrutan = RundownItem::where('event_id', $id)->max('urutan') ?? 0;

        $item = RundownItem::create([
            'event_id' => $id,
            'urutan' => $lastUrutan + 1,
            'waktu_segmen' => $validated['waktu_segmen'],
            'judul_segmen' => $validated['judul_segmen'],
            'naskah_prompter' => $validated['naskah_prompter'] ?? '',
            'instruksi_musik' => $validated['instruksi_musik'] ?? '',
            'is_completed' => false,
        ]);

        return response()->json([
            'success' => true,
            'item' => $item
        ]);
    }

    public function reorderRundown(Request $request, $id)
    {
        $items = $request->input('order', []); // array of item IDs in desired order
        foreach ($items as $index => $itemId) {
            RundownItem::where('event_id', $id)->where('id', $itemId)->update([
                'urutan' => $index + 1
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Urutan rundown berhasil diperbarui'
        ]);
    }

    // Tab 5: Post-Event Review Harvester
    public function submitReview(Request $request, $id)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'komentar' => 'required|string',
            'nama_reviewer' => 'required|string|max:150',
        ]);

        $review = Review::updateOrCreate(
            ['event_id' => $id],
            [
                'rating' => $validated['rating'],
                'komentar' => $validated['komentar'],
                'nama_reviewer' => $validated['nama_reviewer'],
                'is_featured' => true,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Ulasan klien berhasil disimpan!',
            'review' => $review
        ]);
    }

    // Tab 6: List Musik Acara & Audio Cue
    public function addMusic(Request $request, $id)
    {
        $validated = $request->validate([
            'judul_lagu' => 'required|string|max:200',
            'penyanyi' => 'nullable|string|max:150',
            'genre' => 'nullable|string|max:100',
            'segmen_rundown' => 'nullable|string|max:200',
            'tipe_cue' => 'nullable|string|max:100',
            'durasi_menit' => 'nullable|string|max:20',
            'audio_url' => 'nullable|string|max:255',
            'synth_preset' => 'nullable|string|max:100',
            'catatan_operator' => 'nullable|string',
            'status' => 'nullable|string|max:50',
        ]);

        $music = EventMusic::create([
            'event_id' => $id,
            'judul_lagu' => $validated['judul_lagu'],
            'penyanyi' => $validated['penyanyi'] ?? 'Original Audio',
            'genre' => $validated['genre'] ?? 'Pop / Acoustic',
            'segmen_rundown' => $validated['segmen_rundown'] ?? 'Seluruh Acara',
            'tipe_cue' => $validated['tipe_cue'] ?? 'Background',
            'durasi_menit' => $validated['durasi_menit'] ?? '03:30',
            'audio_url' => $validated['audio_url'] ?? '',
            'synth_preset' => $validated['synth_preset'] ?? 'Romantic Piano',
            'catatan_operator' => $validated['catatan_operator'] ?? '',
            'status' => $validated['status'] ?? 'Ready',
        ]);

        // Bi-directional sync with RundownItem if segment is specified
        if (!empty($validated['segmen_rundown']) && $validated['segmen_rundown'] !== 'Seluruh Acara') {
            RundownItem::where('event_id', $id)
                ->where('judul_segmen', $validated['segmen_rundown'])
                ->update([
                    'instruksi_musik' => "🎵 " . $validated['judul_lagu'] . " (" . ($validated['tipe_cue'] ?? 'Cue') . ")"
                ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lagu berhasil ditambahkan ke Command Center!',
            'music' => $music
        ]);
    }

    public function updateMusic(Request $request, $id, $musicId)
    {
        $music = EventMusic::where('event_id', $id)->findOrFail($musicId);

        $validated = $request->validate([
            'judul_lagu' => 'required|string|max:200',
            'penyanyi' => 'nullable|string|max:150',
            'genre' => 'nullable|string|max:100',
            'segmen_rundown' => 'nullable|string|max:200',
            'tipe_cue' => 'nullable|string|max:100',
            'durasi_menit' => 'nullable|string|max:20',
            'audio_url' => 'nullable|string|max:255',
            'synth_preset' => 'nullable|string|max:100',
            'catatan_operator' => 'nullable|string',
            'status' => 'nullable|string|max:50',
        ]);

        $music->update($validated);

        // Bi-directional sync with RundownItem
        if (!empty($validated['segmen_rundown']) && $validated['segmen_rundown'] !== 'Seluruh Acara') {
            RundownItem::where('event_id', $id)
                ->where('judul_segmen', $validated['segmen_rundown'])
                ->update([
                    'instruksi_musik' => "🎵 " . $validated['judul_lagu'] . " (" . ($validated['tipe_cue'] ?? 'Cue') . ")"
                ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lagu berhasil diperbarui!',
            'music' => $music
        ]);
    }

    public function deleteMusic(Request $request, $id, $musicId)
    {
        $music = EventMusic::where('event_id', $id)->findOrFail($musicId);
        $music->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lagu berhasil dihapus dari daftar musik acara!'
        ]);
    }
}
