import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Square, 
  Volume2, 
  Radio, 
  CheckCircle, 
  ArrowLeft, 
  RefreshCw,
  Sliders,
  Music,
  ExternalLink,
  VolumeX
} from 'lucide-react';
import { toast } from 'sonner';

export interface CueItem {
  id: number;
  time: string;
  segmentTitle: string;
  songTitle: string;
  artist: string;
  cueType: 'Intro' | 'Transition' | 'Background' | 'Climax' | 'Outro';
  notes: string;
  status: 'pending' | 'active' | 'completed';
}

export default function VendorCue({
  eventId = 1,
  onBackToDashboard,
}: {
  eventId?: number;
  onBackToDashboard?: () => void;
}) {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [isSynced, setIsSynced] = useState<boolean>(true);
  const [masterVolume, setMasterVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscsRef = useRef<OscillatorNode[]>([]);

  const [cueList, setCueList] = useState<CueItem[]>([
    {
      id: 1,
      time: '18:00 - 18:30',
      segmentTitle: 'Tamu Undangan Registrasi',
      songTitle: 'L-O-V-E (Instrumental Jazz)',
      artist: 'Nat King Cole Trio',
      cueType: 'Background',
      notes: 'Volume 40%, fade out saat MC mulai opening.',
      status: 'completed',
    },
    {
      id: 2,
      time: '18:30 - 18:45',
      segmentTitle: 'Opening MC & Sambutan VIP',
      songTitle: 'Fanfare of Triumph & Brass Intro',
      artist: 'Orchestral Brass Pack',
      cueType: 'Intro',
      notes: 'Hit crash saat MC menyebut nama pengantin.',
      status: 'active',
    },
    {
      id: 3,
      time: '18:45 - 19:15',
      segmentTitle: 'Grand Entrance Pengantin',
      songTitle: 'A Thousand Years (Strings & Piano)',
      artist: 'The Piano Guys',
      cueType: 'Climax',
      notes: 'Mulai pelan dari pintu masuk, naikkan fader ke 85% di pelaminan.',
      status: 'pending',
    },
    {
      id: 4,
      time: '19:15 - 19:45',
      segmentTitle: 'Sambutan Keluarga & Doa Bersama',
      songTitle: 'Spiritual Peacefulness (Acoustic)',
      artist: 'Ambient Calm',
      cueType: 'Background',
      notes: 'Sangat pelan (volume 20%) sebagai ambient.',
      status: 'pending',
    },
    {
      id: 5,
      time: '19:45 - 20:30',
      segmentTitle: 'Dinner, Toast & Games MC',
      songTitle: "Can't Take My Eyes Off You (Bossa)",
      artist: 'Smooth Lounge Quartet',
      cueType: 'Transition',
      notes: 'Siapkan sound effect Ding & Buzzer saat game.',
      status: 'pending',
    },
    {
      id: 6,
      time: '20:30 - 21:00',
      segmentTitle: 'Lempar Buket & Grand Closing MC',
      songTitle: 'Marry You / Happy Finale Anthem',
      artist: 'Bruno Mars (Acoustic Upbeat)',
      cueType: 'Outro',
      notes: 'Full volume 100% saat MC closing pamit.',
      status: 'pending',
    },
  ]);

  // Stop synthetic audio
  const stopAudio = () => {
    activeOscsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    activeOscsRef.current = [];
    setIsPlaying(null);
  };

  // Synthesize harmonic audio preview matching cue type
  const playSyntheticCue = (type: CueItem['cueType']) => {
    stopAudio();

    if (isMuted) {
      toast.info('Audio sedang dimute.');
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime((masterVolume / 100) * 0.25, ctx.currentTime);
      gain.connect(ctx.destination);

      const oscs: OscillatorNode[] = [];
      const now = ctx.currentTime;

      if (type === 'Intro' || type === 'Climax') {
        // Grand Fanfare / Strings Chords (C Major chord arpeggio)
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          osc.connect(gain);
          osc.start(now + idx * 0.1);
          oscs.push(osc);
        });
      } else if (type === 'Transition') {
        // Upbeat Bossa Jazz Chord (Dm7 -> G7)
        [293.66, 349.23, 440.0, 523.25].forEach((freq) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          osc.connect(gain);
          osc.start(now);
          oscs.push(osc);
        });
      } else {
        // Soft Acoustic Background
        [261.63, 329.63, 392.0].forEach((freq) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          osc.connect(gain);
          osc.start(now);
          oscs.push(osc);
        });
      }

      activeOscsRef.current = oscs;

      // Auto fade out after 5 seconds
      gain.gain.exponentialRampToValueAtTime(0.001, now + 5.0);
      setTimeout(() => {
        stopAudio();
      }, 5000);
    } catch (e) {
      console.warn('Web Audio synthesis not supported:', e);
    }
  };

  // HTML5 BroadcastChannel Live Sync with MC Stage Screen
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('mc_connect_live_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'SEGMENT_CHANGE') {
          const newIndex = Number(event.data.segmentIndex);
          if (!isNaN(newIndex) && newIndex >= 0) {
            setActiveSegmentIndex(newIndex);
            setCueList((prev) =>
              prev.map((c, idx) => ({
                ...c,
                status: idx < newIndex ? 'completed' : idx === newIndex ? 'active' : 'pending',
              }))
            );
            toast.info(`🔔 Panggung beralih ke: ${event.data.segmentTitle || `Segmen ${newIndex + 1}`}`);
          }
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported, falling back to local events.');
    }

    return () => {
      channel?.close();
      stopAudio();
    };
  }, []);

  const handleManualActivate = (index: number) => {
    setActiveSegmentIndex(index);
    setCueList((prev) =>
      prev.map((c, idx) => ({
        ...c,
        status: idx < index ? 'completed' : idx === index ? 'active' : 'pending',
      }))
    );

    // Announce to Stage Mode
    try {
      const channel = new BroadcastChannel('mc_connect_live_channel');
      channel.postMessage({
        type: 'SEGMENT_CHANGE',
        segmentIndex: index,
        segmentTitle: cueList[index]?.segmentTitle,
        musicCue: cueList[index]?.songTitle,
        timestamp: Date.now(),
      });
      channel.close();
    } catch (e) {}

    toast.success(`Segmen manual diaktifkan: ${cueList[index].segmentTitle}`);
  };

  const togglePlay = (id: number, type: CueItem['cueType']) => {
    if (isPlaying === id) {
      stopAudio();
      toast('Audio preview dihentikan.');
    } else {
      setIsPlaying(id);
      playSyntheticCue(type);
      const cue = cueList.find((c) => c.id === id);
      toast.success(`Memutar preview audio: ${cue?.songTitle}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Header Operator Musik */}
      <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-4">
          {onBackToDashboard && (
            <Button variant="ghost" size="sm" onClick={onBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke Dashboard
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-emerald-400 animate-pulse" />
            <h1 className="text-sm font-bold text-white tracking-wide">
              LAYAR OPERATOR MUSIK & SOUND (LIVE SYNC)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Master Volume Slider */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-white"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || masterVolume === 0 ? (
                <VolumeX className="h-4 w-4 text-rose-400" />
              ) : (
                <Volume2 className="h-4 w-4 text-amber-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : masterVolume}
              onChange={(e) => {
                setMasterVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-20 accent-amber-400 cursor-pointer"
            />
            <span className="font-bold text-amber-400 w-8">{isMuted ? '0%' : `${masterVolume}%`}</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Sinkronisasi Panggung Aktif
          </div>
          <Badge variant="warning" className="font-mono text-xs">
            SEGMEN AKTIF: #{activeSegmentIndex + 1}
          </Badge>
        </div>
      </header>

      {/* Main Cue Sheet */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <Card className="border-amber-400/30 bg-gradient-to-r from-amber-400/5 to-transparent">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-bold">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> SEKARANG TAMPIL DI PANGGUNG (ON AIR)
                </span>
                <CardTitle className="text-xl text-white mt-1">
                  {cueList[activeSegmentIndex]?.segmentTitle}
                </CardTitle>
              </div>
              <Badge variant="default" className="text-xs px-3 py-1 font-mono">
                {cueList[activeSegmentIndex]?.time}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-400">Target Lagu / Audio Track:</div>
                <div className="text-lg font-bold text-amber-300 mt-0.5 flex items-center gap-2">
                  <Music className="h-5 w-5 text-amber-400" />
                  {cueList[activeSegmentIndex]?.songTitle}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  Artis: {cueList[activeSegmentIndex]?.artist} • Instruksi Fader: <span className="text-emerald-400 font-semibold">{cueList[activeSegmentIndex]?.notes}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => togglePlay(cueList[activeSegmentIndex]?.id || 0, cueList[activeSegmentIndex]?.cueType || 'Intro')}
                  className={isPlaying === cueList[activeSegmentIndex]?.id ? 'bg-rose-600 hover:bg-rose-500' : 'bg-sky-600 hover:bg-sky-500'}
                >
                  {isPlaying === cueList[activeSegmentIndex]?.id ? (
                    <>
                      <Square className="h-4 w-4 mr-1.5" /> Stop Audio
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1.5" /> Test Audio Cue
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Cue Sheet Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              📋 Lembar Kerja Playlist & Cue Sheet Acara
            </CardTitle>
            <span className="text-xs text-slate-400 font-mono">BroadcastChannel: mc_connect_live_channel</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono uppercase">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Segmen Acara</th>
                    <th className="py-3 px-4">Judul Lagu / Cue Track</th>
                    <th className="py-3 px-4">Tipe</th>
                    <th className="py-3 px-4">Instruksi Soundman</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {cueList.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        item.status === 'active'
                          ? 'bg-amber-400/10 font-medium text-white'
                          : item.status === 'completed'
                          ? 'text-slate-500 bg-slate-950/40 line-through'
                          : 'text-slate-300 hover:bg-slate-900/40'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">{item.time}</td>
                      <td className="py-3 px-4 font-bold">{item.segmentTitle}</td>
                      <td className="py-3 px-4">
                        <div className="text-white font-semibold">{item.songTitle}</div>
                        <div className="text-[11px] text-slate-400">{item.artist}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            item.cueType === 'Climax'
                              ? 'purple'
                              : item.cueType === 'Intro'
                              ? 'warning'
                              : item.cueType === 'Outro'
                              ? 'success'
                              : 'default'
                          }
                          className="text-[10px]"
                        >
                          {item.cueType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs">{item.notes}</td>
                      <td className="py-3 px-4 text-center">
                        {item.status === 'active' ? (
                          <Badge variant="warning" className="text-[10px] animate-pulse">
                            LIVE ON AIR
                          </Badge>
                        ) : item.status === 'completed' ? (
                          <span className="text-emerald-400 text-xs">✓ Selesai</span>
                        ) : (
                          <span className="text-slate-500 text-xs">Standby</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => togglePlay(item.id, item.cueType)}
                            title="Play/Stop Preview"
                            className="rounded p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                          >
                            {isPlaying === item.id ? <Square className="h-3.5 w-3.5 text-rose-400" /> : <Play className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => handleManualActivate(idx)}
                            title="Aktifkan Segmen ini ke Layar Panggung"
                            className={`rounded px-2 py-1 text-[11px] font-bold transition-all ${
                              item.status === 'active'
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            {item.status === 'active' ? 'Aktif' : 'Trigger'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
