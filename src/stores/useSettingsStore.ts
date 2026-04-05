import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupportedLanguage, UserSettings } from '@/types/models';
import { DEFAULT_TTS_SPEED, DEFAULT_DAILY_PUSH_TIME } from '@/constants/config';
import i18n from '@/i18n';

interface SettingsActions {
  setLanguage: (lang: SupportedLanguage) => void;
  setTtsSpeed: (speed: number) => void;
  toggleHighContrast: () => void;
  toggleHaptics: () => void;
  toggleShakeToSpeak: () => void;
  setDailyPushEnabled: (enabled: boolean) => void;
  setDailyPushTime: (time: string) => void;
  toggleAutoPlay: () => void;
  toggleDynamicTextScale: () => void;
  setSearchLanguageMode: (mode: 'auto' | 'en' | 'ta') => void;
}

type SettingsStore = UserSettings & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Default values
      primaryLanguage: 'en',
      searchLanguageMode: 'auto',
      ttsSpeed: DEFAULT_TTS_SPEED,
      shakeToSpeakEnabled: true,
      hapticsEnabled: true,
      dailyPushEnabled: false,
      dailyPushTime: DEFAULT_DAILY_PUSH_TIME,
      highContrastMode: true,
      dynamicTextScale: true,
      autoPlayVerseOnOpen: false,

      // Actions
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ primaryLanguage: lang });
      },
      setTtsSpeed: (speed) => set({ ttsSpeed: speed }),
      toggleHighContrast: () =>
        set((state) => ({ highContrastMode: !state.highContrastMode })),
      toggleHaptics: () =>
        set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
      toggleShakeToSpeak: () =>
        set((state) => ({ shakeToSpeakEnabled: !state.shakeToSpeakEnabled })),
      setDailyPushEnabled: (enabled) => set({ dailyPushEnabled: enabled }),
      setDailyPushTime: (time) => set({ dailyPushTime: time }),
      toggleAutoPlay: () =>
        set((state) => ({ autoPlayVerseOnOpen: !state.autoPlayVerseOnOpen })),
      toggleDynamicTextScale: () =>
        set((state) => ({ dynamicTextScale: !state.dynamicTextScale })),
      setSearchLanguageMode: (mode) => set({ searchLanguageMode: mode }),
    }),
    {
      name: 'heavenly-push-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        primaryLanguage: state.primaryLanguage,
        searchLanguageMode: state.searchLanguageMode,
        ttsSpeed: state.ttsSpeed,
        shakeToSpeakEnabled: state.shakeToSpeakEnabled,
        hapticsEnabled: state.hapticsEnabled,
        dailyPushEnabled: state.dailyPushEnabled,
        dailyPushTime: state.dailyPushTime,
        highContrastMode: state.highContrastMode,
        dynamicTextScale: state.dynamicTextScale,
        autoPlayVerseOnOpen: state.autoPlayVerseOnOpen,
      }),
    }
  )
);
