/**
 * Localization API Routes
 * Enterprise i18n and localization management
 */

import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';

const router = Router();

// Supported languages configuration
const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸', rtl: false },
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷', rtl: false },
  { code: 'es', name: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'zh', name: '中文', flag: '🇨🇳', rtl: false },
  { code: 'ja', name: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'ko', name: '한국어', flag: '🇰🇷', rtl: false },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', rtl: false }
];

// Supported timezones with business-friendly names
const supportedTimezones = [
  { code: 'UTC', name: 'UTC (Coordinated Universal Time)', offset: '+00:00', region: 'Global' },
  { code: 'America/New_York', name: 'Eastern Time (US & Canada)', offset: '-05:00', region: 'North America' },
  { code: 'America/Chicago', name: 'Central Time (US & Canada)', offset: '-06:00', region: 'North America' },
  { code: 'America/Denver', name: 'Mountain Time (US & Canada)', offset: '-07:00', region: 'North America' },
  { code: 'America/Los_Angeles', name: 'Pacific Time (US & Canada)', offset: '-08:00', region: 'North America' },
  { code: 'America/Sao_Paulo', name: 'Brasília Time', offset: '-03:00', region: 'South America' },
  { code: 'America/Argentina/Buenos_Aires', name: 'Argentina Time', offset: '-03:00', region: 'South America' },
  { code: 'Europe/London', name: 'Greenwich Mean Time', offset: '+00:00', region: 'Europe' },
  { code: 'Europe/Paris', name: 'Central European Time', offset: '+01:00', region: 'Europe' },
  { code: 'Europe/Berlin', name: 'Central European Time', offset: '+01:00', region: 'Europe' },
  { code: 'Europe/Rome', name: 'Central European Time', offset: '+01:00', region: 'Europe' },
  { code: 'Europe/Madrid', name: 'Central European Time', offset: '+01:00', region: 'Europe' },
  { code: 'Asia/Tokyo', name: 'Japan Standard Time', offset: '+09:00', region: 'Asia' },
  { code: 'Asia/Shanghai', name: 'China Standard Time', offset: '+08:00', region: 'Asia' },
  { code: 'Asia/Seoul', name: 'Korea Standard Time', offset: '+09:00', region: 'Asia' },
  { code: 'Asia/Kolkata', name: 'India Standard Time', offset: '+05:30', region: 'Asia' },
  { code: 'Asia/Dubai', name: 'Gulf Standard Time', offset: '+04:00', region: 'Middle East' },
  { code: 'Australia/Sydney', name: 'Australian Eastern Time', offset: '+10:00', region: 'Oceania' },
  { code: 'Australia/Melbourne', name: 'Australian Eastern Time', offset: '+10:00', region: 'Oceania' },
  { code: 'Pacific/Auckland', name: 'New Zealand Standard Time', offset: '+12:00', region: 'Oceania' }
];

// Supported currencies with regional information
const supportedCurrencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', region: 'North America' },
  { code: 'EUR', name: 'Euro', symbol: '€', region: 'Europe' },
  { code: 'GBP', name: 'British Pound', symbol: '£', region: 'Europe' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', region: 'South America' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', region: 'North America' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', region: 'Oceania' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', region: 'Asia' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', region: 'Asia' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', region: 'Asia' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', region: 'Asia' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', region: 'Middle East' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', region: 'Middle East' }
];

// Date formats by locale
const dateFormats = {
  'en': { short: 'MM/dd/yyyy', long: 'MMMM dd, yyyy', time: 'HH:mm', datetime: 'MM/dd/yyyy HH:mm' },
  'pt-BR': { short: 'dd/MM/yyyy', long: 'dd \'de\' MMMM \'de\' yyyy', time: 'HH:mm', datetime: 'dd/MM/yyyy HH:mm' },
  'es': { short: 'dd/MM/yyyy', long: 'dd \'de\' MMMM \'de\' yyyy', time: 'HH:mm', datetime: 'dd/MM/yyyy HH:mm' },
  'fr': { short: 'dd/MM/yyyy', long: 'dd MMMM yyyy', time: 'HH:mm', datetime: 'dd/MM/yyyy HH:mm' },
  'de': { short: 'dd.MM.yyyy', long: 'dd. MMMM yyyy', time: 'HH:mm', datetime: 'dd.MM.yyyy HH:mm' }
};

/**
 * GET /api/localization/languages
 * Get all supported languages
 */
router.get('/languages', (req, res) => {
  res.json({
    languages: supportedLanguages,
    total: supportedLanguages.length
  });
});

