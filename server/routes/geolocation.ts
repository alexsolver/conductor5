// GEOLOCATION API ROUTES
// Automatic location detection and country-specific configurations
// Dynamic field adaptation based on user location

import { Router, Response } from 'express';
import { z } from 'zod';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { GeolocationService } from '../services/GeolocationService';
import { CurrencyService } from '../services/CurrencyService';
import { pool } from '../db';

const router = Router();
const geolocationService = new GeolocationService(pool);
const currencyService = new CurrencyService(pool);

// Validation schemas
const detectLocationSchema = z.object({
  timezone: z.string().optional(),
  language: z.string().optional(),
  userAgent: z.string().optional()
});

const validateFieldSchema = z.object({
  fieldName: z.string(),
  value: z.string(),
  countryCode: z.string().optional()
});

const convertCurrencySchema = z.object({
  amount: z.number(),
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3)
});

/**
 * POST /api/geolocation/detect
 * Automatically detect user location from IP and browser data
 */
router.post('/detect', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const browserData = detectLocationSchema.parse(req.body);

    // Detect location using IP and browser data
    const locationData = await geolocationService.detectLocationFromIP(req, tenantId);
    
    // Store detected location for future use
    await geolocationService.storeLocationForTenant(tenantId, locationData);

    // Get country-specific configuration
    const countryConfig = geolocationService.getCountryConfig(locationData.countryCode);
    
    res.json({
      success: true,
      location: locationData,
      configuration: {
        requiredFields: countryConfig.requiredFields,
        dateFormat: countryConfig.dateFormat,
        numberFormat: countryConfig.numberFormat,
        addressFormat: countryConfig.addressFormat,
        documentValidation: Object.keys(countryConfig.documentValidation)
      }
    });
  } catch (error) {
    console.error('Location detection failed:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to detect location',
      fallback: {
        countryCode: 'US',
        countryName: 'United States',
        timezone: 'UTC',
        currency: 'USD',
        language: 'en-US'
      }
    });
  }
});

/**
 * GET /api/geolocation/countries
 * Get all supported countries with their configurations
 */
router.get('/countries', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const countries = [
      { code: 'US', name: 'United States', currency: 'USD', language: 'en-US' },
      { code: 'GB', name: 'United Kingdom', currency: 'GBP', language: 'en-GB' },
      { code: 'DE', name: 'Germany', currency: 'EUR', language: 'de-DE' },
      { code: 'FR', name: 'France', currency: 'EUR', language: 'fr-FR' },
      { code: 'BR', name: 'Brazil', currency: 'BRL', language: 'pt-BR' },
      { code: 'CA', name: 'Canada', currency: 'CAD', language: 'en-CA' },
      { code: 'JP', name: 'Japan', currency: 'JPY', language: 'ja-JP' },
      { code: 'AU', name: 'Australia', currency: 'AUD', language: 'en-AU' }
    ];

    const countriesWithConfig = countries.map(country => ({
      ...country,
      config: geolocationService.getCountryConfig(country.code)
    }));

    res.json({
      countries: countriesWithConfig
    });
  } catch (error) {
    console.error('Error getting countries:', error);
    res.status(500).json({ error: 'Failed to get countries' });
  }
});

/**
 * GET /api/geolocation/config/:countryCode
 * Get specific country configuration
 */
router.get('/config/:countryCode', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { countryCode } = req.params;
    
    if (!countryCode || countryCode.length !== 2) {
      return res.status(400).json({ error: 'Valid country code required' });
    }

    const config = geolocationService.getCountryConfig(countryCode.toUpperCase());
    
    res.json({
      countryCode: countryCode.toUpperCase(),
      configuration: config
    });
  } catch (error) {
    console.error('Error getting country config:', error);
    res.status(500).json({ error: 'Failed to get country configuration' });
  }
});

/**
 * POST /api/geolocation/validate-field
 * Validate field according to country-specific rules
 */
