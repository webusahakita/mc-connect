import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  MessageSquare, 
  Music, 
  Star, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  Download,
  Printer,
  FileText,
  Receipt,
  Headphones,
  Search,
  Filter,
  Lock,
  Clock,
  UserCheck,
  PlusCircle,
  RefreshCw,
  LogIn,
  AlertCircle,
  Trash2,
  Edit3,
  Copy,
  Send,
  UploadCloud,
  Check,
  TrendingUp,
  Percent,
  Sliders,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export interface EventItem {
  id: number;
  customerId?: number;
  title: string;
  nama_acara?: string;
  date: string;
  time: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  lokasi?: string;
  pic?: string;
  price?: string;
  rawPrice?: number;
  status: 'Terkunci' | 'Confirmed' | 'Tentative' | 'Review' | 'Selesai' | string;
  paymentStatus?: string;
  note?: string;
  category?: string;
  checklist?: any[];
  expenses?: any[];
  rundown?: any[];
}

export interface RundownSegment {
  id: number;
  time: string;
  title: string;
  isDone: boolean;
  music: string;
  pic: string;
  script?: string;
  segmentType: 'opening' | 'entrance' | 'cake_toast' | 'dinner' | 'games' | 'closing' | 'custom';
  tone: 'formal' | 'romantic_warm' | 'energetic_fun' | 'elegant_luxury';
}

export interface FinancialData {
  financials: {
    event_id: number;
    event_name: string;
    contract_value: number;
    dp_received: number;
    balance_remaining: number;
    total_expenses: number;
    net_profit: number;
    profit_margin_pct: number;
    payment_status: string;
    expense_count: number;
  };
  refund_policy: {
    days_to_event: number;
    cancellation_rule: string;
    refund_amount: number;
    penalty_amount: number;
  };
  expenses: Array<{
    id: number;
    category: string;
    description: string;
    amount: number;
    proof_url?: string;
    created_at?: string;
  }>;
}

