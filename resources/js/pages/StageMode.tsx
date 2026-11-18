import React, { useState, useEffect } from 'react';
import { useVoiceScroll } from '@/hooks/useVoiceScroll';
import { useSoundboard } from '@/hooks/useSoundboard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  ZoomIn, 
  ZoomOut, 
  FlipHorizontal, 
  Volume2,
  Clock,
  ChevronRight,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Music,
  Radio,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export interface StageSegment {
  id: number;
  time: string;
  title: string;
  isDone: boolean;
  music: string;
  pic: string;
  script?: string;
}

export default function StageMode({
  eventId = 1,
  onBackToDashboard,
}: {
  eventId?: number;
  onBackToDashboard?: () => void;
}) {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(1);
  const [activeSegmentTitle, setActiveSegmentTitle] = useState<string>('Grand Entrance Pengantin & Keluarga');
  const [currentScript, setCurrentScript] = useState<string>('');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [remainingTimeSeconds, setRemainingTimeSeconds] = useState<number>(6120); // 1h 42m

  const {
    viewportRef,
    isVoiceActive,
    isSpeakingDetected,
    isScrolling,
    scrollSpeed,
    setScrollSpeed,
    fontSize,
    changeFontSize,
    isMirror,
    setIsMirror,
    toggleVoiceMode,
    toggleScroll,
    stopScroll,
  } = useVoiceScroll();

  const { playFanfare, playDrumRoll, playChime, playBuzzer, playApplause } = useSoundboard();

  const [stageRundown, setStageRundown] = useState<StageSegment[]>([
    {
      id: 1,
      time: '18:00 - 18:30',
      title: 'Tamu Undangan Tiba & Registrasi',
      isDone: true,
      music: 'Acoustic Instrumental Soft BGM',
      pic: 'Penerima Tamu',
      script: 'Selamat malam dan selamat datang kepada bapak, ibu sekalian. Silakan mengisi buku registrasi dan menikmati santap selamat datang.',
    },
    {
      id: 2,
      time: '18:30 - 18:45',
      title: 'Opening MC & Sambutan VIP',
      isDone: true,
      music: 'Fanfare Brass of Triumph Intro',
      pic: 'Master MC Vanya Arsyad',
      script: 'Selamat malam bapak, ibu, serta seluruh tamu undangan yang kami muliakan. Sungguh sebuah kehormatan luar biasa menyambut Anda sekalian di malam penuh cinta ini.',
    },
    {
      id: 3,
      time: '18:45 - 19:15',
      title: 'Grand Entrance Pengantin & Keluarga',
      isDone: false,
      music: 'Canon in D Strings / A Thousand Years Piano',
      pic: 'WO Floor Coordinator',
      script: `Hadirin sekalian, detak waktu sejenak melambat, mengantarkan kita pada momentum paling dinantikan...

Arahkan pandangan Anda semua ke pintu utama, dan sambutlah dengan tepuk tangan paling bergemuruh, kehadiran kedua mempelai kita yang penuh berkah dan cinta:

DIMAS PRATAMA & ANISSA LARASATI!

Mari kita berikan standing ovation paling meriah untuk menyambut langkah suci mereka berdua menuju pelaminan kebahagiaan!

(Cue Operator Musik: Mainkan Fanfare & Romantis Entrance BGM)

Kepada seluruh keluarga besar dan tamu kehormatan, dipersilakan duduk kembali dengan nyaman.`,
    },
    {
      id: 4,
      time: '19:15 - 19:45',
      title: 'Sambutan Perwakilan Keluarga & Doa',
      isDone: false,
      music: 'Subtle Piano Reflection Ambient',
      pic: 'Perwakilan Keluarga',
      script: 'Kepada yang terhormat perwakilan keluarga besar kedua mempelai, waktu dan tempat kami persilakan dengan segala hormat untuk memimpin doa bersama.',
    },
    {
      id: 5,
      time: '19:45 - 20:30',
      title: 'Dinner Reception, Toast & Ice Breaking Game',
      isDone: false,
      music: 'Upbeat Pop Jazz / Game SFX Pack',
      pic: 'Master MC & Asisten',
      script: 'Kini saatnya kita sedikit mencairkan suasana! Kami undang 5 orang sahabat terdekat untuk maju ke panggung dan memperebutkan doorprize spesial!',
    },
    {
      id: 6,
      time: '20:30 - 21:00',
      title: 'Lempar Buket, Foto Bersama & Closing MC',
      isDone: false,
      music: 'Celebration Finale Song / Marry You',
      pic: 'All Crew & MC',
      script: 'Terima kasih atas segala doa restu dan kehangatan yang telah bapak, ibu sekalian persembahkan malam ini. Have a safe journey home and good night!',
    },
  ]);

  // Wall Clock & Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
      setRemainingTimeSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format remaining seconds into HH:MM:SS
  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Broadcast live change to Vendor Operator Musik & Command Center
  const broadcastSegmentChange = (index: number, segment: StageSegment) => {
    try {
      const channel = new BroadcastChannel('mc_connect_live_channel');
      channel.postMessage({
        type: 'SEGMENT_CHANGE',
        segmentIndex: index,
        segmentTitle: segment.title,
        musicCue: segment.music,
        script: segment.script,
        timestamp: Date.now(),
      });
      channel.close();
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  };

  // Listen for BroadcastChannel sync from Command Center / Vendor
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('mc_connect_live_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'SEGMENT_CHANGE') {
          const idx = Number(event.data.segmentIndex);
          if (!isNaN(idx) && idx >= 0 && idx < stageRundown.length) {
            setActiveSegmentIndex(idx);
            const targetSeg = stageRundown[idx];
            setActiveSegmentTitle(event.data.segmentTitle || targetSeg.title);
            if (event.data.script) {
              setCurrentScript(event.data.script);
            } else if (targetSeg.script) {
              setCurrentScript(targetSeg.script);
            }
            toast.info(`🔔 Sinkronisasi Panggung: ${event.data.segmentTitle || targetSeg.title}`);
          }
        }
      };
    } catch (e) {}

    return () => {
      channel?.close();
    };
  }, [stageRundown]);

  const selectSegment = (index: number) => {
    setActiveSegmentIndex(index);
    const seg = stageRundown[index];
    setActiveSegmentTitle(seg.title);
    setCurrentScript(seg.script || '');
    broadcastSegmentChange(index, seg);
    toast.success(`Segmen panggung beralih: ${seg.title}`);
  };

  const advanceToNextSegment = () => {
    if (activeSegmentIndex < stageRundown.length - 1) {
      const nextIdx = activeSegmentIndex + 1;
      // Mark current as done
      setStageRundown((prev) =>
        prev.map((s, idx) => (idx === activeSegmentIndex ? { ...s, isDone: true } : s))
      );
      selectSegment(nextIdx);
    } else {
      toast.info('Seluruh segmen acara telah selesai!');
    }
  };

  const resetScrollPosition = () => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }
    stopScroll();
    toast.info('Posisi teks prompter direset ke atas.');
  };

  const currentDisplayScript = currentScript || stageRundown[activeSegmentIndex]?.script || '';

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Bar Status */}
      <header className="flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-900/95 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <Button variant="ghost" size="sm" onClick={onBackToDashboard} className="text-slate-400 hover:text-white">
              ← Dashboard
            </Button>
          )}
          <Badge variant="purple" className="px-3 py-1 text-xs font-bold tracking-wider">
            STAGE CONSOLE
          </Badge>
          <span className="text-sm font-semibold text-slate-200 hidden sm:inline">
            Event #{eventId} • Panggung & Teleprompter
          </span>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-xl">
            <span
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                isSpeakingDetected
                  ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
                  : isVoiceActive
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-600'
              }`}
            />
            <span className="text-xs font-mono font-bold text-slate-300">
              {isSpeakingDetected ? 'VOICE DETECTED' : isVoiceActive ? 'MIC LISTENING' : 'VOICE OFF'}
            </span>
          </div>

          <Badge variant="default" className="font-mono text-xs hidden md:inline-flex">
            SEGMEN {activeSegmentIndex + 1} / {stageRundown.length}
          </Badge>

          <div className="font-mono text-xs text-amber-400 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            {currentTimeStr || '18:45 WIB'}
          </div>
        </div>
      </header>

      {/* Main Stage Grid: 70% Teleprompter Viewport, 30% Soundboard & Rundown Assistant */}
      <div className="flex flex-1 overflow-hidden">
        {/* 70% Teleprompter Viewport */}
        <div className="relative flex flex-1 flex-col border-r border-slate-800/80 bg-slate-950 p-6">
          {/* Controls Bar for Prompter */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Button
                variant={isScrolling ? 'danger' : 'primary'}
                size="sm"
                onClick={toggleScroll}
                className="font-bold tracking-wide"
              >
                {isScrolling ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isScrolling ? 'PAUSE' : 'AUTO SCROLL'}
              </Button>

              <Button
                variant={isVoiceActive ? 'primary' : 'secondary'}
                size="sm"
                onClick={toggleVoiceMode}
                className="font-bold"
              >
                {isVoiceActive ? <Mic className="h-4 w-4 text-slate-950" /> : <MicOff className="h-4 w-4" />}
                {isVoiceActive ? 'VOICE ON' : 'VOICE SCROLL'}
              </Button>

              <button
                onClick={resetScrollPosition}
                title="Reset Posisi ke Paling Atas"
                className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Scroll Speed & Font Size Controls */}
            <div className="flex items-center gap-3">
              {/* Speed Slider */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 text-[11px]">Speed:</span>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={scrollSpeed}
                  onChange={(e) => setScrollSpeed(Number(e.target.value))}
                  className="w-16 accent-amber-400 cursor-pointer"
                />
                <span className="font-bold text-amber-400">{scrollSpeed.toFixed(1)}x</span>
              </div>

              {/* Font Sizer */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => changeFontSize(-4)}
                  className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Kecilkan Font"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono text-xs font-bold text-slate-300 w-9 text-center">{fontSize}px</span>
                <button
                  onClick={() => changeFontSize(4)}
                  className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Besarkan Font"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Mirror Mode Toggle */}
              <Button
                variant={isMirror ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setIsMirror(!isMirror);
                  toast.info(isMirror ? 'Mode Cermin Dimatikan' : 'Mode Cermin Teleprompter Aktif (-scale-x-100)');
                }}
                className={isMirror ? 'font-bold bg-purple-600 text-white' : ''}
              >
                <FlipHorizontal className="h-4 w-4" />
                <span className="hidden md:inline">MIRROR</span>
              </Button>
            </div>
          </div>

          {/* Scrolling Text Viewport */}
          <div
            ref={viewportRef}
            className={`flex-1 overflow-y-auto rounded-2xl border border-slate-800/80 bg-slate-950 p-8 shadow-inner transition-transform duration-200 ${
              isMirror ? '-scale-x-100' : ''
            }`}
          >
            <div
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
              className="font-medium text-amber-100/90 space-y-6"
            >
              <div className="pb-3 border-b border-amber-500/20">
                <span className="text-amber-400 font-extrabold tracking-wider uppercase block text-base md:text-lg">
                  [{stageRundown[activeSegmentIndex]?.time || '18:45'}] {activeSegmentTitle}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  PIC: {stageRundown[activeSegmentIndex]?.pic || 'WO'} • Cue Musik: <strong className="text-sky-400">{stageRundown[activeSegmentIndex]?.music || 'BGM'}</strong>
                </span>
              </div>

              <div className="text-emerald-300 font-medium whitespace-pre-line leading-relaxed">
                {currentDisplayScript}
              </div>

              {/* End of segment buffer */}
              <div className="pt-16 pb-32 text-center text-slate-500 text-sm font-mono border-t border-slate-800/60 mt-12">
                — AKHIR DARI SEGMEN {activeSegmentIndex + 1} —
              </div>
            </div>
          </div>

          {/* Bottom Floating Fast Action Button */}
          <div className="absolute bottom-10 right-10 z-20">
            <Button
              size="md"
              className="shadow-2xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950"
              onClick={advanceToNextSegment}
            >
              Lanjut ke Segmen Berikutnya <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* 30% Stage Assistant & Soundboard */}
        <div className="flex w-96 flex-col gap-4 bg-slate-900/60 p-5 overflow-y-auto border-l border-slate-800/60">
          {/* Soundboard Quick Pads (Native Web Audio API) */}
          <Card className="border-slate-800 bg-slate-900/90 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                <Volume2 className="h-4 w-4" /> Web Audio Soundboard
              </h4>
              <Badge variant="success" className="text-[10px]">0ms Latency</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={playFanfare}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-slate-200 hover:border-amber-400 hover:text-amber-400 hover:bg-slate-800 active:scale-95 transition-all"
              >
                🎺 Fanfare
              </button>

              <button
                onClick={playDrumRoll}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-slate-200 hover:border-amber-400 hover:text-amber-400 hover:bg-slate-800 active:scale-95 transition-all"
              >
                🥁 Drum Roll
              </button>

              <button
                onClick={playApplause}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-slate-200 hover:border-emerald-400 hover:text-emerald-400 hover:bg-slate-800 active:scale-95 transition-all"
              >
                👏 Applause
              </button>

              <button
                onClick={playChime}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-slate-200 hover:border-sky-400 hover:text-sky-400 hover:bg-slate-800 active:scale-95 transition-all"
              >
                ✨ Chime Ding
              </button>

              <button
                onClick={playBuzzer}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all"
              >
                🚨 Wrong Buzzer
              </button>
            </div>
          </Card>

          {/* Interactive Stage Rundown Navigator */}
          <Card className="border-slate-800 bg-slate-900/90 p-4">
            <h4 className="flex items-center gap-2 text-xs font-extrabold text-white uppercase tracking-wider mb-3">
              <Radio className="h-4 w-4 text-emerald-400" /> Rundown Tracker Panggung
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {stageRundown.map((seg, idx) => {
                const isActive = idx === activeSegmentIndex;
                return (
                  <button
                    key={seg.id}
                    onClick={() => selectSegment(idx)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
                      isActive
                        ? 'border-amber-400 bg-amber-400/10 text-white shadow-md'
                        : seg.isDone
                        ? 'border-slate-800 bg-slate-950/60 text-slate-500 line-through'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-bold flex items-center gap-1.5 truncate">
                        <span>{idx + 1}.</span>
                        <span className="truncate">{seg.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{seg.time}</div>
                    </div>
                    {isActive ? (
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                    ) : seg.isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Sticky Notes VIP Protocols */}
          <Card className="border-amber-500/30 bg-amber-500/5 p-4 text-amber-200">
            <h5 className="font-bold text-xs uppercase tracking-wider text-amber-400 mb-2">
              📌 PANDUAN PENTING VIP
            </h5>
            <ul className="text-xs space-y-1.5 list-disc list-inside text-amber-100/90">
              <li>Sebutkan gelar kehormatan: <strong>Bpk. Prof. Dr. H. Hendrawan</strong>.</li>
              <li>Jangan lakukan lelucon roasting kepada keluarga besar mempelai.</li>
              <li>Penyerahan buket bunga diatur pada segmen 4 setelah potong kue.</li>
            </ul>
          </Card>

          {/* Timer Countdown Acara */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-center shadow-lg">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Estimasi Sisa Waktu Acara
            </span>
            <div className="text-3xl font-black text-amber-400 tracking-wider mt-1">
              {formatCountdown(remainingTimeSeconds)}
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block">Live On-Stage Monitor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
