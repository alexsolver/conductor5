// GLOBAL GEOLOCATION SERVICE MODULE
// IP-based country detection and automatic market configuration
// Integrated currency conversion and exchange rate management

import { Pool } from 'pg';
import { CurrencyService } from './CurrencyService';

export interface DetectedLocation {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  timezone?: string;
  currency?: string;
  marketCode?: string;
  confidence: number;
}

export interface MarketConfiguration {
  marketCode: string;
  countryCode: string;
  languageCode: string;
  currencyCode: string;
  displayConfig: {
    dateFormat: string;
    timeFormat: string;
    numberFormat: string;
    addressFormat: string;
    nameOrder: string;
  };
  validationRules: Record<string, any>;
  legalFields: Record<string, any>;
}

export class GeolocationService {
  private currencyService: CurrencyService;
  
  constructor(private pool: Pool) {
    this.currencyService = new CurrencyService(pool);
  }

  /**
   * Detect user location from IP address
   * Uses multiple fallback methods for accuracy
   */
  async detectLocation(ipAddress: string): Promise<DetectedLocation> {
    try {
      // Primary: Use ipinfo.io for IP geolocation
      const response = await fetch(`https://ipinfo.io/${ipAddress}/json`);
      
      if (response.ok) {
        const data = await response.json();
        
        const location: DetectedLocation = {
          country: data.country || 'Unknown',
          countryCode: data.country || 'US', // Default to US
          region: data.region,
          city: data.city,
          timezone: data.timezone,
          confidence: 0.85
        };

        // Map country code to market and currency
        const marketMapping = this.getMarketMapping(location.countryCode);
        location.marketCode = marketMapping.marketCode;
        location.currency = marketMapping.currency;

        return location;
      }
    } catch (error) {
      console.error('IP geolocation error:', error);
    }

    // Fallback: Return default US location
    return {
      country: 'United States',
      countryCode: 'US',
      marketCode: 'US',
      currency: 'USD',
      confidence: 0.1
    };
  }

