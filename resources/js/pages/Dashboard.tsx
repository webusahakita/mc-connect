import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  DollarSign, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  Music, 
  Star, 
  ShieldCheck, 
  Sparkles, 
  Printer, 
  FileText, 
  Receipt, 
  Headphones, 
  Search, 
  Filter, 
  Clock, 
  PlusCircle, 
  Trash2, 
  Copy, 
  UploadCloud, 
  Check, 
  X, 
  ChevronDown, 
  ExternalLink, 
  Phone, 
  MapPin, 
  User, 
  Mic,
  Eye,
  Zap,
  TrendingUp,
  Sliders,
  Play,
  Square
} from 'lucide-react';
import { toast } from 'sonner';
import { useSoundboard } from '../hooks/useSoundboard';

export type AdminSection = 
  | 'dashboard' 
  | 'calendar' 
  | 'customers' 
  | 'cashflow' 
  | 'settings' 
  | 'landing-settings'
  | 'web-settings'
  | 'command-center' 
  | 'wardrobe' 
  | 'musicbank' 
  | 'guide';

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
  clientCategory?: 'VIP' | 'CORPORATE' | 'REGULAR';
  checklist?: any[];
  expenses?: any[];
  rundown?: any[];
}

export interface CustomerItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  category: string;
  clientCategory: 'VIP' | 'CORPORATE' | 'REGULAR';
  eventName: string;
  eventDate: string;
  eventTime: string;
  contractValue: number;
  paymentStatus: 'DP DIBAYAR' | 'LUNAS 100%' | 'DP 50%' | 'MENUNGGU DP' | 'REVIEW';
  calendarStatus: 'TERKUNCI' | 'TENTATIVE' | 'REVIEW';
  notes?: string;
  eventId: number;
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
  onLogout,
  onUnauthorized,
}: {
  selectedEventId: number;
  onSelectEvent: (id: number) => void;
  onOpenStage: (id?: number) => void;
  onOpenVendor: (id?: number) => void;
  onBackToHome: () => void;
  onLogout?: () => void;
  onUnauthorized?: () => void;
}) {
  // Navigation State
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [liveTime, setLiveTime] = useState<string>('09:00:00');

  // Soundboard DSP Hook
  const { playFanfare, playDrumRoll, playChime, playBuzzer, playApplause } = useSoundboard();

  // Command Center Sub-Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'rundown' | 'vendor' | 'review' | 'crm' | 'stage' | 'music'>('crm');
  const [guideTab, setGuideTab] = useState<'workflow' | 'features' | 'saas' | 'actions'>('workflow');
  const [musicBankSearch, setMusicBankSearch] = useState<string>('');
  const [musicBankCategory, setMusicBankCategory] = useState<string>('all');
  
  // Data State
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mcName, setMcName] = useState<string>('Arkanza Radja Maulana');

  // CRM / Data Pelanggan State
  const [custSearch, setCustSearch] = useState<string>('');
  const [custCategoryFilter, setCustCategoryFilter] = useState<string>('all');
  const [custClientCategoryFilter, setCustClientCategoryFilter] = useState<string>('all');
  const [custPaymentFilter, setCustPaymentFilter] = useState<string>('all');
  const [custCalendarFilter, setCustCalendarFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);

  // Financials State
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [financialLoading, setFinancialLoading] = useState<boolean>(false);
  const [expenseCategory, setExpenseCategory] = useState<string>('transport');
  const [expenseDesc, setExpenseDesc] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState<boolean>(false);

  // Wardrobe State (Real Database Sync)
  const [wardrobeList, setWardrobeList] = useState<any[]>([]);
  const [wardrobeLoading, setWardrobeLoading] = useState<boolean>(false);
  const [showAddWardrobeModal, setShowAddWardrobeModal] = useState<boolean>(false);
  const [newWardrobeName, setNewWardrobeName] = useState<string>('');
  const [newWardrobeColor, setNewWardrobeColor] = useState<string>('#D4AF37');
  const [newWardrobeCategory, setNewWardrobeCategory] = useState<string>('Formal');
  const [newWardrobeDesc, setNewWardrobeDesc] = useState<string>('');
  const [isSavingWardrobe, setIsSavingWardrobe] = useState<boolean>(false);

  // CMS Settings State (Real Database Sync)
  const [mcSpec, setMcSpec] = useState<string>('Luxury Wedding, Corporate Gala & Hybrid Festival Master Host');
  const [mcPhone, setMcPhone] = useState<string>('081234567890');
  const [mcBio, setMcBio] = useState<string>('Master of Ceremony profesional berbasis di Jakarta & Surabaya dengan jam terbang lebih dari 8 tahun membawakan 500+ pernikahan mewah, gala dinner korporat, dan awarding night kenegaraan. Pembawaan elegan, bilingual (ID/EN), adaptif, dan berkarisma.');
  const [mcIg, setMcIg] = useState<string>('@vanyaarsyad.mc');
  const [mcStatEvents, setMcStatEvents] = useState<string>('500+ Acara Sukses');
  const [mcStatYears, setMcStatYears] = useState<string>('8+ Tahun Pengalaman');
  const [mcPhotoUrl, setMcPhotoUrl] = useState<string>('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80');
  const [mcTiktok, setMcTiktok] = useState<string>('@vanyastage_official');
  const [mcFacebook, setMcFacebook] = useState<string>('Vanya Arsyad MC Official');
  const [mcShowreel, setMcShowreel] = useState<string>('https://www.youtube.com/watch?v=demo');
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  // CMS & Web Settings Navigation & Data State (100% Parity)
  const [showSettingsDropdown, setShowSettingsDropdown] = useState<boolean>(false);
  const [cmsSubTab, setCmsSubTab] = useState<'cms-bio' | 'cms-packages' | 'cms-policies' | 'cms-presskit' | 'cms-gallery'>('cms-bio');
  const [webSubTab, setWebSubTab] = useState<'web-payment' | 'cms-categories' | 'cms-client-categories' | 'cms-wa-templates' | 'cms-cashflow-categories' | 'web-logo' | 'web-security'>('web-payment');

  const [cmsPackages, setCmsPackages] = useState<any[]>([]);
  const [cmsPolicies, setCmsPolicies] = useState<{ terms?: string; refund?: string; faq?: any[] }>({
    terms: '1. Booking tanggal dianggap sah (Terkunci) setelah klien membayar Down Payment (DP) 50% dari total nilai kontrak.\n2. Pelunasan sisa tagihan 50% wajib diselesaikan selambat-lambatnya H-2 sebelum hari acara.\n3. Durasi perform MC maksimal 4 jam per sesi acara. Kelebihan durasi dihitung overtime.\n4. Klien wajib menyediakan waktu Soundcheck / Gladi Bersih minimal 45 menit sebelum acara mulai.',
    refund: '1. Pembatalan >30 hari sebelum hari H: DP dapat dialihkan ke jadwal lain (reschedule) dalam waktu 6 bulan kalender.\n2. Pembatalan H-30 s/d H-14: DP dapat dipindahtangankan ke event lain dengan persetujuan manajemen MC.\n3. Pembatalan <14 hari: DP tidak dapat dikembalikan sebagai biaya kompensasi penolakan penawaran klien lain.\n4. Force Majeure: Tanggal acara dijadwalkan ulang tanpa penalti biaya.'
  });
  const [cmsGallery, setCmsGallery] = useState<any[]>([]);
  const [calBuffer, setCalBuffer] = useState<number>(7);
  const [calMode, setCalMode] = useState<string>('request_to_book');
  const [calNotice, setCalNotice] = useState<string>('Tanggal bertanda merah telah terisi DP klien lain. Tanggal bertanda kuning masih dalam proses konfirmasi DP.');

  // Web Settings Data State
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [qrisUrl, setQrisUrl] = useState<string>('');
  const [eventCategories, setEventCategories] = useState<string[]>(['Wedding', 'Corporate', 'Sweet 17', 'Gala Dinner', 'Awarding Night']);
  const [clientCategories, setClientCategories] = useState<any[]>([
    { name: 'VIP', icon: '⭐' },
    { name: 'Corporate', icon: '🏢' },
    { name: 'Regular', icon: '👥' }
  ]);
  const [waTemplates, setWaTemplates] = useState<any[]>([]);
  const [webLogoUrl, setWebLogoUrl] = useState<string>('');

  // Keamanan Akun State
  const [currPassword, setCurrPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrPass, setShowCurrPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);

  // Bank Accounts Management Helpers
  const addBankAccount = () => {
    setBankAccounts(prev => [...prev, { bank: '', number: '', name: '' }]);
  };
  const updateBankAccount = (index: number, field: string, val: string) => {
    setBankAccounts(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };
  const removeBankAccount = (index: number) => {
    setBankAccounts(prev => prev.filter((_, i) => i !== index));
  };

  // ECC Sticky Notes, VIP Protocol & Checklist State
  const [eccStickyNotes, setEccStickyNotes] = useState<string>('Pengantin menginginkan vibes romantic-warm. Ada tamu kehormatan Menteri BUMN. Dilarang roasting tamu VIP. Naskah bilingual ID/EN. Pintu ballroom dibuka tepat pukul 19:15 WIB.');
  const [eccVipProtocols, setEccVipProtocols] = useState<{ role: string; name: string }[]>([
    { role: 'Menteri BUMN:', name: 'Bpk. Erick Thohir, B.A., M.B.A.' },
    { role: 'Tokoh Nasional:', name: 'Ir. H. Bambang Soesatyo, S.E., M.B.A.' },
    { role: 'Orang Tua Mempelai:', name: 'Bpk. Dr. Ir. Hendrawan & Ibu Farida' }
  ]);
  const [eccChecklist, setEccChecklist] = useState<{ text: string; done: boolean }[]>([
    { text: 'Konfirmasi pelafalan nama gelar tamu VIP', done: true },
    { text: 'Cek gladi mic wireless Shure Axient di FOH', done: true },
    { text: 'Briefing sinyal cue musik dengan Mas Dimas', done: true },
    { text: 'Ambil gaun malam dari desainer', done: true },
    { text: 'Cek air mineral hangat & lemon di green room', done: false }
  ]);
  const [newChecklistText, setNewChecklistText] = useState<string>('');

  // Load Bootstrap CMS data
  useEffect(() => {
    fetch('/api/cms/bootstrap', { credentials: 'same-origin' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const d = data.data;
          if (d.biodata) {
            if (d.biodata.name) setMcName(d.biodata.name);
            if (d.biodata.spec) setMcSpec(d.biodata.spec);
            if (d.biodata.no_telp) setMcPhone(d.biodata.no_telp);
            if (d.biodata.ig) setMcIg(d.biodata.ig);
            if (d.biodata.tiktok) setMcTiktok(d.biodata.tiktok);
            if (d.biodata.fb) setMcFacebook(d.biodata.fb);
            if (d.biodata.bio) setMcBio(d.biodata.bio);
            if (d.biodata.statEvents) setMcStatEvents(d.biodata.statEvents);
            else if (d.biodata.stat_events) setMcStatEvents(d.biodata.stat_events);
            if (d.biodata.statYears) setMcStatYears(d.biodata.statYears);
            else if (d.biodata.stat_years) setMcStatYears(d.biodata.stat_years);
            if (d.biodata.photo) setMcPhotoUrl(d.biodata.photo);
            else if (d.biodata.foto_profil) setMcPhotoUrl(d.biodata.foto_profil);
            if (d.biodata.showreel_url) setMcShowreel(d.biodata.showreel_url);
          }
          if (Array.isArray(d.packages)) setCmsPackages(d.packages);
          if (d.policies) setCmsPolicies(d.policies);
          if (Array.isArray(d.gallery)) setCmsGallery(d.gallery);
          if (d.payment_settings) {
            const rawAccounts = d.payment_settings.accounts || d.payment_settings.banks || [];
            if (Array.isArray(rawAccounts)) {
              setBankAccounts(rawAccounts.map((a: any) => ({
                bank: a.bank || '',
                number: a.number || a.rekening || '',
                name: a.name || a.atasNama || ''
              })));
            }
            if (d.payment_settings.qrisUrl) setQrisUrl(d.payment_settings.qrisUrl);
            else if (d.payment_settings.qris_url) setQrisUrl(d.payment_settings.qris_url);
            if (d.payment_settings.logoUrl) setWebLogoUrl(d.payment_settings.logoUrl);
          }
          if (Array.isArray(d.event_categories)) setEventCategories(d.event_categories);
          if (Array.isArray(d.client_categories)) setClientCategories(d.client_categories);
          if (Array.isArray(d.wa_templates)) setWaTemplates(d.wa_templates);
        }
      })
      .catch(err => console.error('Failed to load CMS bootstrap:', err));
  }, []);

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
      pic: 'Master MC',
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
      script: 'Hadirin sekalian, arahkan pandangan dan sambutlah dengan tepuk tangan paling bergemuruh, kehadiran kedua mempelai!',
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
      script: 'Kini saatnya kita sedikit mencairkan suasana! Kami undang sahabat terdekat untuk maju ke panggung untuk doorprize istimewa!',
    },
    {
      id: 6,
      time: '20:30 - 21:00',
      title: 'Foto Bersama, Ramah Tamah & Closing MC',
      isDone: false,
      music: 'Emotional Grand Finale Strings Outro',
      pic: 'Tim Dokumentasi & Master MC',
      segmentType: 'closing',
      tone: 'elegant_luxury',
      script: 'Demikianlah rangkaian acara indah malam ini. Atas nama keluarga besar dan seluruh pengisi acara, saya mohon undur diri. Selamat malam dan sampai jumpa!',
    },
  ]);

  // AI Script Co-Pilot State
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [selectedSegmentForAi, setSelectedSegmentForAi] = useState<number>(3);
  const [aiTone, setAiTone] = useState<'formal' | 'romantic_warm' | 'energetic_fun' | 'elegant_luxury'>('romantic_warm');
  const [aiCustomNotes, setAiCustomNotes] = useState<string>('Mempelai suka gaya santun bercampur humor hangat');

  // Live Clock Interval
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('id-ID', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Session & Initial Events
  useEffect(() => {
    // 1. Fetch Biodata & CMS Settings
    fetch('/api/cms/biodata', { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.name) setMcName(data.data.name);
          if (data.data.spec) setMcSpec(data.data.spec);
          if (data.data.no_telp) setMcPhone(data.data.no_telp);
          if (data.data.bio) setMcBio(data.data.bio);
          if (data.data.ig) setMcIg(data.data.ig);
        }
      })
      .catch(() => {});

    // 2. Fetch Wardrobe Catalog
    setWardrobeLoading(true);
    fetch('/api/cms/wardrobe-catalog', { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setWardrobeList(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setWardrobeLoading(false));

    fetch('/api/cms/events', { credentials: 'same-origin' })
      .then((res) => {
        if (res.status === 401) {
          onUnauthorized?.();
          return null;
        }
        return res.json();
      })
      .then((resData) => {
        if (!resData) return;
        if (resData.success && Array.isArray(resData.data)) {
          setEvents(resData.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Sync Customers from Events
  const customersList = useMemo<CustomerItem[]>(() => {
    return events.map((ev, idx) => {
      let name = ev.pic || 'Klien ' + (idx + 1);
      let phone = '';
      const match = name.match(/(.*?)\s*\((.*?)\)/);
      if (match) {
        name = match[1].trim();
        phone = match[2].trim();
      }

      let contractNum = 0;
      if (ev.rawPrice) contractNum = ev.rawPrice;
      else if (ev.price) contractNum = parseInt(String(ev.price).replace(/[^0-9]/g, '')) || 0;

      let payStatus: any = 'DP DIBAYAR';
      if (ev.paymentStatus?.toUpperCase().includes('LUNAS')) payStatus = 'LUNAS 100%';
      else if (ev.paymentStatus?.toUpperCase().includes('50%')) payStatus = 'DP 50%';
      else if (ev.paymentStatus?.toUpperCase().includes('REVIEW')) payStatus = 'REVIEW';

      let calStatus: any = 'TERKUNCI';
      if (ev.status?.toLowerCase().includes('tentative')) calStatus = 'TENTATIVE';
      else if (ev.status?.toLowerCase().includes('review')) calStatus = 'REVIEW';

      let cat = ev.category || 'Corporate';
      let clientCat: 'VIP' | 'CORPORATE' | 'REGULAR' = ev.clientCategory || (idx % 2 === 0 ? 'VIP' : 'REGULAR');

      return {
        id: ev.customerId || ev.id || idx + 1,
        name,
        phone: phone || '0812' + (1000000 + idx),
        email: name.toLowerCase().replace(/[^a-z]/g, '') + '@gmail.com',
        category: cat,
        clientCategory: clientCat,
        eventName: ev.title || ev.nama_acara || 'Acara Panggung',
        eventDate: ev.date || '2026-10-15',
        eventTime: ev.time || '18:00 WIB',
        contractValue: contractNum || 15000000,
        paymentStatus: payStatus,
        calendarStatus: calStatus,
        notes: ev.note || 'Prioritas panggung standar.',
        eventId: ev.id,
      };
    });
  }, [events]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customersList.filter((c) => {
      const matchSearch =
        custSearch === '' ||
        c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
        c.phone.includes(custSearch) ||
        c.eventName.toLowerCase().includes(custSearch.toLowerCase());

      const matchCat = custCategoryFilter === 'all' || c.category.toLowerCase() === custCategoryFilter.toLowerCase();
      const matchClientCat = custClientCategoryFilter === 'all' || c.clientCategory.toLowerCase() === custClientCategoryFilter.toLowerCase();
      const matchPay = custPaymentFilter === 'all' || c.paymentStatus.toLowerCase().includes(custPaymentFilter.toLowerCase());
      const matchCal = custCalendarFilter === 'all' || c.calendarStatus.toLowerCase() === custCalendarFilter.toLowerCase();

      return matchSearch && matchCat && matchClientCat && matchPay && matchCal;
    });
  }, [customersList, custSearch, custCategoryFilter, custClientCategoryFilter, custPaymentFilter, custCalendarFilter]);

  // CRM Top Analytics & Distribution Pies
  const { crmTotalCust, crmActiveCount, crmBelumLunas, crmTotalLtv, crmCategoryPies, crmClientCategoryPies } = useMemo(() => {
    const totalCust = customersList.length;
    const active = customersList.filter(c => c.paymentStatus && !c.paymentStatus.includes('Lunas') && !c.paymentStatus.includes('Completed')).length;
    const belum = customersList.filter(c => c.paymentStatus && (c.paymentStatus.includes('Belum') || c.paymentStatus.includes('DP') || c.paymentStatus.includes('Hold') || c.paymentStatus.includes('Review'))).length;
    const ltv = customersList.reduce((acc, c) => {
      const val = parseInt(String(c.contractValue || 0).replace(/[^0-9]/g, ''));
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    const catMap: Record<string, number> = {};
    const clientMap: Record<string, number> = {};
    customersList.forEach(c => {
      const cat = c.category || 'Lainnya';
      catMap[cat] = (catMap[cat] || 0) + 1;
      const clCat = c.clientCategory || 'REGULAR';
      clientMap[clCat] = (clientMap[clCat] || 0) + 1;
    });

    const catColors = ['#D4AF37', '#EC4899', '#3B82F6', '#10B981', '#A855F7', '#F59E0B'];
    const clientColors = ['#D4AF37', '#8B5CF6', '#3B82F6', '#10B981', '#64748B'];

    const buildPie = (map: Record<string, number>, colors: string[]) => {
      const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
      const total = entries.reduce((s, [, v]) => s + v, 0);
      let currentOffset = 0;
      const circumference = Math.PI;

      return entries.map(([name, val], idx) => {
        const pct = total > 0 ? val / total : 0;
        const strokeDasharray = `${pct * circumference} ${circumference}`;
        const strokeDashoffset = -currentOffset;
        currentOffset += (pct * circumference);
        const color = colors[idx % colors.length];
        return { name, val, pct, strokeDasharray, strokeDashoffset, color };
      });
    };

    return {
      crmTotalCust: totalCust,
      crmActiveCount: active,
      crmBelumLunas: belum,
      crmTotalLtv: ltv,
      crmCategoryPies: buildPie(catMap, catColors),
      crmClientCategoryPies: buildPie(clientMap, clientColors)
    };
  }, [customersList]);

  // Active event object
  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

  // Fetch financials when selectedEventId changes
  useEffect(() => {
    if (!selectedEventId) return;
    setFinancialLoading(true);
    fetch(`/api/events/${selectedEventId}/financials`, { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setFinancialData(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setFinancialLoading(false));
  }, [selectedEventId]);

  // AI Script Generation Handler
  const handleGenerateAiScript = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch(`/api/events/${selectedEventId}/ai/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          segment_type: rundownList.find((s) => s.id === selectedSegmentForAi)?.segmentType || 'opening',
          tone: aiTone,
          custom_notes: aiCustomNotes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const genScript = data.data?.script || data.script;
        setRundownList((prev) =>
          prev.map((s) => (s.id === selectedSegmentForAi ? { ...s, script: genScript, tone: aiTone } : s))
        );
        toast.success('Skrip MC AI Co-Pilot berhasil di-generate!');
      } else {
        toast.error(data.message || 'Gagal men-generate skrip.');
      }
    } catch (err) {
      toast.error('Gagal terhubung ke AI Script Generator.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Handler Simpan Biodata ke Database (Full Parity)
  const handleSaveBiodata = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const bioData = {
        name: mcName,
        email: 'vanya@mcconnect.id',
        bio: mcBio,
        statEvents: mcStatEvents,
        statYears: mcStatYears,
        spec: mcSpec,
        photo: mcPhotoUrl,
        ig: mcIg,
        tiktok: mcTiktok,
        fb: mcFacebook,
        stat_events: mcStatEvents,
        stat_years: mcStatYears,
        photo_url: mcPhotoUrl,
        facebook: mcFacebook,
        no_telp: mcPhone,
        showreel_url: mcShowreel,
      };
      const res = await fetch('/api/cms/biodata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (window as any).CSRF_TOKEN || ''
        },
        credentials: 'same-origin',
        body: JSON.stringify(bioData),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(data.message || 'Biodata & Showreel berhasil disimpan dan di-sync ke Web Publik!');
        if (data.data?.photo) setMcPhotoUrl(data.data.photo);
      } else {
        toast.error(data.message || 'Gagal menyimpan biodata.');
      }
    } catch (err: any) {
      toast.error('Gagal menghubungi server: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handler Simpan Rekening Bank & QRIS Statis
  const handleSavePaymentSettings = async () => {
    setIsSavingSettings(true);
    try {
      const accounts = bankAccounts.map(b => ({
        bank: b.bank || '',
        number: String(b.number !== undefined ? b.number : (b.rekening || '')).replace(/[^0-9]/g, ''),
        name: b.name !== undefined ? b.name : (b.atasNama || '')
      })).filter(a => a.bank && a.number);

      const res = await fetch('/api/cms/payment-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (window as any).CSRF_TOKEN || ''
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          accounts,
          qrisUrl,
          logoUrl: webLogoUrl
        })
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success('Pengaturan Pembayaran & QRIS berhasil disimpan ke Server!');
        if (data.qrisUrl) setQrisUrl(data.qrisUrl);
      } else {
        toast.error(data.message || 'Gagal menyimpan pengaturan pembayaran.');
      }
    } catch (err: any) {
      toast.error('Gagal menyambung ke server.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handler Ganti Password Master MC
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Kata sandi baru minimal 8 karakter!');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok!');
      return;
    }
    try {
      const res = await fetch('/api/mc/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          current_password: currPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword
        })
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success('Kata sandi Master MC berhasil diperbarui!');
        setCurrPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || 'Gagal mengubah kata sandi.');
      }
    } catch(err) {
      toast.error('Gagal menghubungi server.');
    }
  };

  // Handler Ubah Status Acara dari Header ECC
  const handleUpdateEventStatus = async (newStatus: string) => {
    if (!activeEvent) return;
    try {
      await fetch(`/api/cms/events/${activeEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: newStatus })
      });
    } catch(e) {}
    setEvents(prev => prev.map(ev => ev.id === activeEvent.id ? { ...ev, status: newStatus } : ev));
    toast.success(`Status acara diubah menjadi: ${newStatus}`);
  };

  // Handler Hapus Acara dari Header ECC
  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus acara ini dari kalender & command center?')) return;
    try {
      await fetch(`/api/cms/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });
      toast.success('Acara berhasil dihapus.');
      setEvents(prev => prev.filter(e => e.id !== eventId));
      const remaining = events.filter(e => e.id !== eventId);
      if (remaining.length > 0) {
        onSelectEvent(remaining[0].id);
      }
    } catch(err) {
      toast.error('Gagal menghapus acara.');
    }
  };

  // Handler Tambah Jas ke Katalog Wardrobe Database
  const handleAddWardrobe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWardrobeName.trim()) {
      toast.error('Nama jas wajib diisi!');
      return;
    }
    setIsSavingWardrobe(true);
    const newItem = {
      name: newWardrobeName,
      desc: newWardrobeDesc || 'Jas panggung MC koleksi resmi.',
      colorHex: newWardrobeColor,
      colorName: newWardrobeCategory || 'Formal',
      imgUrl: 'https://images.unsplash.com/photo-1594938291221-94f18cbb5660?q=80&w=200&auto=format&fit=crop',
      status: 'Siap Pakai',
    };

    const updated = [...wardrobeList, newItem];
    try {
      const res = await fetch('/api/cms/wardrobe-catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ wardrobe: updated }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Jas baru berhasil ditambahkan ke katalog database!');
        setShowAddWardrobeModal(false);
        setNewWardrobeName('');
        setNewWardrobeDesc('');
        // Refresh catalog from DB
        const fresh = await fetch('/api/cms/wardrobe-catalog', { credentials: 'same-origin' }).then((r) => r.json());
        if (fresh.success && Array.isArray(fresh.data)) {
          setWardrobeList(fresh.data);
        }
      } else {
        toast.error(data.message || 'Gagal menambahkan jas.');
      }
    } catch (err: any) {
      toast.error('Gagal menghubungi server: ' + err.message);
    } finally {
      setIsSavingWardrobe(false);
    }
  };

  // Handler Hapus Jas dari Database
  const handleDeleteWardrobe = async (dbId: number) => {
    if (!confirm('Hapus jas ini dari katalog database?')) return;
    try {
      const res = await fetch(`/api/cms/wardrobe-catalog/${dbId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Jas berhasil dihapus dari database.');
        setWardrobeList((prev) => prev.filter((item) => item.db_id !== dbId && item.id !== 'w_' + dbId));
      } else {
        toast.error(data.message || 'Gagal menghapus jas.');
      }
    } catch (err: any) {
      toast.error('Gagal menghapus: ' + err.message);
    }
  };

  const getBreadcrumbTitle = (section: AdminSection) => {
    switch (section) {
      case 'dashboard': return 'Dashboard Ringkasan & Performa MC';
      case 'calendar': return 'Kalender Jadwal Acara (Anti-Bentrok)';
      case 'customers': return 'Direktori Data Pelanggan & Klien (CRM)';
      case 'cashflow': return 'Manajemen Arus Kas (Cash Flow)';
      case 'settings': return 'Pengaturan Landing Page (CMS Publik)';
      case 'landing-settings': return 'Pengaturan Landing Page (CMS Publik)';
      case 'web-settings': return 'Pengaturan Landing Page (CMS Publik)';
      case 'command-center': return 'Event Command Center (Terintegrasi)';
      case 'wardrobe': return 'Manajemen Wardrobe Tracker';
      case 'stage-mode': return 'Stage Mode (Teleprompter & Soundboard)';
      case 'vendor-screen': return 'Layar Vendor Musik (FOH Live Cue)';
      case 'musicbank': return 'Master Bank Musik & Koleksi Audio';
      case 'guide': return 'Pusat Panduan, Fitur Aplikasi & Roadmap SaaS';
      default: return 'Admin Workspace';
    }
  };

  const formatRupiah = (num: number) => {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
  };

  // Dynamic Dashboard Metrics
  const [dashEventFilter, setDashEventFilter] = useState<'all' | 'locked' | 'tentative' | 'review'>('all');

  // Interactive Calendar State (100% Parity)
  const [calCurrentDate, setCalCurrentDate] = useState<Date>(new Date());
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);
  const [selectedCalEvent, setSelectedCalEvent] = useState<EventItem | null>(null);
  const [calAgendaFilter, setCalAgendaFilter] = useState<'all' | 'terkunci' | 'tentative' | 'review'>('all');

  const calMonthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const calYear = calCurrentDate.getFullYear();
  const calMonth = calCurrentDate.getMonth();
  const calFirstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const calLastDate = new Date(calYear, calMonth + 1, 0).getDate();

  const calToday = new Date();
  const calTodayStr = `${calToday.getFullYear()}-${String(calToday.getMonth() + 1).padStart(2, '0')}-${String(calToday.getDate()).padStart(2, '0')}`;

  const filteredAgendaEvents = useMemo(() => {
    if (calAgendaFilter === 'terkunci') {
      return events.filter(e => (e.status || '').toLowerCase() === 'terkunci' || (e.status || '').toLowerCase() === 'locked');
    }
    if (calAgendaFilter === 'tentative') {
      return events.filter(e => (e.status || '').toLowerCase() === 'tentative');
    }
    if (calAgendaFilter === 'review') {
      return events.filter(e => (e.status || '').toLowerCase() === 'review' || !e.status);
    }
    return events;
  }, [events, calAgendaFilter]);

  const {
    totalEvents,
    terkunciCount,
    tentativeCount,
    reviewCount,
    revTerkunci,
    convRate,
    avgDeal,
    annualTargetPct
  } = useMemo(() => {
    const total = events.length;
    const locked = events.filter(e => (e.status || '').toLowerCase() === 'terkunci' || (e.status || '').toLowerCase() === 'locked');
    const tentative = events.filter(e => (e.status || '').toLowerCase() === 'tentative');
    const review = events.filter(e => (e.status || '').toLowerCase() === 'review' || !e.status);

    const revenue = locked.reduce((acc, ev) => {
      if (ev.rawPrice) return acc + ev.rawPrice;
      const parsed = parseInt(String(ev.price || 0).replace(/[^0-9]/g, ''));
      return acc + (isNaN(parsed) ? 0 : parsed);
    }, 0);

    const conversion = total > 0 ? Math.round((locked.length / total) * 100) : 0;
    const deal = locked.length > 0 ? Math.round(revenue / locked.length) : 0;
    const target = Math.round((revenue / 100000000) * 100);

    return {
      totalEvents: total,
      terkunciCount: locked.length,
      tentativeCount: tentative.length,
      reviewCount: review.length,
      revTerkunci: revenue,
      convRate: conversion,
      avgDeal: deal,
      annualTargetPct: target
    };
  }, [events]);

  const filteredDashEvents = useMemo(() => {
    if (dashEventFilter === 'locked') {
      return events.filter(e => (e.status || '').toLowerCase() === 'terkunci' || (e.status || '').toLowerCase() === 'locked');
    }
    if (dashEventFilter === 'tentative') {
      return events.filter(e => (e.status || '').toLowerCase() === 'tentative');
    }
    if (dashEventFilter === 'review') {
      return events.filter(e => (e.status || '').toLowerCase() === 'review' || !e.status);
    }
    return events;
  }, [events, dashEventFilter]);

  // Cashflow Management State (100% Parity)
  const [cashflowList, setCashflowList] = useState<any[]>([]);
  const [cfLoading, setCfLoading] = useState<boolean>(false);
  const [cfSearch, setCfSearch] = useState<string>('');
  const [cfFilterType, setCfFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [showAddCashModal, setShowAddCashModal] = useState<boolean>(false);
  const [newCfType, setNewCfType] = useState<'in' | 'out'>('out');
  const [newCfAmount, setNewCfAmount] = useState<string>('');
  const [newCfCategory, setNewCfCategory] = useState<string>('Operasional Umum MC');
  const [newCfDesc, setNewCfDesc] = useState<string>('');
  const [newCfDate, setNewCfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSavingCf, setIsSavingCf] = useState<boolean>(false);

  // Load Cashflow from Backend
  const loadCashflow = async () => {
    setCfLoading(true);
    try {
      const res = await fetch('/api/cms/cashflow-transactions', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setCashflowList(data.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to load cashflow:', err);
    } finally {
      setCfLoading(false);
    }
  };

  useEffect(() => {
    loadCashflow();
  }, []);

  // Save new cashflow transaction
  const handleSaveCashflow = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newCfAmount.replace(/[^0-9]/g, ''));
    if (!amountNum || isNaN(amountNum)) {
      toast.error('Masukkan nominal transaksi yang valid.');
      return;
    }
    setIsSavingCf(true);
    try {
      const res = await fetch('/api/cms/cashflow-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          type: newCfType,
          category: newCfCategory,
          amount: amountNum,
          date: newCfDate,
          desc: newCfDesc || (newCfType === 'in' ? 'Pemasukan Kas' : 'Pengeluaran Operasional')
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        toast.success(data.message || 'Transaksi kas berhasil dicatat!');
        setShowAddCashModal(false);
        setNewCfAmount('');
        setNewCfDesc('');
        loadCashflow();
      } else {
        toast.error(data.message || 'Gagal menyimpan transaksi.');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan jaringan: ' + err.message);
    } finally {
      setIsSavingCf(false);
    }
  };

  // Delete cashflow transaction
  const handleDeleteCashflow = async (id: number | string) => {
    if (!confirm('Hapus transaksi kas ini?')) return;
    try {
      const res = await fetch(`/api/cms/cashflow-transactions/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });
      const data = await res.json();
      if (data && data.success) {
        toast.success('Transaksi berhasil dihapus');
        setCashflowList(prev => prev.filter(t => t.id !== id));
      } else {
        toast.error(data.message || 'Gagal menghapus transaksi.');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan: ' + err.message);
    }
  };

  // Unified Transactions (Cashflow DB + Event Inflow sync)
  const unifiedTransactions = useMemo(() => {
    const list = [...cashflowList];
    events.forEach(ev => {
      const isPaid = (ev.status || '').toLowerCase() === 'terkunci' || (ev.status || '').toLowerCase() === 'locked';
      if (isPaid && ev.rawPrice && ev.rawPrice > 0) {
        const evId = 'ev_' + ev.id;
        if (!list.find(t => t.id === evId || t.eventId === ev.id)) {
          list.push({
            id: evId,
            type: 'in',
            category: 'Pendapatan Booking',
            amount: ev.rawPrice,
            date: ev.date || new Date().toISOString().split('T')[0],
            desc: `Pelunasan Kontrak - ${ev.title || ev.nama_acara} (${ev.pic || 'Klien'})`,
            status: 'Lunas'
          });
        }
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cashflowList, events]);

  // Filtered Cashflow Transactions
  const filteredCashflow = useMemo(() => {
    return unifiedTransactions.filter(t => {
      const matchType = cfFilterType === 'all' || t.type === cfFilterType;
      const matchSearch = cfSearch === '' ||
        (t.desc || '').toLowerCase().includes(cfSearch.toLowerCase()) ||
        (t.category || '').toLowerCase().includes(cfSearch.toLowerCase()) ||
        (t.date || '').includes(cfSearch);
      return matchType && matchSearch;
    });
  }, [unifiedTransactions, cfFilterType, cfSearch]);

  // Cashflow Financial Stats
  const { cfTotalInflow, cfTotalOutflow, cfNetCash, cfNetMargin } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    unifiedTransactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'in') inflow += amt;
      else if (t.type === 'out') outflow += amt;
    });
    const net = inflow - outflow;
    const margin = inflow > 0 ? ((net / inflow) * 100).toFixed(1) : '0';
    return {
      cfTotalInflow: inflow,
      cfTotalOutflow: outflow,
      cfNetCash: net,
      cfNetMargin: margin
    };
  }, [unifiedTransactions]);

  return (
    <div className={`admin-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* =========================================================
          1. STICKY LEFT SIDEBAR (EXACT MATCH TO OLD ADMIN)
          ========================================================= */}
      <aside className="admin-sidebar">
        {/* Sidebar Header with Brand */}
        <div className="sidebar-header">
          <button 
            onClick={() => setActiveSection('dashboard')} 
            className="brand-logo"
            style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
          >
            <div className="brand-icon">MC</div>
            <div className="brand-text">MC-<span>Connect</span></div>
          </button>
          <div className="sidebar-header-right">
            <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(212,175,55,0.15)', color: 'var(--adm-gold)', border: '1px solid rgba(212,175,55,0.3)', padding: '0.18rem 0.55rem', borderRadius: '999px' }}>
              v8.0 Pro
            </span>
          </div>
        </div>

        {/* Sidebar Profile Card */}
        <div className="sidebar-profile">
          <div className="sidebar-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #D4AF37, #B45309)', color: '#090D16', fontWeight: 900, fontSize: '0.9rem' }}>
            {mcName.split(' ').map(n => n[0]).slice(0, 2).join('') || 'AR'}
          </div>
          <div className="sidebar-user-info">
            <h4>{mcName}</h4>
            <div className="sidebar-user-status">
              <span className="status-dot-pulse"></span> MC Online & Siap
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Menu */}
        <div className="sidebar-menu-group">
          <div className="sidebar-group-title">Menu Utama</div>
          <ul className="sidebar-menu">
            <li>
              <button 
                className={`sidebar-item-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveSection('dashboard')}
              >
                <div className="sidebar-item-left">
                  <div className="sidebar-icon-sq">📊</div>
                  <span>Dashboard</span>
                </div>
              </button>
            </li>

            <li>
              <button 
                className={`sidebar-item-btn ${activeSection === 'calendar' ? 'active' : ''}`}
                onClick={() => setActiveSection('calendar')}
                style={{ justifyContent: 'space-between' }}
              >
                <div className="sidebar-item-left">
                  <div className="sidebar-icon-sq">📅</div>
                  <span>Kalender Acara</span>
                </div>
                <span className="badge" style={{ padding: '0.15rem 0.45rem', borderRadius: '99px', fontSize: '0.75rem', background: 'rgba(59,130,246,0.15)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.3)', fontWeight: 700 }}>
                  {events.length}
                </span>
              </button>
            </li>

            {/* MENU: DATA PELANGGAN (CRM) */}
            <li>
              <button 
                className={`sidebar-item-btn ${activeSection === 'customers' ? 'active' : ''}`}
                onClick={() => setActiveSection('customers')}
              >
                <div className="sidebar-item-left">
                  <div className="sidebar-icon-sq">👥</div>
                  <span>Data Pelanggan</span>
                </div>
              </button>
            </li>

            <li>
              <button 
                className={`sidebar-item-btn ${activeSection === 'cashflow' ? 'active' : ''}`}
                onClick={() => setActiveSection('cashflow')}
              >
                <div className="sidebar-item-left">
                  <div className="sidebar-icon-sq">💰</div>
                  <span>Cash Flow</span>
                </div>
              </button>
            </li>

            {/* MENU 4: PENGATURAN (DROPDOWN 100% PARITY) */}
            <li>
              <button 
                id="menu-settings-toggle"
                className={`sidebar-item-btn ${(activeSection === 'settings' || activeSection === 'landing-settings' || activeSection === 'web-settings') ? 'active' : ''}`}
                onClick={() => setShowSettingsDropdown(prev => !prev)}
              >
                <div className="sidebar-item-left">
                  <div className="sidebar-icon-sq">⚙️</div>
                  <span>Pengaturan</span>
                </div>
                <div style={{ fontSize: '0.6rem', marginRight: '0.5rem', opacity: 0.6 }}>
                  {showSettingsDropdown ? '▲' : '▼'}
                </div>
              </button>
              <ul 
                id="landing-dropdown" 
                style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  margin: 0, 
                  paddingLeft: '3rem',
                  display: (showSettingsDropdown || activeSection === 'landing-settings' || activeSection === 'web-settings' || activeSection === 'settings') ? 'block' : 'none'
                }}
              >
                <li>
                  <button
                    className={`sidebar-item-btn ${(activeSection === 'settings' || activeSection === 'landing-settings') ? 'active' : ''}`}
                    id="menu-landing-settings"
                    onClick={() => setActiveSection('landing-settings')}
                    style={{ padding: '0.6rem', fontSize: '0.85rem', background: 'transparent' }}
                  >
                    <span>CMS Konten</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`sidebar-item-btn ${activeSection === 'web-settings' ? 'active' : ''}`}
                    id="menu-web-settings"
                    onClick={() => setActiveSection('web-settings')}
                    style={{ padding: '0.6rem', fontSize: '0.85rem', background: 'transparent' }}
                  >
                    <span>Pengaturan Web</span>
                  </button>
                </li>
              </ul>
            </li>

            <li>
              <button 
                id="menu-command-center"
                className={`sidebar-item-btn ${activeSection === 'command-center' ? 'active' : ''}`}
                onClick={() => setActiveSection('command-center')}
              >
                <div className="sidebar-item-left">
                  <div className="sidebar-icon-sq">⚡</div>
                  <span>Event Command Center</span>
                </div>
              </button>
            </li>

            <li>
              <button 
                id="menu-wardrobe"
                className={`sidebar-item-btn ${activeSection === 'wardrobe' ? 'active' : ''}`}
                onClick={() => setActiveSection('wardrobe')}
              >
                <div className="sidebar-item-left">
                  <div className="sidebar-icon-sq">👔</div>
                  <span>Wardrobe Tracker</span>
                </div>
              </button>
            </li>

            <li>
              <button 
                id="menu-musicbank"
                className={`sidebar-item-btn ${activeSection === 'musicbank' ? 'active' : ''}`}
                onClick={() => setActiveSection('musicbank')}
              >
                <div className="sidebar-item-left">
                  <div className="sidebar-icon-sq">&#128194;</div>
                  <span>Master Bank Musik</span>
                </div>
              </button>
            </li>

            <li>
              <button 
                id="menu-guide"
                className={`sidebar-item-btn ${activeSection === 'guide' ? 'active' : ''}`}
                onClick={() => setActiveSection('guide')}
                style={{ border: '1px solid rgba(212, 175, 55, 0.3)', background: 'rgba(212, 175, 55, 0.08)', marginTop: '0.35rem' }}
              >
                <div className="sidebar-item-left">
                  <div className="sidebar-icon-sq" style={{ background: 'rgba(212, 175, 55, 0.25)', color: 'var(--adm-gold)' }}>📖</div>
                  <span style={{ fontWeight: 700, color: '#FFFFFF' }}>Panduan & Fitur</span>
                </div>
                <span className="badge" style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.68rem', background: 'rgba(212,175,55,0.25)', color: '#FDE047', fontWeight: 800, border: '1px solid rgba(212,175,55,0.4)' }}>
                  SAAS
                </span>
              </button>
            </li>
          </ul>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <button 
              onClick={onBackToHome}
              style={{ color: 'var(--adm-gold)', fontSize: '0.8rem', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              title="Buka Portal Publik"
            >
              Lihat Web
            </button>
          </div>
          <button 
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                fetch('/api/mc/logout', { method: 'POST', credentials: 'same-origin' }).finally(() => {
                  window.location.href = '/login';
                });
              }
            }} 
            className="btn btn-secondary btn-sm"
            style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#F87171', justifyContent: 'center', width: '100%', marginTop: '0.5rem' }}
          >
            🚪 Logout / Keluar
          </button>
        </div>
      </aside>

      {/* =========================================================
          2. STICKY TOPBAR & MAIN CONTENT BODY
          ========================================================= */}
      <main className="admin-body-content">
        {/* Topbar Header */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button 
              className="btn btn-secondary btn-sm mobile-menu-toggle"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{ fontSize: '1.2rem', padding: '0.2rem 0.6rem' }}
            >
              ☰
            </button>
            <div className="admin-breadcrumbs admin-topbar-breadcrumb">
              <div className="sidebar-icon-sq">🏠</div>
              <span className="breadcrumb-prefix">Admin Workspace</span>
              <span className="breadcrumb-separator" style={{ opacity: 0.4 }}>/</span>
              <span className="curr">{getBreadcrumbTitle(activeSection)}</span>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <div className="live-time-pill">
              ⏰ <span>{liveTime} WIB</span>
            </div>

            <button 
              onClick={() => {
                const current = document.documentElement.getAttribute('data-theme');
                document.documentElement.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
              }} 
              className="btn btn-secondary btn-sm" 
              title="Ubah Mode Terang/Gelap"
              style={{ fontSize: '1.1rem', padding: '0.2rem 0.5rem' }}
            >
              🌗
            </button>

            <button 
              onClick={onBackToHome} 
              className="btn btn-secondary btn-sm btn-portal-publik" 
              style={{ fontWeight: 600 }}
              title="Buka Portal Publik"
            >
              <span>🌐</span> <span className="btn-portal-text">Portal Publik</span>
            </button>
          </div>
        </header>

        {/* Content Pad */}
        <div className="admin-content-pad">
          {/* =========================================================
              VIEW 1: DASHBOARD RINGKASAN & PERFORMA MC
              ========================================================= */}
          {activeSection === 'dashboard' && (
            <div id="sec-dashboard" className="admin-section active">
              {/* Hero Banner */}
              <div 
                className="ecc-card dash-hero-card"
                style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(17,24,39,0.95))', border: '1px solid rgba(212,175,55,0.3)', marginBottom: '2rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem' }}>
                      <span className="badge badge-tier-pro">PRO PLAN SUITE</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--adm-text-secondary)' }}>
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.4rem', color: 'var(--adm-text-primary)' }}>
                      Selamat Datang, <span style={{ color: 'var(--adm-gold)' }}>{mcName}</span>!
                    </h1>
                    <p style={{ color: 'var(--adm-text-secondary)', fontSize: '0.92rem', margin: 0 }}>
                      Workspace Manajemen Panggung & Dynamic Booking Center.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => setActiveSection('settings')}>
                      Pengaturan CMS
                    </button>
                    <button className="btn btn-primary" onClick={() => setActiveSection('command-center')}>
                      Buka Command Center
                    </button>
                  </div>
                </div>
              </div>

              {/* Top 3 KPI Cards */}
              <div className="dash-kpi-grid">
                <div className="stat-metric-card gold">
                  <div className="stat-metric-top">
                    <span className="stat-metric-label">Total Pendapatan Terkunci</span>
                    <div className="stat-metric-icon">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="stat-metric-val gold" id="dashTotalRev">{formatRupiah(revTerkunci)}</div>
                  <div className="stat-metric-foot">
                    <span style={{ color: 'var(--adm-success)', fontWeight: 700 }}>Terverifikasi</span>
                    <span> Dari DP 50% & Pelunasan</span>
                  </div>
                </div>

                <div className="stat-metric-card blue">
                  <div className="stat-metric-top">
                    <span className="stat-metric-label">Total Jadwal Acara</span>
                    <div className="stat-metric-icon">
                      <CalendarIcon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="stat-metric-val" id="dashTotalEvents">{totalEvents} Acara</div>
                  <div className="stat-metric-foot">
                    <span style={{ color: 'var(--adm-info)', fontWeight: 700 }}>{terkunciCount} Terkunci</span>
                    <span> {tentativeCount} Tentative {reviewCount} Review</span>
                  </div>
                </div>

                <div className="stat-metric-card green">
                  <div className="stat-metric-top">
                    <span className="stat-metric-label">Rasio Konversi Booking</span>
                    <div className="stat-metric-icon">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="stat-metric-val green" id="dashConvRate">{convRate}%</div>
                  <div className="stat-metric-foot">
                    <span style={{ color: 'var(--adm-success)', fontWeight: 700 }}>Tinggi</span>
                    <span> Request to Book → Terkunci</span>
                  </div>
                </div>
              </div>

              {/* Monthly Trend Analytics SVG Card */}
              <div 
                className="ecc-card" 
                id="dashRevenueChart"
                style={{ marginTop: '2rem', marginBottom: '2.5rem', background: 'linear-gradient(135deg, rgba(21,29,48,0.9), rgba(11,16,30,0.95))' }}
              >
                <div className="ecc-card-header">
                  <div>
                    <div className="ecc-card-title">Tren Pendapatan & Booking Bulanan (Q3 - Q4 2026)</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--adm-text-secondary)', margin: '0.25rem 0 0' }}>
                      Monitoring pertumbuhan kontrak panggung, rata-rata deal, dan target kuartal.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="badge badge-available">& Pertumbuhan +24% YoY</span>
                  </div>
                </div>

                <div className="dash-analytics-grid dash-revenue-grid">
                  {/* SVG Area Chart */}
                  <div className="dash-grid-chart">
                    <svg viewBox="0 0 600 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#F59E0B" />
                          <stop offset="50%" stopColor="#D4AF37" />
                          <stop offset="100%" stopColor="#34D399" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                      <line x1="0" y1="75" x2="600" y2="75" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                      <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />

                      <path d="M 0,110 Q 75,90 150,95 T 300,60 T 450,45 T 600,20 L 600,150 L 0,150 Z" fill="url(#chartGrad)" />
                      <path d="M 0,110 Q 75,90 150,95 T 300,60 T 450,45 T 600,20" fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" />

                      <circle cx="0" cy="110" r="4" fill="#D4AF37" stroke="#000" strokeWidth="2" />
                      <circle cx="150" cy="95" r="4" fill="#D4AF37" stroke="#000" strokeWidth="2" />
                      <circle cx="300" cy="60" r="4" fill="#D4AF37" stroke="#000" strokeWidth="2" />
                      <circle cx="450" cy="45" r="5" fill="#34D399" stroke="#000" strokeWidth="2" />
                      <circle cx="600" cy="20" r="6" fill="#FDE047" stroke="#000" strokeWidth="2" />

                      <text x="0" y="145" fill="var(--adm-text-muted)" fontSize="11">Mei</text>
                      <text x="140" y="145" fill="var(--adm-text-muted)" fontSize="11">Jun</text>
                      <text x="290" y="145" fill="var(--adm-text-muted)" fontSize="11">Jul</text>
                      <text x="435" y="145" fill="var(--adm-text-muted)" fontSize="11">Agu (Peak)</text>
                      <text x="560" y="145" fill="var(--adm-gold)" fontSize="11" fontWeight="bold">Sep (Aktif)</text>
                    </svg>
                  </div>

                  {/* Highlights Column */}
                  <div className="dash-grid-highlights">
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Rata-rata Deal</span>
                      <div id="dashAvgDeal" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--adm-gold)' }}>{formatRupiah(avgDeal)}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Target Tahunan</span>
                      <div id="dashAnnualTarget" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34D399' }}>{annualTargetPct}% Tercapai</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Lead Time Booking</span>
                      <div id="dashLeadTime" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38BDF8' }}>H-30 Hari</div>
                    </div>
                  </div>

                  {/* Pie Chart Column (Proporsi Acara) */}
                  <div className="dash-grid-pie">
                    <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: 700, alignSelf: 'flex-start' }}>Proporsi Acara</span>
                    <svg viewBox="-1 -1 2 2" style={{ width: '90px', height: '90px', transform: 'rotate(-90deg)', overflow: 'visible' }}>
                      <circle r="0.5" cx="0" cy="0" fill="transparent" stroke="#D4AF37" strokeWidth="1" strokeDasharray="1.7278 3.14159" strokeDashoffset="0" />
                      <circle r="0.5" cx="0" cy="0" fill="transparent" stroke="#3B82F6" strokeWidth="1" strokeDasharray="1.0995 3.14159" strokeDashoffset="-1.7278" />
                      <circle r="0.5" cx="0" cy="0" fill="transparent" stroke="#EC4899" strokeWidth="1" strokeDasharray="0.3142 3.14159" strokeDashoffset="-2.8273" />
                    </svg>
                    <div style={{ fontSize: '0.75rem', color: 'var(--adm-text-secondary)', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#D4AF37', fontWeight: 600 }}>Wedding</span> <span>55%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#3B82F6', fontWeight: 600 }}>Corporate</span> <span>35%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#EC4899', fontWeight: 600 }}>Birthday</span> <span>10%</span>
                      </div>
                    </div>
                  </div>

                  {/* Pie Chart Column (Proporsi Pendapatan) */}
                  <div className="dash-grid-pie">
                    <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: 700, alignSelf: 'flex-start' }}>Proporsi Pendapatan</span>
                    <svg viewBox="-1 -1 2 2" style={{ width: '90px', height: '90px', transform: 'rotate(-90deg)', overflow: 'visible' }}>
                      <circle r="0.5" cx="0" cy="0" fill="transparent" stroke="#D4AF37" strokeWidth="1" strokeDasharray="2.2 3.14159" strokeDashoffset="0" />
                      <circle r="0.5" cx="0" cy="0" fill="transparent" stroke="#38BDF8" strokeWidth="1" strokeDasharray="0.94 3.14159" strokeDashoffset="-2.2" />
                    </svg>
                    <div style={{ fontSize: '0.75rem', color: 'var(--adm-text-secondary)', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#D4AF37', fontWeight: 600 }}>Terkunci</span> <span>70%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#38BDF8', fontWeight: 600 }}>Tentative</span> <span>30%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Expense Trend Analytics Card */}
              <div 
                className="ecc-card" 
                id="dashExpenseChart"
                style={{ marginBottom: '2.5rem', background: 'linear-gradient(135deg, rgba(30,21,21,0.9), rgba(20,11,11,0.95))', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                <div className="ecc-card-header">
                  <div>
                    <div className="ecc-card-title" style={{ color: '#EF4444' }}>📉 Tren Pengeluaran & Operasional (Q3 - Q4 2026)</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--adm-text-secondary)', margin: '0.25rem 0 0' }}>
                      Monitoring biaya, logistik panggung, dan operasional MC.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="badge badge-locked" style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', borderColor: 'rgba(239,68,68,0.3)' }}>
                      Efisiensi +12% YoY
                    </span>
                  </div>
                </div>

                <div className="dash-analytics-grid dash-expense-grid">
                  {/* SVG Area Chart */}
                  <div className="dash-grid-chart">
                    <svg viewBox="0 0 600 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="chartGradExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="lineGradExpense" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#FCA5A5" />
                          <stop offset="50%" stopColor="#EF4444" />
                          <stop offset="100%" stopColor="#B91C1C" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                      <line x1="0" y1="75" x2="600" y2="75" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                      <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />

                      <path d="M 0,50 Q 75,70 150,60 T 300,90 T 450,110 T 600,100 L 600,150 L 0,150 Z" fill="url(#chartGradExpense)" />
                      <path d="M 0,50 Q 75,70 150,60 T 300,90 T 450,110 T 600,100" fill="none" stroke="url(#lineGradExpense)" strokeWidth="3" strokeLinecap="round" />

                      <circle cx="0" cy="50" r="4" fill="#EF4444" stroke="#000" strokeWidth="2" />
                      <circle cx="150" cy="60" r="4" fill="#EF4444" stroke="#000" strokeWidth="2" />
                      <circle cx="300" cy="90" r="4" fill="#EF4444" stroke="#000" strokeWidth="2" />
                      <circle cx="450" cy="110" r="5" fill="#EF4444" stroke="#000" strokeWidth="2" />
                      <circle cx="600" cy="100" r="6" fill="#FCA5A5" stroke="#000" strokeWidth="2" />

                      <text x="0" y="145" fill="var(--adm-text-muted)" fontSize="11">Mei</text>
                      <text x="140" y="145" fill="var(--adm-text-muted)" fontSize="11">Jun</text>
                      <text x="290" y="145" fill="var(--adm-text-muted)" fontSize="11">Jul</text>
                      <text x="435" y="145" fill="var(--adm-text-muted)" fontSize="11">Agu (Low)</text>
                      <text x="560" y="145" fill="#EF4444" fontSize="11" fontWeight="bold">Sep (Aktif)</text>
                    </svg>
                  </div>

                  {/* Highlights Column */}
                  <div className="dash-grid-highlights expense-border">
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>RATA-RATA BIAYA</span>
                      <div id="dashAvgExpense" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#EF4444' }}>Rp 850.000</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Batas Anggaran</span>
                      <div id="dashBudgetStatus" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F59E0B' }}>Aman (15%)</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Biaya Terbesar</span>
                      <div id="dashTopExpense" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#9CA3AF' }}>Honor Asisten Kru</div>
                    </div>
                  </div>

                  {/* Pie Chart Column (Expense) */}
                  <div className="dash-grid-pie expense-border">
                    <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: 700, alignSelf: 'flex-start' }}>Proporsi Pengeluaran</span>
                    <svg viewBox="-1 -1 2 2" style={{ width: '90px', height: '90px', transform: 'rotate(-90deg)', overflow: 'visible' }}>
                      <circle r="0.5" cx="0" cy="0" fill="transparent" stroke="#EF4444" strokeWidth="1" strokeDasharray="1.88 3.14159" strokeDashoffset="0" />
                      <circle r="0.5" cx="0" cy="0" fill="transparent" stroke="#F59E0B" strokeWidth="1" strokeDasharray="0.94 3.14159" strokeDashoffset="-1.88" />
                      <circle r="0.5" cx="0" cy="0" fill="transparent" stroke="#3B82F6" strokeWidth="1" strokeDasharray="0.32 3.14159" strokeDashoffset="-2.82" />
                    </svg>
                    <div style={{ fontSize: '0.75rem', color: 'var(--adm-text-secondary)', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#EF4444', fontWeight: 600 }}>Kru & Asisten</span> <span>60%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#F59E0B', fontWeight: 600 }}>Transportasi</span> <span>30%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#3B82F6', fontWeight: 600 }}>Dry Cleaning</span> <span>10%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Cards Header & Filter Tabs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Daftar Acara & Booking Aktif:</h2>

                {/* Filter Tabs */}
                <div className="filter-tabs-scrollable" id="dashEventFiltersContainer">
                  <button 
                    className={`btn btn-sm ${dashEventFilter === 'all' ? 'btn-primary active' : 'btn-secondary'}`}
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => setDashEventFilter('all')}
                  >
                    Semua ({events.length})
                  </button>
                  <button 
                    className={`btn btn-sm ${dashEventFilter === 'locked' ? 'btn-primary active' : 'btn-secondary'}`}
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => setDashEventFilter('locked')}
                  >
                    🔒 Terkunci ({terkunciCount})
                  </button>
                  <button 
                    className={`btn btn-sm ${dashEventFilter === 'tentative' ? 'btn-primary active' : 'btn-secondary'}`}
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => setDashEventFilter('tentative')}
                  >
                    ⏳ Tentative ({tentativeCount})
                  </button>
                  <button 
                    className={`btn btn-sm ${dashEventFilter === 'review' ? 'btn-primary active' : 'btn-secondary'}`}
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => setDashEventFilter('review')}
                  >
                    📝 Review ({reviewCount})
                  </button>
                </div>
              </div>

              {/* Event Cards Grid */}
              <div 
                id="dashEventsGrid"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1.75rem', marginBottom: '2.5rem' }}
              >
                {filteredDashEvents.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--adm-text-muted)', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--adm-radius-md)', border: '1px dashed var(--adm-border)', fontSize: '0.95rem' }}>
                    Tidak ada acara dengan status ini di database.
                  </div>
                ) : (
                  filteredDashEvents.map((ev) => {
                    const isLocked = (ev.status || '').toLowerCase() === 'terkunci' || (ev.status || '').toLowerCase() === 'locked';
                    const isTentative = (ev.status || '').toLowerCase() === 'tentative';
                    const isCompleted = (ev.status || '').toLowerCase() === 'selesai' || (ev.status || '').toLowerCase() === 'completed';

                    let badgeClass = 'badge-review';
                    let badgeIcon = '📝';
                    let badgeText = ev.status || 'Review';
                    let progressColor = 'linear-gradient(90deg, #38BDF8, #818CF8)';
                    let pctColor = '#38BDF8';

                    if (isLocked) {
                      badgeClass = 'badge-locked';
                      badgeIcon = '🔒';
                      badgeText = 'Terkunci';
                      progressColor = 'linear-gradient(90deg, #10B981, #34D399)';
                      pctColor = 'var(--adm-success)';
                    } else if (isTentative) {
                      badgeClass = 'badge-tentative';
                      badgeIcon = '⏳';
                      badgeText = 'Tentative';
                      progressColor = 'linear-gradient(90deg, #F59E0B, #FBBF24)';
                      pctColor = '#FBBF24';
                    } else if (isCompleted) {
                      badgeClass = 'badge-available';
                      badgeIcon = '✓';
                      badgeText = 'Selesai';
                      progressColor = 'linear-gradient(90deg, #10B981, #059669)';
                      pctColor = '#10B981';
                    }

                    const checklistPct = isLocked ? 80 : (isTentative ? 40 : 20);

                    return (
                      <div 
                        key={ev.id} 
                        className="ecc-card dash-event-card"
                        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <span className={`badge ${badgeClass}`}>{badgeIcon} {badgeText}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--adm-gold)', fontWeight: 700 }}>
                              {ev.date}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--adm-text-primary)' }}>
                            {ev.title || ev.nama_acara || 'Acara MC'}
                          </h3>
                          <div style={{ fontSize: '0.88rem', color: 'var(--adm-text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>📍</span> <span>{ev.venue || ev.lokasi || 'Lokasi Belum Ditentukan'}</span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: 'var(--adm-radius-sm)', fontSize: '0.85rem', marginBottom: '1.25rem', border: '1px solid var(--adm-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span style={{ color: 'var(--adm-text-muted)' }}>Klien PIC:</span>
                              <strong>{ev.pic || 'Belum Ada PIC'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--adm-text-muted)' }}>Waktu:</span>
                              <span>{ev.time || '18:00 - 22:00 WIB'}</span>
                            </div>
                          </div>
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--adm-text-muted)', marginBottom: '0.35rem' }}>
                              <span>Kesiapan Acara (Checklist)</span>
                              <span style={{ color: pctColor, fontWeight: 700 }}>{checklistPct}%</span>
                            </div>
                            <div className="checklist-progress-bar" style={{ margin: 0, background: 'rgba(255,255,255,0.08)' }}>
                              <div className="checklist-progress-fill" style={{ width: `${checklistPct}%`, background: progressColor }} />
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--adm-border)' }}>
                          <button 
                            className="btn btn-primary btn-sm" 
                            style={{ flex: 1 }} 
                            onClick={() => {
                              onSelectEvent(ev.id);
                              setActiveSection('command-center');
                            }}
                          >
                            Command Center
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => onOpenStage(ev.id)}
                            title="Buka Stage Mode"
                          >
                            Stage
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Customer CRM Highlights on Dashboard */}
              <div className="ecc-card" style={{ marginTop: '2.5rem', padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ color: 'var(--adm-gold)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                      Manajemen Pelanggan (CRM Highlights)
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Data Pelanggan & Klien Aktif Terbaru</h3>
                  </div>
                  <div className="dash-header-actions" style={{ display: 'flex', gap: '0.6rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddCustomerModal(true)}>
                      + Tambah Klien
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveSection('customers')}>
                      Buka Direktori Pelanggan Lengkap ~
                    </button>
                  </div>
                </div>

                <div className="table-clean-wrapper">
                  <table className="table-clean" style={{ width: '100%' }}>
                    <thead>
                      <tr style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <th>Klien & Kontak</th>
                        <th>Kategori Acara</th>
                        <th>Kategori Klien</th>
                        <th>Acara Terkait & Tanggal</th>
                        <th>Nilai Kontrak</th>
                        <th>Status Pembayaran</th>
                        <th>Status Kalender</th>
                        <th style={{ textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customersList.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--adm-text-muted)' }}>
                            Belum ada data pelanggan aktif di database server.
                          </td>
                        </tr>
                      ) : (
                        customersList.slice(0, 8).map((c, idx) => (
                          <tr key={idx}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37, #B45309)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                                  {c.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--adm-text-primary)' }}>{c.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>{c.phone || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge" style={{ background: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)' }}>
                                {c.category}
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-tier-pro">{c.clientCategory || 'REGULAR'}</span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{c.eventName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>{c.date}</div>
                            </td>
                            <td style={{ fontWeight: 800, color: 'var(--adm-gold)' }}>
                              {c.contractValue}
                            </td>
                            <td>
                              <span className={`badge ${c.paymentStatus.includes('LUNAS') ? 'badge-available' : c.paymentStatus.includes('DP') ? 'badge-tentative' : 'badge-review'}`}>
                                {c.paymentStatus}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${c.calendarStatus === 'TERKUNCI' ? 'badge-locked' : 'badge-tentative'}`}>
                                {c.calendarStatus}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={() => setSelectedCustomer(c)}
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 2: DATA PELANGGAN & CRM (EXACT MATCH TO USER SCREENSHOT)
              ========================================================= */}
          {activeSection === 'customers' && (
            <div id="sec-customers" className="admin-section active">
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ color: 'var(--adm-gold)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Manajemen Relasi & Data Klien (CRM)
                  </div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Direktori Data Pelanggan & Klien</h1>
                  <p style={{ color: 'var(--adm-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    Kelola kontak klien, riwayat acara, status booking, preferensi khusus, dan total nilai kontrak seumur hidup (LTV).
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      const csvContent = 'data:text/csv;charset=utf-8,Nama,WA,Kategori,Nilai Kontrak,Status\n' + 
                        filteredCustomers.map(c => `"${c.name}","${c.phone}","${c.category}","${c.contractValue}","${c.paymentStatus}"`).join('\n');
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement('a');
                      link.setAttribute('href', encodedUri);
                      link.setAttribute('download', 'kontak_klien_mc_connect.csv');
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success('Data kontak klien berhasil di-export ke CSV!');
                    }}
                  >
                    📥 Export Kontak CSV
                  </button>
                  <button className="btn btn-primary" onClick={() => setShowAddCustomerModal(true)}>
                    + Tambah Pelanggan Baru
                  </button>
                </div>
              </div>

              {/* Dynamic Customer Metric Cards (Based on Client Categories) */}
              <div
                id="crmTopSummaryCards"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                <div className="stat-metric-card gold">
                  <div className="stat-metric-top">
                    <span className="stat-metric-label">Total Pelanggan Terdaftar</span>
                    <div className="stat-metric-icon">👥</div>
                  </div>
                  <div className="stat-metric-val gold" id="custMetricTotal">
                    {crmTotalCust} Klien
                  </div>
                  <div className="stat-metric-foot">
                    <span style={{ color: 'var(--adm-gold)', fontWeight: 700 }}>★ Terintegrasi</span>
                    <span>Database CRM MC-Connect</span>
                  </div>
                </div>

                <div className="stat-metric-card blue">
                  <div className="stat-metric-top">
                    <span className="stat-metric-label">Klien Booking Aktif</span>
                    <div className="stat-metric-icon">💍</div>
                  </div>
                  <div className="stat-metric-val">{crmActiveCount} Acara</div>
                  <div className="stat-metric-foot">
                    <span style={{ color: 'var(--adm-info)', fontWeight: 700 }}>Sedang Berjalan</span>
                    <span>Database CRM</span>
                  </div>
                </div>

                <div
                  className="stat-metric-card"
                  style={{
                    borderColor: 'rgba(248,113,113,0.4)',
                    background: 'linear-gradient(135deg, rgba(248,113,113,0.08) 0%, transparent 100%)',
                  }}
                >
                  <div className="stat-metric-top">
                    <span className="stat-metric-label">Pelanggan Belum Lunas</span>
                    <div className="stat-metric-icon">⚠️</div>
                  </div>
                  <div className="stat-metric-val" style={{ color: '#F87171' }}>
                    {crmBelumLunas} Klien
                  </div>
                  <div className="stat-metric-foot">
                    <span style={{ color: '#F87171', fontWeight: 700 }}>Perlu Follow-Up</span>
                    <span>Status Pembayaran</span>
                  </div>
                </div>

                <div className="stat-metric-card purple">
                  <div className="stat-metric-top">
                    <span className="stat-metric-label">Total Nilai Kontrak (LTV)</span>
                    <div className="stat-metric-icon">💎</div>
                  </div>
                  <div className="stat-metric-val" style={{ color: '#A78BFA' }}>
                    {formatRupiah(crmTotalLtv)}
                  </div>
                  <div className="stat-metric-foot">
                    <span style={{ color: '#A78BFA', fontWeight: 700 }}>Akumulasi LTV</span>
                    <span>Total Keseluruhan</span>
                  </div>
                </div>
              </div>

              {/* CRM Analytics Pie Charts */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                {/* CRM Category Pie */}
                <div
                  className="ecc-card"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    alignItems: 'center',
                  }}
                >
                  <h4 style={{ fontSize: '1rem', margin: 0, textAlign: 'center', color: 'var(--adm-text-primary)' }}>
                    Proporsi Kategori Acara (CRM)
                  </h4>
                  <div style={{ width: '140px', height: '140px', position: 'relative' }}>
                    <svg viewBox="-1 -1 2 2" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      {crmCategoryPies.map((p, idx) => (
                        <circle
                          key={idx}
                          r="0.5"
                          cx="0"
                          cy="0"
                          fill="transparent"
                          stroke={p.color}
                          strokeWidth="1"
                          strokeDasharray={p.strokeDasharray}
                          strokeDashoffset={p.strokeDashoffset}
                        />
                      ))}
                    </svg>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      width: '100%',
                      fontSize: '0.8rem',
                      maxHeight: '100px',
                      overflowY: 'auto',
                      paddingRight: '5px',
                    }}
                  >
                    {crmCategoryPies.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            color: p.color,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '120px',
                          }}
                          title={p.name}
                        >
                          ● {p.name}
                        </span>
                        <span style={{ fontWeight: 700 }}>
                          {p.val}{' '}
                          <span style={{ fontSize: '0.7rem', color: 'var(--adm-text-muted)', fontWeight: 'normal' }}>
                            ({Math.round(p.pct * 100)}%)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CRM Client Category Pie */}
                <div
                  className="ecc-card"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    alignItems: 'center',
                  }}
                >
                  <h4 style={{ fontSize: '1rem', margin: 0, textAlign: 'center', color: 'var(--adm-text-primary)' }}>
                    Proporsi Kategori Klien (CRM)
                  </h4>
                  <div style={{ width: '140px', height: '140px', position: 'relative' }}>
                    <svg viewBox="-1 -1 2 2" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      {crmClientCategoryPies.map((p, idx) => (
                        <circle
                          key={idx}
                          r="0.5"
                          cx="0"
                          cy="0"
                          fill="transparent"
                          stroke={p.color}
                          strokeWidth="1"
                          strokeDasharray={p.strokeDasharray}
                          strokeDashoffset={p.strokeDashoffset}
                        />
                      ))}
                    </svg>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      width: '100%',
                      fontSize: '0.8rem',
                      maxHeight: '100px',
                      overflowY: 'auto',
                      paddingRight: '5px',
                    }}
                  >
                    {crmClientCategoryPies.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            color: p.color,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '120px',
                          }}
                          title={p.name}
                        >
                          ● {p.name}
                        </span>
                        <span style={{ fontWeight: 700 }}>
                          {p.val}{' '}
                          <span style={{ fontSize: '0.7rem', color: 'var(--adm-text-muted)', fontWeight: 'normal' }}>
                            ({Math.round(p.pct * 100)}%)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Customer Directory Table Card */}
              <div className="ecc-card">
                <div className="ecc-card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <div className="ecc-card-title">👥 Daftar Klien & Riwayat Kerjasama</div>
                  
                  {/* Search and Filters Bar */}
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Cari nama, WA, email, acara..."
                      value={custSearch}
                      onChange={(e) => setCustSearch(e.target.value)}
                      style={{ width: '220px', maxWidth: '100%', flex: '0 1 auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: 'var(--adm-radius-md)', color: '#FFF' }}
                    />

                    <select 
                      className="form-select"
                      value={custCategoryFilter}
                      onChange={(e) => setCustCategoryFilter(e.target.value)}
                      style={{ width: 'auto', flex: '0 1 auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem', background: 'var(--adm-bg-surface)', border: '1px solid rgba(212,175,55,0.35)', borderRadius: 'var(--adm-radius-md)', color: '#E2E8F0', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <option value="all">📁 Semua Kategori Acara</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Gala Dinner">Gala Dinner</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Sweet 17">Sweet 17</option>
                      <option value="Birthday">Birthday</option>
                    </select>

                    <select 
                      className="form-select"
                      value={custClientCategoryFilter}
                      onChange={(e) => setCustClientCategoryFilter(e.target.value)}
                      style={{ width: 'auto', flex: '0 1 auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem', background: 'var(--adm-bg-surface)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 'var(--adm-radius-md)', color: '#E2E8F0', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <option value="all">👥 Semua Kategori Klien</option>
                      <option value="VIP">⭐ VIP</option>
                      <option value="CORPORATE">Corporate</option>
                      <option value="REGULAR">Regular</option>
                    </select>

                    <select 
                      className="form-select"
                      value={custPaymentFilter}
                      onChange={(e) => setCustPaymentFilter(e.target.value)}
                      style={{ width: 'auto', flex: '0 1 auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem', background: 'var(--adm-bg-surface)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: 'var(--adm-radius-md)', color: '#E2E8F0', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <option value="all">Semua Status Bayar</option>
                      <option value="Lunas">Lunas / 100%</option>
                      <option value="DP">DP Paid</option>
                      <option value="Review">Review / Hold</option>
                      <option value="Belum">Belum Bayar</option>
                    </select>

                    <select 
                      className="form-select"
                      value={custCalendarFilter}
                      onChange={(e) => setCustCalendarFilter(e.target.value)}
                      style={{ width: 'auto', flex: '0 1 auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem', background: 'var(--adm-bg-surface)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: 'var(--adm-radius-md)', color: '#E2E8F0', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <option value="all">Semua Kalender</option>
                      <option value="Terkunci">Terkunci</option>
                      <option value="Review">Review</option>
                      <option value="Tentative">Tentative</option>
                    </select>
                  </div>
                </div>

                {/* Table Container */}
                <div className="table-clean-wrapper" style={{ overflowX: 'auto' }}>
                  <table className="table-clean" style={{ width: '100%', minWidth: '980px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid var(--adm-border)' }}>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase' }}>Klien & Kontak</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase' }}>Kategori Acara</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase' }}>Kategori Klien</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase' }}>Acara Terkait & Tanggal</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase' }}>Nilai Kontrak</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase' }}>Status Pembayaran</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase' }}>Status Kalender</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--adm-text-muted)' }}>
                            Tidak ada data pelanggan yang sesuai dengan filter pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((cust) => {
                          const initials = cust.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                          return (
                            <tr key={cust.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                              {/* Klien & Kontak */}
                              <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div 
                                    style={{
                                      width: '38px',
                                      height: '38px',
                                      borderRadius: '50%',
                                      background: '#EA580C',
                                      color: '#FFF',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 800,
                                      fontSize: '0.85rem',
                                      flexShrink: 0
                                    }}
                                  >
                                    {initials}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#FFF', fontSize: '0.9rem' }}>{cust.name}</div>
                                    <a 
                                      href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}`} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      style={{ color: 'var(--adm-text-secondary)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}
                                    >
                                      📞 {cust.phone}
                                    </a>
                                  </div>
                                </div>
                              </td>

                              {/* Kategori Acara */}
                              <td style={{ padding: '1rem' }}>
                                <span 
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    color: '#60A5FA',
                                    border: '1px solid rgba(59, 130, 246, 0.3)'
                                  }}
                                >
                                  {cust.category === 'Corporate' && '⭐ CORPORATE'}
                                  {cust.category === 'Gala Dinner' && '🔥 GALA DINNER'}
                                  {cust.category === 'Sweet 17' && 'SWEET 17'}
                                  {cust.category === 'Wedding' && '👑 WEDDING'}
                                  {cust.category !== 'Corporate' && cust.category !== 'Gala Dinner' && cust.category !== 'Sweet 17' && cust.category !== 'Wedding' && cust.category.toUpperCase()}
                                </span>
                              </td>

                              {/* Kategori Klien */}
                              <td style={{ padding: '1rem' }}>
                                <span 
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    background: cust.clientCategory === 'VIP' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                    color: cust.clientCategory === 'VIP' ? 'var(--adm-gold)' : '#CBD5E1',
                                    border: cust.clientCategory === 'VIP' ? '1px solid rgba(212, 175, 55, 0.35)' : '1px solid rgba(255, 255, 255, 0.15)'
                                  }}
                                >
                                  {cust.clientCategory === 'VIP' ? '⭐ VIP' : cust.clientCategory}
                                </span>
                              </td>

                              {/* Acara Terkait & Tanggal */}
                              <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: 700, color: '#FFF', fontSize: '0.85rem' }}>{cust.eventName}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--adm-text-secondary)', marginTop: '0.2rem' }}>
                                  <span>📅 {cust.eventDate}</span>
                                  <span>•</span>
                                  <span>🕒 {cust.eventTime}</span>
                                </div>
                              </td>

                              {/* Nilai Kontrak */}
                              <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: 800, color: '#FFF', fontSize: '0.9rem' }}>
                                  {formatRupiah(cust.contractValue)}
                                </div>
                              </td>

                              {/* Status Pembayaran */}
                              <td style={{ padding: '1rem' }}>
                                <span 
                                  style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    background: cust.paymentStatus === 'LUNAS 100%' 
                                      ? 'rgba(16, 185, 129, 0.18)' 
                                      : cust.paymentStatus === 'DP 50%' 
                                      ? 'rgba(20, 184, 166, 0.18)' 
                                      : 'rgba(245, 158, 11, 0.18)',
                                    color: cust.paymentStatus === 'LUNAS 100%' 
                                      ? '#34D399' 
                                      : cust.paymentStatus === 'DP 50%' 
                                      ? '#2DD4BF' 
                                      : '#FBBF24',
                                    border: '1px solid currentColor'
                                  }}
                                >
                                  {cust.paymentStatus}
                                </span>
                              </td>

                              {/* Status Kalender */}
                              <td style={{ padding: '1rem' }}>
                                <span 
                                  style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    background: cust.calendarStatus === 'TERKUNCI' 
                                      ? 'rgba(239, 68, 68, 0.18)' 
                                      : 'rgba(245, 158, 11, 0.18)',
                                    color: cust.calendarStatus === 'TERKUNCI' 
                                      ? '#F87171' 
                                      : '#FBBF24',
                                    border: '1px solid currentColor'
                                  }}
                                >
                                  {cust.calendarStatus}
                                </span>
                              </td>

                              {/* Aksi */}
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                  <button 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setSelectedCustomer(cust)}
                                    title="Lihat Detail Profil Klien"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    👁️ Detail
                                  </button>

                                  <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => {
                                      onSelectEvent(cust.eventId);
                                      setActiveSection('command-center');
                                    }}
                                    title="Buka di Event Command Center"
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 800 }}
                                  >
                                    ECC
                                  </button>

                                  <button 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setActiveSection('calendar')}
                                    title="Lihat Kalender Acara"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    📅 Kalender
                                  </button>

                                  <button 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                      if (confirm(`Hapus klien ${cust.name}?`)) {
                                        setEvents(prev => prev.filter(e => e.id !== cust.eventId));
                                        toast.info(`Data klien ${cust.name} dihapus.`);
                                      }
                                    }}
                                    title="Hapus Klien"
                                    style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem', color: '#F87171' }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--adm-border)', fontSize: '0.8rem', color: 'var(--adm-text-secondary)', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    Menampilkan <strong>{filteredCustomers.length}</strong> data klien terdaftar
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.5 }}>Sebelumnya</button>
                    <span>Halaman 1 dari 1</span>
                    <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.5 }}>Selanjutnya</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 3: EVENT COMMAND CENTER (FULL FEATURED)
              ========================================================= */}
          {activeSection === 'command-center' && (
            <div id="sec-command-center" className="admin-section active">
              {/* Command Center Top Header Bar (100% Parity Luxury ECC Header) */}
              {activeEvent && (
                <div
                  className="ecc-header ecc-card"
                  style={{
                    marginBottom: '2.5rem',
                    alignItems: 'flex-start',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)',
                    border: '1px solid rgba(212,175,55,0.15)',
                    padding: '2rem 2.5rem',
                    borderRadius: '18px',
                    boxShadow: '0 15px 45px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="ecc-title-group" style={{ flex: 1, minWidth: '340px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                      <span
                        className={`badge ${activeEvent.status?.toLowerCase() === 'terkunci' ? 'badge-locked' : 'badge-review'}`}
                        id="ccEventStatusBadge"
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.45rem 1rem',
                          textTransform: 'uppercase',
                          letterSpacing: '1.5px',
                          boxShadow: '0 0 20px rgba(212,175,55,0.25)',
                          border: '1px solid rgba(212,175,55,0.4)',
                        }}
                      >
                        STATUS: {activeEvent.status?.toUpperCase() || 'TERKUNCI (DP PAID)'}
                      </span>
                      <span
                        id="ccEventIdDisplay"
                        style={{
                          color: 'var(--adm-text-muted)',
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          background: 'rgba(0,0,0,0.4)',
                          padding: '0.4rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                        }}
                      >
                        Event_ID #{activeEvent.id}
                      </span>
                      {/* Event Switcher Dropdown */}
                      <select
                        value={selectedEventId}
                        onChange={(e) => onSelectEvent(Number(e.target.value))}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(212,175,55,0.3)',
                          borderRadius: '8px',
                          padding: '0.35rem 0.75rem',
                          color: 'var(--adm-gold)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="Pilih Acara yang Sedang Dikelola"
                      >
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id} style={{ background: '#0F172A', color: '#FFF' }}>
                            #{ev.id} • {ev.title || ev.nama_acara} ({ev.date})
                          </option>
                        ))}
                      </select>
                    </div>

                    <h1
                      id="ccEventTitle"
                      style={{
                        fontSize: '2.8rem',
                        fontWeight: 900,
                        margin: '0 0 1.5rem 0',
                        color: '#F8FAFC',
                        letterSpacing: '-0.03em',
                        lineHeight: 1.1,
                        textShadow: '0 4px 12px rgba(0,0,0,0.8)',
                      }}
                    >
                      {activeEvent.title || activeEvent.nama_acara || 'Wedding Reception Farhan & Natasha'}
                    </h1>

                    <div
                      className="ecc-meta-bar"
                      style={{
                        display: 'flex',
                        gap: '0.85rem',
                        flexWrap: 'wrap',
                        fontSize: '0.9rem',
                        color: 'var(--adm-text-secondary)',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          background: 'rgba(255,255,255,0.03)',
                          padding: '0.6rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.04)',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        <span style={{ color: 'var(--adm-gold)' }}>📅</span>
                        <span id="ccEventMetaDate" style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '0.9rem' }}>
                          {activeEvent.date}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          background: 'rgba(255,255,255,0.03)',
                          padding: '0.6rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.04)',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        <span style={{ color: '#38BDF8' }}>⏰</span>
                        <span id="ccEventMetaTime" style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '0.9rem' }}>
                          {activeEvent.time || '18:00 - 21:00 WIB'}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          background: 'rgba(255,255,255,0.03)',
                          padding: '0.6rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.04)',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        <span style={{ color: '#10B981' }}>📍</span>
                        <span id="ccEventMetaVenue" style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '0.9rem' }}>
                          {activeEvent.venue || activeEvent.lokasi || 'Grand Ballroom Hotel Mulia Senayan'}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          background: 'rgba(255,255,255,0.03)',
                          padding: '0.6rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.04)',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        <span style={{ color: '#F472B6' }}>👤</span>
                        <span id="ccEventMetaPic" style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '0.9rem' }}>
                          PIC: {activeEvent.pic || 'Farhan'} ({activeEvent.phone || '081122334455'})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="ecc-actions"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'flex-start',
                      gap: '1.5rem',
                    }}
                  >
                    {/* Row 1: Status & Hapus */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          padding: '0.25rem',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid rgba(255,255,255,0.15)',
                          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--adm-text-secondary)',
                            padding: '0 0.5rem 0 0.75rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Set Status:
                        </span>
                        <select
                          className="form-select"
                          id="ccStatusSelect"
                          value={activeEvent.status || 'Terkunci'}
                          onChange={(e) => handleUpdateEventStatus(e.target.value)}
                          style={{
                            width: 'auto',
                            padding: '0.4rem 1.5rem 0.4rem 0.5rem',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--adm-gold)',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="Review" style={{ background: '#0F172A', color: '#FFF' }}>Review</option>
                          <option value="Tentative" style={{ background: '#0F172A', color: '#FFF' }}>Tentative</option>
                          <option value="Terkunci" style={{ background: '#0F172A', color: '#D4AF37' }}>Terkunci (DP Paid)</option>
                          <option value="Selesai" style={{ background: '#0F172A', color: '#10B981' }}>Selesai</option>
                        </select>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDeleteEvent(activeEvent.id)}
                        style={{
                          color: '#FCA5A5',
                          background: 'rgba(239,68,68,0.15)',
                          borderColor: 'rgba(239,68,68,0.4)',
                          padding: '0.6rem',
                          borderRadius: '12px',
                        }}
                        title="Hapus Acara"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Row 2: Main Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <a
                        href={`/stage?eventId=${activeEvent.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{
                          padding: '0.75rem 1.5rem',
                          fontSize: '0.95rem',
                          fontWeight: 900,
                          borderRadius: '12px',
                          boxShadow: '0 6px 20px rgba(212,175,55,0.4)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          textDecoration: 'none',
                        }}
                      >
                        ↑ MASUK STAGE MODE
                      </a>
                      <a
                        href={`/vendor?eventId=${activeEvent.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '0.75rem 1.25rem',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          borderRadius: '12px',
                          borderColor: 'rgba(255,255,255,0.25)',
                          background: 'rgba(255,255,255,0.06)',
                          textDecoration: 'none',
                        }}
                        title="Layar Khusus Operator Suara/DJ"
                      >
                        ♫ Vendor Musik
                      </a>
                      <button
                        className="btn btn-outline-gold btn-sm"
                        style={{
                          padding: '0.75rem 1.25rem',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          borderRadius: '12px',
                        }}
                        onClick={() => {
                          toast.info(`Edit jadwal acara #${activeEvent.id}`);
                        }}
                        title="Edit Venue & Jam Acara"
                      >
                        ✏️ Edit
                      </button>
                      <a
                        href={`/invoices/${activeEvent.id}/print`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '0.75rem 1.25rem',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          borderRadius: '12px',
                          textDecoration: 'none',
                        }}
                      >
                        Cetak Invoice
                      </a>
                      <a
                        href={`/events/${activeEvent.id}/spk`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-gold btn-sm"
                        style={{
                          padding: '0.75rem 1.25rem',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          borderRadius: '12px',
                          textDecoration: 'none',
                        }}
                        title="Cetak Surat Perjanjian Kerja (SPK) Kontrak Resmi"
                      >
                        📄 Cetak SPK
                      </a>
                      <a
                        href={`/invoices/${activeEvent.id}/thermal`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '0.75rem 1.25rem',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          borderRadius: '12px',
                          textDecoration: 'none',
                        }}
                        title="Cetak Struk Kasir Thermal Bluetooth (58mm/80mm)"
                      >
                        🧾 Struk Thermal
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Command Center Tabs Bar */}
              <div className="ecc-nav-tabs" style={{ marginBottom: '1.5rem' }}>
                <button 
                  onClick={() => setActiveTab('crm')}
                  className={`ecc-tab-btn ${(activeTab === 'crm' || activeTab === 'overview') ? 'active' : ''}`}
                >
                  <span>Ikhtisar & CRM</span>
                </button>
                <button 
                  onClick={() => setActiveTab('finance')}
                  className={`ecc-tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
                >
                  <span>Keuangan & Invoice</span>
                </button>
                <button 
                  onClick={() => setActiveTab('stage')}
                  className={`ecc-tab-btn ${(activeTab === 'stage' || activeTab === 'rundown') ? 'active' : ''}`}
                >
                  <span>Stage, Rundown & AI</span>
                </button>
                <button 
                  onClick={() => setActiveTab('music')}
                  className={`ecc-tab-btn ${activeTab === 'music' ? 'active' : ''}`}
                >
                  <span>Musik & Sound Acara</span>
                </button>
                <button 
                  onClick={() => setActiveTab('vendor')}
                  className={`ecc-tab-btn ${activeTab === 'vendor' ? 'active' : ''}`}
                >
                  <span>Kolaborasi Vendor</span>
                </button>
              </div>

              {/* Tab 1: Overview & CRM (100% Legacy Parity) */}
              {(activeTab === 'overview' || activeTab === 'crm') && activeEvent && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Row 1: Profil Klien & Detail Booking + Sticky Notes VIP Info */}
                  <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                    {/* Profil Klien & Detail Booking */}
                    <div className="ecc-card">
                      <div className="ecc-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                        <div className="ecc-card-title" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFF' }}>Profil Klien & Detail Booking</div>
                        <span className="badge badge-locked" id="eccClientBadge" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          DP DIBAYAR
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div
                          id="eccClientAvatar"
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #D4AF37, #B38F26)',
                            color: '#0B0F19',
                            fontWeight: 800,
                            fontSize: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 0 15px rgba(212,175,55,0.4)',
                          }}
                        >
                          {(activeEvent.pic || activeEvent.client || 'FA').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 id="eccClientName" style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: 'var(--adm-text-primary)' }}>
                            {activeEvent.pic || activeEvent.client || 'Farhan'}
                          </h3>
                          <div id="eccClientContact" style={{ fontSize: '0.85rem', color: 'var(--adm-text-secondary)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span>📞 {activeEvent.phone || '081122334455'}</span>
                            <span>✉️ {activeEvent.email || 'farhan@mcconnect.id'}</span>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                          gap: '0.75rem',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: '1px solid var(--adm-border)',
                          marginBottom: '1.25rem',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', display: 'block' }}>Paket Layanan:</span>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--adm-gold)' }} id="eccClientPkg">{activeEvent.package || activeEvent.category || 'Corporate'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', display: 'block' }}>Kategori Client:</span>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--adm-gold)' }} id="eccClientCategory">{activeEvent.client_category || 'VIP'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', display: 'block' }}>Nilai Kontrak:</span>
                          <strong style={{ fontSize: '0.85rem', color: '#34D399' }} id="eccClientPrice">{activeEvent.price || formatRupiah(activeEvent.rawPrice || 16645000)}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', display: 'block' }}>Durasi Panggung:</span>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--adm-text-primary)' }} id="eccClientDuration">{activeEvent.time || '18:00 - 21:00 WIB'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', display: 'block' }}>Venue:</span>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--adm-text-primary)' }} id="eccClientVenue">{activeEvent.venue || activeEvent.lokasi || 'Grand Ballroom Hotel Mulia'}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <a
                          href={`https://wa.me/${String(activeEvent.phone || '081122334455').replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          id="eccClientWaBtn"
                          style={{ color: '#22C55E', borderColor: 'rgba(34,197,94,0.4)', textDecoration: 'none' }}
                        >
                          💬 Chat WA Langsung
                        </a>
                        <button
                          className="btn btn-secondary btn-sm"
                          id="eccClientCrmBtn"
                          onClick={() => setActiveSection('customers')}
                        >
                          Detail Lengkap di CRM
                        </button>
                        <a
                          href={`/invoices/${activeEvent.id}/print`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          Unduh Invoice PDF
                        </a>
                      </div>
                    </div>

                    {/* Sticky Notes & VIP Info */}
                    <div className="ecc-card" style={{ borderLeft: '4px solid var(--adm-gold)' }}>
                      <div className="ecc-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                        <div className="ecc-card-title" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFF' }}>Sticky Notes & VIP Info</div>
                        <span className="badge badge-locked" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--adm-gold)' }}>
                          Prioritas Tinggi
                        </span>
                      </div>

                      {/* Sticky Note Post-it Card */}
                      <div className="sticky-note-card" style={{ marginBottom: '1.25rem' }}>
                        <div className="sticky-note-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontWeight: 800, fontSize: '0.85rem', color: '#78350F' }}>
                          <span>Catatan Khusus Acara (Urgent)</span>
                          <span style={{ fontSize: '0.7rem', background: 'rgba(120,53,15,0.15)', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>Auto-saved</span>
                        </div>
                        <textarea
                          id="tabStickyNotesText"
                          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '0.88rem', color: '#78350F', resize: 'none', minHeight: '80px', lineHeight: 1.4 }}
                          placeholder="Tulis catatan penting acara di sini..."
                          value={eccStickyNotes}
                          onChange={(e) => setEccStickyNotes(e.target.value)}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#92400E', marginTop: '0.35rem', borderTop: '1px dashed rgba(120,53,15,0.3)', paddingTop: '0.35rem' }}>
                          <span id="eccStickySubtitle">* Tersimpan ke Event_ID #{activeEvent.id}</span>
                          <span style={{ fontStyle: 'italic' }}>Klik untuk mengedit langsung</span>
                        </div>
                      </div>

                      {/* Protokol Nama & Gelar Tamu VIP */}
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--adm-border)', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--adm-gold)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Protokol Nama & Gelar Tamu VIP</span>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.15rem 0.45rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              const role = prompt('Masukkan Jabatan / Kategori Tamu (contoh: Menteri BUMN):');
                              if (!role) return;
                              const name = prompt('Masukkan Nama Lengkap & Gelar (contoh: Bpk. Erick Thohir):');
                              if (!name) return;
                              setEccVipProtocols(prev => [...prev, { role: role + ':', name }]);
                            }}
                          >
                            + Tambah
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.83rem' }} id="eccVipProtocolList">
                          {eccVipProtocols.map((vip, vIdx) => (
                            <div key={vIdx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: vIdx < eccVipProtocols.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', paddingBottom: '0.3rem' }}>
                              <span style={{ color: 'var(--adm-text-muted)' }}>{vip.role}</span>
                              <strong style={{ color: '#F8FAFC' }}>{vip.name}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Checklist Kesiapan MC & WhatsApp Gateway */}
                  <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                    {/* Checklist Kesiapan MC Panggung */}
                    <div className="ecc-card">
                      <div className="ecc-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                        <div className="ecc-card-title" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFF' }}>Checklist Kesiapan MC Panggung</div>
                        <span className="badge badge-available" id="adminChkCount">
                          {eccChecklist.filter(c => c.done).length}/{eccChecklist.length} Selesai ({Math.round((eccChecklist.filter(c => c.done).length / (eccChecklist.length || 1)) * 100)}%)
                        </span>
                      </div>

                      <div className="checklist-progress-bar" style={{ marginBottom: '1rem', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          className="checklist-progress-fill"
                          id="adminChkBar"
                          style={{
                            height: '100%',
                            width: `${Math.round((eccChecklist.filter(c => c.done).length / (eccChecklist.length || 1)) * 100)}%`,
                            background: 'linear-gradient(90deg, #10B981, #34D399)',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} id="adminChkList">
                        {eccChecklist.map((item, cIdx) => (
                          <label key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.88rem', color: item.done ? 'var(--adm-text-muted)' : '#FFF', textDecoration: item.done ? 'line-through' : 'none' }}>
                            <input
                              type="checkbox"
                              checked={item.done}
                              onChange={() => {
                                setEccChecklist(prev => prev.map((c, i) => i === cIdx ? { ...c, done: !c.done } : c));
                              }}
                            />
                            <span>{item.text}</span>
                          </label>
                        ))}
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newChecklistText.trim()) return;
                          setEccChecklist(prev => [...prev, { text: newChecklistText.trim(), done: false }]);
                          setNewChecklistText('');
                        }}
                        style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}
                      >
                        <input
                          type="text"
                          className="form-input"
                          id="adminNewChkInput"
                          placeholder="+ Tambah tugas persiapan baru..."
                          value={newChecklistText}
                          onChange={(e) => setNewChecklistText(e.target.value)}
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', flex: 1, background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', color: '#FFF' }}
                        />
                        <button type="submit" className="btn btn-secondary btn-sm">Tambah</button>
                      </form>
                    </div>

                    {/* WhatsApp Automation Gateway */}
                    <div className="ecc-card">
                      <div className="ecc-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                        <div className="ecc-card-title" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFF' }}>WhatsApp Automation Gateway</div>
                        <span className="badge badge-review">Kirim Pesan Otomatis</span>
                      </div>
                      <div className="wa-automation-list" id="ccWaAutomationList" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                          { title: 'Konfirmasi DP & Booking Terkunci', desc: 'Kirim bukti tanda jadi dan kontrak SPK digital', tag: 'DP Paid' },
                          { title: 'Reminder H-7 Gladi Bersih & Rundown', desc: 'Kirim rundown terbaru ke WO & Klien', tag: 'H-7 Event' },
                          { title: 'Pemberitahuan Pelunasan H-3', desc: 'Instruksi transfer sisa 50% pelunasan kontrak', tag: 'Billing' },
                          { title: 'Ucapan Terima Kasih & Review Acara', desc: 'Kirim link formulir ulasan bintang 5 pasca acara', tag: 'Post-Event' },
                        ].map((wa, wIdx) => (
                          <div key={wIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--adm-border)', borderRadius: '8px' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#FFF' }}>{wa.title}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--adm-text-secondary)' }}>{wa.desc}</div>
                            </div>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                const phone = String(activeEvent.phone || '081122334455').replace(/^0/, '62').replace(/[^0-9]/g, '');
                                const msg = encodeURIComponent(`Halo ${activeEvent.pic || 'Kak'}, ini dari Manajemen MC Arkanza terkait acara "${activeEvent.title}". ${wa.desc}. Terima kasih!`);
                                window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                              }}
                              style={{ color: '#22C55E', borderColor: 'rgba(34,197,94,0.3)', fontSize: '0.75rem' }}
                            >
                              Kirim WA ↗
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Wardrobe Assigned to Event */}
                  <div className="ecc-card">
                    <div className="ecc-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                      <div className="ecc-card-title" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFF' }}>Wardrobe Assigned to Event</div>
                      <button className="btn btn-secondary btn-sm" onClick={() => setActiveSection('wardrobe')}>
                        Pilih Gaun dari Koleksi
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--adm-border)', borderRadius: '8px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                        👔
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#FFF', fontSize: '0.9rem' }}>Royal Gold Velvet Tuxedo</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--adm-text-secondary)' }}>Kategori: Formal Black Tie • Status: Siap Pakai</div>
                      </div>
                      <span className="badge badge-locked" style={{ marginLeft: 'auto' }}>Assigned</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Finance & Net Profit */}
              {activeTab === 'finance' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="ecc-card">
                      <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>NILAI KONTRAK</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF' }}>
                        {formatRupiah(financialData?.financials?.contract_value || 16645000)}
                      </div>
                    </div>
                    <div className="ecc-card">
                      <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>DP DITERIMA (50%)</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34D399' }}>
                        {formatRupiah(financialData?.financials?.dp_received || 8322500)}
                      </div>
                    </div>
                    <div className="ecc-card">
                      <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>TOTAL BEBAN BIAYA</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F87171' }}>
                        {formatRupiah(financialData?.financials?.total_expenses || 1600000)}
                      </div>
                    </div>
                    <div className="ecc-card">
                      <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>ESTIMASI LABA BERSIH</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--adm-gold)' }}>
                        {formatRupiah(financialData?.financials?.net_profit || 15045000)}
                      </div>
                    </div>
                  </div>

                  {/* Form Input Beban Baru */}
                  <div className="ecc-card">
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem', color: '#FFF' }}>
                      + Catat Pengeluaran Operasional (Beban Acara)
                    </h4>
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const amountNum = parseFloat(expenseAmount.replace(/[^0-9]/g, ''));
                        if (!amountNum || !expenseDesc.trim()) {
                          toast.error('Isi nominal dan deskripsi pengeluaran.');
                          return;
                        }
                        setIsSubmittingExpense(true);
                        try {
                          const res = await fetch(`/api/events/${selectedEventId}/expenses`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'same-origin',
                            body: JSON.stringify({ category: expenseCategory, description: expenseDesc, amount: amountNum })
                          });
                          if (res.ok) {
                            toast.success('Pengeluaran berhasil dicatat!');
                            setExpenseDesc('');
                            setExpenseAmount('');
                          }
                        } catch(err) {
                          toast.error('Gagal mencatat pengeluaran.');
                        } finally {
                          setIsSubmittingExpense(false);
                        }
                      }}
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}
                    >
                      <select 
                        value={expenseCategory} 
                        onChange={(e) => setExpenseCategory(e.target.value)}
                        style={{ background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }}
                      >
                        <option value="transport">Transportasi & Tol</option>
                        <option value="wardrobe">Dry Cleaning & Wardrobe</option>
                        <option value="assistant">Honor Kru / Asisten</option>
                        <option value="meals">Konsumsi & Meals</option>
                        <option value="other">Lain-lain</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Deskripsi biaya..."
                        value={expenseDesc}
                        onChange={(e) => setExpenseDesc(e.target.value)}
                        style={{ background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }}
                      />
                      <input 
                        type="number" 
                        placeholder="Nominal (Rp)..."
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        style={{ background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }}
                      />
                      <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmittingExpense}>
                        {isSubmittingExpense ? 'Menyimpan...' : '+ Simpan Pengeluaran'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Tab 3: Stage, Rundown & AI Script Co-Pilot */}
              {(activeTab === 'stage' || activeTab === 'rundown') && (
                <div className="space-y-4">
                  {/* AI Co-Pilot Trigger Bar */}
                  <div className="ecc-card" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(15,23,42,0.9))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--adm-gold)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Sparkles className="h-4 w-4" /> AI MC SCRIPT CO-PILOT
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--adm-text-secondary)', margin: '0.2rem 0 0' }}>
                          Generate skrip panggung elegan sesuai jenis segmen & karakter mempelai secara instan.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select 
                          value={selectedSegmentForAi} 
                          onChange={(e) => setSelectedSegmentForAi(Number(e.target.value))}
                          style={{ background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.4rem', color: '#FFF', fontSize: '0.8rem' }}
                        >
                          {rundownList.map((seg) => (
                            <option key={seg.id} value={seg.id}>
                              Segmen #{seg.id}: {seg.title}
                            </option>
                          ))}
                        </select>

                        <select 
                          value={aiTone} 
                          onChange={(e) => setAiTone(e.target.value as any)}
                          style={{ background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.4rem', color: '#FFF', fontSize: '0.8rem' }}
                        >
                          <option value="romantic_warm">Romantis & Hangat</option>
                          <option value="formal">Resmi & Kenegaraan</option>
                          <option value="energetic_fun">Energik & Meriah</option>
                          <option value="elegant_luxury">Luxury & Intimate</option>
                        </select>

                        <button 
                          onClick={handleGenerateAiScript}
                          disabled={aiGenerating}
                          className="btn btn-primary btn-sm"
                          style={{ fontWeight: 800 }}
                        >
                          {aiGenerating ? 'Generating...' : '✨ Generate Skrip'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Rundown Timeline List */}
                  <div className="ecc-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--adm-border)', fontWeight: 800 }}>
                      ⏱️ Susunan Rundown Panggung
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {rundownList.map((seg) => (
                        <div 
                          key={seg.id}
                          style={{
                            padding: '1rem',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '1rem',
                            background: seg.isDone ? 'rgba(16, 185, 129, 0.04)' : 'transparent'
                          }}
                        >
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <button 
                              onClick={() => {
                                setRundownList(prev => prev.map(s => s.id === seg.id ? { ...s, isDone: !s.isDone } : s));
                              }}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: seg.isDone ? '2px solid #34D399' : '2px solid var(--adm-border)',
                                background: seg.isDone ? '#34D399' : 'transparent',
                                color: '#000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                marginTop: '0.2rem',
                                flexShrink: 0
                              }}
                            >
                              {seg.isDone && '✓'}
                            </button>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.78rem', color: 'var(--adm-gold)', fontWeight: 700 }}>
                                  {seg.time}
                                </span>
                                <span style={{ fontWeight: 800, color: '#FFF' }}>{seg.title}</span>
                                <span className="badge" style={{ fontSize: '0.7rem' }}>PIC: {seg.pic}</span>
                              </div>

                              <div style={{ fontSize: '0.78rem', color: '#60A5FA', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Music className="h-3 w-3" /> Audio Cue: {seg.music}
                              </div>

                              {seg.script && (
                                <div style={{ marginTop: '0.5rem', padding: '0.6rem 0.85rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', borderLeft: '3px solid var(--adm-gold)', fontSize: '0.8rem', color: 'var(--adm-text-primary)' }}>
                                  &quot;{seg.script}&quot;
                                </div>
                              )}
                            </div>
                          </div>

                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(seg.script || seg.title);
                              toast.success('Skrip cue disalin!');
                            }}
                            title="Salin Skrip Cue"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Musik & Sound Acara (100% Parity) */}
              {activeTab === 'music' && (
                <div className="space-y-4">
                  {/* Banner Offline & Gadget Reliability Note */}
                  <div
                    style={{
                      background: 'rgba(56,189,248,0.06)',
                      border: '1px solid rgba(56,189,248,0.25)',
                      borderRadius: 'var(--adm-radius-md)',
                      padding: '0.85rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.6rem' }}>📱</span>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38BDF8' }}>
                          Mode Offline & Pemutar Langsung di Gadget (Zero Internet Required)
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--adm-text-secondary)' }}>
                          Setiap trek musik cue dapat diputar langsung dari browser via Web Audio API Synthesizer tanpa internet.
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-available" style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid #10B981' }}>
                      Siap Offline di Gadget
                    </span>
                  </div>

                  {/* 4 Metric Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div className="ecc-card" style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Trek Musik</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--adm-gold)', marginTop: '0.2rem' }}>5 Trek</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--adm-text-secondary)', marginTop: '0.25rem' }}>Untuk seluruh rentetan acara</div>
                    </div>
                    <div className="ecc-card" style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Terhubung ke Rundown</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38BDF8', marginTop: '0.2rem' }}>5 / 5 Segmen</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--adm-text-secondary)', marginTop: '0.25rem' }}>100% Sinkron dengan Stage MC</div>
                    </div>
                    <div className="ecc-card" style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Estimasi Durasi Total</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#34D399', marginTop: '0.2rem' }}>180 Menit</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--adm-text-secondary)', marginTop: '0.25rem' }}>Durasi panggung terisi musik</div>
                    </div>
                    <div className="ecc-card" style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Sinkronisasi Vendor FOH</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#A78BFA', marginTop: '0.4rem' }}>Live Broadcast Ready</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--adm-text-secondary)', marginTop: '0.25rem' }}>Layar operator menerima live cue</div>
                    </div>
                  </div>

                  {/* Soundboard Preview */}
                  <div className="ecc-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--adm-gold)', margin: 0 }}>
                          🎹 Pratinjau Interaktif Stage Soundboard (Live Web Audio)
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--adm-text-secondary)', margin: '0.2rem 0 0' }}>
                          Uji suara panggung instan yang akan muncul di layar Stage Mode MC:
                        </p>
                      </div>
                      <span className="badge" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--adm-gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
                        Live Synthesizer DSP
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                      <button onClick={playFanfare} className="btn btn-secondary btn-sm" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', borderColor: '#D4AF37' }}>
                        <span style={{ fontSize: '1.3rem' }}>🎺</span>
                        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--adm-gold)' }}>Fanfare [1]</span>
                      </button>
                      <button onClick={playDrumRoll} className="btn btn-secondary btn-sm" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', borderColor: '#38BDF8' }}>
                        <span style={{ fontSize: '1.3rem' }}>🥁</span>
                        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#38BDF8' }}>Drumroll [2]</span>
                      </button>
                      <button onClick={playApplause} className="btn btn-secondary btn-sm" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', borderColor: '#10B981' }}>
                        <span style={{ fontSize: '1.3rem' }}>👏</span>
                        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#34D399' }}>Applause [3]</span>
                      </button>
                      <button onClick={playChime} className="btn btn-secondary btn-sm" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', borderColor: '#F59E0B' }}>
                        <span style={{ fontSize: '1.3rem' }}>✨</span>
                        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#FBBF24' }}>Chime [4]</span>
                      </button>
                      <button onClick={playBuzzer} className="btn btn-secondary btn-sm" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', borderColor: '#EF4444' }}>
                        <span style={{ fontSize: '1.3rem' }}>🚨</span>
                        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#F87171' }}>Buzzer [5]</span>
                      </button>
                    </div>
                  </div>

                  {/* Playlist Acara Table */}
                  <div className="ecc-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--adm-border)', fontWeight: 800 }}>
                      🎵 Master Cue Sheet Musik Acara Terpilih
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <tr>
                          <th style={{ padding: '0.75rem', color: 'var(--adm-gold)' }}>Segmen Acara</th>
                          <th style={{ padding: '0.75rem', color: 'var(--adm-gold)' }}>Judul Lagu / Cue Audio</th>
                          <th style={{ padding: '0.75rem', color: 'var(--adm-gold)' }}>Instruksi Suara</th>
                          <th style={{ padding: '0.75rem', color: 'var(--adm-gold)', textAlign: 'right' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { seg: 'Opening & Welcoming', cue: 'Fanfare Brass of Triumph Intro', note: 'Fade in saat MC dipanggil naik panggung' },
                          { seg: 'Grand Entrance', cue: 'Canon in D Strings / A Thousand Years', note: 'Naikkan volume 80% saat pintu ballroom dibuka' },
                          { seg: 'Toast & Cake Cutting', cue: 'Celebration Pop Uplifting Beats', note: 'Pukul gong / confetti pop hitungan ketiga' },
                          { seg: 'Games & Ice Break', cue: 'Funky Groovy Upbeat Jazz', note: 'Background audio saat games berlangsung' },
                          { seg: 'Grand Finale & Closing', cue: 'Emotional Cinematic Strings Outro', note: 'Mulai saat MC closing kalimat terakhir' },
                        ].map((m, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '0.75rem' }}><span className="badge">{m.seg}</span></td>
                            <td style={{ padding: '0.75rem', fontWeight: 700, color: '#FFF' }}>{m.cue}</td>
                            <td style={{ padding: '0.75rem', color: 'var(--adm-text-secondary)', fontSize: '0.8rem' }}>{m.note}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  playChime();
                                  toast.info(`Memutar cue: ${m.cue}`);
                                }}
                              >
                                ▶ Test Cue
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 5: Vendor & Music Operator */}
              {activeTab === 'vendor' && (
                <div className="space-y-4">
                  <div className="ecc-card">
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--adm-gold)', marginBottom: '0.75rem' }}>
                      🎧 Sinkronisasi FOH & Operator Audio Real-Time
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--adm-text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                      Layar operator soundman terhubung secara instan via <code>BroadcastChannel(&apos;mc_connect_live_channel&apos;)</code>. Segala pergeseran cue rundown, script, atau sound effect akan langsung sinkron ke monitor operator tanpa reload.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-primary" onClick={() => onOpenVendor(selectedEventId)} style={{ fontWeight: 800 }}>
                        🎧 Buka Layar Operator Musik Full Screen ↗
                      </button>
                      <button className="btn btn-secondary" onClick={() => onOpenStage(selectedEventId)} style={{ fontWeight: 800 }}>
                        🎤 Buka Layar Panggung MC Full Screen ↗
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="ecc-card">
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF', marginBottom: '0.75rem' }}>
                        👥 Kontak & Koordinasi Vendor Terkait
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                        <div><strong>Wedding Organizer:</strong> Mahkota Enterprise (PIC: Bpk. Andre - 0812345678)</div>
                        <div><strong>Sound & Lighting:</strong> SoundWave Production (PIC: Mas Dani - 0819876543)</div>
                        <div><strong>Fotografi & Video:</strong> Luminance Pictures (PIC: Kevin - 0811223344)</div>
                        <div><strong>Catering:</strong> Puspa Catering Service (PIC: Bu Dewi - 0813456789)</div>
                      </div>
                    </div>

                    <div className="ecc-card">
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF', marginBottom: '0.75rem' }}>
                        📋 Catatan Teknis FOH (Soundman)
                      </h4>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.82rem', lineHeight: 1.8, color: 'var(--adm-text-secondary)' }}>
                        <li>Wireless Mic Sennheiser EW-D (Kanal 1 untuk MC Utama).</li>
                        <li>Monitor IEM MC frekuensi 550.250 MHz aktif.</li>
                        <li>Cek audio ducking otomatis: musik turun 12dB saat mikrofon MC aktif.</li>
                        <li>Standby backup mic kabel Shure SM58 di stage wing kanan.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              VIEW 4: KALENDER ACARA (ANTI-BENTROK)
              ========================================================= */}
          {activeSection === 'calendar' && (
            <div id="sec-calendar" className="admin-section active">
              <div
                className="calendar-section-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div
                    style={{
                      color: 'var(--adm-gold)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Kalender Jadwal & Agenda
                  </div>
                  <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem 0' }}>
                    Pemantauan Jadwal Anti-Bentrok
                  </h1>
                  <p style={{ color: 'var(--adm-text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                    Pastikan jam panggung tidak tumpang tindih. Sistem otomatis mengunci tanggal yang
                    berstatus DP Paid secara real-time.
                  </p>
                </div>
                <div className="calendar-actions-bar" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setCalCurrentDate(new Date());
                      toast.info('Kembali ke bulan aktif');
                    }}
                  >
                    <CalendarIcon style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle', display: 'inline-block' }} /> Hari Ini
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: '1 1 auto', minWidth: 0, whiteSpace: 'nowrap' }}
                    onClick={() => setShowAddCustomerModal(true)}
                    title="Tambah Pelanggan & Jadwal Baru"
                  >
                    + Tambah Jadwal Baru
                  </button>
                </div>
              </div>

              {/* KPI Metric Cards for Calendar */}
              <div
                className="dash-stat-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '1.75rem',
                }}
              >
                <div className="stat-metric-card" style={{ borderLeft: '4px solid var(--adm-gold)' }}>
                  <div className="stat-metric-top">
                    <span className="stat-metric-title">
                      <CalendarIcon style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle', display: 'inline-block' }} /> Total Agenda Terjadwal
                    </span>
                    <span
                      className="stat-metric-badge"
                      style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--adm-gold)' }}
                    >
                      Q3–Q4 {calYear}
                    </span>
                  </div>
                  <div className="stat-metric-val" style={{ color: 'var(--adm-gold)' }}>
                    {totalEvents}
                  </div>
                  <div className="stat-metric-foot">
                    <span style={{ color: 'var(--adm-gold)', fontWeight: 700 }}>Aktif</span>
                    <span>Acara terdaftar di kalender</span>
                  </div>
                </div>

                <div className="stat-metric-card" style={{ borderLeft: '4px solid #EF4444' }}>
                  <div className="stat-metric-top">
                    <span className="stat-metric-title">
                      <ShieldCheck style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle', display: 'inline-block' }} /> (DP Paid)
                    </span>
                    <span
                      className="stat-metric-badge"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171' }}
                    >
                      Terkunci
                    </span>
                  </div>
                  <div className="stat-metric-val" style={{ color: '#F87171' }}>
                    {terkunciCount}
                  </div>
                  <div className="stat-metric-foot">
                    <span style={{ color: '#F87171', fontWeight: 700 }}>Anti-Bentrok 100%</span>
                    <span>Slot resmi terkunci</span>
                  </div>
                </div>

                <div className="stat-metric-card" style={{ borderLeft: '4px solid #F59E0B' }}>
                  <div className="stat-metric-top">
                    <span className="stat-metric-title">
                      <Clock style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle', display: 'inline-block' }} /> Tentative & Review
                    </span>
                    <span
                      className="stat-metric-badge"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#FBBF24' }}
                    >
                      Hold
                    </span>
                  </div>
                  <div className="stat-metric-val" style={{ color: '#FBBF24' }}>
                    {tentativeCount + reviewCount}
                  </div>
                  <div className="stat-metric-foot">
                    <span style={{ color: '#FBBF24', fontWeight: 700 }}>Masa Tunggu</span>
                    <span>Menunggu DP atau review</span>
                  </div>
                </div>

                <div className="stat-metric-card" style={{ borderLeft: '4px solid #10B981' }}>
                  <div className="stat-metric-top">
                    <span className="stat-metric-title">
                      <ShieldCheck style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle', display: 'inline-block' }} /> Sistem Anti-Bentrok
                    </span>
                    <span
                      className="stat-metric-badge"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399' }}
                    >
                      Shield ON
                    </span>
                  </div>
                  <div className="stat-metric-val" style={{ color: '#34D399', fontSize: '1.5rem', paddingTop: '0.4rem' }}>
                    AKTIF
                  </div>
                  <div className="stat-metric-foot">
                    <span style={{ color: '#34D399', fontWeight: 700 }}>Zero Collision</span>
                    <span>Deteksi bentrok instan</span>
                  </div>
                </div>
              </div>

              {/* Calendar Full Month Matrix */}
              <div style={{ marginBottom: '2rem' }}>
                <div className="calendar-widget-wrapper" id="adminCalendarWidget">
                  <div className="calendar-header-bar">
                    <div
                      className="calendar-nav-controls"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem' }}
                    >
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm cal-nav-btn"
                        onClick={() => setCalCurrentDate(new Date(calYear, calMonth - 1, 1))}
                        title="Bulan Sebelumnya"
                        aria-label="Bulan Sebelumnya"
                        style={{
                          flexShrink: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                        }}
                      >
                        <span className="cal-nav-arrow">◀</span>
                        <span className="cal-nav-text">Sebelumnya</span>
                      </button>
                      <h3
                        className="calendar-month-title"
                        style={{
                          flex: '1 1 auto',
                          minWidth: 0,
                          textAlign: 'center',
                          margin: '0 0.5rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: 'clamp(0.95rem, 3.8vw, 1.25rem)',
                          fontWeight: 800,
                        }}
                      >
                        {calMonthNames[calMonth]} {calYear}
                      </h3>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm cal-nav-btn"
                        onClick={() => setCalCurrentDate(new Date(calYear, calMonth + 1, 1))}
                        title="Bulan Berikutnya"
                        aria-label="Bulan Berikutnya"
                        style={{
                          flexShrink: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                        }}
                      >
                        <span className="cal-nav-text">Berikutnya</span>
                        <span className="cal-nav-arrow">▶</span>
                      </button>
                    </div>
                    <div className="calendar-legend">
                      <div className="legend-item"><span className="legend-dot avail"></span> Tersedia (Available)</div>
                      <div className="legend-item"><span className="legend-dot tentative"></span> Tentative Booking</div>
                      <div className="legend-item"><span className="legend-dot locked"></span> Terkunci (Booked)</div>
                    </div>
                  </div>

                  <div className="calendar-grid-container" style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <div className="calendar-grid">
                      <div className="calendar-day-header">Min</div>
                      <div className="calendar-day-header">Sen</div>
                      <div className="calendar-day-header">Sel</div>
                      <div className="calendar-day-header">Rab</div>
                      <div className="calendar-day-header">Kam</div>
                      <div className="calendar-day-header">Jum</div>
                      <div className="calendar-day-header">Sab</div>

                      {/* Empty cells before first day */}
                      {Array.from({ length: calFirstDayIndex }).map((_, i) => (
                        <div key={`cal-pad-${i}`} className="calendar-cell inactive" />
                      ))}

                      {/* Days of month */}
                      {Array.from({ length: calLastDate }).map((_, idx) => {
                        const day = idx + 1;
                        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const eventsOnDate = events.filter((e) => e.date === dateStr);
                        const eventOnDate = eventsOnDate[0];
                        const isToday = dateStr === calTodayStr;

                        const cellDate = new Date(calYear, calMonth, day);
                        cellDate.setHours(0, 0, 0, 0);
                        const todayZero = new Date(calToday);
                        todayZero.setHours(0, 0, 0, 0);

                        let cellClass = 'calendar-cell';
                        let pill = null;

                        if (eventOnDate) {
                          const st = (eventOnDate.status || '').toLowerCase();
                          if (st === 'terkunci' || st === 'locked') {
                            cellClass += ' has-event locked';
                            pill = <div className="calendar-cell-pill" style={{ background: '#EF4444', color: '#fff' }}>Terkunci</div>;
                          } else if (st === 'tentative') {
                            cellClass += ' has-event tentative';
                            pill = <div className="calendar-cell-pill" style={{ background: '#F59E0B', color: '#000' }}>Tentative</div>;
                          } else if (st === 'selesai') {
                            cellClass += ' has-event done';
                            pill = <div className="calendar-cell-pill" style={{ background: '#10B981', color: '#fff' }}>Selesai</div>;
                          } else {
                            cellClass += ' has-event';
                            pill = <div className="calendar-cell-pill" style={{ background: '#3B82F6', color: '#fff' }}>Review</div>;
                          }
                        } else {
                          if (cellDate < todayZero) {
                            if (!isToday) cellClass += ' inactive';
                            pill = <div className="calendar-cell-pill" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>Tdk Tersedia</div>;
                          } else {
                            pill = <div className="calendar-cell-pill" style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399' }}>Tersedia</div>;
                          }
                        }

                        const isSelected = selectedCalDate === dateStr;
                        let cellStyle: React.CSSProperties = { cursor: 'pointer' };
                        if (isToday) {
                          cellStyle = { ...cellStyle, border: '1px solid #D4AF37', position: 'relative' };
                        }
                        if (isSelected) {
                          cellStyle = { ...cellStyle, outline: '2px solid var(--adm-gold)', background: 'rgba(212,175,55,0.08)' };
                        }

                        return (
                          <div
                            key={dateStr}
                            className={cellClass}
                            data-date={dateStr}
                            style={cellStyle}
                            onClick={() => {
                              setSelectedCalDate(dateStr);
                              setSelectedCalEvent(eventOnDate || null);
                            }}
                          >
                            <span className="calendar-cell-date">{day}</span>
                            {isToday && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  background: '#EF4444',
                                  color: '#FFF',
                                  fontSize: '0.65rem',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontWeight: 800,
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                  zIndex: 10,
                                  border: '1px solid rgba(255,255,255,0.2)',
                                }}
                              >
                                HARI INI
                              </div>
                            )}
                            {pill}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Agenda Inspector (Fitur Anti-Bentrok) */}
              {selectedCalDate && (
                <div
                  id="calendarConflictInspector"
                  className="ecc-card"
                  style={{
                    marginTop: '1.5rem',
                    border: '1px solid rgba(212,175,55,0.4)',
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(15,23,42,0.95))',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '1.25rem',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          marginBottom: '0.5rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          className={`badge ${
                            selectedCalEvent
                              ? (selectedCalEvent.status || '').toLowerCase() === 'terkunci' || (selectedCalEvent.status || '').toLowerCase() === 'locked'
                                ? 'badge-locked'
                                : (selectedCalEvent.status || '').toLowerCase() === 'selesai'
                                ? 'badge-completed'
                                : 'badge-tentative'
                              : 'badge-available'
                          }`}
                        >
                          {selectedCalEvent?.status || 'Tersedia'}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: 'var(--adm-gold)',
                          }}
                        >
                          {selectedCalDate}
                        </span>
                      </div>
                      <h3
                        style={{
                          fontSize: '1.35rem',
                          fontWeight: 800,
                          margin: '0 0 0.35rem 0',
                          color: 'var(--adm-text-primary)',
                        }}
                      >
                        {selectedCalEvent
                          ? selectedCalEvent.title || selectedCalEvent.nama_acara || 'Agenda Acara'
                          : 'Hari Bebas / Tersedia'}
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: 'var(--adm-text-secondary)', margin: '0 0 0.25rem 0' }}>
                        {selectedCalEvent
                          ? `${selectedCalEvent.venue || selectedCalEvent.lokasi || ''} ${selectedCalEvent.time || ''}`
                          : 'Belum ada acara di tanggal ini.'}
                      </p>
                      {selectedCalEvent && (
                        <p
                          style={{
                            fontSize: '0.88rem',
                            color: 'var(--adm-text-secondary)',
                            margin: '0 0 0.85rem 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          PIC: {selectedCalEvent.pic || '-'} {selectedCalEvent.contact ? `(${selectedCalEvent.contact})` : ''}
                        </p>
                      )}
                      {selectedCalEvent &&
                        ((selectedCalEvent.status || '').toLowerCase() === 'terkunci' ||
                          (selectedCalEvent.status || '').toLowerCase() === 'locked') && (
                          <div
                            style={{
                              fontSize: '0.85rem',
                              padding: '0.65rem 1rem',
                              borderRadius: 'var(--adm-radius-sm)',
                              border: '1px solid rgba(239,68,68,0.3)',
                              background: 'rgba(239,68,68,0.1)',
                              color: '#FCA5A5',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                            }}
                          >
                            <ShieldCheck style={{ width: 18, height: 18, flexShrink: 0 }} />
                            <div>
                              <strong>Proteksi Anti-Bentrok Aktif:</strong> Jadwal ini telah terkunci secara
                              resmi (DP Paid). Sistem otomatis memblokir pemesanan ganda di tanggal & jam yang sama.
                            </div>
                          </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      {selectedCalEvent && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            onSelectEvent(selectedCalEvent.id);
                            setActiveSection('command-center');
                          }}
                        >
                          Kelola di Command Center
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setSelectedCalDate(null);
                          setSelectedCalEvent(null);
                        }}
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Agenda Timeline View */}
              <div className="ecc-card" style={{ marginTop: '2.25rem' }}>
                <div className="ecc-card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div className="ecc-card-title">Agenda Acara Terjadwal (Detail Waktu)</div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--adm-text-secondary)', margin: '0.25rem 0 0' }}>
                      Daftar kronologis acara yang telah diagendakan.
                    </p>
                  </div>
                  {/* Filter Tabs */}
                  <div className="filter-tabs-scrollable cal-agenda-filters-bar">
                    <button
                      className={`btn btn-sm cal-agenda-filter-btn ${calAgendaFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setCalAgendaFilter('all')}
                    >
                      Semua
                    </button>
                    <button
                      className={`btn btn-secondary btn-sm cal-agenda-filter-btn ${calAgendaFilter === 'terkunci' ? 'active' : ''}`}
                      onClick={() => setCalAgendaFilter('terkunci')}
                    >
                      🔒 Terkunci
                    </button>
                    <button
                      className={`btn btn-secondary btn-sm cal-agenda-filter-btn ${calAgendaFilter === 'tentative' ? 'active' : ''}`}
                      onClick={() => setCalAgendaFilter('tentative')}
                    >
                      ⏳ Tentative
                    </button>
                    <button
                      className={`btn btn-secondary btn-sm cal-agenda-filter-btn ${calAgendaFilter === 'review' ? 'active' : ''}`}
                      onClick={() => setCalAgendaFilter('review')}
                    >
                      📝 Review
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }} id="agendaListContainer">
                  {filteredAgendaEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--adm-text-muted)' }}>
                      Tidak ada agenda yang cocok dengan filter.
                    </div>
                  ) : (
                    filteredAgendaEvents.map((ev) => {
                      const st = (ev.status || '').toLowerCase();
                      let stColor = '#3B82F6';
                      if (st === 'terkunci' || st === 'locked') stColor = '#EF4444';
                      else if (st === 'tentative') stColor = '#F59E0B';
                      else if (st === 'selesai') stColor = '#10B981';

                      return (
                        <div
                          key={ev.id}
                          className="ecc-card"
                          style={{
                            padding: '1rem',
                            borderLeft: `3px solid ${stColor}`,
                            cursor: 'pointer',
                            background: 'rgba(255,255,255,0.02)',
                          }}
                          onClick={() => {
                            setSelectedCalDate(ev.date);
                            setSelectedCalEvent(ev);
                            const el = document.getElementById('calendarConflictInspector');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                                {ev.title || ev.nama_acara || 'Acara'}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--adm-text-secondary)' }}>
                                📅 {ev.date} | ⏰ {ev.time || '-'}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--adm-text-secondary)' }}>
                                📍 {ev.venue || ev.lokasi || '-'}
                              </div>
                            </div>
                            <span className="badge" style={{ background: `${stColor}20`, color: stColor }}>
                              {ev.status || 'Review'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 5: CASH FLOW & KEUANGAN
              ========================================================= */}
          {activeSection === 'cashflow' && (
            <div id="sec-cashflow" className="admin-section active">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div
                    style={{
                      color: 'var(--adm-gold)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Manajemen Arus Kas (Cash Flow)
                  </div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Catatan Kas Keluar & Masuk Uang</h1>
                  <p style={{ color: 'var(--adm-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    Monitoring seluruh pemasukan DP/pelunasan dan pengeluaran operasional kru/transportasi
                    secara transparan.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => setShowAddCashModal(true)}>
                    + Catat Transaksi Kas
                  </button>
                </div>
              </div>

              {/* Cash Flow Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                <div className="stat-metric-card green">
                  <div className="stat-metric-top">
                    <span className="stat-metric-label">Total Kas Masuk (Inflow)</span>
                    <div className="stat-metric-icon">
                      <Receipt style={{ width: 22, height: 22 }} />
                    </div>
                  </div>
                  <div className="stat-metric-val green" id="cfTotalIn">
                    {formatRupiah(cfTotalInflow)}
                  </div>
                  <div className="stat-metric-foot">
                    <span style={{ color: 'var(--adm-success)', fontWeight: 700 }}>Inflow</span>
                    <span>DP 50% & Pelunasan Kontrak</span>
                  </div>
                </div>

                <div className="stat-metric-card" style={{ borderLeft: '3px solid #F43F5E' }}>
                  <div className="stat-metric-top">
                    <span className="stat-metric-label">Total Kas Keluar (Outflow)</span>
                    <div className="stat-metric-icon">
                      <DollarSign style={{ width: 22, height: 22 }} />
                    </div>
                  </div>
                  <div className="stat-metric-val red" id="cfTotalOut">
                    {formatRupiah(cfTotalOutflow)}
                  </div>
                  <div className="stat-metric-foot">
                    <span style={{ color: 'var(--adm-danger)', fontWeight: 700 }}>- Outflow</span>
                    <span>Transport, Wardrobe & Kru</span>
                  </div>
                </div>

                <div className="stat-metric-card gold">
                  <div className="stat-metric-top">
                    <span className="stat-metric-label">Saldo Kas Bersih (Net Cash)</span>
                    <div className="stat-metric-icon">
                      <FileText style={{ width: 22, height: 22 }} />
                    </div>
                  </div>
                  <div className="stat-metric-val gold" id="cfNetCash">
                    {formatRupiah(cfNetCash)}
                  </div>
                  <div className="stat-metric-foot">
                    <span style={{ color: 'var(--adm-gold)', fontWeight: 700 }}>& Likuid</span>
                    <span>Kas siap ditarik/operasional</span>
                  </div>
                </div>

                <div className="stat-metric-card blue">
                  <div className="stat-metric-top">
                    <span className="stat-metric-label">Margin Keuntungan Bersih</span>
                    <div className="stat-metric-icon">
                      <TrendingUp style={{ width: 22, height: 22 }} />
                    </div>
                  </div>
                  <div className="stat-metric-val" style={{ color: '#38BDF8' }} id="cfNetMargin">
                    {cfNetMargin}%
                  </div>
                  <div className="stat-metric-foot">
                    <span style={{ color: 'var(--adm-info)', fontWeight: 700 }}>Sehat & Optimal</span>
                    <span>Rasio profitabilitas MC</span>
                  </div>
                </div>
              </div>

              {/* Cash Flow Table */}
              <div className="ecc-card">
                <div className="ecc-card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <div className="ecc-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText style={{ width: 20, height: 20 }} /> Kas Keluar-Masuk (Jurnal Transaksi)
                  </div>
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      className="form-input"
                      id="cfSearchInput"
                      placeholder="🔍 transaksi / acara..."
                      style={{ width: '220px', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                      value={cfSearch}
                      onChange={(e) => setCfSearch(e.target.value)}
                    />
                    <select
                      className="form-select"
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem', width: 'auto' }}
                      id="cfFilterSelect"
                      value={cfFilterType}
                      onChange={(e) => setCfFilterType(e.target.value as any)}
                    >
                      <option value="all">Semua Transaksi</option>
                      <option value="in">Hanya Kas Masuk (+)</option>
                      <option value="out">Hanya Kas Keluar (-)</option>
                    </select>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const csvContent = 'data:text/csv;charset=utf-8,Tanggal,Deskripsi,Kategori,Nominal,Tipe\n' +
                          filteredCashflow.map(t => `"${t.date}","${t.desc}","${t.category}","${t.amount}","${t.type}"`).join('\n');
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement('a');
                        link.setAttribute('href', encodedUri);
                        link.setAttribute('download', 'jurnal_kas_mc_connect.csv');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        toast.success('Jurnal kas berhasil diexport ke CSV!');
                      }}
                    >
                      CSV
                    </button>
                  </div>
                </div>

                <div className="table-clean-wrapper" style={{ overflowX: 'auto' }}>
                  <table className="table-clean" id="cashFlowTable" style={{ width: '100%', minWidth: '780px' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--adm-text-muted)' }}>Tanggal ▼</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--adm-text-muted)' }}>Keterangan / Deskripsi</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--adm-text-muted)' }}>Kategori</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--adm-text-muted)' }}>Nominal</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--adm-text-muted)' }}>Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--adm-text-muted)' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody id="cashFlowTableBody">
                      {filteredCashflow.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--adm-text-muted)' }}>
                            {cfLoading ? 'Memuat transaksi kas...' : 'Belum ada transaksi kas yang dicatat.'}
                          </td>
                        </tr>
                      ) : (
                        filteredCashflow.map((t, idx) => {
                          const isIn = t.type === 'in';
                          const isSyncedEvent = typeof t.id === 'string' && t.id.startsWith('ev_');
                          return (
                            <tr key={t.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '0.75rem' }}>{t.date || '-'}</td>
                              <td style={{ padding: '0.75rem', fontWeight: 600 }}>{t.desc || '-'}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <span className={`badge ${isIn ? 'badge-available' : 'badge-tier-pro'}`}>
                                  {t.category || (isIn ? 'Kas Masuk' : 'Pengeluaran')}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 800, color: isIn ? '#34D399' : '#F87171' }}>
                                {isIn ? '+' : '-'}{formatRupiah(t.amount)}
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                <span className="badge" style={{ background: isIn ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: isIn ? '#34D399' : '#F87171' }}>
                                  {t.status || 'Berhasil'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                {!isSyncedEvent ? (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleDeleteCashflow(t.id)}
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#F87171' }}
                                    title="Hapus Transaksi"
                                  >
                                    Hapus
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>Auto-Sync</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 6: WARDROBE TRACKER (100% PARITY TABULAR TABLE)
              ========================================================= */}
          {activeSection === 'wardrobe' && (
            <div id="sec-wardrobe" className="admin-section active">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ color: 'var(--adm-gold)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Koleksi Busana Panggung
                  </div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Manajemen Wardrobe Global</h1>
                  <p style={{ color: 'var(--adm-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    Kelola seluruh gaun/jas di sini. Pantau di acara apa saja busana ini dipakai dan lihat total frekuensi penggunaannya.
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddWardrobeModal(true)}
                  style={{ fontWeight: 800 }}
                >
                  + Tambah Gaun Baru
                </button>
              </div>

              {wardrobeLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--adm-text-secondary)' }}>
                  Memuat katalog wardrobe dari database...
                </div>
              ) : (
                <div className="ecc-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead style={{ background: 'rgba(0, 0, 0, 0.2)', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                        <tr>
                          <th style={{ padding: '1rem 0.75rem', color: 'var(--adm-gold)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>Foto</th>
                          <th style={{ padding: '1rem 0.75rem', color: 'var(--adm-gold)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>Kode / Nama Busana</th>
                          <th style={{ padding: '1rem 0.75rem', color: 'var(--adm-gold)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>Deskripsi</th>
                          <th style={{ padding: '1rem 0.75rem', color: 'var(--adm-gold)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>Kategori</th>
                          <th style={{ padding: '1rem 0.75rem', color: 'var(--adm-gold)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>Warna</th>
                          <th style={{ padding: '1rem 0.75rem', color: 'var(--adm-gold)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>Status</th>
                          <th style={{ padding: '1rem 0.75rem', color: 'var(--adm-gold)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', textAlign: 'center' }}>Frekuensi Dipakai</th>
                          <th style={{ padding: '1rem 0.75rem', color: 'var(--adm-gold)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', textAlign: 'right' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(wardrobeList.length > 0 ? wardrobeList : [
                          { name: 'Royal Gold Velvet Tuxedo', colorHex: '#D4AF37', colorName: 'Formal', status: 'Siap Pakai', desc: 'tss (30 Sep 2026)', count: 3 },
                          { name: 'Midnight Navy Peak Lapel Suit', colorHex: '#1E3A8A', colorName: 'Formal', status: 'Siap Pakai', desc: 'Gala Awarding (1 Oct 2026)', count: 5 },
                          { name: 'Classic Black Shawl Satin', colorHex: '#111827', colorName: 'Black Tie', status: 'Laundry', desc: '25 Sep 2026', count: 2 },
                          { name: 'Batik Tulis Sutra Parang Barong', colorHex: '#92400E', colorName: 'Tradisional', status: 'Siap Pakai', desc: 'Akad Nikah Jawa', count: 4 },
                        ]).map((w, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)' }}>
                            <td style={{ padding: '0.85rem 0.75rem' }}>
                              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: w.colorHex || w.warna || '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 2px 6px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                👔
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: '#FFF' }}>
                              {w.name || w.nama}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', color: 'var(--adm-text-secondary)', fontSize: '0.85rem' }}>
                              {w.desc || w.deskripsi || 'Koleksi busana resmi panggung.'}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', fontSize: '0.85rem', color: 'var(--adm-gold)' }}>
                              {w.kategori || w.colorName || 'Formal'}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: w.colorHex || w.warna || '#D4AF37', display: 'inline-block', border: '1px solid rgba(255,255,255,0.3)' }} />
                                <span>{w.colorName || w.warna || 'Gold'}</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem' }}>
                              <span className={`badge ${w.status === 'Siap Pakai' ? 'badge-available' : 'badge-locked'}`}>
                                {w.status || 'Siap Pakai'}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: 800, color: 'var(--adm-gold)' }}>
                              {w.count || '1'}x
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                              {w.db_id ? (
                                <button
                                  onClick={() => handleDeleteWardrobe(w.db_id)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ color: '#F87171', borderColor: 'rgba(239,68,68,0.3)', padding: '0.3rem 0.6rem' }}
                                  title="Hapus busana"
                                >
                                  🗑️ Hapus
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>Bawaan</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              VIEW 7: MASTER BANK MUSIK (100% PARITY)
              ========================================================= */}
          {activeSection === 'musicbank' && (
            <div id="sec-musicbank" className="admin-section active">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ color: 'var(--adm-gold)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Koleksi Musik & Audio
                  </div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Master Bank Musik & Soundboard</h1>
                  <p style={{ color: 'var(--adm-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    Kelola seluruh koleksi bank lagu, musik latar, dan soundboard di sini.
                  </p>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => toast.info('Fitur unggah lagu audio MP3/WAV siap digunakan.')}
                  style={{ fontWeight: 800 }}
                >
                  + Tambah Lagu Baru
                </button>
              </div>

              {/* Quick Soundboard Live Audition */}
              <div className="ecc-card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--adm-gold)', margin: 0 }}>
                      🎹 Instant Soundboard Synthesizer (Web Audio API)
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--adm-text-secondary)', margin: '0.2rem 0 0' }}>
                      Tekan tombol soundboard untuk membunyikan efek suara panggung tanpa latensi:
                    </p>
                  </div>
                  <span className="badge" style={{ background: 'rgba(56,189,248,0.15)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.3)' }}>
                    DSP Active
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <button onClick={playFanfare} className="btn btn-secondary btn-sm" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', borderColor: '#D4AF37' }}>
                    <span style={{ fontSize: '1.3rem' }}>🎺</span>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--adm-gold)' }}>Fanfare [1]</span>
                  </button>
                  <button onClick={playDrumRoll} className="btn btn-secondary btn-sm" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', borderColor: '#38BDF8' }}>
                    <span style={{ fontSize: '1.3rem' }}>🥁</span>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#38BDF8' }}>Drumroll [2]</span>
                  </button>
                  <button onClick={playApplause} className="btn btn-secondary btn-sm" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', borderColor: '#10B981' }}>
                    <span style={{ fontSize: '1.3rem' }}>👏</span>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#34D399' }}>Applause [3]</span>
                  </button>
                  <button onClick={playChime} className="btn btn-secondary btn-sm" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', borderColor: '#F59E0B' }}>
                    <span style={{ fontSize: '1.3rem' }}>✨</span>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#FBBF24' }}>Chime [4]</span>
                  </button>
                  <button onClick={playBuzzer} className="btn btn-secondary btn-sm" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', borderColor: '#EF4444' }}>
                    <span style={{ fontSize: '1.3rem' }}>🚨</span>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#F87171' }}>Buzzer [5]</span>
                  </button>
                </div>
              </div>

              {/* Master Cue Sheet Table */}
              <div className="ecc-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFF' }}>
                    📁 Daftar Katalog Bank Musik Panggung
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Cari lagu / instruksi..." 
                      value={musicBankSearch}
                      onChange={(e) => setMusicBankSearch(e.target.value)}
                      className="form-input"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', width: '220px' }}
                    />
                    <select
                      value={musicBankCategory}
                      onChange={(e) => setMusicBankCategory(e.target.value)}
                      className="form-select"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', width: 'auto' }}
                    >
                      <option value="all">Semua Kategori</option>
                      <option value="Anthem">Opening Anthem</option>
                      <option value="Entrance">Grand Entrance</option>
                      <option value="Toast">Toast & Cake</option>
                      <option value="Games">Games & Ice Break</option>
                      <option value="Finale">Grand Finale</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead style={{ background: 'rgba(0, 0, 0, 0.2)', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                      <tr>
                        <th style={{ padding: '1rem 0.75rem', color: 'var(--adm-gold)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem' }}>Kategori Cue</th>
                        <th style={{ padding: '1rem 0.75rem', color: 'var(--adm-gold)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem' }}>Judul Lagu / Backsound</th>
                        <th style={{ padding: '1rem 0.75rem', color: 'var(--adm-gold)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem' }}>Instruksi Panggung MC</th>
                        <th style={{ padding: '1rem 0.75rem', color: 'var(--adm-gold)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', textAlign: 'right' }}>Audio Preview</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { cat: 'Anthem', catName: 'Opening Anthem', title: 'Fanfare Brass of Triumph Intro', cue: 'Fade in saat MC dipanggil naik panggung' },
                        { cat: 'Entrance', catName: 'Grand Entrance', title: 'Canon in D Strings / A Thousand Years', cue: 'Naikkan volume 80% saat pintu ballroom terbuka' },
                        { cat: 'Toast', catName: 'Cake & Toast', title: 'Celebration Pop Uplifting Beats', cue: 'Hitungan ketiga bersamaan confetti pop' },
                        { cat: 'Games', catName: 'Games & Ice Break', title: 'Funky Groovy Upbeat Jazz', cue: 'Background audio saat games interaktif berlangsung' },
                        { cat: 'Finale', catName: 'Grand Finale', title: 'Emotional Cinematic Strings Outro', cue: 'Mulai saat MC closing kalimat terakhir' },
                        { cat: 'Anthem', catName: 'Opening Anthem', title: 'Majestic Royal Fanfare', cue: 'Diputar saat pembukaan gala dinner tamu VIP' },
                        { cat: 'Entrance', catName: 'Grand Entrance', title: 'Acoustic Guitar Romantic Journey', cue: 'Iringan masuk mempelai wanita ke pelaminan' },
                      ]
                        .filter(m => (musicBankCategory === 'all' || m.cat === musicBankCategory) && (musicBankSearch === '' || m.title.toLowerCase().includes(musicBankSearch.toLowerCase()) || m.cue.toLowerCase().includes(musicBankSearch.toLowerCase())))
                        .map((m, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)' }}>
                            <td style={{ padding: '0.85rem 0.75rem' }}><span className="badge">{m.catName}</span></td>
                            <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: '#FFF' }}>{m.title}</td>
                            <td style={{ padding: '0.85rem 0.75rem', fontSize: '0.85rem', color: 'var(--adm-text-secondary)' }}>{m.cue}</td>
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  playChime();
                                  toast.info(`Memutar Web Audio preview: ${m.title}`);
                                }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                ▶ Putar Cue
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 8A: CMS KONTEN (PENGATURAN LANDING PAGE)
              ========================================================= */}
          {(activeSection === 'settings' || activeSection === 'landing-settings') && (
            <div id="sec-landing-settings" className="admin-section active">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div
                    style={{
                      color: 'var(--adm-gold)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    CMS Manajemen Konten Portal Publik
                  </div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Pengaturan Landing Page Publik</h1>
                  <p style={{ color: 'var(--adm-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    Kelola profil biodata, video showreel, etalase paket layanan, syarat & ketentuan (T&C), dan berkas unduhan Press Kit.
                  </p>
                </div>
              </div>

              {/* CMS Navigation Tabs */}
              <div className="cms-nav-tabs">
                <button
                  className={`cms-tab-btn ${cmsSubTab === 'cms-bio' ? 'active' : ''}`}
                  onClick={() => setCmsSubTab('cms-bio')}
                >
                  👤 Biodata, Showreel & Sosmed
                </button>
                <button
                  className={`cms-tab-btn ${cmsSubTab === 'cms-packages' ? 'active' : ''}`}
                  onClick={() => setCmsSubTab('cms-packages')}
                >
                  📦 Layanan
                </button>
                <button
                  className={`cms-tab-btn ${cmsSubTab === 'cms-policies' ? 'active' : ''}`}
                  onClick={() => setCmsSubTab('cms-policies')}
                >
                  📝 Blog, Kebijakan & FAQ
                </button>
                <button
                  className={`cms-tab-btn ${cmsSubTab === 'cms-presskit' ? 'active' : ''}`}
                  onClick={() => setCmsSubTab('cms-presskit')}
                >
                  📁 Press Kit & Riders
                </button>
                <button
                  className={`cms-tab-btn ${cmsSubTab === 'cms-gallery' ? 'active' : ''}`}
                  onClick={() => setCmsSubTab('cms-gallery')}
                >
                  🖼️ Galeri Portofolio
                </button>
              </div>

              {/* CMS 1: BIODATA, SHOWREEL & SOSMED */}
              {cmsSubTab === 'cms-bio' && (
                <div className="cms-subpanel active" id="cms-bio">
                  <div className="ecc-card">
                    <div className="ecc-card-header">
                      <div className="ecc-card-title">Sunting Profil Personal Branding, Jam Terbang & Showreel</div>
                      <span className="badge badge-tier-pro">Live Sync Web Publik</span>
                    </div>
                    <form onSubmit={handleSaveBiodata} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--adm-text-secondary)', fontWeight: 600 }}>
                            Nama Panggung & Gelar *
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            id="cmsNamaPanggung"
                            required
                            value={mcName}
                            onChange={(e) => setMcName(e.target.value)}
                            style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.5rem', color: '#FFF' }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--adm-text-secondary)', fontWeight: 600 }}>
                            Email Kontak Bisnis *
                          </label>
                          <input
                            type="email"
                            className="form-input"
                            id="cmsEmail"
                            required
                            value="vanya@mcconnect.id"
                            readOnly
                            style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.5rem', color: '#94A3B8' }}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--adm-text-secondary)', fontWeight: 600 }}>
                          Bio Singkat / Profil Karier Panggung *
                        </label>
                        <textarea
                          className="form-textarea"
                          id="cmsBioText"
                          rows={3}
                          required
                          value={mcBio}
                          onChange={(e) => setMcBio(e.target.value)}
                          placeholder="Master of Ceremony profesional berbasis di Jakarta & Surabaya..."
                          style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.5rem', color: '#FFF', minHeight: '90px' }}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--adm-text-secondary)', fontWeight: 600 }}>
                            Total Acara Sukses
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            id="cmsStatEvents"
                            value={mcStatEvents}
                            onChange={(e) => setMcStatEvents(e.target.value)}
                            placeholder="500+ Acara Sukses"
                            style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.5rem', color: '#FFF' }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--adm-text-secondary)', fontWeight: 600 }}>
                            Tahun Jam Terbang
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            id="cmsStatYears"
                            value={mcStatYears}
                            onChange={(e) => setMcStatYears(e.target.value)}
                            placeholder="8+ Tahun Pengalaman"
                            style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.5rem', color: '#FFF' }}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--adm-text-secondary)', fontWeight: 600 }}>
                          Spesialisasi Panggung (Pisahkan dengan koma)
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          id="cmsSpesialisasi"
                          value={mcSpec}
                          onChange={(e) => setMcSpec(e.target.value)}
                          placeholder="Luxury Wedding, Corporate Gala, Awarding Night, Hybrid Tech Summit, Festival Musik"
                          style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.5rem', color: '#FFF' }}
                        />
                      </div>

                      <div className="grid-2col" style={{ gap: '1.25rem' }}>
                        <div className="form-group">
                          <label className="form-label">Foto Profil MC (URL / Upload)</label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <img
                              id="cmsFotoPreview"
                              src={mcPhotoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'}
                              alt="Preview"
                              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))' }}
                            />
                            <input
                              type="text"
                              className="form-input"
                              id="cmsFotoUrl"
                              value={mcPhotoUrl}
                              onChange={(e) => setMcPhotoUrl(e.target.value)}
                              style={{ flex: 1 }}
                            />
                            <input
                              type="file"
                              id="cmsFotoUpload"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    if (typeof ev.target?.result === 'string') {
                                      setMcPhotoUrl(ev.target.result);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                (document.getElementById('cmsFotoUpload') as HTMLInputElement)?.click();
                              }}
                            >
                              Upload
                            </button>
                          </div>
                        </div>
                      </div>

                      <div
                        className="grid-3col cms-social-grid"
                        style={{ gap: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
                      >
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ color: '#E1306C' }}>📷</span> Handle Akun Instagram
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            id="cmsIg"
                            value={mcIg}
                            onChange={(e) => setMcIg(e.target.value)}
                            placeholder="Misal: @vanyaarsyad.mc atau URL"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ color: '#25F4EE' }}>🎵</span> Handle Akun TikTok
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            id="cmsTiktok"
                            value={mcTiktok}
                            onChange={(e) => setMcTiktok(e.target.value)}
                            placeholder="Misal: @vanyastage_official atau URL"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ color: '#1877F2' }}>👥</span> Handle Akun Facebook
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            id="cmsFb"
                            value={mcFacebook}
                            onChange={(e) => setMcFacebook(e.target.value)}
                            placeholder="Misal: vanyaarsyad.mc atau URL profil"
                          />
                        </div>
                      </div>

                      <div className="cms-bio-submit-wrapper" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button type="submit" disabled={isSavingSettings} className="btn btn-primary btn-save-cms-bio" style={{ minWidth: '220px', fontWeight: 700 }}>
                          {isSavingSettings ? 'Menyimpan...' : '💾 Simpan Biodata & Sosmed'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* CMS 2: LAYANAN (PAKET & TARIF) */}
              {cmsSubTab === 'cms-packages' && (
                <div className="cms-subpanel active" id="cms-packages">
                  <div className="ecc-card">
                    <div className="ecc-card-header">
                      <div className="ecc-card-title">Kelola Paket Layanan & Harga Panggung</div>
                      <span className="badge badge-available">Katalog Online</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--adm-text-secondary)', marginBottom: '1.5rem' }}>
                      Paket yang Anda kelola di sini langsung tampil pada etalase landing page publik.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      {cmsPackages.length === 0 ? (
                        [
                          { name: 'Silver Classic Wedding', price: 'Rp 6.500.000', desc: 'Durasi maksimal 3 jam, 1 sesi resepsi wedding standar.' },
                          { name: 'Diamond Royal Wedding', price: 'Rp 12.500.000', desc: 'Pemberkatan/Akad & Resepsi, gladi bersih, bilingual ID/EN.' },
                          { name: 'Corporate Gala & Awarding', price: 'Rp 15.000.000', desc: 'Annual Dinner, Awarding Night, protokol formal kenegaraan.' }
                        ].map((pkg, idx) => (
                          <div key={idx} className="ecc-card" style={{ border: '1px solid var(--adm-border)', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--adm-gold)', marginBottom: '0.25rem' }}>
                              {pkg.name}
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34D399', marginBottom: '0.5rem' }}>
                              {pkg.price}
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--adm-text-secondary)', margin: 0 }}>
                              {pkg.desc}
                            </p>
                          </div>
                        ))
                      ) : (
                        cmsPackages.map((pkg, idx) => (
                          <div key={idx} className="ecc-card" style={{ border: '1px solid var(--adm-border)', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--adm-gold)', marginBottom: '0.25rem' }}>
                              {pkg.name}
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34D399', marginBottom: '0.5rem' }}>
                              {formatRupiah(pkg.price)}
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--adm-text-secondary)', margin: 0 }}>
                              {pkg.description || pkg.desc || '-'}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CMS 3: BLOG, KEBIJAKAN & FAQ */}
              {cmsSubTab === 'cms-policies' && (
                <div className="cms-subpanel active" id="cms-policies">
                  <div className="ecc-card">
                    <div className="ecc-card-header">
                      <div className="ecc-card-title">⚖️ Kebijakan, Syarat & Ketentuan (T&C) & FAQ</div>
                      <span className="badge badge-tier-pro">Legal & Compliance</span>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        toast.success('Kebijakan T&C & FAQ berhasil disimpan!');
                      }}
                      className="space-y-4"
                    >
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--adm-text-secondary)' }}>
                          1. Syarat & Ketentuan Booking (T&C)
                        </label>
                        <textarea
                          className="form-textarea"
                          rows={4}
                          value={cmsPolicies.terms || ''}
                          onChange={(e) => setCmsPolicies({ ...cmsPolicies, terms: e.target.value })}
                          style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.5rem', color: '#FFF' }}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--adm-text-secondary)' }}>
                          2. Kebijakan Pembatalan & Refund (Refund Policy)
                        </label>
                        <textarea
                          className="form-textarea"
                          rows={4}
                          value={cmsPolicies.refund || ''}
                          onChange={(e) => setCmsPolicies({ ...cmsPolicies, refund: e.target.value })}
                          style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.5rem', color: '#FFF' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                          💾 Simpan Kebijakan & FAQ
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* CMS 4: PRESS KIT & RIDERS */}
              {cmsSubTab === 'cms-presskit' && (
                <div className="cms-subpanel active" id="cms-presskit">
                  <div className="ecc-card">
                    <div className="ecc-card-header">
                      <div className="ecc-card-title">📁 Press Kit & Technical Riders MC</div>
                      <span className="badge badge-available">Dokumen Resmi</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--adm-text-secondary)', marginBottom: '1.5rem' }}>
                      Kebutuhan panggung resmi, sound system minimal, wireless microphone, dan hospitality rider.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="ecc-card" style={{ border: '1px solid var(--adm-border)', background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ fontWeight: 800, color: 'var(--adm-gold)', marginBottom: '0.5rem' }}>🎤 Technical Sound Riders</h4>
                        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--adm-text-secondary)', lineHeight: 1.8 }}>
                          <li>2x Wireless Handheld Mic (Shure / Sennheiser UHF)</li>
                          <li>1x Dedicated Sound Monitor di posisi Stage MC</li>
                          <li>Kabel audio aux / bluetooth untuk soundboard cues</li>
                        </ul>
                      </div>
                      <div className="ecc-card" style={{ border: '1px solid var(--adm-border)', background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ fontWeight: 800, color: 'var(--adm-gold)', marginBottom: '0.5rem' }}>☕ Hospitality Riders</h4>
                        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--adm-text-secondary)', lineHeight: 1.8 }}>
                          <li>Ruang transit / ganti pakaian AC yang bersih</li>
                          <li>Air mineral hangat, kopi / teh sebelum naik panggung</li>
                          <li>1x Meal box untuk MC & 1 Asisten Lapangan</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CMS 5: GALERI PORTOFOLIO */}
              {cmsSubTab === 'cms-gallery' && (
                <div className="cms-subpanel active" id="cms-gallery">
                  <div className="ecc-card">
                    <div className="ecc-card-header">
                      <div className="ecc-card-title">🖼️ Galeri Foto & Portofolio Dokumentasi Panggung</div>
                      <button className="btn btn-secondary btn-sm" onClick={() => toast.info('Fitur upload foto galeri')}>
                        + Upload Foto Baru
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                      {(cmsGallery.length > 0 ? cmsGallery : [
                        { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80', caption: 'The Grand Ballroom Wedding' },
                        { url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80', caption: 'Corporate Gala Dinner' },
                        { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80', caption: 'Awarding Night Kenegaraan' }
                      ]).map((item, idx) => (
                        <div key={idx} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--adm-border)', background: 'var(--adm-bg-surface)' }}>
                          <img src={item.url || item.image_url} alt={item.caption || 'Galeri'} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                          <div style={{ padding: '0.5rem', fontSize: '0.78rem', color: 'var(--adm-text-secondary)' }}>
                            {item.caption || 'Dokumentasi Panggung'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              VIEW 8B: PENGATURAN WEB (INTEGRASI FINANSIAL & SYSTEM)
              ========================================================= */}
          {activeSection === 'web-settings' && (
            <div id="sec-web-settings" className="admin-section active">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div
                    style={{
                      color: 'var(--adm-gold)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Pengaturan Integrasi Finansial
                  </div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Pengaturan Web</h1>
                  <p style={{ color: 'var(--adm-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    Atur rekening bank penerima pembayaran dan tautan statis gambar QRIS untuk diintegrasikan ke Invoice dan WhatsApp.
                  </p>
                </div>
              </div>

              {/* Web Settings Navigation Tabs (100% Parity 7 Sub-Tabs) */}
              <div className="cms-nav-tabs" style={{ marginTop: '1.5rem' }}>
                <button
                  className={`cms-tab-btn ${webSubTab === 'web-payment' ? 'active' : ''}`}
                  onClick={() => setWebSubTab('web-payment')}
                >
                  💳 Pembayaran & QRIS
                </button>
                <button
                  className={`cms-tab-btn ${webSubTab === 'cms-categories' ? 'active' : ''}`}
                  onClick={() => setWebSubTab('cms-categories')}
                >
                  📅 Kategori Acara
                </button>
                <button
                  className={`cms-tab-btn ${webSubTab === 'cms-client-categories' ? 'active' : ''}`}
                  onClick={() => setWebSubTab('cms-client-categories')}
                >
                  👥 Kategori Klien
                </button>
                <button
                  className={`cms-tab-btn ${webSubTab === 'cms-wa-templates' ? 'active' : ''}`}
                  onClick={() => setWebSubTab('cms-wa-templates')}
                >
                  💬 Template WA
                </button>
                <button
                  className={`cms-tab-btn ${webSubTab === 'cms-cashflow-categories' ? 'active' : ''}`}
                  onClick={() => setWebSubTab('cms-cashflow-categories')}
                >
                  💰 Kategori Arus Kas
                </button>
                <button
                  className={`cms-tab-btn ${webSubTab === 'web-logo' ? 'active' : ''}`}
                  onClick={() => setWebSubTab('web-logo')}
                >
                  🌐 Logo Web & Invoice
                </button>
                <button
                  className={`cms-tab-btn ${webSubTab === 'web-security' ? 'active' : ''}`}
                  onClick={() => setWebSubTab('web-security')}
                >
                  🔒 Keamanan Akun
                </button>
              </div>

              {/* TAB 1: PEMBAYARAN & QRIS */}
              {webSubTab === 'web-payment' && (
                <div className="cms-subpanel active" id="web-payment">
                  <div className="ecc-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Rekening Bank</h2>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={addBankAccount}>
                        + Tambah Rekening Lain
                      </button>
                    </div>
                    <div id="bankAccountsContainer" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {bankAccounts.map((b, idx) => (
                        <div
                          key={idx}
                          className="bank-account-item"
                          style={{
                            display: 'flex',
                            gap: '1rem',
                            flexWrap: 'wrap',
                            alignItems: 'flex-end',
                            padding: '1rem',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94A3B8)' }}>
                              Nama Bank
                            </label>
                            <input
                              type="text"
                              className="form-input bank-name"
                              placeholder="BCA / Mandiri"
                              value={b.bank || ''}
                              onChange={(e) => updateBankAccount(idx, 'bank', e.target.value)}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94A3B8)' }}>
                              Nomor Rekening (Angka Saja)
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="form-input bank-number"
                              placeholder="1234567890"
                              value={b.number !== undefined ? b.number : (b.rekening || '')}
                              onChange={(e) => updateBankAccount(idx, 'number', e.target.value.replace(/[^0-9]/g, ''))}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94A3B8)' }}>
                              Atas Nama
                            </label>
                            <input
                              type="text"
                              className="form-input bank-owner"
                              placeholder="Nama Pemilik"
                              value={b.name !== undefined ? b.name : (b.atasNama || '')}
                              onChange={(e) => updateBankAccount(idx, 'name', e.target.value)}
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => removeBankAccount(idx)}
                              style={{ padding: '0.4rem 0.8rem' }}
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="ecc-card" style={{ marginTop: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                      QRIS Statis
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94A3B8)', marginBottom: '1rem' }}>
                      Unggah gambar QRIS statis bisnis Anda. Jika dibiarkan kosong, sistem akan menggunakan QRIS dinamis bawaan berdasarkan nomor invoice.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <input type="hidden" id="paymentQrisUrl" value={qrisUrl} />
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary, #94A3B8)' }}>
                          Unggah Gambar QRIS Statis (Format: JPG, PNG, WebP)
                        </label>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="file"
                            id="paymentQrisFile"
                            accept="image/*"
                            className="form-input"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === 'string') {
                                    setQrisUrl(reader.result);
                                    toast.success('QRIS Statis berhasil dimuat!');
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            style={{ padding: '0.45rem 0.75rem', flex: 1, minWidth: '200px' }}
                          />
                          {qrisUrl && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              id="btnRemoveQris"
                              onClick={() => {
                                setQrisUrl('');
                                const fileEl = document.getElementById('paymentQrisFile') as HTMLInputElement | null;
                                if (fileEl) fileEl.value = '';
                              }}
                              style={{ background: 'rgba(244,63,94,0.15)', color: '#F43F5E', border: '1px solid rgba(244,63,94,0.3)', fontWeight: 600, padding: '0.45rem 0.85rem', borderRadius: '6px' }}
                            >
                              🗑️ Hapus Gambar QRIS
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--adm-text-muted, #94A3B8)', marginTop: '0.4rem' }}>
                          💡 File QRIS yang diunggah akan otomatis disimpan ke server dan disematkan pada lembar Invoice pembayaran klien.
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '1.25rem', textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94A3B8)' }}>
                        Pratinjau Gambar QRIS:
                      </div>
                      <img
                        id="previewQrisImg"
                        src={qrisUrl || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22bold%22%20fill%3D%22%2364748b%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EQRIS%20Preview%3C%2Ftext%3E%3C%2Fsvg%3E'}
                        alt="QRIS Preview"
                        style={{ width: '200px', height: '200px', objectFit: 'contain', background: '#FFF', padding: '0.5rem', borderRadius: '8px', display: 'inline-block' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                    <button type="button" className="btn btn-primary" onClick={handleSavePaymentSettings} disabled={isSavingSettings} style={{ fontWeight: 700 }}>
                      {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: KATEGORI ACARA */}
              {webSubTab === 'cms-categories' && (
                <div className="cms-subpanel active" id="cms-categories">
                  <div className="ecc-card">
                    <div className="ecc-card-header">
                      <div className="ecc-card-title">📅 Master Kategori Acara Panggung</div>
                      <span className="badge badge-tier-pro">{eventCategories.length} Kategori</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: '1rem' }}>
                      {eventCategories.map((cat: any, idx: number) => {
                        const catName = typeof cat === 'object' && cat ? cat.name : String(cat || '');
                        const catIcon = typeof cat === 'object' && cat?.icon ? cat.icon : '✨';
                        return (
                          <div key={idx} style={{ padding: '0.5rem 0.85rem', borderRadius: '8px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--adm-gold)', fontWeight: 700, fontSize: '0.85rem' }}>
                            {catIcon} {catName}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: KATEGORI KLIEN */}
              {webSubTab === 'cms-client-categories' && (
                <div className="cms-subpanel active" id="cms-client-categories">
                  <div className="ecc-card">
                    <div className="ecc-card-header">
                      <div className="ecc-card-title">👥 Master Segmen Kategori Klien</div>
                      <span className="badge badge-tier-pro">{clientCategories.length} Segmen</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                      {clientCategories.map((c: any, idx: number) => {
                        const cName = typeof c === 'object' && c ? c.name : String(c || '');
                        const cIcon = typeof c === 'object' && c?.icon ? c.icon : '⭐';
                        return (
                          <div key={idx} style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--adm-border)' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{cIcon}</div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFF' }}>{cName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--adm-text-secondary)', marginTop: '0.25rem' }}>Segmen Klien Terdaftar</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: TEMPLATE WHATSAPP */}
              {webSubTab === 'cms-wa-templates' && (
                <div className="cms-subpanel active" id="cms-wa-templates">
                  <div className="ecc-card">
                    <div className="ecc-card-header">
                      <div className="ecc-card-title">💬 Master Template Pesan Otomatis WhatsApp</div>
                      <span className="badge badge-available">WA Direct Engine</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                      {[
                        { title: 'Konfirmasi Booking DP & Penguncian Tanggal', desc: 'Halo [Nama], terima kasih telah melakukan pembayaran DP. Tanggal [Tanggal] resmi TERKUNCI untuk acara [Nama Acara].' },
                        { title: 'Reminder Pembayaran Pelunasan H-3', desc: 'Halo [Nama], mengingatkan bahwa jadwal acara [Nama Acara] tinggal H-3. Mohon menyelesaikan pelunasan sisa tagihan.' },
                        { title: 'Post-Event Review & Terima Kasih', desc: 'Terima kasih banyak atas kepercayaannya kepada MC [Nama MC]. Semoga acara [Nama Acara] berkesan dan membahagiakan!' }
                      ].map((t, idx) => (
                        <div key={idx} style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--adm-border)' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--adm-gold)', marginBottom: '0.4rem' }}>{t.title}</div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--adm-text-secondary)', background: 'rgba(0,0,0,0.3)', padding: '0.65rem', borderRadius: '6px', margin: 0, fontStyle: 'italic' }}>
                            "{t.desc}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: KATEGORI CASH FLOW */}
              {webSubTab === 'cms-cashflow-categories' && (
                <div className="cms-subpanel active" id="cms-cashflow-categories">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="ecc-card" style={{ borderLeft: '3px solid #10B981' }}>
                      <div className="ecc-card-title" style={{ color: '#10B981', marginBottom: '0.75rem' }}>💰 Kategori Kas Masuk (Inflow)</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {['Pendapatan Booking Acara', 'DP Pembayaran Klien', 'Pelunasan Kontrak', 'Sponsorship & Endorsement'].map((cat, idx) => (
                          <div key={idx} style={{ padding: '0.45rem 0.65rem', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', color: '#34D399', fontSize: '0.82rem', fontWeight: 600 }}>
                            + {cat}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="ecc-card" style={{ borderLeft: '3px solid #EF4444' }}>
                      <div className="ecc-card-title" style={{ color: '#F87171', marginBottom: '0.75rem' }}>💸 Kategori Kas Keluar (Outflow)</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {['Operasional Umum MC', 'Biaya Transport & Bensin', 'Biaya Wardrobe & Dry Cleaning', 'Konsumsi / Meals Kru', 'Honor Asisten Lapangan'].map((cat, idx) => (
                          <div key={idx} style={{ padding: '0.45rem 0.65rem', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', fontSize: '0.82rem', fontWeight: 600 }}>
                            - {cat}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: LOGO WEB & INVOICE */}
              {webSubTab === 'web-logo' && (
                <div className="cms-subpanel active" id="web-logo">
                  <div className="ecc-card">
                    <div className="ecc-card-header">
                      <div>
                        <div className="ecc-card-title">Pengaturan Logo Web & Invoice</div>
                        <p style={{ color: 'var(--adm-text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                          Atur identitas visual web, favicon, invoice, dan Press Kit.
                        </p>
                      </div>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        toast.success('Pengaturan logo berhasil disimpan!');
                      }}
                      style={{ marginTop: '1.25rem' }}
                    >
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, color: 'var(--adm-text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                          Logo Brand / Web
                        </label>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <div style={{ flex: 1, minWidth: '250px' }}>
                            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>
                              Tautan (URL) atau Base64
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="https://example.com/logo.png"
                              value={webLogoUrl}
                              onChange={(e) => setWebLogoUrl(e.target.value)}
                              style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.5rem', color: '#FFF' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>
                              Upload File
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              className="form-input"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === 'string') {
                                      setWebLogoUrl(reader.result);
                                      toast.success('Logo berhasil dimuat!');
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              style={{ padding: '0.35rem 0.6rem', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', color: '#FFF' }}
                            />
                          </div>
                        </div>

                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', width: 'fit-content' }}>
                          <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--adm-text-secondary)' }}>
                            Pratinjau Logo:
                          </div>
                          {webLogoUrl ? (
                            <img
                              src={webLogoUrl}
                              alt="Logo Preview"
                              style={{ maxHeight: '80px', objectFit: 'contain', background: '#FFF', padding: '0.5rem', borderRadius: '4px' }}
                            />
                          ) : (
                            <div style={{ width: '160px', height: '60px', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', color: '#64748B', fontWeight: 700, fontSize: '0.85rem' }}>
                              Logo Preview
                            </div>
                          )}
                        </div>
                        <small style={{ color: 'var(--adm-text-muted)', display: 'block', marginTop: '1rem', fontSize: '0.8rem' }}>
                          Logo ini akan digunakan pada pojok kiri atas dashboard, favicon browser, invoice pelanggan, serta berkas Press Kit PDF.
                        </small>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                          💾 Simpan Pengaturan Web
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 7: KEAMANAN AKUN & GANTI KATA SANDI */}
              {webSubTab === 'web-security' && (
                <div className="cms-subpanel active" id="web-security">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                    {/* Card Form Ganti Password */}
                    <div className="ecc-card">
                      <div className="ecc-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                        <div>
                          <div className="ecc-card-title" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFF' }}>
                            <span style={{ fontSize: '1.25rem', marginRight: '0.4rem' }}>🔒</span> Ganti Kata Sandi Master MC
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--adm-text-secondary)', margin: '0.25rem 0 0' }}>
                            Perbarui kredensial untuk login ke Command Center & Workspace Admin.
                          </p>
                        </div>
                        <span className="badge badge-available">Akun Master MC</span>
                      </div>

                      <form onSubmit={handleChangePassword}>
                        {/* Sandi Saat Ini */}
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                          <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', color: 'var(--adm-text-secondary)', fontSize: '0.85rem' }}>
                            Kata Sandi Saat Ini <span style={{ color: '#EF4444' }}>*</span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showCurrPass ? 'text' : 'password'}
                              className="form-input"
                              placeholder="Masukkan kata sandi saat ini"
                              required
                              value={currPassword}
                              onChange={(e) => setCurrPassword(e.target.value)}
                              style={{ width: '100%', paddingRight: '2.5rem', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.5rem', color: '#FFF' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrPass(!showCurrPass)}
                              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--adm-text-muted)', cursor: 'pointer' }}
                            >
                              {showCurrPass ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>

                        {/* Sandi Baru */}
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                          <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', color: 'var(--adm-text-secondary)', fontSize: '0.85rem' }}>
                            Kata Sandi Baru <span style={{ color: '#EF4444' }}>*</span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showNewPass ? 'text' : 'password'}
                              className="form-input"
                              placeholder="Minimal 8 karakter"
                              minLength={8}
                              required
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              style={{ width: '100%', paddingRight: '2.5rem', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.5rem', color: '#FFF' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPass(!showNewPass)}
                              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--adm-text-muted)', cursor: 'pointer' }}
                            >
                              {showNewPass ? '🙈' : '👁️'}
                            </button>
                          </div>
                          {newPassword && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: newPassword.length >= 8 ? '#34D399' : '#F87171' }}>
                              Kekuatan: {newPassword.length >= 10 ? 'Kuat (Optimal)' : newPassword.length >= 8 ? 'Cukup' : 'Terlalu Pendek'}
                            </div>
                          )}
                        </div>

                        {/* Konfirmasi Sandi Baru */}
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                          <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', color: 'var(--adm-text-secondary)', fontSize: '0.85rem' }}>
                            Ulangi Kata Sandi Baru <span style={{ color: '#EF4444' }}>*</span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showConfirmPass ? 'text' : 'password'}
                              className="form-input"
                              placeholder="Ketik ulang kata sandi baru"
                              minLength={8}
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              style={{ width: '100%', paddingRight: '2.5rem', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.5rem', color: '#FFF' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPass(!showConfirmPass)}
                              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--adm-text-muted)', cursor: 'pointer' }}
                            >
                              {showConfirmPass ? '🙈' : '👁️'}
                            </button>
                          </div>
                          {confirmPassword && (
                            <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: newPassword === confirmPassword ? '#34D399' : '#F87171' }}>
                              {newPassword === confirmPassword ? '✓ Kata sandi cocok' : '✗ Kata sandi tidak cocok'}
                            </div>
                          )}
                        </div>

                        {/* Tombol Simpan */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setCurrPassword('');
                              setNewPassword('');
                              setConfirmPassword('');
                            }}
                          >
                            Batal / Reset
                          </button>
                          <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 700, padding: '0.5rem 1.25rem' }}>
                            💾 Perbarui Kata Sandi
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Card Tips & Info Keamanan */}
                    <div className="ecc-card" style={{ borderLeft: '4px solid var(--adm-gold)', background: 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(15,23,42,0.95))' }}>
                      <div className="ecc-card-header" style={{ marginBottom: '1rem' }}>
                        <div className="ecc-card-title" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFF' }}>
                          <span style={{ fontSize: '1.2rem', marginRight: '0.4rem' }}>🛡️</span> Panduan Keamanan Akun
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.86rem', color: 'var(--adm-text-secondary)', lineHeight: 1.5 }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--adm-gold)', fontSize: '1.1rem', flexShrink: 0 }}>🔑</span>
                          <div>
                            <strong style={{ color: '#FFF', display: 'block' }}>Gunakan Sandi Kuat</strong>
                            Kombinasikan minimal 8 karakter dengan huruf kapital, angka, dan simbol untuk proteksi optimal.
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <span style={{ color: '#38BDF8', fontSize: '1.1rem', flexShrink: 0 }}>🔒</span>
                          <div>
                            <strong style={{ color: '#FFF', display: 'block' }}>Akses Tunggal Master MC</strong>
                            Kredensial ini melindungi seluruh data kontrak panggung, riwayat transfer DP, dan database klien VIP Anda.
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <span style={{ color: '#10B981', fontSize: '1.1rem', flexShrink: 0 }}>🔄</span>
                          <div>
                            <strong style={{ color: '#FFF', display: 'block' }}>Enkripsi Standar Industri</strong>
                            Kata sandi dienkripsi menggunakan algoritma Bcrypt hash satu arah dan tidak dapat dibaca oleh pihak lain.
                          </div>
                        </div>
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--adm-border)' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--adm-text-muted)' }}>Status Keamanan:</div>
                          <div style={{ fontWeight: 700, color: '#34D399', marginTop: '0.15rem' }}>● Enkripsi Bcrypt Aktif (Zero-Knowledge)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              VIEW 9: PUSAT PANDUAN & ROADMAP SAAS (100% PARITY)
              ========================================================= */}
          {activeSection === 'guide' && (
            <div id="sec-guide" className="admin-section active">
              {/* Hero Banner */}
              <div className="guide-hero-banner" style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)', border: '1px solid rgba(212,175,55,0.2)', padding: '2rem', borderRadius: '16px', marginBottom: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
                  <div style={{ maxWidth: '760px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--adm-gold)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(212,175,55,0.15)', padding: '0.3rem 0.8rem', borderRadius: '999px', border: '1px solid rgba(212,175,55,0.3)', marginBottom: '0.75rem' }}>
                      <span>📚</span> PUSAT DOKUMENTASI & KNOWLEDGE BASE MC-CONNECT
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#F8FAFC', lineHeight: 1.2 }}>
                      Panduan Aplikasi, Fitur & Blueprint SaaS
                    </h1>
                    <p style={{ color: 'var(--adm-text-secondary)', fontSize: '0.92rem', margin: 0, lineHeight: 1.6 }}>
                      Panduan praktis operasional bisnis MC dari hulu ke hilir, direktori lengkap keunggulan panggung, serta cetak biru transformasi MC-Connect menuju platform SaaS Multi-Tenant skala komersial.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button onClick={() => onOpenStage(selectedEventId)} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                      <span>🎙️</span> Buka Stage Mode
                    </button>
                    <button onClick={() => onOpenVendor(selectedEventId)} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                      <span>🎧</span> Buka Layar Vendor
                    </button>
                    <button onClick={onBackToHome} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                      <span>🌐</span> Portal Publik
                    </button>
                  </div>
                </div>

                {/* Quick Badges Metric Strip */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#E2E8F0', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: '#22C55E' }}>●</span> <strong>4 Portal:</strong> Publik, Admin, Stage, Vendor
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#E2E8F0', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: 'var(--adm-gold)' }}>★</span> <strong>AI Co-Pilot:</strong> 4 Tone Scripting & Audio Cue
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#E2E8F0', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: '#38BDF8' }}>⚡</span> <strong>Live Sync:</strong> Zero Latency Cue Matrix
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#E2E8F0', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: '#A855F7' }}>🚀</span> <strong>SaaS Architecture:</strong> Decoupled React 19 + Laravel 12
                  </div>
                </div>
              </div>

              {/* Sub-Tab Navigation */}
              <div className="cms-nav-tabs" style={{ marginBottom: '1.5rem' }}>
                <button 
                  className={`cms-tab-btn ${guideTab === 'workflow' ? 'active' : ''}`}
                  onClick={() => setGuideTab('workflow')}
                >
                  🔄 1. Alur Pemesanan Hulu ke Hilir
                </button>
                <button 
                  className={`cms-tab-btn ${guideTab === 'features' ? 'active' : ''}`}
                  onClick={() => setGuideTab('features')}
                >
                  🌟 2. Katalog Fitur & Keunggulan
                </button>
                <button 
                  className={`cms-tab-btn ${guideTab === 'saas' ? 'active' : ''}`}
                  onClick={() => setGuideTab('saas')}
                >
                  🚀 3. Brainstorming & Arsitektur SaaS
                </button>
                <button 
                  className={`cms-tab-btn ${guideTab === 'actions' ? 'active' : ''}`}
                  onClick={() => setGuideTab('actions')}
                >
                  ⚡ 4. Aksi Cepat & Uji Coba Langsung
                </button>
              </div>

              {/* TAB 1: WORKFLOW */}
              {guideTab === 'workflow' && (
                <div className="space-y-4">
                  <div className="ecc-card">
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--adm-gold)', marginBottom: '0.5rem' }}>
                      🗺️ Alur Siklus Hidup Acara (5 Fase Operasional Terpadu)
                    </h3>
                    <p style={{ color: 'var(--adm-text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                      MC-Connect menghubungkan seluruh mata rantai pekerjaan MC dari saat klien pertama kali melihat portofolio hingga acara selesai dan pembukuan laba bersih ditutup.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      <div className="ecc-card" style={{ borderLeft: '4px solid #38BDF8' }}>
                        <span className="badge" style={{ background: 'rgba(56,189,248,0.15)', color: '#38BDF8', marginBottom: '0.5rem' }}>Fase 1: Hulu</span>
                        <h4 style={{ fontWeight: 800, color: '#FFF', margin: '0.25rem 0 0.5rem' }}>Pemasaran & Request Booking</h4>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', lineHeight: 1.7, color: 'var(--adm-text-secondary)' }}>
                          <li>Klien membuka portal publik <code>/</code>.</li>
                          <li>Cek ketersediaan di Kalender Hijau.</li>
                          <li>Klik tanggal & isi formulir booking (PIC, WA, Venue).</li>
                          <li>Draft invoice otomatis terbit berstatus Unpaid.</li>
                        </ul>
                      </div>

                      <div className="ecc-card" style={{ borderLeft: '4px solid var(--adm-gold)' }}>
                        <span className="badge" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--adm-gold)', marginBottom: '0.5rem' }}>Fase 2: Konfirmasi</span>
                        <h4 style={{ fontWeight: 800, color: '#FFF', margin: '0.25rem 0 0.5rem' }}>Manajemen Lead & Finansial</h4>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', lineHeight: 1.7, color: 'var(--adm-text-secondary)' }}>
                          <li>Notifikasi booking masuk di Dashboard & Kalender.</li>
                          <li>Kirim sapaan WhatsApp 1-klik ke nomor klien.</li>
                          <li>Klien bayar DP 50% via QRIS resmi bisnis.</li>
                          <li>Status berubah ke Terkunci (Anti-Bentrok 100% Aktif).</li>
                        </ul>
                      </div>

                      <div className="ecc-card" style={{ borderLeft: '4px solid #A855F7' }}>
                        <span className="badge" style={{ background: 'rgba(168,85,247,0.15)', color: '#C084FC', marginBottom: '0.5rem' }}>Fase 3: Pra-Acara</span>
                        <h4 style={{ fontWeight: 800, color: '#FFF', margin: '0.25rem 0 0.5rem' }}>Persiapan & AI MC Scripting</h4>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', lineHeight: 1.7, color: 'var(--adm-text-secondary)' }}>
                          <li>Pilih busana panggung di Wardrobe Tracker.</li>
                          <li>Generate naskah AI Co-Pilot dengan 4 pilihan tone.</li>
                          <li>Susun rundown & kaitkan lagu master Bank Musik.</li>
                          <li>Cetak kontrak resmi Surat Perjanjian Kerja (SPK).</li>
                        </ul>
                      </div>

                      <div className="ecc-card" style={{ borderLeft: '4px solid #10B981' }}>
                        <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399', marginBottom: '0.5rem' }}>Fase 4: Hari H</span>
                        <h4 style={{ fontWeight: 800, color: '#FFF', margin: '0.25rem 0 0.5rem' }}>Pelaksanaan di Panggung</h4>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', lineHeight: 1.7, color: 'var(--adm-text-secondary)' }}>
                          <li>MC membuka Stage Mode di iPad/Tablet.</li>
                          <li>Operator menyalakan layar Vendor Cue Screen.</li>
                          <li>Live BroadcastChannel sinkronkan cue segmen tanpa internet.</li>
                          <li>MC bunyikan soundboard efek suara instan.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FEATURES */}
              {guideTab === 'features' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="ecc-card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--adm-gold)', marginBottom: '0.75rem' }}>
                      🛡️ Sistem Anti-Collision Scheduling
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--adm-text-secondary)', lineHeight: 1.6 }}>
                      Mesin penjadwalan cerdas yang secara otomatis mendeteksi tumpang tindih waktu acara antar venue dengan buffer perjalanan wajib 90 menit. Klien ditolak secara instan jika memesan tanggal yang telah berstatus DP Paid.
                    </p>
                  </div>

                  <div className="ecc-card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--adm-gold)', marginBottom: '0.75rem' }}>
                      ⚡ HTML5 Live Broadcast Channel
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--adm-text-secondary)', lineHeight: 1.6 }}>
                      Sinkronisasi instan antar gadget panggung (layar MC di panggung dan laptop operator suara di FOH) tanpa perlu internet atau websocket pihak ketiga. Menggunakan arsitektur native browser zero-latency.
                    </p>
                  </div>

                  <div className="ecc-card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--adm-gold)', marginBottom: '0.75rem' }}>
                      🧾 Generator Dokumen Bisnis Lengkap
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--adm-text-secondary)', lineHeight: 1.6 }}>
                      Cetak Surat Perjanjian Kerja (SPK) PDF berstandar legal, cetak invoice QRIS beresolusi tinggi, dan struk kasir thermal saku 58mm/80mm Bluetooth langsung dari browser tanpa driver tambahan.
                    </p>
                  </div>

                  <div className="ecc-card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--adm-gold)', marginBottom: '0.75rem' }}>
                      🎵 Web Audio Synthesizer DSP
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--adm-text-secondary)', lineHeight: 1.6 }}>
                      Sistem audio bebas royalti yang menghasilkan nada musik ambient dan efek suara panggung (fanfare, drumroll, buzzer, applause) secara matematis murni menggunakan Web Audio API tanpa perlu file audio berat.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: SAAS ARCHITECTURE */}
              {guideTab === 'saas' && (
                <div className="space-y-4">
                  <div className="ecc-card">
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--adm-gold)', marginBottom: '0.75rem' }}>
                      🏗️ Arsitektur Modern Decoupled (React 19 + Laravel 12 API)
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--adm-text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                      Aplikasi ini telah dimigrasikan dari arsitektur monolitik Blade/jQuery menjadi decoupled SPA modern. Frontend React 19 + TypeScript menyajikan pengalaman pengguna yang sangat cepat (sub-100ms), sementara Laravel 12 API Engine mengelola bisnis logic, autentikasi sesi aman, dan database MySQL.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                      <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--adm-border)' }}>
                        <div style={{ fontWeight: 800, color: 'var(--adm-gold)', marginBottom: '0.4rem' }}>Frontend Client (SPA)</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--adm-text-secondary)' }}>
                          React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite 6. Rendering instan tanpa reload halaman, reactive state management.
                        </div>
                      </div>

                      <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--adm-border)' }}>
                        <div style={{ fontWeight: 800, color: '#38BDF8', marginBottom: '0.4rem' }}>Backend Engine (REST API)</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--adm-text-secondary)' }}>
                          Laravel 12 API, Unified Auth Guard via Session & Sanctum, Zero-Trust Financial calculation, Anti-Collision locking engine.
                        </div>
                      </div>

                      <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--adm-border)' }}>
                        <div style={{ fontWeight: 800, color: '#34D399', marginBottom: '0.4rem' }}>Penyimpanan Riil (MySQL)</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--adm-text-secondary)' }}>
                          100% data tersinkronisasi riil di database MySQL: events, customers, cashflow_transactions, cms_contents, wardrobe_items, soundboards.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: QUICK ACTIONS */}
              {guideTab === 'actions' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="ecc-card text-center" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎙️</div>
                    <h4 style={{ fontWeight: 800, color: '#FFF', marginBottom: '0.5rem' }}>Layar Panggung MC</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--adm-text-secondary)', marginBottom: '1.25rem' }}>
                      Mode tablet Dark OLED dengan teleprompter auto-scroll dan soundboard instan.
                    </p>
                    <button onClick={() => onOpenStage(selectedEventId)} className="btn btn-primary btn-sm" style={{ width: '100%', fontWeight: 800 }}>
                      Buka Stage Mode ↗
                    </button>
                  </div>

                  <div className="ecc-card text-center" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎧</div>
                    <h4 style={{ fontWeight: 800, color: '#FFF', marginBottom: '0.5rem' }}>Layar Vendor / Operator</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--adm-text-secondary)', marginBottom: '1.25rem' }}>
                      Layar monitor khusus soundman/DJ yang tersambung live broadcast cue segmen.
                    </p>
                    <button onClick={() => onOpenVendor(selectedEventId)} className="btn btn-secondary btn-sm" style={{ width: '100%', fontWeight: 800 }}>
                      Buka Vendor Screen ↗
                    </button>
                  </div>

                  <div className="ecc-card text-center" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌐</div>
                    <h4 style={{ fontWeight: 800, color: '#FFF', marginBottom: '0.5rem' }}>Portal Beranda Publik</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--adm-text-secondary)', marginBottom: '1.25rem' }}>
                      Halaman penawaran paket jasa MC, showreel video, kalender ketersediaan, dan form booking klien.
                    </p>
                    <button onClick={onBackToHome} className="btn btn-primary btn-sm" style={{ width: '100%', fontWeight: 800 }}>
                      Lihat Beranda Publik ↗
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* =========================================================
          MODAL: DETAIL KLIEN CRM
          ========================================================= */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="ecc-card" style={{ maxWidth: '520px', width: '100%', border: '1px solid var(--adm-gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--adm-border)', paddingBottom: '0.75rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFF' }}>
                👤 Profil Klien: {selectedCustomer.name}
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div><strong>Nomor WhatsApp:</strong> {selectedCustomer.phone}</div>
              <div><strong>Email:</strong> {selectedCustomer.email}</div>
              <div><strong>Kategori Klien:</strong> {selectedCustomer.clientCategory} ({selectedCustomer.category})</div>
              <div><strong>Acara Terkait:</strong> {selectedCustomer.eventName} ({selectedCustomer.eventDate})</div>
              <div><strong>Total Nilai Kontrak:</strong> {formatRupiah(selectedCustomer.contractValue)}</div>
              <div><strong>Status Pembayaran:</strong> {selectedCustomer.paymentStatus}</div>
              <div><strong>Status Kalender:</strong> {selectedCustomer.calendarStatus}</div>
              <div><strong>Catatan Khusus:</strong> {selectedCustomer.notes}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <a 
                href={`https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-secondary btn-sm"
              >
                Chat WhatsApp Klien ↗
              </a>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onSelectEvent(selectedCustomer.eventId);
                  setSelectedCustomer(null);
                  setActiveSection('command-center');
                }}
              >
                Buka di Command Center
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: TAMBAH PELANGGAN BARU
          ========================================================= */}
      {showAddCustomerModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="ecc-card" style={{ maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--adm-border)', paddingBottom: '0.75rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFF' }}>
                + Tambah Pelanggan Baru ke Direktori CRM
              </div>
              <button onClick={() => setShowAddCustomerModal(false)} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formEl = e.currentTarget;
                const newName = (formEl.elements.namedItem('custName') as HTMLInputElement).value;
                const newWa = (formEl.elements.namedItem('custWa') as HTMLInputElement).value;
                const newEvent = (formEl.elements.namedItem('custEvent') as HTMLInputElement).value;
                const newDate = (formEl.elements.namedItem('custDate') as HTMLInputElement).value;
                const newPrice = parseFloat((formEl.elements.namedItem('custPrice') as HTMLInputElement).value) || 15000000;

                const newEventObj: EventItem = {
                  id: Date.now(),
                  title: newEvent,
                  nama_acara: newEvent,
                  date: newDate,
                  time: '18:00 - 21:00 WIB',
                  venue: 'Jakarta Ballroom',
                  lokasi: 'Jakarta Ballroom',
                  pic: `${newName} (${newWa})`,
                  price: formatRupiah(newPrice),
                  rawPrice: newPrice,
                  status: 'Tentative',
                  paymentStatus: 'MENUNGGU DP',
                  category: 'Corporate',
                  clientCategory: 'REGULAR',
                };

                setEvents(prev => [newEventObj, ...prev]);
                setShowAddCustomerModal(false);
                toast.success(`Klien baru ${newName} berhasil ditambahkan ke direktori!`);
              }}
              className="space-y-3"
              style={{ fontSize: '0.85rem' }}
            >
              <div>
                <label style={{ display: 'block', color: 'var(--adm-text-muted)', marginBottom: '0.2rem' }}>Nama Klien:</label>
                <input required name="custName" type="text" placeholder="e.g. Bpk. Hendra Gunawan" style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--adm-text-muted)', marginBottom: '0.2rem' }}>Nomor WhatsApp:</label>
                <input required name="custWa" type="text" placeholder="e.g. 081298765432" style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--adm-text-muted)', marginBottom: '0.2rem' }}>Nama Acara / Project:</label>
                <input required name="custEvent" type="text" placeholder="e.g. Annual Company Gala Dinner" style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--adm-text-muted)', marginBottom: '0.2rem' }}>Tanggal Acara:</label>
                <input required name="custDate" type="date" defaultValue="2026-11-15" style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--adm-text-muted)', marginBottom: '0.2rem' }}>Estimasi Nilai Kontrak (Rp):</label>
                <input required name="custPrice" type="number" defaultValue={18000000} style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCustomerModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 800 }}>+ Simpan Pelanggan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: TAMBAH WARDROBE (DATABASE SYNC)
          ========================================================= */}
      {showAddWardrobeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="ecc-card" style={{ maxWidth: '520px', width: '100%', border: '1px solid var(--adm-gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--adm-border)', paddingBottom: '0.75rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFF' }}>
                👔 Tambah Koleksi Jas / Busana ke Database
              </div>
              <button onClick={() => setShowAddWardrobeModal(false)} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWardrobe} className="space-y-3" style={{ fontSize: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--adm-text-muted)', marginBottom: '0.2rem' }}>Nama Jas / Busana:</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Midnight Navy Peak Lapel Suit"
                  value={newWardrobeName}
                  onChange={(e) => setNewWardrobeName(e.target.value)}
                  style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--adm-text-muted)', marginBottom: '0.2rem' }}>Kategori Busana:</label>
                  <select
                    value={newWardrobeCategory}
                    onChange={(e) => setNewWardrobeCategory(e.target.value)}
                    style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }}
                  >
                    <option value="Formal">Formal / Tuxedo</option>
                    <option value="Tradisional">Adat / Tradisional</option>
                    <option value="Casual Chic">Casual Chic / Smart Casual</option>
                    <option value="Black Tie">Black Tie Gala</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--adm-text-muted)', marginBottom: '0.2rem' }}>Aksen Warna:</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={newWardrobeColor}
                      onChange={(e) => setNewWardrobeColor(e.target.value)}
                      style={{ width: '36px', height: '34px', background: 'none', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={newWardrobeColor}
                      onChange={(e) => setNewWardrobeColor(e.target.value)}
                      style={{ flex: 1, background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--adm-text-muted)', marginBottom: '0.2rem' }}>Deskripsi / Catatan Perawatan:</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan bahan jas, dasi pasangan, atau catatan dry-cleaning..."
                  value={newWardrobeDesc}
                  onChange={(e) => setNewWardrobeDesc(e.target.value)}
                  style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddWardrobeModal(false)}>Batal</button>
                <button type="submit" disabled={isSavingWardrobe} className="btn btn-primary" style={{ fontWeight: 800 }}>
                  {isSavingWardrobe ? 'Menyimpan...' : '+ Simpan ke Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: TAMBAH TRANSAKSI KAS (CASH FLOW)
          ========================================================= */}
      {showAddCashModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="ecc-card" style={{ maxWidth: '520px', width: '100%', border: '1px solid var(--adm-gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--adm-border)', paddingBottom: '0.75rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFF' }}>
                💰 Catat Transaksi Arus Kas Baru
              </div>
              <button onClick={() => setShowAddCashModal(false)} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCashflow} className="space-y-3" style={{ fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--adm-text-muted)', marginBottom: '0.2rem' }}>Jenis Transaksi *</label>
                  <select
                    value={newCfType}
                    onChange={(e) => {
                      const val = e.target.value as 'in' | 'out';
                      setNewCfType(val);
                      if (val === 'in') {
                        setNewCfCategory('Pendapatan Booking');
                      } else {
                        setNewCfCategory('Operasional Umum MC');
                      }
                    }}
                    style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }}
                  >
                    <option value="in">Kas Masuk (Pendapatan)</option>
                    <option value="out">Kas Keluar (Pengeluaran)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--adm-text-muted)', marginBottom: '0.2rem' }}>Nominal (Rp) *</label>
                  <input
                    required
                    type="number"
                    placeholder="Contoh: 1500000"
                    value={newCfAmount}
                    onChange={(e) => setNewCfAmount(e.target.value)}
                    style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--adm-text-muted)', marginBottom: '0.2rem' }}>Kategori Transaksi *</label>
                  <select
                    value={newCfCategory}
                    onChange={(e) => setNewCfCategory(e.target.value)}
                    style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }}
                  >
                    {newCfType === 'in' ? (
                      <>
                        <option value="Pendapatan Booking">Pendapatan Booking Acara</option>
                        <option value="DP Acara">DP Pembayaran Klien</option>
                        <option value="Pelunasan">Pelunasan Kontrak</option>
                        <option value="Sponsorship">Sponsorship & Endorsement</option>
                        <option value="Lainnya">Pemasukan Lainnya</option>
                      </>
                    ) : (
                      <>
                        <option value="Operasional Umum MC">Operasional Umum MC</option>
                        <option value="Transportasi">Biaya Transport & Bensin</option>
                        <option value="Wardrobe">Biaya Wardrobe & Dry Cleaning</option>
                        <option value="Konsumsi">Konsumsi / Meals Kru</option>
                        <option value="Asisten MC">Honor Asisten Lapangan</option>
                        <option value="Lainnya">Pengeluaran Lainnya</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--adm-text-muted)', marginBottom: '0.2rem' }}>Tanggal Transaksi *</label>
                  <input
                    required
                    type="date"
                    value={newCfDate}
                    onChange={(e) => setNewCfDate(e.target.value)}
                    style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--adm-text-muted)', marginBottom: '0.2rem' }}>Keterangan / Deskripsi</label>
                <input
                  type="text"
                  placeholder="Misal: Pelunasan klien, bayar transport, dry clean jas..."
                  value={newCfDesc}
                  onChange={(e) => setNewCfDesc(e.target.value)}
                  style={{ width: '100%', background: 'var(--adm-bg-surface)', border: '1px solid var(--adm-border)', borderRadius: '6px', padding: '0.45rem', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCashModal(false)}>Batal</button>
                <button type="submit" disabled={isSavingCf} className="btn btn-primary" style={{ fontWeight: 800 }}>
                  {isSavingCf ? 'Menyimpan...' : 'Simpan Transaksi Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
