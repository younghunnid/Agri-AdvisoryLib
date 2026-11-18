import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {apiFetch} from '../lib/api';
import {type LanguageCode, t as translate} from '../lib/i18n';
import {useOnlineStatus} from '../hooks/usePWA';
import {
  detectVoiceCapabilities,
  pauseSpeaking,
  resumeSpeaking,
  speakText,
  stopSpeaking,
} from '../lib/voice';

export interface ClientUser {
  id: number;
  displayName: string;
  phone: string;
  email: string | null;
  status: string;
  roles: Array<'farmer' | 'expert' | 'admin'>;
  county: string;
  preferredLanguage: LanguageCode;
  cropsOfInterest: string[];
  expertStatus?: string | null;
  expertSpecialty?: string | null;
}

export type PlaybackState = 'idle' | 'playing' | 'paused';

interface AppContextValue {
  user: ClientUser | null;
  loadingAuth: boolean;
  language: LanguageCode;
  isOnline: boolean;
  lowBandwidth: boolean;
  toggleLowBandwidth: () => void;
  listenMode: boolean;
  setListenMode: (enabled: boolean) => void;
  toggleListenMode: () => void;
  speechSupported: boolean;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  playbackState: PlaybackState;
  activeSpeechId: string | null;
  activeSpeechLabel: string | null;
  speechNotice: string | null;
  speakSection: (id: string, label: string, text: string) => void;
  pauseSpeech: () => void;
  resumeSpeech: () => void;
  replaySpeech: () => void;
  stopSpeech: () => void;
  setLanguage: (code: LanguageCode) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<ClientUser | null>>;
  logout: () => Promise<void>;
  tr: (key: Parameters<typeof translate>[1]) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

const LANG_STORAGE_KEY = 'agri_advisory_lang_v1';
const LOW_BW_STORAGE_KEY = 'agri_advisory_low_bw_v1';
const LISTEN_MODE_KEY = 'agri_advisory_listen_mode_v1';

export const AppProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'en' || saved === 'bas' || saved === 'man' || saved === 'lre' || saved === 'kpe') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'en';
  });

  const [lowBandwidth, setLowBandwidth] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOW_BW_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [listenMode, setListenModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LISTEN_MODE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [speechRate, setSpeechRateState] = useState<number>(0.95);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [activeSpeechLabel, setActiveSpeechLabel] = useState<string | null>(null);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const lastSpokenRef = useRef<{id: string; label: string; text: string} | null>(null);

  const voiceCaps = detectVoiceCapabilities();
  const isOnline = useOnlineStatus();

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<{user: ClientUser | null}>('/auth/me');
      setUser(data.user);
      if (data.user?.preferredLanguage) {
        setLanguageState(data.user.preferredLanguage);
        localStorage.setItem(LANG_STORAGE_KEY, data.user.preferredLanguage);
      }
    } catch {
      // Offline or unreachable server: preserve current UI gracefully
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    return () => stopSpeaking();
  }, [refreshUser]);

  const toggleLowBandwidth = useCallback(() => {
    setLowBandwidth((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LOW_BW_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const setListenMode = useCallback((enabled: boolean) => {
    setListenModeState(enabled);
    try {
      localStorage.setItem(LISTEN_MODE_KEY, enabled ? '1' : '0');
    } catch {
      // ignore
    }
    if (!enabled) {
      stopSpeaking();
      setPlaybackState('idle');
      setActiveSpeechId(null);
      setActiveSpeechLabel(null);
      setSpeechNotice(null);
    }
  }, []);

  const toggleListenMode = useCallback(() => {
    setListenMode(!listenMode);
  }, [listenMode, setListenMode]);

  const speakSection = useCallback(
    (id: string, label: string, text: string) => {
      const clean = text.trim();
      if (!clean) return;
      setSpeechNotice(null);
      lastSpokenRef.current = {id, label, text: clean};

      if (!voiceCaps.speechSynthesisSupported) {
        setActiveSpeechId(id);
        setActiveSpeechLabel(label);
        setPlaybackState('idle');
        setSpeechNotice(
          'Text-to-speech audio is unavailable on this browser. Reading transcript is highlighted on screen.'
        );
        return;
      }

      setActiveSpeechId(id);
      setActiveSpeechLabel(label);
      setPlaybackState('playing');

      const started = speakText(clean, {
        rate: speechRate,
        onStart: () => setPlaybackState('playing'),
        onEnd: () => {
          setPlaybackState('idle');
        },
        onError: () => {
          setPlaybackState('idle');
          setSpeechNotice('Browser voice playback could not start. Please review the text on screen.');
        },
      });

      if (!started) {
        setPlaybackState('idle');
        setSpeechNotice('Speech synthesis is unavailable on this browser.');
      }
    },
    [speechRate, voiceCaps.speechSynthesisSupported]
  );

  const pauseSpeech = useCallback(() => {
    if (playbackState === 'playing' && pauseSpeaking()) {
      setPlaybackState('paused');
    }
  }, [playbackState]);

  const resumeSpeech = useCallback(() => {
    if (playbackState === 'paused' && resumeSpeaking()) {
      setPlaybackState('playing');
    }
  }, [playbackState]);

  const replaySpeech = useCallback(() => {
    if (lastSpokenRef.current) {
      const {id, label, text} = lastSpokenRef.current;
      speakSection(id, label, text);
    }
  }, [speakSection]);

  const stopSpeech = useCallback(() => {
    stopSpeaking();
    setPlaybackState('idle');
    setActiveSpeechId(null);
    setActiveSpeechLabel(null);
    setSpeechNotice(null);
  }, []);

  const setSpeechRate = useCallback(
    (rate: number) => {
      setSpeechRateState(rate);
      if (playbackState === 'playing' && lastSpokenRef.current) {
        const {id, label, text} = lastSpokenRef.current;
        speakText(text, {
          rate,
          onStart: () => setPlaybackState('playing'),
          onEnd: () => setPlaybackState('idle'),
        });
        setActiveSpeechId(id);
        setActiveSpeechLabel(label);
      }
    },
    [playbackState]
  );

  const setLanguage = useCallback(
    async (code: LanguageCode) => {
      setLanguageState(code);
      try {
        localStorage.setItem(LANG_STORAGE_KEY, code);
      } catch {
        // ignore
      }
      if (user && isOnline) {
        try {
          const updated = await apiFetch<{user: ClientUser}>('/profile', {
            method: 'PATCH',
            body: JSON.stringify({preferredLanguage: code}),
          });
          if (updated.user) setUser(updated.user);
        } catch {
          // ignore offline profile sync error
        }
      }
    },
    [user, isOnline]
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', {method: 'POST'});
    } finally {
      setUser(null);
    }
  }, []);

  const tr = useCallback(
    (key: Parameters<typeof translate>[1]) => translate(language, key).text,
    [language]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        loadingAuth,
        language,
        isOnline,
        lowBandwidth,
        toggleLowBandwidth,
        listenMode,
        setListenMode,
        toggleListenMode,
        speechSupported: voiceCaps.speechSynthesisSupported,
        speechRate,
        setSpeechRate,
        playbackState,
        activeSpeechId,
        activeSpeechLabel,
        speechNotice,
        speakSection,
        pauseSpeech,
        resumeSpeech,
        replaySpeech,
        stopSpeech,
        setLanguage,
        refreshUser,
        setUser,
        logout,
        tr,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
