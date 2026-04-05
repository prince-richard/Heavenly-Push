import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './en.json';
import ta from './ta.json';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';
const initialLanguage = deviceLanguage === 'ta' ? 'ta' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ta: { translation: ta },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
