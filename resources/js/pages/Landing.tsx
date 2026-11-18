import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Star, 
  Sparkles, 
  Shield, 
  Clock, 
  AlertTriangle,
  FileText,
  Printer,
  Receipt,
  MessageSquare,
  Check,
  Send,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

export interface CalendarEventItem {
  id: number;
  title: string;
  nama_acara?: string;
  date: string;
  status: string;
  color?: string;
  time?: string;
  lokasi?: string;
}

const bookingSchema = z.object({
  nama_pic: z.string().min(3, 'Nama pemesan minimal 3 karakter'),
  no_wa: z.string().min(9, 'Nomor WhatsApp minimal 9 digit'),
  email: z.string().email('Format email tidak valid').or(z.literal('')),
  tipe_klien: z.enum(['Personal', 'EO', 'WO', 'Corporate']),
  tipe_acara: z.string().min(2, 'Tipe acara wajib diisi'),
  nama_acara: z.string().min(3, 'Nama acara minimal 3 karakter'),
  lokasi: z.string().min(3, 'Lokasi/Venue acara wajib diisi'),
  tanggal_acara: z.string().min(8, 'Pilih tanggal acara'),
  waktu_mulai: z.string().min(4, 'Waktu mulai wajib diisi'),
  waktu_selesai: z.string().min(4, 'Waktu selesai wajib diisi'),
  catatan_khusus: z.string().optional(),
  paket_layanan: z.string().optional(),
});