router.post('/validate-field', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { fieldName, value, countryCode } = validateFieldSchema.parse(req.body);

    // Use detected country if not specified
    let targetCountryCode = countryCode;
    if (!targetCountryCode) {
      const storedLocation = await geolocationService.getStoredLocationForTenant(tenantId);
      targetCountryCode = storedLocation?.countryCode || 'US';
    }

    const validation = geolocationService.validateFieldForCountry(
      fieldName, 
      value, 
      targetCountryCode
    );

    res.json({
      fieldName,
      value,
      countryCode: targetCountryCode,
      validation
    });
  } catch (error) {
    console.error('Field validation failed:', error);
    res.status(400).json({ 
      error: 'Validation failed',
      details: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

/**
 * GET /api/geolocation/currencies
 * Get all supported currencies
 */
router.get('/currencies', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currencies = currencyService.getSupportedCurrencies();
    
    res.json({
      currencies
    });
  } catch (error) {
    console.error('Error getting currencies:', error);
    res.status(500).json({ error: 'Failed to get currencies' });
  }
});

/**
 * POST /api/geolocation/convert-currency
 * Convert amount between currencies
 */
router.post('/convert-currency', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { amount, fromCurrency, toCurrency } = convertCurrencySchema.parse(req.body);

    const conversion = await currencyService.convertCurrency(
      amount,
      fromCurrency.toUpperCase(),
      toCurrency.toUpperCase(),
      tenantId
    );

    res.json({
      conversion,
      formatted: {
        original: currencyService.formatCurrency(conversion.originalAmount, conversion.originalCurrency),
        converted: currencyService.formatCurrency(conversion.convertedAmount, conversion.targetCurrency)
      }
    });
  } catch (error) {
    console.error('Currency conversion failed:', error);
    res.status(400).json({ 
      error: 'Conversion failed',
      details: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

/**
 * GET /api/geolocation/exchange-rates/:baseCurrency
 * Get current exchange rates for a base currency
 */
router.get('/exchange-rates/:baseCurrency', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { baseCurrency } = req.params;
    
    if (!baseCurrency || baseCurrency.length !== 3) {
      return res.status(400).json({ error: 'Valid currency code required' });
    }

    const rates = await currencyService.fetchExchangeRates(baseCurrency.toUpperCase());
    
    res.json({
      baseCurrency: baseCurrency.toUpperCase(),
      rates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    res.status(500).json({ error: 'Failed to get exchange rates' });
  }
});

/**
 * POST /api/geolocation/format-data
 * Format numbers, dates, and addresses according to country preferences
 */
router.post('/format-data', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { countryCode, data } = req.body;

    // Use detected country if not specified
    let targetCountryCode = countryCode;
    if (!targetCountryCode) {
      const storedLocation = await geolocationService.getStoredLocationForTenant(tenantId);
      targetCountryCode = storedLocation?.countryCode || 'US';
    }

    const formatted = {
      countryCode: targetCountryCode
    };

    // Format numbers
    if (data.numbers && Array.isArray(data.numbers)) {
      formatted.numbers = data.numbers.map(num => 
        geolocationService.formatNumber(num, targetCountryCode)
      );
    }

    // Format dates
    if (data.dates && Array.isArray(data.dates)) {
      formatted.dates = data.dates.map(dateStr => 
        geolocationService.formatDate(new Date(dateStr), targetCountryCode)
      );
    }

    // Get address format
    if (data.address) {
      formatted.addressFormat = geolocationService.getAddressFormat(targetCountryCode);
    }

    res.json(formatted);
  } catch (error) {
    console.error('Data formatting failed:', error);
    res.status(400).json({ error: 'Formatting failed' });
  }
});

/**
 * GET /api/geolocation/tenant-location
 * Get stored location data for current tenant
 */
router.get('/tenant-location', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
    const storedLocation = await geolocationService.getStoredLocationForTenant(tenantId);
    
    if (storedLocation) {
      const config = geolocationService.getCountryConfig(storedLocation.countryCode);
      
      res.json({
        location: storedLocation,
        configuration: {
          requiredFields: config.requiredFields,
          dateFormat: config.dateFormat,
          numberFormat: config.numberFormat,
          addressFormat: config.addressFormat
        }
      });
    } else {
      res.json({
        location: null,
        message: 'No location data stored. Use /detect endpoint to detect location.'
      });
    }
  } catch (error) {
    console.error('Error getting tenant location:', error);
    res.status(500).json({ error: 'Failed to get tenant location' });
  }
});

export default router;