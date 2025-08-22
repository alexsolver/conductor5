/**
 * Internationalization Setup
 * React-i18next configuration with enterprise features
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'pt-BR',
    lng: 'pt-BR',
    debug: false,

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
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    load: 'languageOnly',
    supportedLngs: ['pt-BR'],
    
    defaultNS: 'translation',
    ns: ['translation'],

    // Força o carregamento de pt-BR mesmo se detectar 'pt'
    cleanCode: true,
    
    react: {
      useSuspense: false
    }
  });

export default i18n;

export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
];

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