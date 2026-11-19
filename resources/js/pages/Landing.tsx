import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Lock,
  Music,
  Sliders,
  User,
  MapPin,
  Mail,
  Globe,
  Phone,
  Play,
  Square,
  Volume2,
  VolumeX,
  Check,
  X,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useLuxuryBgm, BGM_TRACKS, BgmTrackKey } from '@/hooks/useLuxuryBgm';

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

export interface CmsPackage {
  id?: number | string;
  name: string;
  price: string | number;
  duration: string;
  features: string[];
  badge?: string;
  isPopular?: boolean;
}

export interface CmsGalleryItem {
  id: string | number;
  url: string;
  caption: string;
}

export interface CmsTestimonial {
  id: number | string;
  author: string;
  role: string;
  text: string;
  rating: number;
}

export interface CmsFaq {
  q: string;
  a: string;
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
  // CMS State
  const [bio, setBio] = useState({
    name: 'Arkanza Radja Maulana',
    bio: 'Master of Ceremony profesional berbasis di Jakarta & Surabaya dengan jam terbang lebih dari 8 tahun membawakan 500+ pernikahan mewah, gala dinner korporat, dan awarding night kenegaraan. Pembawaan elegan, bilingual (ID/EN), adaptif, dan berkarisma.',
    photo: '/uploads/profile/profile_1793662578.png',
    spec: 'Luxury Wedding, Corporate Gala, Tech Summit, Festival Musik, Awarding Night',
    statEvents: '500+ Acara',
    statYears: '8+ Tahun',
    showreel_youtube_id: 'dQw4w9WgXcQ',
    ig: 'arkanza.mc',
    tiktok: 'arkanza.mc',
    email: 'vanya@mcconnect.id',
    no_telp: '081298765432',
  });

