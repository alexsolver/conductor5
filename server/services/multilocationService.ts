// GLOBAL MULTILOCATION SERVICE
// Dynamic localization system with automatic geographic detection
// International compliance and field adaptation

import { Pool } from '@neondatabase/serverless';
import { 
  MarketConfig, 
  MARKET_CONFIGS, 
  LegalFieldConfig, 
  ValidationRule, 
  DisplayConfig 
} from '@shared/schema-multilocation';

export interface MultilocationContext {
  tenantId: string;
  marketCode: string;
  languageCode: string;
  userPreferences?: UserLocalizationPreferences;
}

export interface UserLocalizationPreferences {
  language: string;
  timezone: string;
  currency: string;
  dateFormat?: string;
  numberFormat?: string;
}

export interface FieldLocalization {
  originalField: string;
  localizedLabel: string;
  placeholder: string;
  helpText: string;
  validationPattern?: string;
  required: boolean;
  alias?: string;
}

export interface LocalizedFormConfig {
  formId: string;
  marketCode: string;
  languageCode: string;
  fields: Record<string, FieldLocalization>;
  validationRules: Record<string, ValidationRule>;
  displayConfig: DisplayConfig;
}

export class MultilocationService {
  constructor(private pool: Pool) {}

  /**
   * Get market configuration for tenant
   */
  async getMarketConfig(tenantId: string, marketCode?: string): Promise<MarketConfig> {
    try {
      // If no market code provided, detect from tenant settings
      if (!marketCode) {
        marketCode = await this.detectTenantMarket(tenantId);
      }

      // Get custom market configuration from database
      const customConfig = await this.pool.query(
        `SELECT * FROM market_localization 
         WHERE tenant_id = $1 AND market_code = $2 AND is_active = true`,
        [tenantId, marketCode]
      );

      if (customConfig.rows.length > 0) {
        const row = customConfig.rows[0];
        return {
          marketCode: row.market_code,
          countryCode: row.country_code,
          languageCode: row.language_code,
          currencyCode: row.currency_code,
          legalFields: row.legal_field_mappings,
          validationRules: row.validation_rules,
          displayConfig: row.display_config
        };
      }

      // Fallback to predefined configuration
      return MARKET_CONFIGS[marketCode] || MARKET_CONFIGS.BR;
    } catch (error) {
      console.error('Error getting market config:', error);
      return MARKET_CONFIGS.BR; // Safe fallback to Brazilian config
    }
  }