/**
 * GET /api/localization/timezones
 * Get all supported timezones grouped by region
 */
router.get('/timezones', (req, res) => {
  const { region } = req.query;
  
  let timezones = supportedTimezones;
  
  if (region && typeof region === 'string') {
    timezones = supportedTimezones.filter(tz => 
      tz.region.toLowerCase() === region.toLowerCase()
    );
  }
  
  // Group by region
  const groupedTimezones = timezones.reduce((acc, tz) => {
    if (!acc[tz.region]) {
      acc[tz.region] = [];
    }
    acc[tz.region].push(tz);
    return acc;
  }, {} as Record<string, typeof supportedTimezones>);
  
  res.json({
    timezones: groupedTimezones,
    total: timezones.length
  });
});

/**
 * GET /api/localization/currencies
 * Get all supported currencies
 */
router.get('/currencies', (req, res) => {
  const { region } = req.query;
  
  let currencies = supportedCurrencies;
  
  if (region && typeof region === 'string') {
    currencies = supportedCurrencies.filter(curr => 
      curr.region.toLowerCase() === region.toLowerCase()
    );
  }
  
  res.json({
    currencies,
    total: currencies.length
  });
});

/**
 * GET /api/localization/formats
 * Get date/time formats for specific locale
 */
router.get('/formats/:locale?', (req, res) => {
  const { locale = 'en' } = req.params;
  
  const formats = dateFormats[locale as keyof typeof dateFormats] || dateFormats.en;
  
  res.json({
    locale,
    formats,
    numberFormat: {
      decimal: locale === 'en' ? '.' : ',',
      thousands: locale === 'en' ? ',' : '.',
      currency: supportedCurrencies.find(c => c.code === 'USD') // Default fallback
    }
  });
});

/**
 * POST /api/localization/user-preferences
 * Save user localization preferences
 */
router.post('/user-preferences', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { language, timezone, currency, dateFormat } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Validate inputs
    const validLanguage = supportedLanguages.find(l => l.code === language);
    const validTimezone = supportedTimezones.find(tz => tz.code === timezone);
    const validCurrency = supportedCurrencies.find(c => c.code === currency);
    
    if (!validLanguage) {
      return res.status(400).json({ message: 'Invalid language code' });
    }
    
    if (!validTimezone) {
      return res.status(400).json({ message: 'Invalid timezone code' });
    }
    
    if (!validCurrency) {
      return res.status(400).json({ message: 'Invalid currency code' });
    }
    
    // Here you would save to database
    // For now, we'll return the validated preferences
    const preferences = {
      userId,
      language: validLanguage.code,
      timezone: validTimezone.code,
      currency: validCurrency.code,
      dateFormat: dateFormat || 'short',
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      message: 'Preferences saved successfully',
      preferences
    });
    
  } catch (error) {
    console.error('Error saving user preferences:', error);
    res.status(500).json({ message: 'Failed to save preferences' });
  }
});

/**
 * GET /api/localization/user-preferences
 * Get user localization preferences
 */
router.get('/user-preferences', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Here you would fetch from database
    // For now, we'll return default preferences
    const defaultPreferences = {
      userId,
      language: 'en',
      timezone: 'UTC',
      currency: 'USD',
      dateFormat: 'short',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      preferences: defaultPreferences
    });
    
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ message: 'Failed to fetch preferences' });
  }
});

/**
 * GET /api/localization/detect
 * Auto-detect user locale from headers
 */
router.get('/detect', (req, res) => {
  const acceptLanguage = req.headers['accept-language'] || '';
  const timezone = req.headers['x-timezone'] as string || 'UTC';
  
  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, priority = '1'] = lang.trim().split(';q=');
      return { code: code.trim(), priority: parseFloat(priority) };
    })
    .sort((a, b) => b.priority - a.priority);
  
  // Find best matching supported language
  const detectedLanguage = languages.find(lang => 
    supportedLanguages.some(supported => 
      supported.code.toLowerCase().startsWith(lang.code.toLowerCase())
    )
  );
  
  const language = detectedLanguage 
    ? supportedLanguages.find(s => s.code.toLowerCase().startsWith(detectedLanguage.code.toLowerCase()))
    : supportedLanguages[0]; // Default to English
  
  // Detect timezone if provided
  const detectedTimezone = supportedTimezones.find(tz => tz.code === timezone) 
    || supportedTimezones[0]; // Default to UTC
  
  res.json({
    detected: {
      language: language?.code || 'en',
      timezone: detectedTimezone.code,
      currency: 'USD' // Default currency
    },
    confidence: detectedLanguage ? 'high' : 'low'
  });
});

export default router;