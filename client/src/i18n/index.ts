/**
 * Internationalization Setup
 * React-i18next configuration with enterprise features
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import actual translation files
import enTranslations from './locales/en.json';
import ptBRTranslations from './locales/pt-BR.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';


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

// Get user's preferred language from localStorage, browser, or use Portuguese as default
const getInitialLanguage = () => {
  // Check multiple possible keys for language preference
  const saved = localStorage.getItem('preferred-language') || 
                localStorage.getItem('conductor-language') || 
                localStorage.getItem('i18nextLng');

  if (saved && supportedLanguages.find(lang => lang.code === saved)) {
    return saved;
  }

  // Detect browser language - check for Portuguese first
  const browserLang = navigator.language || navigator.languages?.[0];
  
  if (browserLang) {
    // Check for Portuguese variants first
    if (browserLang.toLowerCase().startsWith('pt')) {
      return 'pt-BR';
    }
    
    // Check for exact match
    const exactMatch = supportedLanguages.find(lang => lang.code === browserLang);
    if (exactMatch) {
      return exactMatch.code;
    }
    
    // Check for partial match (e.g., 'en-US' matches 'en')
    const partialMatch = supportedLanguages.find(lang => 
      browserLang.toLowerCase().startsWith(lang.code.toLowerCase()) || 
      lang.code.toLowerCase().startsWith(browserLang.toLowerCase())
    );
    if (partialMatch) {
      return partialMatch.code;
    }
  }
  
  // Default to Portuguese Brazilian
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

    // Enable debug to see what's happening
    debug: true,

    // Configure missing key behavior
    saveMissing: false,
    missingKeyHandler: (lng, ns, key) => {
      console.warn(`Missing translation key: ${key} for language: ${lng}`);
    },

    // Return key if translation is missing
    returnEmptyString: false,
    returnNull: false,

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
    }
  });

// Ensure we start with detected language and save preference
const initialLang = getInitialLanguage();
if (!localStorage.getItem('preferred-language')) {
  localStorage.setItem('preferred-language', initialLang);
  localStorage.setItem('conductor-language', initialLang);
  localStorage.setItem('i18nextLng', initialLang);
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