  /**
   * Get localized field configuration for a specific form/context
   */
  async getLocalizedFormConfig(
    tenantId: string, 
    formId: string, 
    context: MultilocationContext
  ): Promise<LocalizedFormConfig> {
    try {
      const marketConfig = await this.getMarketConfig(tenantId, context.marketCode);
      
      // Get localization context from database
      const localizationData = await this.pool.query(
        `SELECT * FROM localization_context 
         WHERE tenant_id = $1 AND context_key = $2 AND market_code = $3 AND is_active = true`,
        [tenantId, formId, context.marketCode]
      );

      let labels: Record<string, any> = {};
      let placeholders: Record<string, any> = {};
      let helpTexts: Record<string, any> = {};

      if (localizationData.rows.length > 0) {
        const row = localizationData.rows[0];
        labels = row.labels[context.languageCode] || {};
        placeholders = row.placeholders[context.languageCode] || {};
        helpTexts = row.help_texts[context.languageCode] || {};
      }

      // Build field configurations
      const fields: Record<string, FieldLocalization> = {};

      // Handle favorecidos (Brazilian beneficiaries) specific fields
      if (formId === 'favorecidos_form') {
        fields.name = {
          originalField: 'name',
          localizedLabel: labels.name || (context.languageCode === 'pt-BR' ? 'Nome' : 'Full Name'),
          placeholder: placeholders.name || (context.languageCode === 'pt-BR' ? 'Nome completo' : 'Full name'),
          helpText: helpTexts.name || '',
          required: true
        };

        fields.email = {
          originalField: 'email',
          localizedLabel: labels.email || (context.languageCode === 'pt-BR' ? 'Email' : 'Email Address'),
          placeholder: placeholders.email || 'email@example.com',
          helpText: helpTexts.email || '',
          required: true
        };

        // Brazilian legal fields with international aliases
        if (context.marketCode === 'BR') {
          fields.cpf = {
            originalField: 'cpf',
            localizedLabel: labels.cpf || 'CPF',
            placeholder: placeholders.cpf || '000.000.000-00',
            helpText: helpTexts.cpf || 'Cadastro de Pessoas Físicas (11 dígitos)',
            validationPattern: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$|^\\d{11}$',
            required: true,
            alias: 'tax_id'
          };

          fields.cnpj = {
            originalField: 'cnpj',
            localizedLabel: labels.cnpj || 'CNPJ',
            placeholder: placeholders.cnpj || '00.000.000/0000-00',
            helpText: helpTexts.cnpj || 'Cadastro Nacional de Pessoas Jurídicas (14 dígitos)',
            validationPattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$|^\\d{14}$',
            required: false,
            alias: 'business_tax_id'
          };

          fields.rg = {
            originalField: 'rg',
            localizedLabel: labels.rg || 'RG',
            placeholder: placeholders.rg || '00.000.000-0',
            helpText: helpTexts.rg || 'Registro Geral - Documento de identidade brasileiro',
            required: false,
            alias: 'national_id'
          };
        } else {
          // International markets - show as generic fields with Brazilian context
          fields.cpf = {
            originalField: 'cpf',
            localizedLabel: labels.cpf || 'Tax ID (CPF)',
            placeholder: placeholders.cpf || 'Brazilian Tax ID',
            helpText: helpTexts.cpf || 'Brazilian individual taxpayer registry (11 digits)',
            validationPattern: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$|^\\d{11}$',
            required: false,
            alias: 'tax_id'
          };

          fields.cnpj = {
            originalField: 'cnpj',
            localizedLabel: labels.cnpj || 'Business Tax ID (CNPJ)',
            placeholder: placeholders.cnpj || 'Business Registration',
            helpText: helpTexts.cnpj || 'Brazilian national registry of legal entities',
            validationPattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$|^\\d{14}$',
            required: false,
            alias: 'business_tax_id'
          };

          fields.rg = {
            originalField: 'rg',
            localizedLabel: labels.rg || 'National ID (RG)',
            placeholder: placeholders.rg || 'Identity Document',
            helpText: helpTexts.rg || 'Brazilian national identity document',
            required: false,
            alias: 'national_id'
          };
        }

        // Address fields with market-specific formatting
        fields.address = {
          originalField: 'address',
          localizedLabel: labels.address || (context.languageCode === 'pt-BR' ? 'Endereço' : 'Address'),
          placeholder: placeholders.address || (context.languageCode === 'pt-BR' ? 'Rua, número, complemento' : 'Street, number, complement'),
          helpText: helpTexts.address || '',
          required: false
        };

        fields.city = {
          originalField: 'city',
          localizedLabel: labels.city || (context.languageCode === 'pt-BR' ? 'Cidade' : 'City'),
          placeholder: placeholders.city || '',
          helpText: helpTexts.city || '',
          required: false
        };

        fields.state = {
          originalField: 'state',
          localizedLabel: labels.state || (context.languageCode === 'pt-BR' ? 'Estado' : 'State'),
          placeholder: placeholders.state || (context.languageCode === 'pt-BR' ? 'UF' : 'State code'),
          helpText: helpTexts.state || '',
          required: false
        };

        fields.zipCode = {
          originalField: 'zip_code',
          localizedLabel: labels.zipCode || (context.languageCode === 'pt-BR' ? 'CEP' : 'ZIP Code'),
          placeholder: placeholders.zipCode || (context.languageCode === 'pt-BR' ? '00000-000' : 'ZIP/Postal Code'),
          helpText: helpTexts.zipCode || '',
          required: false
        };
      }

      return {
        formId,
        marketCode: context.marketCode,
        languageCode: context.languageCode,
        fields,
        validationRules: marketConfig.validationRules,
        displayConfig: marketConfig.displayConfig
      };
    } catch (error) {
      console.error('Error getting localized form config:', error);
      throw error;
    }
  }

  /**
   * Validate field value according to market rules
   */
  async validateField(
    tenantId: string, 
    fieldName: string, 
    value: string, 
    context: MultilocationContext
  ): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const marketConfig = await this.getMarketConfig(tenantId, context.marketCode);
      const errors: string[] = [];

      const validation = marketConfig.validationRules[fieldName];
      if (!validation) {
        return { isValid: true, errors: [] };
      }

      // Check if field is required for this market
      if (validation.required_for.includes(context.marketCode) && (!value || value.trim() === '')) {
        errors.push(`${fieldName} is required for ${context.marketCode} market`);
      }

      // Check if field is forbidden for this market
      if (validation.forbidden_for.includes(context.marketCode) && value && value.trim() !== '') {
        errors.push(`${fieldName} is not allowed for ${context.marketCode} market`);
      }

