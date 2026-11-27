import React, { useState, useEffect } from 'react';
const Landing = React.lazy(() => import('./pages/Landing'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const StageMode = React.lazy(() => import('./pages/StageMode'));
const VendorCue = React.lazy(() => import('./pages/VendorCue'));
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  Mic, 
  Headphones, 
  Globe, 
  Sparkles,
  Lock,
  Mail,
  Key,
  LogIn,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';

export default function App() {
  const getInitialView = (): 'admin' | 'stage' | 'vendor' | 'landing' => {
    if (typeof window === 'undefined') return 'admin';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    if (hash === '#stage' || path.startsWith('/stage')) return 'stage';
    if (hash === '#vendor' || path.startsWith('/vendor')) return 'vendor';
    if (hash === '#admin' || path.startsWith('/admin')) return 'admin';
    if (hash === '#landing' || path === '/' || path.startsWith('/landing')) return 'landing';
    return 'landing';
  };

  const [currentView, setCurrentView] = useState<'admin' | 'stage' | 'vendor' | 'landing'>(getInitialView);
  const [selectedEventId, setSelectedEventId] = useState<number>(1);

  // Authentication State (Unified SPA Auth Guard)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [pendingView, setPendingView] = useState<'admin' | 'stage' | 'vendor' | null>(null);

  // Check Active Session on Mount
  const checkSession = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/mc/session', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setIsAuthenticated(true);
          return true;
        }
      }
      setIsAuthenticated(false);
      return false;
    } catch {
      setIsAuthenticated(false);
      return false;
    }
  };

  useEffect(() => {
    checkSession().then((authed) => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const isProtected = path.startsWith('/admin') || path.startsWith('/stage') || path.startsWith('/vendor') || hash === '#admin' || hash === '#stage' || hash === '#vendor';
      if (isProtected && !authed) {
        setShowLoginModal(true);
      }
    });
  }, []);

  // Sync with browser URL / hash if specified
  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (hash === '#stage' || path.startsWith('/stage')) {
        if (!isAuthenticated) {
          setPendingView('stage');
          setShowLoginModal(true);
        } else {
          setCurrentView('stage');
        }
      } else if (hash === '#vendor' || path.startsWith('/vendor')) {
        if (!isAuthenticated) {
          setPendingView('vendor');
          setShowLoginModal(true);
        } else {
          setCurrentView('vendor');
        }
      } else if (hash === '#admin' || path.startsWith('/admin')) {
        if (!isAuthenticated) {
          setPendingView('admin');
          setShowLoginModal(true);
        } else {
          setCurrentView('admin');
        }
      } else if (hash === '#landing' || path === '/' || path.startsWith('/landing')) {
        setCurrentView('landing');
      }
    };

    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    return () => {
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
    };
  }, [isAuthenticated]);

  const navigateTo = (view: 'admin' | 'stage' | 'vendor' | 'landing', eventId?: number) => {
    if (eventId) {
      setSelectedEventId(eventId);
    }

    if (view !== 'landing' && !isAuthenticated) {
      setPendingView(view);
      setShowLoginModal(true);
      return;
    }

    setCurrentView(view);
    const targetPath = view === 'landing' ? '/' : `/${view}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/mc/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setShowLoginModal(false);
        setLoginError('');
        toast.success('Login Berhasil! Selamat datang di Workspace Admin.');
        const nextView = pendingView || (currentView === 'landing' ? 'admin' : currentView);
        setCurrentView(nextView);
        const targetPath = nextView === 'landing' ? '/' : `/${nextView}`;
        if (window.location.pathname !== targetPath) {
          window.history.pushState(null, '', targetPath);
        }
      } else {
        setLoginError(data.message || 'Email atau password tidak sesuai.');
      }
    } catch (err: any) {
      setLoginError('Koneksi server terganggu: ' + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/mc/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {}
    setIsAuthenticated(false);
    setCurrentView('landing');
    window.history.pushState(null, '', '/');
    toast.info('Sesi Anda telah berakhir.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
      {/* Top Enterprise Modern App Shell Bar (Only shown on Stage/Vendor screens, Admin has its own full sidebar workspace) */}
      {(currentView === 'stage' || currentView === 'vendor') && (
        <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-slate-800/80 bg-slate-900/95 px-4 backdrop-blur-md shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('admin')}>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20">
                MC
              </span>
              <div className="hidden sm:block">
                <span className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  MC-CONNECT
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-amber-400 border border-amber-500/20">
                    REACT 19 SPA
                  </span>
                </span>
              </div>
            </div>

            <div className="h-4 w-px bg-slate-800 hidden md:block" />

            {/* Module Switcher Tabs */}
            <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 text-xs font-medium">
              <button
                onClick={() => navigateTo('admin')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  currentView === 'admin'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Command Center</span>
              </button>

              <button
                onClick={() => navigateTo('stage')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  currentView === 'stage'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Mic className="h-3.5 w-3.5" />
                <span>Stage Mode</span>
              </button>

              <button
                onClick={() => navigateTo('vendor')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  currentView === 'vendor'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Headphones className="h-3.5 w-3.5" />
                <span>Operator Musik</span>
              </button>

              <button
                onClick={() => navigateTo('landing')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  currentView === 'landing'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Landing Klien</span>
              </button>
            </nav>
          </div>

          {/* Right Status & Safe Bridge Switcher */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-slate-400">Laravel API :9000</span>
            </div>
          </div>
        </header>
      )}

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        <React.Suspense
          fallback={
            <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center bg-slate-950 text-slate-300 gap-3">
              <div className="h-7 w-7 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              <div className="text-xs font-semibold tracking-wider text-amber-400">MEMUAT MODUL MC-CONNECT...</div>
            </div>
          }
        >
          {isAuthenticated === null ? (
            <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center bg-slate-950 text-slate-300 gap-3">
              <div className="h-7 w-7 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              <div className="text-xs font-semibold tracking-wider text-amber-400">MEMVERIFIKASI SESI AMAN...</div>
            </div>
          ) : currentView === 'admin' ? (
            isAuthenticated ? (
              <Dashboard
                selectedEventId={selectedEventId}
                onSelectEvent={(id) => setSelectedEventId(id)}
                onOpenStage={(id) => navigateTo('stage', id || selectedEventId)}
                onOpenVendor={(id) => navigateTo('vendor', id || selectedEventId)}
                onBackToHome={() => navigateTo('landing')}
                onLogout={handleLogout}
                onUnauthorized={() => {
                  setIsAuthenticated(false);
                  setShowLoginModal(true);
                }}
              />
            ) : (
              <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center bg-slate-950 text-slate-300 p-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
                  <Lock className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-2">Panel Admin Dilindungi</h2>
                <p className="text-sm text-slate-400 max-w-md mb-6">
                  Halaman ini memerlukan autentikasi resmi. Silakan login menggunakan akun MC Anda untuk melanjutkan.
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => setShowLoginModal(true)} className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400">
                    <LogIn className="h-4 w-4 mr-1.5" /> Buka Form Login
                  </Button>
                  <Button variant="outline" onClick={() => navigateTo('landing')} className="border-slate-800 text-slate-300 hover:text-white">
                    Kembali ke Beranda
                  </Button>
                </div>
              </div>
            )
          ) : currentView === 'stage' ? (
            isAuthenticated ? (
              <div className="relative flex-1 flex flex-col">
                <StageMode
                  eventId={selectedEventId}
                  onBackToDashboard={() => navigateTo('admin')}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center bg-slate-950 text-slate-300 p-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Lock className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-2">Stage Mode Terproteksi</h2>
                <Button onClick={() => setShowLoginModal(true)} className="bg-amber-500 text-slate-950 font-bold mt-4">
                  <LogIn className="h-4 w-4 mr-1.5" /> Login MC untuk Membuka Stage
                </Button>
              </div>
            )
          ) : currentView === 'vendor' ? (
            isAuthenticated ? (
              <div className="relative flex-1 flex flex-col">
                <VendorCue
                  eventId={selectedEventId}
                  onBackToDashboard={() => navigateTo('admin')}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center bg-slate-950 text-slate-300 p-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Lock className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-2">Layar Vendor Terproteksi</h2>
                <Button onClick={() => setShowLoginModal(true)} className="bg-amber-500 text-slate-950 font-bold mt-4">
                  <LogIn className="h-4 w-4 mr-1.5" /> Login untuk Membuka Layar Vendor
                </Button>
              </div>
            )
          ) : (
            <Landing
              onOpenAdmin={() => navigateTo('admin')}
              onOpenStage={() => navigateTo('stage')}
            />
          )}
        </React.Suspense>
      </main>

      {/* Unified SPA Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900/95 p-6 md:p-8 shadow-2xl shadow-amber-500/10">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowLoginModal(false);
                if (currentView !== 'landing' && !isAuthenticated) {
                  navigateTo('landing');
                }
              }}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Tutup & Kembali"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 font-black text-slate-950 shadow-lg shadow-amber-500/25 text-xl">
                MC
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
                MC-CONNECT
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-amber-400 border border-amber-500/20">
                  v8.0 Pro
                </span>
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Silakan login untuk mengakses Command Center, CRM & Kalender Panggung.
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Akun MC
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@mcconnect.id"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold hover:brightness-110 shadow-lg shadow-amber-500/20 py-2.5 rounded-xl transition-all"
              >
                {loginLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi Kredensial...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" /> Masuk ke Workspace Admin
                  </span>
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  navigateTo('landing');
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors pt-1"
              >
                Kembali ke Beranda Publik
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
