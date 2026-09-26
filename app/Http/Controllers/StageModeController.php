<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;

class StageModeController extends Controller
{
    public function show($id)
    {
        $event = Event::with(['client', 'rundownItems'])->findOrFail($id);
        $mc = $event->client->mc;

        return view('admin.stage', compact('event', 'mc'));
    }

    public function completeSegment(Request $request, $id, $itemId)
    {
        $item = \App\Models\RundownItem::where('event_id', $id)->where('id', $itemId)->firstOrFail();
        $item->is_completed = true;
        $item->save();

        return response()->json([
            'success' => true,
            'completed_item_id' => $item->id
        ]);
    }
}