      // Pattern validation
      if (value && value.trim() !== '') {
        let pattern = validation.pattern;
        
        // Handle market-specific patterns
        if (typeof pattern === 'object') {
          pattern = pattern[context.marketCode];
        }
        
        if (pattern && typeof pattern === 'string') {
          const regex = new RegExp(pattern);
          if (!regex.test(value)) {
            errors.push(`${fieldName} format is invalid for ${context.marketCode} market`);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating field:', error);
      return {
        isValid: false,
        errors: ['Validation service temporarily unavailable']
      };
    }
  }

  /**
   * Get field aliases for API responses (international compatibility)
   */
  async getFieldAliases(tenantId: string, tableName: string, marketCode: string): Promise<Record<string, string>> {
    try {
      const aliases = await this.pool.query(
        `SELECT source_field, alias_field FROM field_alias_mapping 
         WHERE tenant_id = $1 AND source_table = $2 AND market_code = $3 AND is_active = true`,
        [tenantId, tableName, marketCode]
      );

      const aliasMap: Record<string, string> = {};
      aliases.rows.forEach(row => {
        aliasMap[row.source_field] = row.alias_field;
      });

      // Add default Brazilian field aliases for international markets
      if (marketCode !== 'BR' && tableName === 'favorecidos') {
        aliasMap.cpf = aliasMap.cpf || 'tax_id';
        aliasMap.cnpj = aliasMap.cnpj || 'business_tax_id';
        aliasMap.rg = aliasMap.rg || 'national_id';
      }

      return aliasMap;
    } catch (error) {
      console.error('Error getting field aliases:', error);
      return {};
    }
  }

  /**
   * Transform data with aliases for international API responses
   */
  async transformDataWithAliases(
    tenantId: string, 
    tableName: string, 
    data: any, 
    marketCode: string
  ): Promise<any> {
    const aliases = await this.getFieldAliases(tenantId, tableName, marketCode);
    
    if (Object.keys(aliases).length === 0) {
      return data;
    }

    const transformedData = { ...data };
    
    // Add aliased fields alongside original fields
    Object.entries(aliases).forEach(([originalField, alias]) => {
      if (data[originalField] !== undefined) {
        transformedData[alias] = data[originalField];
      }
    });

    return transformedData;
  }

  /**
   * Detect tenant's primary market from settings
   */
  private async detectTenantMarket(tenantId: string): Promise<string> {
    try {
      const tenantSettings = await this.pool.query(
        'SELECT settings FROM tenants WHERE id = $1',
        [tenantId]
      );

      if (tenantSettings.rows.length > 0) {
        const settings = tenantSettings.rows[0].settings || {};
        return settings.marketCode || settings.country || 'BR';
      }

      return 'BR'; // Default to Brazilian market
    } catch (error) {
      console.error('Error detecting tenant market:', error);
      return 'BR';
    }
  }

  /**
   * Initialize default market configurations for a tenant
   */
  async initializeTenantMarketConfig(tenantId: string, marketCode: string = 'BR'): Promise<void> {
    try {
      const marketConfig = MARKET_CONFIGS[marketCode];
      if (!marketConfig) {
        throw new Error(`Unknown market code: ${marketCode}`);
      }

      // Insert market localization
      await this.pool.query(
        `INSERT INTO market_localization 
         (tenant_id, market_code, country_code, language_code, currency_code, 
          legal_field_mappings, validation_rules, display_config)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (tenant_id, market_code) DO UPDATE SET
         updated_at = CURRENT_TIMESTAMP`,
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

      // Initialize field aliases for favorecidos table
      if (marketCode !== 'BR') {
        const aliasConfigs = [
          { sourceField: 'cpf', aliasField: 'tax_id', displayName: 'Tax ID' },
          { sourceField: 'cnpj', aliasField: 'business_tax_id', displayName: 'Business Tax ID' },
          { sourceField: 'rg', aliasField: 'national_id', displayName: 'National ID' }
        ];

        for (const config of aliasConfigs) {
          await this.pool.query(
            `INSERT INTO field_alias_mapping 
             (tenant_id, source_table, source_field, alias_field, alias_display_name, market_code)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT DO NOTHING`,
            [tenantId, 'favorecidos', config.sourceField, config.aliasField, config.displayName, marketCode]
          );
        }
      }

      console.log(`✅ Initialized market configuration for tenant ${tenantId}, market ${marketCode}`);
    } catch (error) {
      console.error('Error initializing tenant market config:', error);
      throw error;
    }
  }
}

export const multilocationService = new MultilocationService(
  // Pool will be injected from the calling context
  null as any
);