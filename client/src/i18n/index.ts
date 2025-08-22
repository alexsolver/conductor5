/**
 * Internationalization Setup
 * React-i18next configuration with enterprise features
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Assume enTranslations, ptBRTranslations, esTranslations, frTranslations, deTranslations are imported from their respective files
// For example:
// import enTranslations from './locales/en/translation.json';
// import ptBRTranslations from './locales/pt-BR/translation.json';
// import esTranslations from './locales/es/translation.json';
// import frTranslations from './locales/fr/translation.json';
// import deTranslations from './locales/de/translation.json';

// Placeholder for translations, replace with actual imports
const enTranslations = {};
const ptBRTranslations = {};
const esTranslations = {};
const frTranslations = {};
const deTranslations = {};


export const supportedLanguages = [
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷', nativeName: 'Português (Brasil)' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' }
];

const resources = {
  'pt-BR': { translation: ptBRTranslations },
  pt: { translation: ptBRTranslations }, // Use same translations as pt-BR
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },
  de: { translation: deTranslations }
};

// Get user's preferred language from localStorage or use Portuguese as default
const getInitialLanguage = () => {
  // Check multiple possible keys for language preference
  const saved = localStorage.getItem('preferred-language') || 
                localStorage.getItem('conductor-language') || 
                localStorage.getItem('i18nextLng');

  if (saved && supportedLanguages.find(lang => lang.code === saved)) {
    return saved;
  }
  return 'pt-BR';
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'pt-BR',

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      allowMultiLoading: false,
      requestOptions: {
        cache: 'no-cache'
      }
    },

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'preferred-language',
      caches: ['localStorage'],
    },

    load: 'languageOnly',
    supportedLngs: ['en', 'pt-BR', 'pt', 'es', 'fr', 'de'],

    defaultNS: 'translation',
    ns: ['translation'],

    // Enable proper code cleaning
    cleanCode: true,

    // Enable debug mode temporarily to see loading issues
    debug: process.env.NODE_ENV === 'development',

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
    }
  });

// Ensure we start with Portuguese by default if no preference exists
if (!localStorage.getItem('preferred-language')) {
  localStorage.setItem('preferred-language', 'pt-BR');
  localStorage.setItem('conductor-language', 'pt-BR');
  localStorage.setItem('i18nextLng', 'pt-BR');
}

export default i18n;

export const timezones = [
  { code: 'UTC', name: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  { code: 'America/New_York', name: 'Eastern Time (US & Canada)', offset: '-05:00' },
  { code: 'America/Chicago', name: 'Central Time (US & Canada)', offset: '-06:00' },
  { code: 'America/Denver', name: 'Mountain Time (US & Canada)', offset: '-07:00' },
  { code: 'America/Los_Angeles', name: 'Pacific Time (US & Canada)', offset: '-08:00' },
  { code: 'America/Sao_Paulo', name: 'Brasília Time', offset: '-03:00' },
  { code: 'Europe/London', name: 'Greenwich Mean Time', offset: '+00:00' },
  { code: 'Europe/Paris', name: 'Central European Time', offset: '+01:00' },
  { code: 'Europe/Berlin', name: 'Central European Time', offset: '+01:00' },
  { code: 'Asia/Tokyo', name: 'Japan Standard Time', offset: '+09:00' },
  { code: 'Asia/Shanghai', name: 'China Standard Time', offset: '+08:00' },
  { code: 'Australia/Sydney', name: 'Australian Eastern Time', offset: '+10:00' }
];

export const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
];