  /**
   * Get market configuration for detected location
   */
  async getMarketConfiguration(countryCode: string, tenantId: string): Promise<MarketConfiguration | null> {
    try {
      const marketCode = this.getMarketMapping(countryCode).marketCode;
      
      // Query database for existing market configuration
      const result = await this.pool.query(
        `SELECT * FROM market_localization 
         WHERE tenant_id = $1 AND market_code = $2 AND is_active = true`,
        [tenantId, marketCode]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          marketCode: row.market_code,
          countryCode: row.country_code,
          languageCode: row.language_code,
          currencyCode: row.currency_code,
          displayConfig: row.display_config,
          validationRules: row.validation_rules,
          legalFields: row.legal_field_mappings
        };
      }

      // Return default configuration based on country
      return this.getDefaultMarketConfiguration(countryCode);
      
    } catch (error) {
      console.error('Error getting market configuration:', error);
      return null;
    }
  }

  /**
   * Auto-initialize market configuration for tenant based on location
   */
  async initializeMarketConfiguration(tenantId: string, location: DetectedLocation): Promise<boolean> {
    try {
      const marketConfig = this.getDefaultMarketConfiguration(location.countryCode);
      
      // Check if market config already exists
      const existing = await this.pool.query(
        `SELECT id FROM market_localization 
         WHERE tenant_id = $1 AND market_code = $2`,
        [tenantId, marketConfig.marketCode]
      );

      if (existing.rows.length > 0) {
        return true; // Already exists
      }

      // Create new market configuration
      await this.pool.query(
        `INSERT INTO market_localization 
         (tenant_id, market_code, country_code, language_code, currency_code, 
          legal_field_mappings, validation_rules, display_config)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          tenantId,
          marketConfig.marketCode,
          marketConfig.countryCode,
          marketConfig.languageCode,
          marketConfig.currencyCode,
          JSON.stringify(marketConfig.legalFields),
          JSON.stringify(marketConfig.validationRules),
          JSON.stringify(marketConfig.displayConfig)
        ]
      );

      console.log(`✅ Initialized market configuration: ${marketConfig.marketCode} for tenant ${tenantId}`);
      return true;
      
    } catch (error) {
      console.error('Error initializing market configuration:', error);
      return false;
    }
  }

  /**
   * Map country code to market and currency
   */
  private getMarketMapping(countryCode: string): { marketCode: string; currency: string } {
    const mappings: Record<string, { marketCode: string; currency: string }> = {
      'BR': { marketCode: 'BR', currency: 'BRL' },
      'US': { marketCode: 'US', currency: 'USD' },
      'CA': { marketCode: 'US', currency: 'USD' }, // North America
      'GB': { marketCode: 'EU', currency: 'GBP' },
      'DE': { marketCode: 'EU', currency: 'EUR' },
      'FR': { marketCode: 'EU', currency: 'EUR' },
      'IT': { marketCode: 'EU', currency: 'EUR' },
      'ES': { marketCode: 'EU', currency: 'EUR' },
      'PT': { marketCode: 'EU', currency: 'EUR' },
      'NL': { marketCode: 'EU', currency: 'EUR' },
      'AU': { marketCode: 'AU', currency: 'AUD' },
      'IN': { marketCode: 'APAC', currency: 'INR' },
      'JP': { marketCode: 'APAC', currency: 'JPY' },
      'CN': { marketCode: 'APAC', currency: 'CNY' }
    };

    return mappings[countryCode] || { marketCode: 'US', currency: 'USD' };
  }

  /**
   * Get default market configuration for country
   */
  private getDefaultMarketConfiguration(countryCode: string): MarketConfiguration {
    const mapping = this.getMarketMapping(countryCode);
    
    // US Market Configuration
    if (mapping.marketCode === 'US') {
      return {
        marketCode: 'US',
        countryCode: countryCode,
        languageCode: 'en-US',
        currencyCode: mapping.currency,
        displayConfig: {
          dateFormat: 'MM/dd/yyyy',
          timeFormat: 'h:mm a',
          numberFormat: 'en-US',
          addressFormat: 'us_standard',
          nameOrder: 'first_last'
        },
        validationRules: {
          ssn: { pattern: '^\\d{3}-\\d{2}-\\d{4}$', required_for: [], forbidden_for: [] },
          phone: { pattern: { 'US': '^\\+1\\s?\\(?\\d{3}\\)?\\s?\\d{3}-?\\d{4}$' } }
        },
        legalFields: {
          ssn: { alias: 'tax_id', type: 'social_security', required: false, validation: 'us_ssn', description: 'Social Security Number' },
          ein: { alias: 'business_tax_id', type: 'employer_identification', required: false, validation: 'us_ein', description: 'Employer Identification Number' }
        }
      };
    }

    // EU Market Configuration  
    if (mapping.marketCode === 'EU') {
      return {
        marketCode: 'EU',
        countryCode: countryCode,
        languageCode: 'en-GB',
        currencyCode: mapping.currency,
        displayConfig: {
          dateFormat: 'dd/MM/yyyy',
          timeFormat: 'HH:mm',
          numberFormat: 'en-GB',
          addressFormat: 'european',
          nameOrder: 'first_last'
        },
        validationRules: {
          vat: { pattern: '^[A-Z]{2}[0-9A-Z]+$', required_for: [], forbidden_for: [] },
          phone: { pattern: { 'EU': '^\\+\\d{1,3}\\s?\\d{4,14}$' } }
        },
        legalFields: {
          vat: { alias: 'tax_id', type: 'vat_number', required: false, validation: 'eu_vat', description: 'VAT Registration Number' },
          company_reg: { alias: 'business_tax_id', type: 'company_registration', required: false, validation: 'eu_company', description: 'Company Registration Number' }
        }
      };
    }

    // Brazilian Market Configuration (preserved as fallback)
    return {
      marketCode: 'BR',
      countryCode: 'BR',
      languageCode: 'pt-BR',
      currencyCode: 'BRL',
      displayConfig: {
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        numberFormat: 'pt-BR',
        addressFormat: 'brazilian',
        nameOrder: 'first_last'
      },
      validationRules: {
        cpf: { pattern: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$|^\\d{11}$', required_for: ['BR'], forbidden_for: [] },
        cnpj: { pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$|^\\d{14}$', required_for: [], forbidden_for: [] },
        phone: { pattern: { 'BR': '^\\+55\\s?\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$' } }
      },
      legalFields: {
        cpf: { alias: 'tax_id', type: 'personal_tax_id', required: true, validation: 'brazilian_cpf', description: 'Cadastro de Pessoas Físicas' },
        cnpj: { alias: 'business_tax_id', type: 'business_tax_id', required: false, validation: 'brazilian_cnpj', description: 'Cadastro Nacional de Pessoas Jurídicas' },
        rg: { alias: 'national_id', type: 'national_identity', required: false, validation: 'brazilian_rg', description: 'Registro Geral (Brazilian ID)' }
      }
    };
  }

  /**
   * Format currency amount based on detected location
   */
  async formatCurrency(amount: number, fromCurrency: string, location: DetectedLocation): Promise<string> {
    try {
      const targetCurrency = location.currency || 'USD';
      
      if (fromCurrency === targetCurrency) {
        return this.formatCurrencyDisplay(amount, targetCurrency, location.countryCode);
      }

      // Convert currency using CurrencyService
      const convertedAmount = await this.currencyService.convertCurrency(
        amount, fromCurrency, targetCurrency
      );

      return this.formatCurrencyDisplay(convertedAmount, targetCurrency, location.countryCode);
      
    } catch (error) {
      console.error('Currency formatting error:', error);
      return this.formatCurrencyDisplay(amount, fromCurrency, location.countryCode);
    }
  }

  /**
   * Format currency display based on country conventions
   */
  private formatCurrencyDisplay(amount: number, currency: string, countryCode: string): string {
    const localeMap: Record<string, string> = {
      'BR': 'pt-BR',
      'US': 'en-US',
      'CA': 'en-CA',
      'GB': 'en-GB',
      'DE': 'de-DE',
      'FR': 'fr-FR',
      'ES': 'es-ES',
      'IT': 'it-IT',
      'AU': 'en-AU',
      'JP': 'ja-JP'
    };

    const locale = localeMap[countryCode] || 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}