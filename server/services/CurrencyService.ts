// CURRENCY SERVICE MODULE  
// Exchange rate management and currency conversion
// Real-time rate updates and conversion logging

import { Pool } from 'pg';

export interface ExchangeRateResponse {
  baseCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  lastUpdated: Date;
  source: string;
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  conversionTimestamp: Date;
}

export class CurrencyService {
  private cache: Map<string, { rate: number; timestamp: Date }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(private pool: Pool) {}

  /**
   * Convert currency amount from one currency to another
   */
  async convertCurrency(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string,
    tenantId?: string
  ): Promise<number> {
    try {
      if (fromCurrency === toCurrency) {
        return amount;
      }

      const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = amount * exchangeRate;

      // Log conversion if tenant provided
      if (tenantId) {
        await this.logConversion({
          originalAmount: amount,
          originalCurrency: fromCurrency,
          convertedAmount,
          targetCurrency: toCurrency,
          exchangeRate,
          conversionTimestamp: new Date()
        }, tenantId);
      }

      return Math.round(convertedAmount * 100) / 100; // Round to 2 decimals
      
    } catch (error) {
      console.error('Currency conversion error:', error);
      return amount; // Return original amount on error
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(baseCurrency: string, targetCurrency: string): Promise<number> {
    try {
      const cacheKey = `${baseCurrency}_${targetCurrency}`;
      
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp.getTime()) < this.cacheTimeout) {
        return cached.rate;
      }

      // Check database for recent rate
      const dbRate = await this.getExchangeRateFromDB(baseCurrency, targetCurrency);
      if (dbRate && (Date.now() - dbRate.lastUpdated.getTime()) < this.cacheTimeout) {
        this.cache.set(cacheKey, { rate: dbRate.exchangeRate, timestamp: dbRate.lastUpdated });
        return dbRate.exchangeRate;
      }

      // Fetch from external API
      const apiRate = await this.fetchExchangeRateFromAPI(baseCurrency, targetCurrency);
      if (apiRate) {
        // Cache the rate
        this.cache.set(cacheKey, { rate: apiRate.exchangeRate, timestamp: new Date() });
        
        // Update database
        await this.updateExchangeRateInDB(apiRate);
        
        return apiRate.exchangeRate;
      }

      // Fallback rates (approximate)
      return this.getFallbackExchangeRate(baseCurrency, targetCurrency);
      
    } catch (error) {
      console.error('Exchange rate fetch error:', error);
      return this.getFallbackExchangeRate(baseCurrency, targetCurrency);
    }
  }

  /**
   * Get exchange rate from database
   */
  private async getExchangeRateFromDB(
    baseCurrency: string, 
    targetCurrency: string
  ): Promise<ExchangeRateResponse | null> {
    try {
      const result = await this.pool.query(
        `SELECT base_currency, target_currency, exchange_rate, updated_at
         FROM exchange_rates 
         WHERE base_currency = $1 AND target_currency = $2
         ORDER BY updated_at DESC LIMIT 1`,
        [baseCurrency, targetCurrency]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          baseCurrency: row.base_currency,
          targetCurrency: row.target_currency,
          exchangeRate: parseFloat(row.exchange_rate),
          lastUpdated: new Date(row.updated_at),
          source: 'database'
        };
      }

      return null;
    } catch (error) {
      console.error('Database exchange rate error:', error);
      return null;
    }
  }

  /**
   * Fetch exchange rate from external API
   */
  private async fetchExchangeRateFromAPI(
    baseCurrency: string, 
    targetCurrency: string
  ): Promise<ExchangeRateResponse | null> {
    try {
      // Using free exchangerate-api.com service
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.rates && data.rates[targetCurrency]) {
          return {
            baseCurrency,
            targetCurrency,
            exchangeRate: data.rates[targetCurrency],
            lastUpdated: new Date(),
            source: 'exchangerate-api'
          };
        }
      }
    } catch (error) {
      console.error('API exchange rate fetch error:', error);
    }

    return null;
  }

  /**
   * Update exchange rate in database
   */
  private async updateExchangeRateInDB(rateData: ExchangeRateResponse): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO exchange_rates (base_currency, target_currency, exchange_rate, created_at, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (base_currency, target_currency) 
         DO UPDATE SET 
           exchange_rate = EXCLUDED.exchange_rate,
           updated_at = CURRENT_TIMESTAMP`,
        [rateData.baseCurrency, rateData.targetCurrency, rateData.exchangeRate]
      );
    } catch (error) {
      console.error('Database exchange rate update error:', error);
    }
  }

  /**
   * Log currency conversion for audit trail
   */
  private async logConversion(conversion: ConversionResult, tenantId: string): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO currency_conversion_log 
         (tenant_id, original_amount, original_currency, converted_amount, 
          target_currency, exchange_rate, conversion_timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          tenantId,
          conversion.originalAmount,
          conversion.originalCurrency, 
          conversion.convertedAmount,
          conversion.targetCurrency,
          conversion.exchangeRate,
          conversion.conversionTimestamp
        ]
      );
    } catch (error) {
      console.error('Conversion logging error:', error);
    }
  }

  /**
   * Get fallback exchange rates (approximate, for emergencies)
   */
  private getFallbackExchangeRate(baseCurrency: string, targetCurrency: string): number {
    // Approximate rates as of 2025 (fallback only)
    const fallbackRates: Record<string, Record<string, number>> = {
      'USD': {
        'BRL': 5.20,
        'EUR': 0.85,
        'GBP': 0.73,
        'JPY': 110.0,
        'CAD': 1.25,
        'AUD': 1.35,
        'CHF': 0.88,
        'CNY': 7.15,
        'INR': 75.0
      },
      'BRL': {
        'USD': 0.19,
        'EUR': 0.16,
        'GBP': 0.14
      },
      'EUR': {
        'USD': 1.18,
        'BRL': 6.12,
        'GBP': 0.86
      },
      'GBP': {
        'USD': 1.37,
        'EUR': 1.16,
        'BRL': 7.12
      }
    };

    if (fallbackRates[baseCurrency] && fallbackRates[baseCurrency][targetCurrency]) {
      return fallbackRates[baseCurrency][targetCurrency];
    }

    // If no fallback rate available, return 1 (no conversion)
    console.warn(`No fallback exchange rate for ${baseCurrency} to ${targetCurrency}`);
    return 1.0;
  }

  /**
   * Get supported currencies list
   */
  getSupportedCurrencies(): string[] {
    return [
      'USD', 'EUR', 'GBP', 'BRL', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR',
      'MXN', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB'
    ];
  }

  /**
   * Clear exchange rate cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get conversion history for tenant
   */
  async getConversionHistory(tenantId: string, limit: number = 50): Promise<ConversionResult[]> {
    try {
      const result = await this.pool.query(
        `SELECT original_amount, original_currency, converted_amount, 
                target_currency, exchange_rate, conversion_timestamp
         FROM currency_conversion_log 
         WHERE tenant_id = $1 
         ORDER BY conversion_timestamp DESC 
         LIMIT $2`,
        [tenantId, limit]
      );

      return result.rows.map(row => ({
        originalAmount: parseFloat(row.original_amount),
        originalCurrency: row.original_currency,
        convertedAmount: parseFloat(row.converted_amount),
        targetCurrency: row.target_currency,
        exchangeRate: parseFloat(row.exchange_rate),
        conversionTimestamp: new Date(row.conversion_timestamp)
      }));
      
    } catch (error) {
      console.error('Conversion history error:', error);
      return [];
    }
  }
}