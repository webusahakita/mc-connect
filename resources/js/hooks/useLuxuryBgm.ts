import { useState, useEffect, useRef, useCallback } from 'react';

export type BgmTrackKey = 'wedding' | 'gala' | 'acoustic';

export interface BgmTrack {
  key: BgmTrackKey;
  name: string;
  shortName: string;
  bpm: number;
}

export const BGM_TRACKS: BgmTrack[] = [
  { key: 'wedding', name: 'Wedding Romance (Piano & Strings)', shortName: 'Wedding Romance', bpm: 64 },
  { key: 'gala', name: 'Corporate Gala Lounge & Wine', shortName: 'Gala Lounge', bpm: 76 },
  { key: 'acoustic', name: 'Sunset Celebration Vibe', shortName: 'Sunset Vibe', bpm: 82 },
];

interface ChordDef {
  bass: number;
  notes: number[];
}

const TRACK_CHORDS: Record<BgmTrackKey, ChordDef[]> = {
  wedding: [
    { bass: 36, notes: [48, 52, 55, 59, 64] }, // Cmaj9
    { bass: 33, notes: [45, 48, 52, 55, 60] }, // Am9
    { bass: 29, notes: [41, 45, 48, 52, 57] }, // Fmaj7
    { bass: 31, notes: [43, 47, 50, 55, 62] }, // Gsus4
    { bass: 36, notes: [48, 55, 59, 64, 67] }, // Cmaj7
  ],
  gala: [
    { bass: 38, notes: [50, 53, 57, 60, 64] }, // Dm9
    { bass: 31, notes: [43, 47, 52, 57, 59] }, // G13
    { bass: 36, notes: [48, 52, 55, 59, 62] }, // Cmaj9
    { bass: 33, notes: [45, 49, 52, 55, 61] }, // A7b9
  ],
  acoustic: [
    { bass: 31, notes: [43, 47, 50, 55, 59] }, // Gmaj7
    { bass: 28, notes: [40, 43, 47, 52, 55] }, // Em7
    { bass: 36, notes: [48, 52, 55, 59, 64] }, // Cmaj7
    { bass: 38, notes: [50, 54, 57, 62, 66] }, // Dadd9
  ],
};

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function useLuxuryBgm() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.5);
  const [currentTrack, setCurrentTrack] = useState<BgmTrackKey>('wedding');

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const voiceGainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeNodesRef = useRef<{ stop: () => void; disconnect: () => void }[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const volumeRef = useRef<number>(0.5);
  const trackRef = useRef<BgmTrackKey>('wedding');
  const chordIdxRef = useRef<number>(0);

  // Sync refs with state
  isPlayingRef.current = isPlaying;
  isMutedRef.current = isMuted;
  volumeRef.current = volume;
  trackRef.current = currentTrack;

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      const eff = isMutedRef.current || volumeRef.current === 0 ? 0 : volumeRef.current;
      master.gain.setValueAtTime(eff * 0.85, ctx.currentTime);
      master.connect(ctx.destination);

      const voice = ctx.createGain();
      voice.gain.setValueAtTime(1.0, ctx.currentTime);
      voice.connect(master);

      ctxRef.current = ctx;
      masterGainRef.current = master;
      voiceGainRef.current = voice;
    }
    if (ctxRef.current && ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
  }, []);

  const playTone = useCallback((freq: number, startTime: number, duration: number, vel: number = 0.5) => {
    const ctx = ctxRef.current;
    const voice = voiceGainRef.current;
    if (!ctx || !voice || !isPlayingRef.current) return;

    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(freq * 1.001, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, startTime);

    const peak = vel * 0.18;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(peak * 0.35, startTime + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    overtone.connect(filter);
    filter.connect(gain);
    gain.connect(voice);

    osc.start(startTime);
    overtone.start(startTime);
    osc.stop(startTime + duration + 0.1);
    overtone.stop(startTime + duration + 0.1);

    const nodeRef = {
      stop: () => {
        try {
          osc.stop(0);
          overtone.stop(0);
        } catch (_) {}
      },
      disconnect: () => {
        try {
          gain.disconnect();
          filter.disconnect();
        } catch (_) {}
      },
    };
    activeNodesRef.current.push(nodeRef);
    setTimeout(() => {
      const idx = activeNodesRef.current.indexOf(nodeRef);
      if (idx !== -1) activeNodesRef.current.splice(idx, 1);
    }, (duration + 0.2) * 1000);
  }, []);

  const stopAllNotes = useCallback(() => {
    activeNodesRef.current.forEach((n) => {
      try {
        n.stop();
        n.disconnect();
      } catch (_) {}
    });
    activeNodesRef.current = [];
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(() => {
    if (!isPlayingRef.current || !ctxRef.current) return;

    const chords = TRACK_CHORDS[trackRef.current] || TRACK_CHORDS.wedding;
    const chord = chords[chordIdxRef.current % chords.length];
    chordIdxRef.current += 1;

    const ctx = ctxRef.current;
    const now = ctx.currentTime;
    const bpm = BGM_TRACKS.find((t) => t.key === trackRef.current)?.bpm || 64;
    const beatLen = 60 / bpm;

    // Bass note
    if (chord.bass) {
      playTone(midiToFreq(chord.bass), now, beatLen * 3.8, 0.45);
    }

    // Arpeggiated chord notes
    chord.notes.forEach((midi, i) => {
      const offset = i * (beatLen * 0.45);
      playTone(midiToFreq(midi), now + offset, beatLen * 2.8, 0.35);
    });

    const stepMs = beatLen * 4 * 1000;
    timerRef.current = setTimeout(() => {
      scheduleNext();
    }, stepMs);
  }, [playTone]);

  const start = useCallback(() => {
    ensureContext();
    isPlayingRef.current = true;
    setIsPlaying(true);
    chordIdxRef.current = 0;
    scheduleNext();
  }, [ensureContext, scheduleNext]);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    stopAllNotes();
  }, [stopAllNotes]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    volumeRef.current = clamped;
    if (masterGainRef.current && ctxRef.current) {
      const eff = isMutedRef.current || clamped === 0 ? 0 : clamped;
      masterGainRef.current.gain.setValueAtTime(eff * 0.85, ctxRef.current.currentTime);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const next = !isMutedRef.current;
    setIsMuted(next);
    isMutedRef.current = next;
    if (masterGainRef.current && ctxRef.current) {
      const eff = next || volumeRef.current === 0 ? 0 : volumeRef.current;
      masterGainRef.current.gain.setValueAtTime(eff * 0.85, ctxRef.current.currentTime);
    }
  }, []);

  const setTrack = useCallback((track: BgmTrackKey) => {
    setCurrentTrack(track);
    trackRef.current = track;
    chordIdxRef.current = 0;
    if (isPlayingRef.current) {
      stopAllNotes();
      scheduleNext();
    }
  }, [scheduleNext, stopAllNotes]);

  useEffect(() => {
    return () => {
      stopAllNotes();
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
      }
    };
  }, [stopAllNotes]);

  return {
    isPlaying,
    isMuted,
    volume,
    currentTrack,
    start,
    stop,
    togglePlay,
    setVolume,
    toggleMute,
    setTrack,
  };
}