export default function Landing({
  onOpenAdmin,
  onOpenStage,
}: {
  onOpenAdmin: () => void;
  onOpenStage: () => void;
}) {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-15');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [createdBooking, setCreatedBooking] = useState<{ eventId: number; invoiceId: number; invoiceNumber: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    nama_pic: '',
    no_wa: '',
    email: '',
    tipe_klien: 'Personal' as 'Personal' | 'EO' | 'WO' | 'Corporate',
    tipe_acara: 'Wedding',
    nama_acara: '',
    lokasi: 'Grand Ballroom, Jakarta',
    tanggal_acara: '2026-10-15',
    waktu_mulai: '18:00',
    waktu_selesai: '21:00',
    catatan_khusus: '',
    paket_layanan: 'Gold Luxury',
  });

  // Anti-Collision Live Check State
  const [collisionStatus, setCollisionStatus] = useState<{
    checking: boolean;
    checked: boolean;
    available: boolean;
    message: string;
  }>({
    checking: false,
    checked: false,
    available: true,
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const packages = [
    {
      name: 'Silver Classic',
      price: 'Rp 4.500.000',
      duration: 'Hingga 3 Jam Acara',
      features: ['1 Master of Ceremony Profesional', 'Technical Meeting H-7', 'Standar Cue Sheet & Rundown Review'],
    },
    {
      name: 'Gold Luxury',
      price: 'Rp 7.500.000',
      isPopular: true,
      duration: 'Hingga 5 Jam Acara (Resepsi & Akad)',
      features: [
        'Master MC + 1 Asisten Panggung Pribadi',
        'Naskah Personalisasi AI MC Co-Pilot',
        'Live Sync Cue Musik ke Operator/Soundman',
        'Konsultasi Konsep Panggung & Gladi Resik',
      ],
    },
    {
      name: 'Platinum Royal',
      price: 'Rp 12.000.000',
      duration: 'Full Day Event (Akad, Temu Manten, Resepsi)',
      features: [
        'Duet MC Pria & Wanita (Duo Host)',
        'Full Crew Stage Command Center',
        'Custom Soundboard & VIP Protocol Handling',
        'Garansi Penggantian MC Darurat 100%',
      ],
    },
  ];

  // Fetch real calendar availability
  useEffect(() => {
    fetch('/api/calendar/availability')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCalendarEvents(data);
        }
      })
      .catch((err) => console.warn('Gagal memuat ketersediaan jadwal:', err));
  }, []);

  // Real-time Anti-Collision check when date or times change
  useEffect(() => {
    if (!form.tanggal_acara || !form.waktu_mulai || !form.waktu_selesai) return;

    setCollisionStatus((prev) => ({ ...prev, checking: true }));

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/calendar/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            tanggal_acara: form.tanggal_acara,
            waktu_mulai: form.waktu_mulai,
            waktu_selesai: form.waktu_selesai,
          }),
        });
        const data = await res.json();
        setCollisionStatus({
          checking: false,
          checked: true,
          available: !!data.available,
          message: data.message || (data.available ? 'Jadwal tersedia & bebas bentrok transit 90 menit.' : 'Jadwal bertabrakan.'),
        });
      } catch (e) {
        setCollisionStatus({
          checking: false,
          checked: false,
          available: true,
          message: '',
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form.tanggal_acara, form.waktu_mulai, form.waktu_selesai]);

  const handleDateClick = (dateStr: string, isLocked: boolean) => {
    if (isLocked) {
      toast.error('Tanggal ini telah terkunci oleh pemesan lain.');
      return;
    }
    setSelectedDate(dateStr);
    setForm((prev) => ({ ...prev, tanggal_acara: dateStr }));
    setIsModalOpen(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side Zod validation
    const validation = bookingSchema.safeParse(form);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Form belum lengkap.';
      toast.error(firstError);
      return;
    }

    if (!collisionStatus.available) {
      toast.error('Jadwal bentrok dengan acara lain! Silakan pilih jam atau tanggal lain.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/book/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Permintaan booking berhasil diajukan!');
        setCreatedBooking({
          eventId: data.event_id,
          invoiceId: data.invoice_id,
          invoiceNumber: data.invoice_number,
        });
        setIsModalOpen(false);
        setIsSuccessModalOpen(true);
      } else {
        toast.error(data.message || 'Gagal mengajukan booking.');
      }
    } catch (err) {
      toast.error('Gagal terhubung ke backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build calendar days for October 2026 (or active month)
  const daysInOctober = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const fullDate = `2026-10-${dayStr}`;
    const matchingEvent = calendarEvents.find((e) => e.date === fullDate);

    let status = 'available';
    if (matchingEvent) {
      status = matchingEvent.status === 'Terkunci' ? 'locked' : 'tentative';
    }

    return {
      day,
      fullDate,
      status,
      eventTitle: matchingEvent?.title || matchingEvent?.nama_acara || '',
    };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 flex flex-col font-sans">
      {/* Hero Header */}
      <section className="relative overflow-hidden py-16 px-6 text-center">
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[360px] w-[500px] rounded-full bg-amber-500/10 blur-[130px]" />
        </div>

        <Badge variant="purple" className="mb-4 px-3.5 py-1 text-xs font-bold tracking-wider">
          👑 INDONESIA&apos;S PREMIER WEDDING & CORPORATE HOST
        </Badge>

        <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
          Momen Sakral & Megah Anda, Dipandu dengan{' '}
          <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
            Presisi Tinggi
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
          Booking terintegrasi langsung dengan <strong>Anti-Collision Scheduling Engine</strong> ber-buffer transit 90 menit dan proteksi transaksi ACID anti-bentrok.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="md" onClick={() => setIsModalOpen(true)} className="font-bold">
            <Sparkles className="h-4 w-4 mr-1.5" /> Reservasi Tanggal Sekarang
          </Button>
          <Button variant="outline" size="md" onClick={onOpenAdmin}>
            🎛️ Buka Command Center
          </Button>
          <Button variant="secondary" size="md" onClick={onOpenStage}>
            🎤 Masuk Stage Mode
          </Button>
        </div>

        {/* Stats Strip */}
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md text-center">
          <div>
            <div className="text-2xl font-black text-amber-400">500+</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Acara Berhasil</div>
          </div>
          <div className="border-x border-slate-800">
            <div className="text-2xl font-black text-amber-400">99.8%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Ulasan Bintang 5</div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">0%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Risiko Bentrok Jadwal</div>
          </div>
        </div>
      </section>

      {/* Interactive Real-Time Calendar */}
      <section className="py-12 px-6 max-w-5xl w-full mx-auto">
        <div className="text-center mb-8">
          <Badge variant="warning" className="mb-2">
            REAL-TIME DATABASE SCHEDULE
          </Badge>
          <h2 className="text-2xl font-bold text-white">Kalender Ketersediaan MC Vanya Arsyad</h2>
          <p className="text-xs text-slate-400 mt-1">
            Data jadwal tersinkronisasi langsung dengan database server. Klik pada tanggal kosong untuk mengajukan reservasi.
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-amber-400" />
              <span className="font-bold text-base text-white">Oktober 2026 (Live Schedule)</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Tersedia
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Tentative (Hold)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Terkunci (Booked)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2.5 text-center">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
              <span key={day} className="text-xs font-semibold text-slate-500 mb-1">
                {day}
              </span>
            ))}
            {daysInOctober.map((item) => (
              <button
                key={item.day}
                onClick={() => handleDateClick(item.fullDate, item.status === 'locked')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                  item.status === 'available'
                    ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-300'
                    : item.status === 'tentative'
                    ? 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/25 text-amber-300'
                    : 'border-rose-500/40 bg-rose-500/10 text-rose-300 cursor-not-allowed'
                }`}
              >
                <span className="text-base font-extrabold">{item.day}</span>
                <span className="text-[9px] uppercase font-bold mt-0.5 truncate max-w-[60px]">
                  {item.status === 'locked' ? 'Booked' : item.status === 'tentative' ? 'Hold' : 'Tersedia'}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </section>

      {/* Packages Section */}
      <section className="py-12 px-6 max-w-6xl w-full mx-auto">
        <div className="text-center mb-8">
          <Badge variant="purple" className="mb-2">
            PAKET LAYANAN
          </Badge>
          <h2 className="text-2xl font-bold text-white">Investasi & Pilihan Paket Acara</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card
              key={pkg.name}
              className={`relative flex flex-col justify-between ${
                pkg.isPopular ? 'border-amber-500/60 shadow-2xl shadow-amber-500/10' : 'border-slate-800'
              }`}
            >
              {pkg.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="warning" className="px-3 py-0.5 font-bold text-[10px]">
                    ⭐ PALING DIMINATI
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">{pkg.name}</CardTitle>
                <div className="text-2xl font-black text-amber-400 mt-1">{pkg.price}</div>
                <p className="text-xs text-slate-400 mt-0.5">{pkg.duration}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-xs text-slate-300">
                  {pkg.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full mt-4"
                  variant={pkg.isPopular ? 'primary' : 'secondary'}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, paket_layanan: pkg.name }));
                    setIsModalOpen(true);
                  }}
                >
                  Pilih Paket Ini
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Booking Form Modal with Real-time Anti-Collision Validator */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" /> Formulir Reservasi Jadwal MC
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
              {/* Anti-Collision Feedback Alert Banner */}
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  collisionStatus.checking
                    ? 'border-slate-700 bg-slate-950 text-slate-400'
                    : collisionStatus.available
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                }`}
              >
                {collisionStatus.checking ? (
                  <Clock className="h-4 w-4 animate-spin shrink-0 mt-0.5 text-slate-400" />
                ) : collisionStatus.available ? (
                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <div>
                  <div className="font-bold">
                    {collisionStatus.checking
                      ? 'Memeriksa Ketersediaan Anti-Collision...'
                      : collisionStatus.available
                      ? 'Jadwal Tersedia & Bebas Bentrok!'
                      : 'Jadwal Bertabrakan!'}
                  </div>
                  <div className="text-[11px] mt-0.5">
                    {collisionStatus.message || 'Pemeriksaan buffer transit 90 menit otomatis aktif.'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Tanggal Acara:</label>
                  <input
                    type="date"
                    required
                    value={form.tanggal_acara}
                    onChange={(e) => setForm({ ...form, tanggal_acara: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Paket Terpilih:</label>
                  <select
                    value={form.paket_layanan}
                    onChange={(e) => setForm({ ...form, paket_layanan: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Silver Classic">Silver Classic (Rp 4.500.000)</option>
                    <option value="Gold Luxury">Gold Luxury (Rp 7.500.000)</option>
                    <option value="Platinum Royal">Platinum Royal (Rp 12.000.000)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Waktu Mulai:</label>
                  <input
                    type="time"
                    required
                    value={form.waktu_mulai}
                    onChange={(e) => setForm({ ...form, waktu_mulai: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Waktu Selesai:</label>
                  <input
                    type="time"
                    required
                    value={form.waktu_selesai}
                    onChange={(e) => setForm({ ...form, waktu_selesai: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Nama Pemesan / PIC:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dimas Pratama"
                    value={form.nama_pic}
                    onChange={(e) => setForm({ ...form, nama_pic: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Nomor WhatsApp:</label>
                  <input
                    type="tel"
                    required
                    placeholder="08123456789"
                    value={form.no_wa}
                    onChange={(e) => setForm({ ...form, no_wa: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Nama Acara:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: The Royal Wedding of Dimas & Anissa"
                    value={form.nama_acara}
                    onChange={(e) => setForm({ ...form, nama_acara: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Lokasi / Venue & Kota:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Grand Ballroom Hotel Mulia Senayan, Jakarta"
                    value={form.lokasi}
                    onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <Button variant="ghost" type="button" size="sm" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting || !collisionStatus.available}>
                  {isSubmitting ? 'Mengunci Jadwal...' : 'Ajukan Booking Sekarang'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post-Booking Success Dialog Modal */}
      {isSuccessModalOpen && createdBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 text-slate-100 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Check className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Booking Berhasil Dikunci!</h3>
              <p className="text-xs text-slate-300 mt-1">
                Jadwal Anda telah tercatat aman di sistem dengan status <strong>"Tentative"</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-left space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">ID Acara:</span>
                <span className="text-white font-bold">#{createdBooking.eventId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Invoice:</span>
                <span className="text-amber-400 font-bold">{createdBooking.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Batas Hold Jadwal:</span>
                <span className="text-emerald-400">24 Jam (DP 50%)</span>
              </div>
            </div>

            {/* Quick Action Document Buttons */}
            <div className="space-y-2 pt-2">
              <a
                href={`/invoices/${createdBooking.invoiceId}/print`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Printer className="h-4 w-4" /> Cetak Invoice Resmi QRIS
              </a>

              <a
                href={`/events/${createdBooking.eventId}/spk`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
              >
                <FileText className="h-4 w-4" /> Tinjau Dokumen SPK Kontrak
              </a>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-400"
                onClick={() => setIsSuccessModalOpen(false)}
              >
                Selesai & Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
