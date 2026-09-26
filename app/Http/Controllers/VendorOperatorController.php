<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;

class VendorOperatorController extends Controller
{
    public function show($id)
    {
        $event = Event::with(['client', 'rundownItems'])->findOrFail($id);

        return view('vendor.operator-music', compact('event'));
    }
}
