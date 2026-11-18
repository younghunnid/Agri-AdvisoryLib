export interface VoiceCapabilities {
  speechInputSupported: boolean;
  speechSynthesisSupported: boolean;
  mediaRecorderSupported: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResult>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

export function detectVoiceCapabilities(): VoiceCapabilities {
  if (typeof window === 'undefined') {
    return {speechInputSupported: false, speechSynthesisSupported: false, mediaRecorderSupported: false};
  }
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return {
    speechInputSupported: Boolean(win.SpeechRecognition || win.webkitSpeechRecognition),
    speechSynthesisSupported: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
    mediaRecorderSupported:
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined',
  };
}

export function startSpeechRecognition(callbacks: {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}): (() => void) | null {
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
  if (!Ctor) {
    callbacks.onError('Speech input is not supported in this browser. Please type your question below.');
    return null;
  }

  const recognition = new Ctor();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let full = '';
    let isFinal = false;
    for (let i = 0; i < event.results.length; i++) {
      full += event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) isFinal = true;
    }
    callbacks.onTranscript(full.trim(), isFinal);
  };

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      callbacks.onError('Microphone permission was denied. Allow microphone access or type your question.');
    } else if (event.error === 'no-speech') {
      callbacks.onError('No speech was detected. Please try speaking again or type your question.');
    } else {
      callbacks.onError(`Voice recognition stopped (${event.error}). Please review or type your question.`);
    }
  };

  recognition.onend = () => {
    callbacks.onEnd();
  };

  try {
    recognition.start();
    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore stop errors
      }
    };
  } catch {
    callbacks.onError('Could not start microphone recognition on this device.');
    return null;
  }
}

export function speakText(
  text: string,
  optionsOrOnEnd?:
    | (() => void)
    | {
        rate?: number;
        onStart?: () => void;
        onEnd?: () => void;
        onError?: () => void;
      }
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    return false;
  }
  const opts = typeof optionsOrOnEnd === 'function' ? {onEnd: optionsOrOnEnd} : optionsOrOnEnd || {};

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = opts.rate ?? 0.95;
    utterance.onstart = () => opts.onStart?.();
    utterance.onend = () => opts.onEnd?.();
    utterance.onerror = () => {
      opts.onError?.();
      opts.onEnd?.();
    };
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function pauseSpeaking(): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.pause();
    return true;
  }
  return false;
}

export function resumeSpeaking(): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.resume();
    return true;
  }
  return false;
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

export function playKeypadTone(key: string): void {
  if (typeof window === 'undefined') return;
  const freqs = DTMF_FREQS[key];
  if (!freqs) return;
  const AudioCtx = window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.frequency.value = freqs[0];
    osc2.frequency.value = freqs[1];
    gain.gain.value = 0.06;
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start();
    osc2.start();
    setTimeout(() => {
      osc1.stop();
      osc2.stop();
      ctx.close().catch(() => undefined);
    }, 110);
  } catch {
    // Ignore audio context autoplay errors gracefully
  }
}