  const [packages, setPackages] = useState<CmsPackage[]>([
    {
      id: 1,
      name: 'Silver Classic',
      price: 'Rp 4.500.000',
      duration: 'Hingga 3 Jam Acara',
      features: ['1 Master of Ceremony Profesional', 'Technical Meeting H-7', 'Standar Cue Sheet & Rundown Review'],
    },
    {
      id: 2,
      name: 'Gold Luxury',
      price: 'Rp 7.500.000',
      isPopular: true,
      badge: 'PALING DIMINATI',
      duration: 'Hingga 5 Jam Acara (Resepsi & Akad)',
      features: [
        'Master MC + 1 Asisten Panggung Pribadi',
        'Naskah Personalisasi AI MC Co-Pilot',
        'Live Sync Cue Musik ke Operator/Soundman',
        'Konsultasi Konsep Panggung & Gladi Resik',
      ],
    },
    {
      id: 3,
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
  ]);

  const [gallery, setGallery] = useState<CmsGalleryItem[]>([
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
      caption: 'The Royal Wedding Reception - Grand Hyatt Jakarta',
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=800&q=80',
      caption: 'Annual Corporate Gala & Awarding Night - Ritz Carlton',
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
      caption: 'Intimate Garden Wedding & Dinner Reception',
    },
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
      caption: 'National Tech Summit & Keynote Opening Stage',
    },
    {
      id: 5,
      url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
      caption: 'Sweet 17 Glamour Birthday Party Celebration',
    },
    {
      id: 6,
      url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
      caption: 'Bilingual Corporate Gathering & Award Ceremony',
    },
  ]);

  const [testimonials, setTestimonials] = useState<CmsTestimonial[]>([
    {
      id: 1,
      author: 'Dimas & Anissa',
      role: 'Pengantin (Wedding at Hotel Mulia)',
      text: 'Kak MC luar biasa membawakan pernikahan kami! Suasana romantisnya dapet banget, transisi ke games dan wedding toast sangat hidup tanpa ada jeda canggung.',
      rating: 5,
    },
    {
      id: 2,
      author: 'PT Telkomsel Indonesia',
      role: 'Corporate Organizer (Annual Summit 2026)',
      text: 'Sangat profesional, on-time, dan adaptif dengan pergeseran rundown VIP direksi. Fitur live cue teleprompter dan koordinasi soundman sangat rapi!',
      rating: 5,
    },
    {
      id: 3,
      author: 'Jessica Wijaya (Epic EO)',
      role: 'Event Director',
      text: 'Sudah lebih dari 15 kali bekerjasama, selalu puas 100%! MC terpercaya yang bikin EO tenang karena koordinasi panggung selalu presisi.',
      rating: 5,
    },
  ]);

  const [policies, setPolicies] = useState({
    terms: `1. Booking tanggal dianggap sah (Terkunci) setelah klien membayar Down Payment (DP) 50% dari total nilai kontrak.\n2. Pelunasan sisa tagihan 50% wajib diselesaikan selambat-lambatnya H-2 sebelum hari acara.\n3. Durasi performa MC maksimal 4 jam per sesi acara. Kelebihan durasi dihitung overtime Rp 1.000.000/jam.\n4. Klien wajib menyediakan waktu Soundcheck / Gladi Bersih minimal 45 menit sebelum acara dimulai.`,
    refund: `1. Pembatalan >30 hari sebelum hari H: Refund 50% dari nilai DP yang telah dibayarkan, atau DP dialihkan ke jadwal lain (reschedule) dalam waktu 6 bulan.\n2. Pembatalan H-30 s/d H-14: DP hangus (0% refund) sebagai kompensasi penolakan klien lain pada tanggal tersebut.\n3. Pembatalan <14 hari sebelum hari H: Klien wajib melunasi 100% total nilai kontrak karena jadwal panggung telah terkunci penuh.\n4. Kondisi Kahar (Force Majeure): Tanggal dijadwalkan ulang secara musyawarah tanpa penalti denda.`,
    riders: `Kebutuhan Teknis Panggung:\n- 2 unit Wireless Microphone berkualitas tinggi (Shure Axient / Sennheiser EW-D) dengan baterai baru.\n- 1 unit Stage Monitor speaker khusus menghadap posisi berdiri MC.\n\nKebutuhan Hospitality:\n- Ruang transit ber-AC (Green Room) dengan cermin rias dan colokan listrik.\n- Air mineral suhu ruang, lemon hangat/madu, dan konsumsi kru MC.`,
    faqs: [
      {
        q: 'Apakah bisa membawakan acara bilingual (Inggris - Indonesia)?',
        a: 'Ya, sangat fasih untuk corporate event multinasional maupun pernikahan multikultural dengan gaya formal maupun santai.',
      },
      {
        q: 'Kapan naskah panggung teleprompter & cue musik disiapkan?',
        a: 'Maksimal 2x24 jam setelah rundown final disepakati bersama WO/EO melalui sesi Technical Meeting.',
      },
      {
        q: 'Bagaimana jika acara saya melebihi durasi yang disepakati (Overtime)?',
        a: 'Kelebihan waktu akan dicatat dan dihitung dengan tarif lembur transparan sebesar Rp 1.000.000 per jam setelah acara selesai.',
      },
    ] as CmsFaq[],
  });

  // Calendar State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [activeYearMonth, setActiveYearMonth] = useState<{ year: number; month: number }>({
    year: 2026,
    month: 10, // Oktober
  });

  // Accordion State for Policies
  const [activeAccordion, setActiveAccordion] = useState<string | null>('terms');

  // Video Showreel Modal State
  const [isShowreelOpen, setIsShowreelOpen] = useState<boolean>(false);

  // Booking Modal State
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
    lokasi: 'Grand Ballroom Hotel Mulia Senayan, Jakarta',
    tanggal_acara: '2026-10-15',
    waktu_mulai: '18:00',
    waktu_selesai: '21:00',
    catatan_khusus: '',
    paket_layanan: 'Gold Luxury',
    policy_agreed: true,
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

  // BGM Luxury Audio Synthesizer Hook
  const bgm = useLuxuryBgm();
  const [isBgmWidgetOpen, setIsBgmWidgetOpen] = useState<boolean>(false);

  // Fetch CMS Data on Mount
  useEffect(() => {
    fetch('/api/cms/public-bootstrap')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          const d = resData.data;
          if (d.biodata?.name) {
            setBio((prev) => ({
              ...prev,
              ...d.biodata,
            }));
          }
          if (Array.isArray(d.packages) && d.packages.length > 0) {
            setPackages(
              d.packages.map((p: Record<string, unknown>) => ({
                id: p.id as string | number,
                name: (p.name as string) || 'Paket Acara',
                price: typeof p.price === 'number' ? `Rp ${p.price.toLocaleString('id-ID')}` : (p.price as string),
                duration: (p.duration as string) || '4 Jam Acara',
                features: Array.isArray(p.features) ? (p.features as string[]) : ['Pemanduan Acara Penuh'],
                badge: (p.badge as string) || (p.is_popular ? 'PALING DIMINATI' : undefined),
                isPopular: !!p.badge || !!p.is_popular,
              }))
            );
          }
          if (Array.isArray(d.gallery) && d.gallery.length > 0) {
            setGallery(d.gallery);
          }
          if (Array.isArray(d.testimonials) && d.testimonials.length > 0) {
            setTestimonials(d.testimonials);
          }
          if (d.policies) {
            setPolicies((prev) => ({
              ...prev,
              terms: d.policies.terms || prev.terms,
              refund: d.policies.refund || prev.refund,
              riders: d.policies.riders || prev.riders,
              faqs: Array.isArray(d.policies.faqs) && d.policies.faqs.length > 0 ? d.policies.faqs : prev.faqs,
            }));
          }
        }
      })
      .catch((err) => console.warn('Gagal memuat CMS public-bootstrap:', err));

    // Fetch calendar availability
    fetch('/api/calendar/availability')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCalendarEvents(data);
        }
      })
      .catch((err) => console.warn('Gagal memuat ketersediaan jadwal:', err));
  }, []);

  // Anti-Collision Validator
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
      toast.error('Tanggal ini telah terkunci penuh oleh acara klien lain.');
      return;
    }
    setForm((prev) => ({ ...prev, tanggal_acara: dateStr }));
    setIsModalOpen(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        toast.success(data.message || 'Permintaan booking berhasil dikunci!');
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

  // Calendar month days calculation
  const calendarDays = useMemo(() => {
    const { year, month } = activeYearMonth;
    const daysCount = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay();

    const days = [];
    // Padding before 1st day
    for (let p = 0; p < firstDayIndex; p++) {
      days.push({ empty: true, key: `empty-${p}` });
    }

    // Actual days
    for (let d = 1; d <= daysCount; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const fullDate = `${year}-${monthStr}-${dayStr}`;

      const matching = calendarEvents.find((e) => e.date === fullDate);
      let status = 'available';
      if (matching) {
        status = matching.status === 'Terkunci' || matching.status === 'Confirmed' ? 'locked' : 'tentative';
      }

      days.push({
        empty: false,
        key: fullDate,
        day: d,
        fullDate,
        status,
        eventTitle: matching?.title || matching?.nama_acara || '',
      });
    }

    return days;
  }, [activeYearMonth, calendarEvents]);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const handlePrevMonth = () => {
    setActiveYearMonth((prev) => {
      if (prev.month === 1) return { year: prev.year - 1, month: 12 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setActiveYearMonth((prev) => {
      if (prev.month === 12) return { year: prev.year + 1, month: 1 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col">
      {/* =========================================================
          1. LUXURY STICKY NAVIGATION BAR
          ========================================================= */}
      <nav className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#0B0F19]/90 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20">
              MC
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                {bio.name || 'MC-Connect'}
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                  OFFICIAL
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <button onClick={() => scrollTo('biodata')} className="hover:text-amber-400 transition-colors">
            Biodata
          </button>
          <button onClick={() => scrollTo('katalog')} className="hover:text-amber-400 transition-colors">
            Paket Layanan
          </button>
          <button onClick={() => scrollTo('galeri')} className="hover:text-amber-400 transition-colors">
            Galeri Portofolio
          </button>
          <button onClick={() => scrollTo('kalender')} className="hover:text-amber-400 transition-colors">
            Kalender Jadwal
          </button>
          <button onClick={() => scrollTo('kebijakan')} className="hover:text-amber-400 transition-colors">
            Kebijakan & FAQ
          </button>
          <button onClick={() => scrollTo('testimoni')} className="hover:text-amber-400 transition-colors">
            Testimoni
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* BGM Toggle Button */}
          <button
            onClick={() => {
              if (!bgm.isPlaying) bgm.start();
              setIsBgmWidgetOpen(!isBgmWidgetOpen);
            }}
            title="Pengaturan Musik Latar Panggung (BGM)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              bgm.isPlaying
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Music className={`h-3.5 w-3.5 ${bgm.isPlaying ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{bgm.isPlaying ? 'Musik On' : 'Musik BGM'}</span>
          </button>

          {/* Quick Booking Button */}
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold hover:brightness-110 shadow-md shadow-amber-500/20"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Request to Book
          </Button>

          {/* Login MC Admin Portal Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenAdmin}
            className="hidden sm:flex border-white/10 bg-slate-900 text-slate-300 hover:text-white"
          >
            <Lock className="h-3 w-3 mr-1 text-amber-400" /> Portal MC
          </Button>
        </div>
      </nav>

      {/* =========================================================
          2. HERO SECTION (BIODATA & PROFIL RESMI)
          ========================================================= */}
      <section id="biodata" className="relative py-16 md:py-24 px-6 overflow-hidden">
        {/* Ambient Glow Circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -z-10 h-[450px] w-[600px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text & Bio */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-400">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>INDONESIA&apos;S PREMIER WEDDING & CORPORATE HOST</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
              Bring Extraordinary Energy to Your Stage with{' '}
              <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
                {bio.name}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {bio.bio}
            </p>

            {/* Specialization Tags */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {bio.spec.split(',').map((tag, i) => (
                <span
                  key={i}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
                >
                  ✓ {tag.trim()}
                </span>
              ))}
            </div>

            {/* Social Media Links */}
            <div className="flex items-center gap-3 justify-center lg:justify-start pt-2">
              <a
                href={`https://wa.me/${bio.no_telp?.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
              >
                <Phone className="h-3.5 w-3.5" /> WhatsApp Direct
              </a>
              <a
                href={`https://instagram.com/${bio.ig}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pink-500/30 bg-pink-500/10 text-pink-400 text-xs font-semibold hover:bg-pink-500/20 transition-all"
              >
                <span>📸</span> @{bio.ig}
              </a>
              <a
                href={`mailto:${bio.email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-all"
              >
                <Mail className="h-3.5 w-3.5" /> {bio.email}
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 justify-center lg:justify-start pt-3">
              <Button
                size="lg"
                onClick={() => scrollTo('kalender')}
                className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-xl shadow-amber-500/20 hover:brightness-110 px-6"
              >
                <CalendarIcon className="h-4 w-4 mr-2" /> Lihat Jadwal & Reservasi
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsShowreelOpen(true)}
                className="border-white/20 bg-slate-900/60 text-white hover:bg-slate-800 px-6"
              >
                <Play className="h-4 w-4 mr-2 text-amber-400" /> Tonton Showreel Video
              </Button>
            </div>
          </div>

          {/* Right MC Photo with Glowing Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group max-w-[340px] sm:max-w-[380px] w-full">
              {/* Outer Golden Glow Border */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 opacity-60 blur-lg group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-slate-900 shadow-2xl">
                <img
                  src={bio.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'}
                  alt={bio.name}
                  className="w-full h-[440px] object-cover object-top hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                {/* Bottom Overlay Badge */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-5 text-center">
                  <h3 className="font-bold text-lg text-white">{bio.name}</h3>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-medium mt-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>MC Terverifikasi & Bersertifikasi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          3. STATS STRIP
          ========================================================= */}
      <section className="border-y border-white/10 bg-[#111827]/80 py-8 px-6 backdrop-blur-md">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-black text-amber-400">{bio.statEvents || '500+'}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Acara Sukses Terpandu</div>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-400">{bio.statYears || '8+ Tahun'}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Pengalaman Panggung</div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-400">99.8%</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Tingkat Kepuasan Klien</div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-400">0%</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Risiko Bentrok Jadwal (Anti-Collision)</div>
          </div>
        </div>
      </section>

      {/* =========================================================
          4. KATALOG PAKET LAYANAN
          ========================================================= */}
      <section id="katalog" className="py-20 px-6 max-w-6xl w-full mx-auto">
        <div className="text-center mb-12">
          <Badge variant="purple" className="mb-2.5 font-bold">
            KATALOG RESMI MC
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Investasi & Paket Acara Pilihan</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Seluruh paket dilengkapi jaminan transparansi SPK resmi, rincian riders jelas, dan dukungan AI Rundown Co-Pilot.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {packages.map((pkg) => (
            <Card
              key={pkg.name}
              className={`relative flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                pkg.isPopular
                  ? 'border-amber-400/80 bg-slate-900/90 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-400/40'
                  : 'border-white/10 bg-[#111827]/70 hover:border-white/20'
              }`}
            >
              {pkg.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 py-1 text-[11px] font-black uppercase text-slate-950 shadow-md">
                    ⭐ {pkg.badge || 'PALING DIMINATI'}
                  </span>
                </div>
              )}

              <CardHeader className="pt-8">
                <CardTitle className="text-xl font-bold text-white">{pkg.name}</CardTitle>
                <div className="text-3xl font-black text-amber-400 mt-2">{pkg.price}</div>
                <p className="text-xs text-slate-400 mt-1 font-medium">{pkg.duration}</p>
              </CardHeader>

              <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5 text-xs text-slate-300">
                  {pkg.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className={`w-full py-2.5 font-bold ${
                    pkg.isPopular
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, paket_layanan: pkg.name }));
                    setIsModalOpen(true);
                  }}
                >
                  Pilih Paket & Booking
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* =========================================================
          5. GALERI PORTOFOLIO PANGGUNG
          ========================================================= */}
      <section id="galeri" className="py-20 px-6 bg-[#111827]/60 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="warning" className="mb-2.5 font-bold">
              PORTOFOLIO PANGGUNG
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Momen Magis di Setiap Acara</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Dokumentasi panggung pernikahan sakral, jamuan korporat kenegaraan, dan festival musik meriah.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.slice(0, 6).map((item, idx) => (
              <div
                key={item.id || idx}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-lg aspect-[4/3]"
              >
                <img
                  src={item.url}
                  alt={item.caption}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity p-4 flex flex-col justify-end">
                  <span className="text-xs font-bold text-white leading-snug">{item.caption}</span>
                  <span className="text-[10px] text-amber-400 font-mono mt-1">Live Stage Highlight</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          6. KALENDER KETERSEDIAAN REAL-TIME
          ========================================================= */}
      <section id="kalender" className="py-20 px-6 max-w-5xl w-full mx-auto">
        <div className="text-center mb-10">
          <Badge variant="purple" className="mb-2.5 font-bold">
            LIVE SCHEDULE DATABASE
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Kalender Ketersediaan Panggung</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Tersinkronisasi langsung dengan mesin anti-bentrok jadwal. Klik tanggal bertanda hijau untuk mengajukan booking seketika.
          </p>
        </div>

        <Card className="border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
          {/* Calendar Header with Month Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-amber-400" />
              <span className="font-extrabold text-lg text-white">
                {monthNames[activeYearMonth.month - 1]} {activeYearMonth.year}
              </span>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" /> Tersedia
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" /> Tentative (Hold)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" /> Terkunci (Booked)
              </span>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2.5 text-center">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
              <span key={d} className="text-xs font-bold text-slate-500 py-1">
                {d}
              </span>
            ))}

            {calendarDays.map((item) => {
              if (item.empty) {
                return <div key={item.key} className="p-3" />;
              }

              const isLocked = item.status === 'locked';
              const isTentative = item.status === 'tentative';

              return (
                <button
                  key={item.key}
                  disabled={isLocked}
                  onClick={() => handleDateClick(item.fullDate!, isLocked)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                    item.status === 'available'
                      ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-300 hover:scale-105'
                      : isTentative
                      ? 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 hover:scale-105'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-400/60 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span className="text-base font-black">{item.day}</span>
                  <span className="text-[9px] uppercase font-extrabold mt-0.5 truncate max-w-[55px]">
                    {isLocked ? 'Booked' : isTentative ? 'Hold' : 'Tersedia'}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      </section>

      {/* =========================================================
          7. KEBIJAKAN, TERMS & FAQ ACCORDION
          ========================================================= */}
      <section id="kebijakan" className="py-20 px-6 bg-[#111827]/70 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="purple" className="mb-2.5 font-bold">
              TRANSPARANSI & KEBIJAKAN
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Syarat, Ketentuan & Kebijakan Refund</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Segala ketentuan tertulis dalam Surat Perjanjian Kerja (SPK) resmi demi kenyamanan bersama.
            </p>
          </div>

          <div className="space-y-4">
            {/* Accordion 1: Terms */}
            <div className="rounded-2xl border border-white/10 bg-slate-900 overflow-hidden">
              <button
                onClick={() => setActiveAccordion(activeAccordion === 'terms' ? null : 'terms')}
                className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-white hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base">📜</span> Syarat & Ketentuan Booking MC
                </span>
                {activeAccordion === 'terms' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {activeAccordion === 'terms' && (
                <div className="p-5 pt-0 text-xs text-slate-300 whitespace-pre-line leading-relaxed border-t border-white/5 bg-slate-950/40">
                  {policies.terms}
                </div>
              )}
            </div>

            {/* Accordion 2: Refund Policy */}
            <div className="rounded-2xl border border-white/10 bg-slate-900 overflow-hidden">
              <button
                onClick={() => setActiveAccordion(activeAccordion === 'refund' ? null : 'refund')}
                className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-white hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base">🛡️</span> Kebijakan Pembatalan & Hak Refund (Zero-Trust)
                </span>
                {activeAccordion === 'refund' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {activeAccordion === 'refund' && (
                <div className="p-5 pt-0 text-xs text-slate-300 whitespace-pre-line leading-relaxed border-t border-white/5 bg-slate-950/40">
                  {policies.refund}
                </div>
              )}
            </div>

            {/* Accordion 3: Riders */}
            <div className="rounded-2xl border border-white/10 bg-slate-900 overflow-hidden">
              <button
                onClick={() => setActiveAccordion(activeAccordion === 'riders' ? null : 'riders')}
                className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-white hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base">🎙️</span> Technical & Hospitality Riders MC
                </span>
                {activeAccordion === 'riders' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {activeAccordion === 'riders' && (
                <div className="p-5 pt-0 text-xs text-slate-300 whitespace-pre-line leading-relaxed border-t border-white/5 bg-slate-950/40">
                  {policies.riders}
                </div>
              )}
            </div>

            {/* Accordion 4: FAQ */}
            <div className="rounded-2xl border border-white/10 bg-slate-900 overflow-hidden">
              <button
                onClick={() => setActiveAccordion(activeAccordion === 'faq' ? null : 'faq')}
                className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-white hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base">❓</span> FAQ (Tanya Jawab Seputar Acara)
                </span>
                {activeAccordion === 'faq' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {activeAccordion === 'faq' && (
                <div className="p-5 pt-0 space-y-3.5 border-t border-white/5 bg-slate-950/40">
                  {policies.faqs.map((faq, i) => (
                    <div key={i} className="text-xs">
                      <div className="font-bold text-amber-400">Q: {faq.q}</div>
                      <div className="text-slate-300 mt-1">A: {faq.a}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          8. TESTIMONI KLIEN & PENYELENGGARA
          ========================================================= */}
      <section id="testimoni" className="py-20 px-6 max-w-6xl w-full mx-auto">
        <div className="text-center mb-12">
          <Badge variant="warning" className="mb-2.5 font-bold">
            ULASAN KLIEN TERVERIFIKASI
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Apa Kata Klien & Penyelenggara?</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Kepuasan penyelenggara acara dan pengantin adalah dedikasi utama kami di setiap menit panggung.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card key={t.id} className="border border-white/10 bg-slate-900/80 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: t.rating || 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30">
                  {t.author.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-xs text-white">{t.author}</div>
                  <div className="text-[10px] text-slate-400">{t.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* =========================================================
          9. FOOTER
          ========================================================= */}
      <footer className="border-t border-white/10 bg-[#0B0F19] py-12 px-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs">
              MC
            </div>
            <span className="font-bold text-white text-base">MC-Connect</span>
          </div>

          <p className="max-w-md mx-auto text-xs text-slate-400 leading-relaxed">
            Portal resmi pemesanan jadwal Master of Ceremony terpadu. Dilengkapi sistem anti-collision, live teleprompter, dan transparansi invoice resmi.
          </p>

          <div className="flex justify-center items-center gap-4 text-xs font-medium">
            <button onClick={onOpenAdmin} className="text-amber-400 hover:underline">
              Buka Command Center Admin
            </button>
            <span className="text-slate-600">•</span>
            <button onClick={onOpenStage} className="text-amber-400 hover:underline">
              Layar Tablet Stage Mode
            </button>
            <span className="text-slate-600">•</span>
            <a href="/legacy/landing" className="text-slate-500 hover:text-slate-300 hover:underline" title="Buka versi web HTML asli">
              Versi Asli (Legacy)
            </a>
          </div>

          <div className="pt-4 border-t border-white/5 text-[11px] text-slate-500">
            &copy; {new Date().getFullYear()} {bio.name} • MC-Connect Management System. All rights reserved.
          </div>
        </div>
      </footer>

      {/* =========================================================
          10. SHOWREEL YOUTUBE MODAL
          ========================================================= */}
      {isShowreelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/20 bg-slate-900 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-950">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Play className="h-4 w-4 text-amber-400" /> Showreel Cuplikan Panggung MC
              </span>
              <button onClick={() => setIsShowreelOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${bio.showreel_youtube_id || 'dQw4w9WgXcQ'}?autoplay=1`}
                title="Showreel Video MC"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          11. BOOKING REQUEST MODAL (WITH LIVE ANTI-COLLISION ENGINE)
          ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-slate-900 p-6 text-slate-100 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" /> Formulir Request to Book MC
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
              {/* Anti-Collision Live Feedback Banner */}
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
                    {collisionStatus.message || 'Pemeriksaan jeda transit 90 menit otomatis aktif.'}
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
                    {packages.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.price})
                      </option>
                    ))}
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
                  <label className="text-slate-400 block mb-1">Nama Pemesan (PIC):</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dimas Pratama"
                    value={form.nama_pic}
                    onChange={(e) => setForm({ ...form, nama_pic: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Nomor WhatsApp:</label>
                  <input
                    type="tel"
                    required
                    placeholder="081298765432"
                    value={form.no_wa}
                    onChange={(e) => setForm({ ...form, no_wa: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Email:</label>
                  <input
                    type="email"
                    placeholder="client@mail.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Tipe Klien:</label>
                  <select
                    value={form.tipe_klien}
                    onChange={(e) => setForm({ ...form, tipe_klien: e.target.value as typeof form.tipe_klien })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Personal">Personal (Calon Pengantin / Keluarga)</option>
                    <option value="WO">Wedding Organizer (WO)</option>
                    <option value="EO">Event Organizer (EO)</option>
                    <option value="Corporate">Corporate / Perusahaan</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Nama Acara:</label>
                  <input
                    type="text"
                    required
                    placeholder="The Royal Wedding of Dimas & Anissa"
                    value={form.nama_acara}
                    onChange={(e) => setForm({ ...form, nama_acara: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Lokasi / Venue Acara:</label>
                  <input
                    type="text"
                    required
                    placeholder="Grand Ballroom Hotel Mulia Senayan, Jakarta"
                    value={form.lokasi}
                    onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Catatan Tambahan / Konsep Acara:</label>
                  <textarea
                    rows={2}
                    placeholder="Konsep intimate wedding, ada prosesi adat Jawa..."
                    value={form.catatan_khusus}
                    onChange={(e) => setForm({ ...form, catatan_khusus: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <input
                  type="checkbox"
                  id="agreePolicy"
                  required
                  checked={form.policy_agreed}
                  onChange={(e) => setForm({ ...form, policy_agreed: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 h-4 w-4"
                />
                <label htmlFor="agreePolicy" className="text-[11px] text-slate-300">
                  Saya menyetujui ketentuan down payment (DP 50%) dan kebijakan pembatalan panggung MC.
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <Button variant="ghost" type="button" size="sm" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !collisionStatus.available}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold"
                >
                  {isSubmitting ? 'Mengunci Jadwal...' : 'Kirim Permintaan Booking'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          12. POST-BOOKING SUCCESS DIALOG
          ========================================================= */}
      {isSuccessModalOpen && createdBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 text-slate-100 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Check className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white">Booking Berhasil Dikunci!</h3>
              <p className="text-xs text-slate-300 mt-1">
                Jadwal Anda telah tercatat aman di sistem dengan status <strong>"Tentative (Hold 24 Jam)"</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950 p-4 text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">ID Acara:</span>
                <span className="text-white font-bold">#{createdBooking.eventId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Invoice:</span>
                <span className="text-amber-400 font-bold">{createdBooking.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Batas Waktu DP:</span>
                <span className="text-emerald-400">24 Jam (DP 50% Otomatis)</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={`/invoices/${createdBooking.invoiceId}/print`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Printer className="h-4 w-4" /> Cetak Invoice Resmi QRIS
              </a>

              <a
                href={`/events/${createdBooking.eventId}/spk`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
              >
                <FileText className="h-4 w-4" /> Tinjau Dokumen SPK Kontrak
              </a>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-400"
                onClick={() => setIsSuccessModalOpen(false)}
              >
                Tutup & Selesai
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          13. FLOATING LUXURY BGM SYNTHESIZER WIDGET
          ========================================================= */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isBgmWidgetOpen ? (
          <button
            onClick={() => {
              if (!bgm.isPlaying) bgm.start();
              setIsBgmWidgetOpen(true);
            }}
            className="flex items-center gap-2.5 rounded-full border border-amber-400/40 bg-slate-900/95 px-4 py-3 text-xs font-bold text-amber-400 shadow-2xl backdrop-blur-md hover:scale-105 transition-all"
          >
            <Music className={`h-4 w-4 ${bgm.isPlaying ? 'animate-spin' : ''}`} />
            <span>{bgm.isPlaying ? 'Musik Aktif' : 'Putar Musik BGM'}</span>
          </button>
        ) : (
          <div className="w-80 rounded-2xl border border-amber-400/40 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Music className="h-3.5 w-3.5 text-amber-400" /> Musik Latar Panggung (BGM)
              </span>
              <button onClick={() => setIsBgmWidgetOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Track Selector */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">
                Tema Melodi:
              </label>
              <select
                value={bgm.currentTrack}
                onChange={(e) => bgm.setTrack(e.target.value as BgmTrackKey)}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
              >
                {BGM_TRACKS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Play/Stop & Volume Slider */}
            <div className="flex items-center gap-3">
              <button
                onClick={bgm.togglePlay}
                className={`p-2 rounded-xl text-slate-950 font-bold transition-all ${
                  bgm.isPlaying ? 'bg-amber-400' : 'bg-white/20 text-white'
                }`}
              >
                {bgm.isPlaying ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
              </button>

              <button onClick={bgm.toggleMute} className="text-slate-400 hover:text-white">
                {bgm.isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgm.volume}
                onChange={(e) => bgm.setVolume(parseFloat(e.target.value))}
                className="flex-1 accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                {Math.round(bgm.volume * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