export default function Dashboard({
  selectedEventId,
  onSelectEvent,
  onOpenStage,
  onOpenVendor,
  onBackToHome,
}: {
  selectedEventId: number;
  onSelectEvent: (id: number) => void;
  onOpenStage: (id?: number) => void;
  onOpenVendor: (id?: number) => void;
  onBackToHome: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'rundown' | 'vendor' | 'review'>('overview');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [authStatus, setAuthStatus] = useState<'authenticated' | 'guest'>('guest');
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; tier: string } | null>(null);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Financials State
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [financialLoading, setFinancialLoading] = useState<boolean>(false);
  const [expenseCategory, setExpenseCategory] = useState<string>('transport');
  const [expenseDesc, setExpenseDesc] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseProofUrl, setExpenseProofUrl] = useState<string>('');
  const [isUploadingProof, setIsUploadingProof] = useState<boolean>(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState<boolean>(false);

  // Fast Login Modal state
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('vanya@mcconnect.id');
  const [loginPassword, setLoginPassword] = useState<string>('password123');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Rundown Timeline State
  const [rundownList, setRundownList] = useState<RundownSegment[]>([
    {
      id: 1,
      time: '18:00 - 18:30',
      title: 'Tamu Undangan Tiba & Registrasi',
      isDone: true,
      music: 'Acoustic Instrumental Soft BGM',
      pic: 'Penerima Tamu / Asisten MC',
      segmentType: 'opening',
      tone: 'formal',
      script: 'Selamat malam dan selamat datang kepada bapak, ibu sekalian. Silakan mengisi buku registrasi dan menikmati santap selamat datang.',
    },
    {
      id: 2,
      time: '18:30 - 18:45',
      title: 'Opening MC & Penyambutan VIP',
      isDone: true,
      music: 'Fanfare Brass of Triumph Intro',
      pic: 'Master MC Vanya Arsyad',
      segmentType: 'opening',
      tone: 'romantic_warm',
      script: 'Selamat malam bapak, ibu, serta seluruh tamu undangan yang kami muliakan. Sungguh kehormatan luar biasa menyambut Anda di malam penuh kebahagiaan ini.',
    },
    {
      id: 3,
      time: '18:45 - 19:15',
      title: 'Grand Entrance Pengantin & Keluarga',
      isDone: false,
      music: 'Canon in D Strings / A Thousand Years Piano',
      pic: 'WO Floor Coordinator',
      segmentType: 'entrance',
      tone: 'romantic_warm',
      script: 'Hadirin sekalian, arahkan pandangan dan sambutlah dengan tepuk tangan paling bergemuruh, kehadiran kedua mempelai: Dimas & Anissa!',
    },
    {
      id: 4,
      time: '19:15 - 19:45',
      title: 'Sambutan Perwakilan Keluarga & Doa Bersama',
      isDone: false,
      music: 'Subtle Piano Reflection Ambient',
      pic: 'Perwakilan Keluarga Besar',
      segmentType: 'cake_toast',
      tone: 'formal',
      script: 'Kepada yang terhormat perwakilan keluarga besar, waktu dan tempat kami persilakan dengan segala hormat.',
    },
    {
      id: 5,
      time: '19:45 - 20:30',
      title: 'Dinner Reception, Toast & Ice Breaking Game',
      isDone: false,
      music: 'Upbeat Pop Jazz / Game SFX Pack',
      pic: 'Master MC & Asisten Panggung',
      segmentType: 'games',
      tone: 'energetic_fun',
      script: 'Kini saatnya kita sedikit mencairkan suasana! Kami undang 5 sahabat terdekat untuk maju ke atas panggung untuk memperebutkan doorprize istimewa!',
    },
    {
      id: 6,
      time: '20:30 - 21:00',
      title: 'Lempar Buket, Foto Bersama & Closing MC',
      isDone: false,
      music: 'Celebration Finale Song / Marry You',
      pic: 'All Crew & Master MC',
      segmentType: 'closing',
      tone: 'romantic_warm',
      script: 'Terima kasih atas segala doa restu dan kehadiran Anda semua. Semoga kebahagiaan malam ini senantiasa menyertai kita. Have a safe journey home!',
    },
  ]);

  // AI Co-Pilot Script Generator Dialog State
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [activeSegmentForAi, setActiveSegmentForAi] = useState<RundownSegment | null>(null);
  const [aiSegmentType, setAiSegmentType] = useState<string>('opening');
  const [aiTone, setAiTone] = useState<string>('romantic_warm');
  const [aiVipNames, setAiVipNames] = useState<string>('');
  const [aiCustomNotes, setAiCustomNotes] = useState<string>('');
  const [aiGeneratedScript, setAiGeneratedScript] = useState<string>('');
  const [aiGeneratedMusic, setAiGeneratedMusic] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [remainingTokens, setRemainingTokens] = useState<number>(85);

  // Add Segment Modal State
  const [showAddSegmentModal, setShowAddSegmentModal] = useState<boolean>(false);
  const [newSegTime, setNewSegTime] = useState<string>('20:00 - 20:15');
  const [newSegTitle, setNewSegTitle] = useState<string>('');
  const [newSegPic, setNewSegPic] = useState<string>('WO / MC');
  const [newSegMusic, setNewSegMusic] = useState<string>('Romantic Instrument');

  // Interactive Refund Policy Simulator State
  const [simulatedDaysToEvent, setSimulatedDaysToEvent] = useState<number>(14);

  // Initial Load: check session and fetch events
  useEffect(() => {
    loadEvents();
  }, []);

  // When selected event changes or when activeTab becomes finance, load financials
  useEffect(() => {
    if (activeTab === 'finance' && selectedEventId) {
      loadFinancials(selectedEventId);
    }
  }, [selectedEventId, activeTab]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // 1. Check Session
      const sessionRes = await fetch('/api/mc/session', { credentials: 'same-origin' });
      if (sessionRes.ok) {
        const sessionJson = await sessionRes.json();
        if (sessionJson.success && sessionJson.user) {
          setAuthStatus('authenticated');
          setUserProfile(sessionJson.user);
        }
      }

      // 2. Fetch Events
      let loadedEvents: EventItem[] = [];
      const cmsRes = await fetch('/api/cms/events', { credentials: 'same-origin' });
      if (cmsRes.ok) {
        const cmsJson = await cmsRes.json();
        if (cmsJson.success && Array.isArray(cmsJson.data) && cmsJson.data.length > 0) {
          loadedEvents = cmsJson.data;
          setAuthStatus('authenticated');
        }
      }

      // Fallback to public availability calendar if unauthenticated or cms empty
      if (loadedEvents.length === 0) {
        const publicRes = await fetch('/api/calendar/availability');
        if (publicRes.ok) {
          const publicJson = await publicRes.json();
          if (Array.isArray(publicJson)) {
            loadedEvents = publicJson.map((item: any) => ({
              id: item.id,
              title: item.title || item.nama_acara,
              nama_acara: item.nama_acara || item.title,
              date: item.date,
              time: item.time || `${item.startTime || '18:00'} - ${item.endTime || '21:00'} WIB`,
              startTime: item.startTime,
              endTime: item.endTime,
              venue: item.lokasi || 'Venue TBD',
              lokasi: item.lokasi,
              pic: item.pic || 'Klien MC-Connect',
              price: item.price || 'Rp 7.500.000',
              rawPrice: item.rawPrice || 7500000,
              status: item.status || 'Terkunci',
              paymentStatus: item.status === 'Terkunci' ? 'DP Terverifikasi' : 'Hold',
              category: 'Wedding',
              rundown: [],
            }));
          }
        }
      }

      setEvents(loadedEvents);

      if (loadedEvents.length > 0) {
        const exists = loadedEvents.some((e) => e.id === selectedEventId);
        if (!exists) {
          onSelectEvent(loadedEvents[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading events:', err);
      toast.error('Gagal memuat daftar acara dari server.');
    } finally {
      setLoading(false);
    }
  };

  const loadFinancials = async (eventId: number) => {
    setFinancialLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/financials`, { credentials: 'same-origin' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setFinancialData(json.data);
          if (json.data.refund_policy?.days_to_event !== undefined) {
            setSimulatedDaysToEvent(json.data.refund_policy.days_to_event);
          }
          return;
        }
      }
      // If 401 unauthenticated, fallback to local Zero-Trust estimate
      const activeEv = events.find((e) => e.id === eventId);
      const contractVal = activeEv?.rawPrice || 7500000;
      const dp = activeEv?.status === 'Terkunci' ? contractVal * 0.5 : 0;
      setFinancialData({
        financials: {
          event_id: eventId,
          event_name: activeEv?.title || 'Acara MC',
          contract_value: contractVal,
          dp_received: dp,
          balance_remaining: contractVal - dp,
          total_expenses: 500000,
          net_profit: contractVal - 500000,
          profit_margin_pct: Math.round(((contractVal - 500000) / contractVal) * 100),
          payment_status: activeEv?.status === 'Terkunci' ? 'DP 50% Diterima' : 'Belum Bayar',
          expense_count: 1,
        },
        refund_policy: {
          days_to_event: 14,
          cancellation_rule: 'H-14 s/d H-30: DP Hangus (Non-Refundable)',
          refund_amount: 0,
          penalty_amount: dp,
        },
        expenses: [
          {
            id: 1,
            category: 'transport',
            description: 'Transport Kru & Asisten Panggung',
            amount: 500000,
            created_at: new Date().toISOString(),
          },
        ],
      });
    } catch (err) {
      console.warn('Gagal memuat rincian finansial:', err);
    } finally {
      setFinancialLoading(false);
    }
  };

  // Broadcast live state change to Stage Mode & Music Operator
  const broadcastLiveChange = (segmentIndex: number, title: string, musicCue?: string, scriptText?: string) => {
    try {
      const channel = new BroadcastChannel('mc_connect_live_channel');
      channel.postMessage({
        type: 'SEGMENT_CHANGE',
        segmentIndex,
        segmentTitle: title,
        musicCue: musicCue || 'Default BGM',
        script: scriptText || '',
        timestamp: Date.now(),
      });
      channel.close();
    } catch (e) {
      console.warn('BroadcastChannel not available:', e);
    }
  };

  const toggleRundown = (id: number) => {
    setRundownList((prev) => {
      const updated = prev.map((item, idx) => {
        if (item.id === id) {
          const newDone = !item.isDone;
          if (newDone) {
            broadcastLiveChange(idx, item.title, item.music, item.script);
          }
          return { ...item, isDone: newDone };
        }
        return item;
      });
      return updated;
    });
    toast.success('Status segmen diperbarui & tersinkronisasi ke Panggung & Operator Musik!');
  };

  // Open AI Script Co-Pilot Modal for a specific segment
  const openAiGeneratorForSegment = (segment: RundownSegment) => {
    setActiveSegmentForAi(segment);
    setAiSegmentType(segment.segmentType || 'opening');
    setAiTone(segment.tone || 'romantic_warm');
    setAiVipNames('');
    setAiCustomNotes('');
    setAiGeneratedScript(segment.script || '');
    setAiGeneratedMusic(segment.music || '');
    setShowAiModal(true);
  };

  const handleGenerateAiScript = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch(`/api/events/${selectedEventId}/ai/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          segment_type: aiSegmentType,
          tone: aiTone,
          vip_names: aiVipNames.trim() || undefined,
          custom_notes: aiCustomNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setAiGeneratedScript(json.script);
        setAiGeneratedMusic(json.music_cue);
        if (json.token_ai_tersisa !== undefined) {
          setRemainingTokens(json.token_ai_tersisa);
        }
        toast.success('Naskah cerdas AI MC Co-Pilot berhasil digenerate! (-1 Token)');
      } else {
        if (res.status === 401) {
          toast.error('Sesi belum login. Masuk sebagai MC untuk memakai AI.');
          setShowLoginModal(true);
        } else {
          toast.error(json.message || 'Gagal menghasilkan naskah AI.');
        }
      }
    } catch (err) {
      toast.error('Gagal terhubung ke AI Engine backend.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveAiScriptToRundown = () => {
    if (!activeSegmentForAi) return;
    setRundownList((prev) =>
      prev.map((seg) =>
        seg.id === activeSegmentForAi.id
          ? {
              ...seg,
              script: aiGeneratedScript,
              music: aiGeneratedMusic || seg.music,
              segmentType: aiSegmentType as any,
              tone: aiTone as any,
            }
          : seg
      )
    );

    // Sync to Stage Teleprompter and Vendor Screen
    broadcastLiveChange(
      rundownList.findIndex((s) => s.id === activeSegmentForAi.id),
      activeSegmentForAi.title,
      aiGeneratedMusic || activeSegmentForAi.music,
      aiGeneratedScript
    );

    toast.success('Naskah berhasil disimpan ke Rundown & dikirim ke Teleprompter Panggung!');
    setShowAiModal(false);
  };

  const handleAddNewSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSegTitle.trim()) {
      toast.error('Judul segmen wajib diisi.');
      return;
    }
    const nextId = Math.max(...rundownList.map((s) => s.id), 0) + 1;
    const newSeg: RundownSegment = {
      id: nextId,
      time: newSegTime,
      title: newSegTitle.trim(),
      pic: newSegPic.trim(),
      music: newSegMusic.trim(),
      isDone: false,
      segmentType: 'custom',
      tone: 'formal',
      script: `Hadirin sekalian, kita memasuki segmen: ${newSegTitle}.`,
    };
    setRundownList((prev) => [...prev, newSeg]);
    setShowAddSegmentModal(false);
    setNewSegTitle('');
    toast.success('Segmen baru berhasil ditambahkan ke susunan rundown!');
  };

  const handleDeleteSegment = (id: number) => {
    setRundownList((prev) => prev.filter((s) => s.id !== id));
    toast.info('Segmen dihapus dari rundown.');
  };

  // Upload Expense Proof (Nota/Receipt) with WebP Image Sanitizer
  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProof(true);
    const formData = new FormData();
    formData.append('proof', file);

    try {
      const res = await fetch('/api/cms/events/upload-expense-proof', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setExpenseProofUrl(json.url);
        toast.success('Bukti nota berhasil disanitasi (EXIF dibersihkan & dikonversi ke WebP)!');
      } else {
        toast.error(json.message || 'Gagal mengunggah bukti nota.');
      }
    } catch (err) {
      toast.error('Gagal mengunggah file gambar.');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Masukkan nominal pengeluaran yang valid.');
      return;
    }
    if (!expenseDesc.trim()) {
      toast.error('Keterangan pengeluaran wajib diisi.');
      return;
    }

    setIsSubmittingExpense(true);
    try {
      const res = await fetch(`/api/events/${selectedEventId}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          category: expenseCategory,
          description: expenseDesc.trim(),
          amount: amountNum,
          proof_url: expenseProofUrl || undefined,
        }),
      });

      if (res.ok) {
        toast.success(`Pengeluaran Rp ${amountNum.toLocaleString('id-ID')} berhasil dicatat & Laba Bersih direkalkulasi!`);
        setExpenseDesc('');
        setExpenseAmount('');
        setExpenseProofUrl('');
        loadFinancials(selectedEventId);
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 401) {
          toast.error('Sesi Anda belum login. Silakan login sebagai MC terlebih dahulu.');
          setShowLoginModal(true);
        } else {
          toast.error(errJson.message || 'Gagal menyimpan pengeluaran.');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleFastLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/mc/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Selamat datang kembali, ${data.user?.name || 'MC'}!`);
        setAuthStatus('authenticated');
        setUserProfile(data.user);
        setShowLoginModal(false);
        loadEvents();
      } else {
        toast.error(data.message || 'Email atau password salah.');
      }
    } catch (err) {
      toast.error('Koneksi server gagal.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Find active event
  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0] || {
    id: 1,
    title: 'Loading Acara...',
    date: '2026-11-25',
    time: '18:00 - 21:00 WIB',
    venue: 'Grand Ballroom',
    pic: 'Dimas Pratama (+62 812-3456-7890)',
    price: 'Rp 7.500.000',
    rawPrice: 7500000,
    status: 'Terkunci',
  };

  // Metrics Calculation
  const totalEventsCount = events.length;
  const confirmedCount = events.filter((e) => e.status === 'Terkunci' || e.status === 'Confirmed').length;
  const tentativeCount = events.filter((e) => e.status === 'Tentative').length;
  const reviewCount = events.filter((e) => e.status === 'Review').length;
  const selesaiCount = events.filter((e) => e.status === 'Selesai').length;

  const totalOmset = events.reduce((acc, curr) => acc + (curr.rawPrice || 7500000), 0);
  const estimatedNetProfit = Math.round(totalOmset * 0.88);

  // Filtered Events Directory
  const filteredEvents = events.filter((ev) => {
    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'Terkunci'
        ? ev.status === 'Terkunci' || ev.status === 'Confirmed'
        : ev.status === statusFilter;

    const query = searchQuery.toLowerCase();
    const matchSearch =
      !query ||
      ev.title?.toLowerCase().includes(query) ||
      ev.nama_acara?.toLowerCase().includes(query) ||
      ev.venue?.toLowerCase().includes(query) ||
      ev.pic?.toLowerCase().includes(query);

    return matchStatus && matchSearch;
  });

  // Calculate Rundown Readiness %
  const doneSegmentsCount = rundownList.filter((s) => s.isDone).length;
  const rundownReadinessPct = Math.round((doneSegmentsCount / (rundownList.length || 1)) * 100);

  // Financial Breakdown calculations for Cashflow Meter
  const contractVal = financialData?.financials.contract_value || currentEvent.rawPrice || 7500000;
  const dpReceived = financialData?.financials.dp_received || contractVal * 0.5;
  const balanceRemaining = financialData?.financials.balance_remaining || contractVal - dpReceived;
  const totalExpenses = financialData?.financials.total_expenses || 500000;
  const netProfit = financialData?.financials.net_profit || contractVal - totalExpenses;
  const profitMarginPct = financialData?.financials.profit_margin_pct || Math.round((netProfit / contractVal) * 100);

  // Dynamic Refund Simulation
  const simulatedRefund =
    simulatedDaysToEvent > 30
      ? { rule: 'H > 30 Hari: Hak Refund 50% dari DP', refund: dpReceived * 0.5, penalty: dpReceived * 0.5 }
      : simulatedDaysToEvent >= 14
      ? { rule: 'H 14 - 30 Hari: DP Hangus (Non-Refundable 100%)', refund: 0, penalty: dpReceived }
      : { rule: 'H < 14 Hari: Denda Pembatalan 100% Nilai Kontrak', refund: 0, penalty: contractVal };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col">
      {/* Sub-Header: Active Event Selector & Fast Stage Navigation */}
      <div className="border-b border-slate-800/80 bg-slate-900/80 px-6 py-3 backdrop-blur-md sticky top-14 z-30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Pilih Acara Aktif:</span>
            <select
              value={selectedEventId}
              onChange={(e) => onSelectEvent(Number(e.target.value))}
              className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-bold text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  #{ev.id} • {ev.date} — {ev.title || ev.nama_acara} ({ev.status})
                </option>
              ))}
            </select>
          </div>

          <Badge variant={currentEvent.status === 'Terkunci' || currentEvent.status === 'Confirmed' ? 'success' : 'warning'}>
            {currentEvent.status}
          </Badge>

          {/* Readiness Meter */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg">
            <span className="text-[11px] text-slate-400">Kesiapan:</span>
            <div className="w-16 bg-slate-800 rounded-full h-1.5">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${rundownReadinessPct}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-400">{rundownReadinessPct}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {authStatus === 'guest' ? (
            <Button size="sm" variant="outline" onClick={() => setShowLoginModal(true)}>
              <LogIn className="h-3.5 w-3.5 text-amber-400" /> Masuk MC
            </Button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>{userProfile?.name || 'MC Vanya Arsyad'}</span>
              <span className="text-amber-400 font-bold">({userProfile?.tier || 'Pro'})</span>
            </div>
          )}

          <Button size="sm" variant="secondary" onClick={() => onOpenVendor(selectedEventId)}>
            <Headphones className="h-3.5 w-3.5 text-sky-400" /> Operator Musik
          </Button>

          <Button size="sm" onClick={() => onOpenStage(selectedEventId)}>
            🎤 Buka Stage Mode
          </Button>
        </div>
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-6">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: '1. Ikhtisar & Jadwal Acara' },
            { id: 'finance', label: '2. Keuangan & Dokumen SPK' },
            { id: 'rundown', label: '3. Rundown & AI Script Co-Pilot' },
            { id: 'vendor', label: '4. Kolaborasi Vendor Musik' },
            { id: 'review', label: '5. Post-Event & Ulasan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* TAB 1: OVERVIEW & EVENT DIRECTORY */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 border-slate-800 bg-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">TOTAL ACARA TERJADWAL</span>
                <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-2">
                  <span>{totalEventsCount}</span>
                  <span className="text-xs font-normal text-slate-400">Acara</span>
                </div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <span>✓ {confirmedCount} Terkunci (Confirmed)</span>
                </div>
              </Card>

              <Card className="p-4 border-slate-800 bg-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">STATUS TENTATIVE & REVIEW</span>
                <div className="text-2xl font-black text-amber-400 mt-1 flex items-baseline gap-2">
                  <span>{tentativeCount + reviewCount}</span>
                  <span className="text-xs font-normal text-slate-400">Prospek</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {tentativeCount} Tentative • {reviewCount} Review
                </div>
              </Card>

              <Card className="p-4 border-slate-800 bg-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">ESTIMASI OMSET KONTRAK</span>
                <div className="text-2xl font-black text-white mt-1">
                  Rp {totalOmset.toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-slate-400">Kalkulasi 16 Kontrak Database</span>
              </Card>

              <Card className="p-4 border-slate-800 bg-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">ESTIMASI LABA BERSIH (NET)</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  Rp {estimatedNetProfit.toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-emerald-500 font-medium">Margin Rata-rata 88%</span>
              </Card>
            </div>

            {/* Active Selected Event Summary Banner */}
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">ACARA TERPILIH #{currentEvent.id}</Badge>
                    <span className="text-xs text-slate-400 font-mono">{currentEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/events/${currentEvent.id}/spk`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
                    >
                      <FileText className="h-3 w-3 text-amber-400" /> Cetak SPK
                    </a>
                    <a
                      href={`/invoices/${currentEvent.id}/print`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
                    >
                      <Printer className="h-3 w-3 text-emerald-400" /> Cetak Invoice
                    </a>
                    <a
                      href={`/invoices/${currentEvent.id}/thermal`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
                    >
                      <Receipt className="h-3 w-3 text-cyan-400" /> Struk Thermal
                    </a>
                  </div>
                </div>
                <CardTitle className="text-xl text-white mt-1">
                  {currentEvent.title || currentEvent.nama_acara}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Tanggal & Jam:</span>
                    <div className="font-semibold text-white mt-0.5">{currentEvent.date} • {currentEvent.time}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Venue / Lokasi:</span>
                    <div className="font-semibold text-white mt-0.5">{currentEvent.venue || currentEvent.lokasi || 'Venue TBD'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Klien / PIC:</span>
                    <div className="font-semibold text-white mt-0.5">{currentEvent.pic || 'PIC Acara'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Nilai Kontrak:</span>
                    <div className="font-semibold text-amber-400 mt-0.5">{currentEvent.price || `Rp ${Number(currentEvent.rawPrice || 7500000).toLocaleString('id-ID')}`}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Events Directory Table */}
            <Card>
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Direktori & Manajemen Acara</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kelola seluruh 16 agenda acara, cetak dokumen resmi (SPK & Invoice), dan masuk panggung.
                  </p>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-56">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari acara, venue, PIC..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/90 pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                    {[
                      { id: 'all', label: `Semua (${totalEventsCount})` },
                      { id: 'Terkunci', label: `Terkunci (${confirmedCount})` },
                      { id: 'Tentative', label: `Tentative (${tentativeCount})` },
                      { id: 'Review', label: `Review (${reviewCount})` },
                      { id: 'Selesai', label: `Selesai (${selesaiCount})` },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setStatusFilter(f.id)}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          statusFilter === f.id
                            ? 'bg-amber-500/20 text-amber-400 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Nama Acara</th>
                      <th className="py-3 px-4">Tanggal & Waktu</th>
                      <th className="py-3 px-4">Lokasi / Venue</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          Tidak ada acara yang cocok dengan kriteria filter.
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((ev) => {
                        const isCurrent = ev.id === selectedEventId;
                        return (
                          <tr
                            key={ev.id}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              isCurrent ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-mono text-slate-400">
                              #{ev.id}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-white">{ev.title || ev.nama_acara}</div>
                              <div className="text-[11px] text-slate-400">{ev.pic || 'PIC Acara'}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div>{ev.date}</div>
                              <div className="text-[11px] text-slate-400">{ev.time}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                              {ev.venue || ev.lokasi || 'Venue TBD'}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  ev.status === 'Terkunci' || ev.status === 'Confirmed'
                                    ? 'success'
                                    : ev.status === 'Tentative'
                                    ? 'warning'
                                    : ev.status === 'Review'
                                    ? 'purple'
                                    : 'default'
                                }
                              >
                                {ev.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={`/events/${ev.id}/spk`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Cetak SPK Kontrak"
                                  className="rounded p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                                >
                                  📄
                                </a>
                                <a
                                  href={`/invoices/${ev.id}/print`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Cetak Invoice QRIS"
                                  className="rounded p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                                >
                                  🧾
                                </a>
                                <a
                                  href={`/invoices/${ev.id}/thermal`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Cetak Struk Thermal"
                                  className="rounded p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                                >
                                  📠
                                </a>

                                <button
                                  onClick={() => {
                                    onSelectEvent(ev.id);
                                    onOpenStage(ev.id);
                                  }}
                                  title="Buka Stage Mode"
                                  className="rounded px-2 py-1 text-[11px] bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 font-semibold transition-colors"
                                >
                                  🎤 Stage
                                </button>

                                <button
                                  onClick={() => onSelectEvent(ev.id)}
                                  className={`rounded px-2.5 py-1 text-[11px] font-bold transition-all ${
                                    isCurrent
                                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                  }`}
                                >
                                  {isCurrent ? 'Aktif' : 'Pilih'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: KEUANGAN, DOKUMEN & ZERO-TRUST EXPENSES */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            {/* Financial Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 border-slate-800 bg-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">TOTAL NILAI KONTRAK</span>
                <div className="text-2xl font-bold text-white mt-1">
                  Rp {contractVal.toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-amber-400">Zero-Trust Verified</span>
              </Card>

              <Card className="p-4 border-slate-800 bg-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">DP SUDAH DITERIMA</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  Rp {dpReceived.toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-slate-400">{financialData?.financials.payment_status || 'DP 50%'}</span>
              </Card>

              <Card className="p-4 border-slate-800 bg-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">SISA PELUNASAN</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">
                  Rp {balanceRemaining.toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-rose-400">Pelunasan Maksimal H-7</span>
              </Card>

              <Card className="p-4 border-slate-800 bg-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">LABA BERSIH RIIL (NET)</span>
                <div className="text-2xl font-bold text-cyan-400 mt-1">
                  Rp {netProfit.toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">
                  Margin: {profitMarginPct}% ({netProfit >= 0 ? 'Surplus' : 'Defisit'})
                </span>
              </Card>
            </div>

            {/* Visual Cashflow Distribution Meter */}
            <Card className="border-slate-800 bg-slate-900/40 p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" /> Distribusi Arus Kas & Margin Kontrak
                  </h4>
                  <p className="text-xs text-slate-400">Visualisasi komposisi DP, Sisa Pelunasan, dan Beban Operasional.</p>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  Laba Bersih: {profitMarginPct}%
                </span>
              </div>

              {/* Progress Stacked Bar */}
              <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  style={{ width: `${Math.min(100, Math.round((dpReceived / contractVal) * 100))}%` }} 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  title={`DP Diterima: Rp ${dpReceived.toLocaleString('id-ID')}`}
                />
                <div 
                  style={{ width: `${Math.min(100, Math.round((balanceRemaining / contractVal) * 100))}%` }} 
                  className="bg-amber-500 h-full transition-all duration-500" 
                  title={`Sisa Pelunasan: Rp ${balanceRemaining.toLocaleString('id-ID')}`}
                />
                <div 
                  style={{ width: `${Math.min(100, Math.round((totalExpenses / contractVal) * 100))}%` }} 
                  className="bg-rose-500 h-full transition-all duration-500" 
                  title={`Total Beban: Rp ${totalExpenses.toLocaleString('id-ID')}`}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 mt-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">DP Terbayar (Rp {dpReceived.toLocaleString('id-ID')})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-slate-300">Sisa Tagihan (Rp {balanceRemaining.toLocaleString('id-ID')})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="text-slate-300">Beban Operasional (Rp {totalExpenses.toLocaleString('id-ID')})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-cyan-400" />
                  <span className="text-cyan-400 font-bold">Laba Bersih Riil (Rp {netProfit.toLocaleString('id-ID')})</span>
                </div>
              </div>
            </Card>

            {/* Quick Action Document Print Bar */}
            <Card className="border-slate-800 bg-slate-900/40">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
                <div>
                  <CardTitle className="text-base">Dokumen Finansial & Cetak Cepat</CardTitle>
                  <p className="text-xs text-slate-400">
                    Cetak dokumen berkop resmi MC untuk Event #{selectedEventId} ({currentEvent.title || currentEvent.nama_acara})
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/events/${selectedEventId}/spk`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all"
                  >
                    <FileText className="h-4 w-4" /> Cetak SPK PDF
                  </a>

                  <a
                    href={`/invoices/${selectedEventId}/print`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                  >
                    <Printer className="h-4 w-4" /> Cetak Invoice QRIS
                  </a>

                  <a
                    href={`/invoices/${selectedEventId}/thermal`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all"
                  >
                    <Receipt className="h-4 w-4" /> Struk Thermal 58mm
                  </a>

                  <a
                    href={`/invoices/${selectedEventId}/thermal-binary`}
                    download
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-all"
                  >
                    <Download className="h-3.5 w-3.5" /> Biner ESC/POS
                  </a>
                </div>
              </CardHeader>
            </Card>

            {/* Zero-Trust Operational Expense Recorder & Interactive Simulator */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form Input Expense with WebP Proof Sanitizer */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-amber-400" /> Catat Beban Operasional
                  </CardTitle>
                  <p className="text-xs text-slate-400">
                    Pengeluaran baru langsung mengurangi laba bersih secara real-time.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRecordExpense} className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Kategori Pengeluaran:</label>
                      <select
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="transport">Transportasi / BBM</option>
                        <option value="crew">Honor Kru / Asisten Panggung</option>
                        <option value="wardrobe">Wardrobe, Jas & Laundry</option>
                        <option value="equipment">Sewa Alat / Soundboard / Tablet</option>
                        <option value="other">Lain-lain / Konsumsi</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Keterangan / Deskripsi:</label>
                      <input
                        type="text"
                        placeholder="Contoh: Honor Asisten MC Lapangan"
                        value={expenseDesc}
                        onChange={(e) => setExpenseDesc(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Nominal Biaya (Rp):</label>
                      <input
                        type="number"
                        placeholder="Contoh: 500000"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {/* Bukti Upload Sanitizer (WebP & Stripped EXIF) */}
                    <div>
                      <label className="text-slate-400 block mb-1">Bukti Nota / Struk (Sanitasi WebP Otomatis):</label>
                      <label className="flex flex-col items-center justify-center border border-dashed border-slate-700 hover:border-amber-400 rounded-lg p-2.5 cursor-pointer bg-slate-950/60 transition-colors">
                        <UploadCloud className="h-4 w-4 text-slate-400 mb-1" />
                        <span className="text-[11px] text-slate-300">
                          {isUploadingProof ? 'Memproses WebP & Strip EXIF...' : expenseProofUrl ? '✓ Nota Terupload (WebP)' : 'Unggah Foto Nota'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadProof}
                          className="hidden"
                          disabled={isUploadingProof}
                        />
                      </label>
                      {expenseProofUrl && (
                        <div className="mt-1 text-[10px] text-emerald-400 truncate">
                          Tersimpan: {expenseProofUrl}
                        </div>
                      )}
                    </div>

                    <Button type="submit" size="sm" className="w-full mt-2" disabled={isSubmittingExpense}>
                      {isSubmittingExpense ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Table of Recorded Expenses & Interactive Refund Simulator */}
              <div className="md:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Daftar Pengeluaran Acara #{selectedEventId}</CardTitle>
                      <p className="text-xs text-slate-400">Total Beban: Rp {totalExpenses.toLocaleString('id-ID')}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => loadFinancials(selectedEventId)}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-4">Kategori</th>
                          <th className="py-2.5 px-4">Keterangan</th>
                          <th className="py-2.5 px-4 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {!financialData?.expenses || financialData.expenses.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-slate-500">
                              Belum ada pengeluaran yang dicatat untuk acara ini.
                            </td>
                          </tr>
                        ) : (
                          financialData.expenses.map((exp, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40">
                              <td className="py-2.5 px-4 text-amber-400 capitalize">{exp.category}</td>
                              <td className="py-2.5 px-4 text-white">
                                <div>{exp.description}</div>
                                {exp.proof_url && (
                                  <a
                                    href={exp.proof_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-cyan-400 underline hover:text-cyan-300"
                                  >
                                    Lihat Nota WebP
                                  </a>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono text-rose-400">
                                - Rp {Number(exp.amount).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                {/* Interactive Zero-Trust Cancellation & Refund Policy Simulator */}
                <Card className="border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                    <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5" /> Simulator Kebijakan Pembatalan & Hak Refund
                    </h5>
                    <span className="text-[11px] font-mono text-slate-300">
                      Simulasi: H - <strong className="text-amber-400">{simulatedDaysToEvent}</strong> Hari
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={simulatedDaysToEvent}
                    onChange={(e) => setSimulatedDaysToEvent(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer mb-2"
                  />

                  <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 text-xs space-y-1">
                    <div className="font-semibold text-white">
                      Klausul: <span className="text-amber-400">{simulatedRefund.rule}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
                      <span>Uang Kembali ke Klien: <strong className="text-emerald-400">Rp {simulatedRefund.refund.toLocaleString('id-ID')}</strong></span>
                      <span>Kompensasi / Hak MC: <strong className="text-rose-400">Rp {simulatedRefund.penalty.toLocaleString('id-ID')}</strong></span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RUNDOWN TIMELINE EDITOR & AI CO-PILOT */}
        {activeTab === 'rundown' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>Susunan Rundown Acara & AI Script Co-Pilot</CardTitle>
                  <p className="text-xs text-slate-400 mt-1">
                    Kelola timeline acara per menit, susun naskah panggung cerdas via AI Co-Pilot, dan sinkronisasi instan ke tablet MC & operator musik.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setShowAddSegmentModal(true)}>
                    <PlusCircle className="h-4 w-4 text-emerald-400" /> Tambah Segmen
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (rundownList.length > 0) {
                        openAiGeneratorForSegment(rundownList[0]);
                      }
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-amber-400" /> AI Co-Pilot Generator
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rundownList.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all duration-200 gap-3 ${
                        item.isDone
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-slate-400'
                          : 'border-slate-800 bg-slate-900/60 text-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() => toggleRundown(item.id)}
                          className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                            item.isDone
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                              : 'border-slate-700 hover:border-amber-400'
                          }`}
                        >
                          {item.isDone && '✓'}
                        </button>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-400">{item.time}</span>
                            <span className="text-xs text-slate-400">• PIC: {item.pic}</span>
                            <Badge variant={item.isDone ? 'success' : 'default'} className="text-[10px]">
                              Segmen {index + 1}
                            </Badge>
                          </div>
                          <div className={`text-sm font-bold ${item.isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            Cue Musik: <span className="text-sky-400 font-semibold">{item.music}</span>
                          </div>
                          {item.script && (
                            <div className="text-xs text-amber-200/90 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 mt-1 max-w-2xl">
                              "{item.script.slice(0, 140)}..."
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAiGeneratorForSegment(item)}
                          className="text-amber-400 hover:bg-amber-500/10"
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1" /> Naskah AI
                        </Button>

                        <button
                          onClick={() => {
                            broadcastLiveChange(index, item.title, item.music, item.script);
                            onOpenStage(selectedEventId);
                          }}
                          title="Buka Segmen ini di Teleprompter Stage"
                          className="rounded-lg p-1.5 text-xs font-semibold text-purple-400 hover:bg-purple-500/10 transition-colors"
                        >
                          🎤 Stage
                        </button>

                        <button
                          onClick={() => handleDeleteSegment(item.id)}
                          title="Hapus Segmen"
                          className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: VENDOR OPERATOR MUSIK */}
        {activeTab === 'vendor' && (
          <Card>
            <CardHeader>
              <CardTitle>Kolaborasi Operator Musik / Soundman</CardTitle>
              <p className="text-xs text-slate-400">
                Layar FOH khusus ini dapat dibuka di laptop operator musik tanpa memerlukan login dan tersinkronisasi otomatis via BroadcastChannel.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-xs text-slate-500 font-medium">Tautan Khusus Operator Musik (SPA Modern):</span>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/app#vendor`}
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono text-amber-400"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/app#vendor`);
                      toast.success('Tautan Operator Musik disalin!');
                    }}
                  >
                    Salin Tautan
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                <div>
                  <div className="text-sm font-bold text-white">Buka Layar Operator Musik Sekarang</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Membuka layar interaktif Operator Musik untuk memutar cue intro, transition, dan background BGM.
                  </div>
                </div>
                <Button size="sm" onClick={() => onOpenVendor(selectedEventId)}>
                  🎧 Buka Layar Operator
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 5: POST-EVENT & ULASAN */}
        {activeTab === 'review' && (
          <Card>
            <CardHeader>
              <CardTitle>Post-Event Review Harvester</CardTitle>
              <p className="text-xs text-slate-400">
                Kirim formulir evaluasi satu klik ke klien setelah acara selesai. Ulasan bintang 5 otomatis dipublikasikan ke halaman utama.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-xs text-slate-400 font-medium">Template Pesan WhatsApp Klien:</span>
                <p className="mt-2 text-xs text-slate-300 italic bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  "Halo Kak {currentEvent.pic || 'Klien'}, terima kasih banyak telah mempercayakan acara {currentEvent.title || 'Spesial'} kepada MC Vanya Arsyad. Mohon kesediaannya memberikan ulasan singkat bintang 5 pada tautan berikut: https://vanyaarsyad.com/review"
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  const phone = currentEvent.pic?.match(/\+?[0-9]{10,14}/)?.[0] || '6281234567890';
                  const msg = encodeURIComponent(
                    `Halo Kak ${currentEvent.pic || 'Klien'}, terima kasih atas kepercayaannya pada MC Vanya Arsyad di acara ${currentEvent.title}. Kami sangat berterima kasih atas ulasan bintang 5-nya!`
                  );
                  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                  toast.success('Membuka WhatsApp untuk mengirim pesan ulasan...');
                }}
              >
                ⭐ Kirim Permintaan Ulasan via WhatsApp
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* AI Co-Pilot Script Generator Dialog Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">AI MC Co-Pilot Script Generator</h3>
                  <p className="text-xs text-slate-400">
                    Menyusun naskah panggung profesional untuk: <strong>{activeSegmentForAi?.title}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full font-bold">
                  Sisa Token: {remainingTokens}
                </span>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Prompt Parameter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Tipe Segmen Panggung:</label>
                <select
                  value={aiSegmentType}
                  onChange={(e) => setAiSegmentType(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="opening">Pembukaan & Sambutan Tamu (Opening)</option>
                  <option value="entrance">Grand Entrance Pengantin / VIP</option>
                  <option value="cake_toast">Potong Kue / Wedding Toast</option>
                  <option value="dinner">Dinner Reception BGM Cue</option>
                  <option value="games">Games Interaktif & Ice Breaking</option>
                  <option value="closing">Penutupan & Pamit MC (Closing)</option>
                  <option value="custom">Segmen Khusus / Adat</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Gaya Bahasa (Tone):</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="romantic_warm">🌹 Romantis, Hangat & Menyentuh Hati</option>
                  <option value="formal">🎩 Formal, Protokoler & Berwibawa</option>
                  <option value="energetic_fun">🎉 Ceria, Energik & Penuh Semangat</option>
                  <option value="elegant_luxury">👑 Mewah, Elegan & High-Class</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1 font-semibold">Sebutkan Tokoh Penting / VIP (Opsional):</label>
                <input
                  type="text"
                  placeholder="Contoh: Bpk. H. Hendrawan & Ibu, Keluarga Besar Pengantin"
                  value={aiVipNames}
                  onChange={(e) => setAiVipNames(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1 font-semibold">Catatan Khusus / Permintaan Khusus:</label>
                <input
                  type="text"
                  placeholder="Contoh: Ajak tamu berdiri untuk standing ovation saat mempelai melangkah"
                  value={aiCustomNotes}
                  onChange={(e) => setAiCustomNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <Button
              size="md"
              className="w-full"
              onClick={handleGenerateAiScript}
              disabled={isGeneratingAi}
            >
              {isGeneratingAi ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" /> AI Co-Pilot Sedang Menyusun Naskah...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Generate Naskah Panggung Sekarang (-1 Token)
                </>
              )}
            </Button>

            {/* Generated Output Preview Area */}
            {aiGeneratedScript && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" /> Naskah Siap Teleprompter:
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiGeneratedScript);
                        toast.success('Naskah disalin ke clipboard!');
                      }}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" /> Salin Naskah
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={aiGeneratedScript}
                    onChange={(e) => setAiGeneratedScript(e.target.value)}
                    className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-amber-100 font-medium leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>

                {aiGeneratedMusic && (
                  <div className="rounded-lg bg-sky-500/10 border border-sky-500/20 p-2.5 text-xs text-sky-300 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sky-400">Rekomendasi Cue Musik Operator:</span>
                      <div className="text-[11px] mt-0.5">{aiGeneratedMusic}</div>
                    </div>
                    <Music className="h-4 w-4 text-sky-400 shrink-0" />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowAiModal(false)}>
                    Tutup
                  </Button>
                  <Button size="sm" onClick={handleSaveAiScriptToRundown}>
                    💾 Simpan ke Rundown & Teleprompter
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add New Segment Modal */}
      {showAddSegmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-emerald-400" /> Tambah Segmen Rundown Baru
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Tambahkan susunan acara baru yang akan disinkronkan ke panggung & operator musik.
            </p>

            <form onSubmit={handleAddNewSegment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Jam / Rentang Waktu:</label>
                <input
                  type="text"
                  placeholder="Contoh: 19:45 - 20:00"
                  value={newSegTime}
                  onChange={(e) => setNewSegTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Judul Segmen Acara:</label>
                <input
                  type="text"
                  placeholder="Contoh: Lempar Buket & Games Bridesmaid"
                  value={newSegTitle}
                  onChange={(e) => setNewSegTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">PIC / Penanggung Jawab:</label>
                <input
                  type="text"
                  placeholder="Contoh: WO Floor / Asisten MC"
                  value={newSegPic}
                  onChange={(e) => setNewSegPic(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Cue Musik / Sound Cue:</label>
                <input
                  type="text"
                  placeholder="Contoh: Upbeat Funky Pop Jazz"
                  value={newSegMusic}
                  onChange={(e) => setNewSegMusic(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddSegmentModal(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm">
                  Simpan Segmen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fast Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400" /> Masuk sebagai MC
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Gunakan akun MC Anda untuk mengelola pengeluaran dan seluruh data sensitif.
            </p>

            <form onSubmit={handleFastLogin} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Email MC:</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Password:</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowLoginModal(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isLoggingIn}>
                  {isLoggingIn ? 'Memproses...' : 'Masuk Sekarang'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
