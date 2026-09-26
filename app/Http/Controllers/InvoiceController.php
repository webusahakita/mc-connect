<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function show($id)
    {
        $invoice = Invoice::with(['event.client.mc'])->findOrFail($id);
        $event = $invoice->event;
        $mc = $event->client->mc;

        return view('admin.invoice-print', compact('invoice', 'event', 'mc'));
    }

    public function downloadPdf($id)
    {
        $invoice = Invoice::with(['event.client.mc'])->findOrFail($id);
        $event = $invoice->event;
        $mc = $event->client->mc;

        return view('admin.invoice-print', compact('invoice', 'event', 'mc'));
    }
}
