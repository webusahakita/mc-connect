import { useRef, useCallback } from 'react';

export function useSoundboard() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playFanfare = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0.00, d: 0.15 },
      { f: 523.25, t: 0.15, d: 0.15 },
      { f: 523.25, t: 0.30, d: 0.15 },
      { f: 659.25, t: 0.45, d: 0.35 },
      { f: 783.99, t: 0.80, d: 0.25 },
      { f: 1046.50, t: 1.05, d: 0.70 }
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0, now + n.t);
      gain.gain.linearRampToValueAtTime(0.4, now + n.t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
  }, [getAudioContext]);

  const playDrumRoll = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const duration = 1.8;
    const rollCount = 24;

    for (let i = 0; i < rollCount; i++) {
      const time = now + (i * (duration / rollCount));
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 30, time);

      const vol = 0.1 + (i / rollCount) * 0.3;
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.08);
    }
  }, [getAudioContext]);

  const playChime = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const freqs = [1046.50, 1318.51, 1567.98, 2093.00];

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.1);

      gain.gain.setValueAtTime(0.25, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 1.2);
    });
  }, [getAudioContext]);

  const playBuzzer = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }, [getAudioContext]);

  const playApplause = useCallback(() => {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 2.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin((i / bufferSize) * Math.PI), 1.2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 1.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.5);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }, [getAudioContext]);

  return {
    playFanfare,
    playDrumRoll,
    playChime,
    playBuzzer,
    playApplause,
  };
}
