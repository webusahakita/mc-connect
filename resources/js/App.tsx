import React, { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import StageMode from './pages/StageMode';
import VendorCue from './pages/VendorCue';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { 
  LayoutDashboard, 
  Mic, 
  Headphones, 
  Globe, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'admin' | 'stage' | 'vendor' | 'landing'>('admin');
  const [selectedEventId, setSelectedEventId] = useState<number>(1);
  const [showLegacyMenu, setShowLegacyMenu] = useState<boolean>(false);

  // Sync with browser URL / hash if specified
  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (hash === '#stage' || path.includes('/stage')) {
        setCurrentView('stage');
      } else if (hash === '#vendor' || path.includes('/vendor')) {
        setCurrentView('vendor');
      } else if (hash === '#landing' || path.includes('/landing')) {
        setCurrentView('landing');
      } else {
        // Default SPA route is admin command center
        setCurrentView('admin');
      }
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    return () => {
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
    };
  }, []);

  const navigateTo = (view: 'admin' | 'stage' | 'vendor' | 'landing', eventId?: number) => {
    if (eventId) {
      setSelectedEventId(eventId);
    }
    setCurrentView(view);
    window.location.hash = view === 'admin' ? '' : view;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
      {/* Top Enterprise Modern App Shell Bar */}
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

        {/* Right Status & Dual-Track Fallback Switcher */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-400">Laravel API :9000</span>
          </div>

          {/* Dual-Track Fallback Menu */}
          <div className="relative">
            <button
              onClick={() => setShowLegacyMenu(!showLegacyMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              title="Akses Halaman HTML Asli (Dual-Track Safety)"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Versi Asli (Legacy)</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showLegacyMenu && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 text-xs"
                onMouseLeave={() => setShowLegacyMenu(false)}
              >
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/60 mb-1">
                  Dual-Track Safe Fallbacks
                </div>
                <a
                  href="/admin"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <span>Admin HTML Asli</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
                <a
                  href="/stage"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <span>Stage Mode Asli</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
                <a
                  href="/vendor"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <span>Vendor Layar Asli</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
                <a
                  href="/"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <span>Beranda Web Klien</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {currentView === 'admin' && (
          <Dashboard
            selectedEventId={selectedEventId}
            onSelectEvent={(id) => setSelectedEventId(id)}
            onOpenStage={(id) => navigateTo('stage', id || selectedEventId)}
            onOpenVendor={(id) => navigateTo('vendor', id || selectedEventId)}
            onBackToHome={() => navigateTo('landing')}
          />
        )}

        {currentView === 'stage' && (
          <div className="relative flex-1 flex flex-col">
            <StageMode
              eventId={selectedEventId}
              onBackToDashboard={() => navigateTo('admin')}
            />
          </div>
        )}

        {currentView === 'vendor' && (
          <div className="relative flex-1 flex flex-col">
            <VendorCue
              eventId={selectedEventId}
              onBackToDashboard={() => navigateTo('admin')}
            />
          </div>
        )}

        {currentView === 'landing' && (
          <Landing
            onOpenAdmin={() => navigateTo('admin')}
            onOpenStage={() => navigateTo('stage')}
          />
        )}
      </main>
    </div>
  );
}
