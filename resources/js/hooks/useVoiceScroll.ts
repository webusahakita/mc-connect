import { useState, useEffect, useRef, useCallback } from 'react';

// SpeechRecognition type definitions for cross-browser support
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEventLike) => void;
  onerror: (error: unknown) => void;
  onend: () => void;
}

export function useVoiceScroll() {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSpeakingDetected, setIsSpeakingDetected] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1.2);
  const [fontSize, setFontSize] = useState(36);
  const [isMirror, setIsMirror] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const scrollAnimRef = useRef<number | null>(null);
  const scrollAccumulatorRef = useRef<number>(0);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRec = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRec) return;

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'id-ID';

      rec.onresult = () => {
        setIsSpeakingDetected(true);
        setTimeout(() => setIsSpeakingDetected(false), 800);

        // Smoothly advance viewport by 45px when voice is detected
        if (viewportRef.current) {
          viewportRef.current.scrollTop += 45;
          scrollAccumulatorRef.current = viewportRef.current.scrollTop;
        }
      };

      rec.onerror = () => {
        setIsVoiceActive(false);
      };

      rec.onend = () => {
        setIsVoiceActive(false);
      };

      recognitionRef.current = rec;
    } catch {
      // Browser doesn't support or permission blocked
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  const toggleVoiceMode = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech Recognition tidak didukung di browser ini. Gunakan Chrome atau Edge.');
      return false;
    }

    if (isVoiceActive) {
      recognitionRef.current.stop();
      setIsVoiceActive(false);
      return false;
    } else {
      try {
        recognitionRef.current.start();
        setIsVoiceActive(true);
        return true;
      } catch {
        setIsVoiceActive(false);
        return false;
      }
    }
  }, [isVoiceActive]);

  const startScroll = useCallback(() => {
    if (!viewportRef.current) return;
    setIsScrolling(true);
    scrollAccumulatorRef.current = viewportRef.current.scrollTop;

    let lastTime = performance.now();

    const step = (now: number) => {
      if (!viewportRef.current) return;
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const maxScroll = viewportRef.current.scrollHeight - viewportRef.current.clientHeight;
      if (maxScroll > 5 && viewportRef.current.scrollTop >= maxScroll - 2) {
        setIsScrolling(false);
        return;
      }

      scrollAccumulatorRef.current += (scrollSpeed * 42) * delta;
      viewportRef.current.scrollTop = scrollAccumulatorRef.current;

      scrollAnimRef.current = requestAnimationFrame(step);
    };

    scrollAnimRef.current = requestAnimationFrame(step);
  }, [scrollSpeed]);

  const stopScroll = useCallback(() => {
    setIsScrolling(false);
    if (scrollAnimRef.current) {
      cancelAnimationFrame(scrollAnimRef.current);
      scrollAnimRef.current = null;
    }
  }, []);

  const toggleScroll = useCallback(() => {
    if (isScrolling) {
      stopScroll();
    } else {
      startScroll();
    }
  }, [isScrolling, startScroll, stopScroll]);

  const changeFontSize = useCallback((delta: number) => {
    setFontSize((prev) => Math.min(Math.max(prev + delta, 18), 72));
  }, []);

  return {
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
    startScroll,
    stopScroll,
  };
}
