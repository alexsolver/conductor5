// GLOBAL MULTILOCATION SCHEMA MODULE
// Dynamic localization system for international support
// Automatic field adaptation based on geographic location

import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  boolean,
  unique,
  numeric,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========================================
// MARKET LOCALIZATION CONFIGURATION
// ========================================

export const marketLocalization = pgTable("market_localization", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Market Configuration
  marketCode: varchar("market_code", { length: 10 }).notNull(), // BR, US, EU, etc.
  countryCode: varchar("country_code", { length: 2 }).notNull(), // ISO 3166-1
  languageCode: varchar("language_code", { length: 10 }).notNull(), // pt-BR, en-US, etc.
  currencyCode: varchar("currency_code", { length: 3 }).notNull(), // BRL, USD, EUR
  
  // Legal/Cultural Field Mapping
  legalFieldMappings: jsonb("legal_field_mappings").default({
    // Brazilian Legal Fields → International Aliases
    "cpf": { 
      "alias": "tax_id", 
      "type": "personal_tax_id",
      "required": true,
      "validation": "brazilian_cpf",
      "description": "Cadastro de Pessoas Físicas"
    },
    "cnpj": { 
      "alias": "business_tax_id", 
      "type": "business_tax_id",
      "required": false,
      "validation": "brazilian_cnpj",
      "description": "Cadastro Nacional de Pessoas Jurídicas"
    },
    "rg": { 
      "alias": "national_id", 
      "type": "national_identity",
      "required": false,
      "validation": "brazilian_rg",
      "description": "Registro Geral (Brazilian ID)"
    }
  }).notNull(),
  
  // Validation Rules per Market
  validationRules: jsonb("validation_rules").default({
    "cpf": {
      "pattern": "^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$|^\\d{11}$",
      "required_for": ["BR"],
      "forbidden_for": []
    },
    "cnpj": {
      "pattern": "^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$|^\\d{14}$",
      "required_for": [],
      "forbidden_for": []
    },
    "phone": {
      "pattern": {
        "BR": "^\\+55\\s?\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$",
        "US": "^\\+1\\s?\\(?\\d{3}\\)?\\s?\\d{3}-?\\d{4}$",
        "EU": "^\\+\\d{1,3}\\s?\\d{4,14}$"
      }
    }
  }).notNull(),
  
  // Display Configuration
  displayConfig: jsonb("display_config").default({
    "dateFormat": "dd/MM/yyyy",
    "timeFormat": "HH:mm",
    "numberFormat": "pt-BR",
    "addressFormat": "brazilian",
    "nameOrder": "first_last"
  }).notNull(),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueTenantMarket: unique("market_localization_tenant_market_unique").on(table.tenantId, table.marketCode),
  tenantActiveIdx: index("market_localization_tenant_active_idx").on(table.tenantId, table.isActive),
  marketCodeIdx: index("market_localization_market_code_idx").on(table.marketCode),
}));

// ========================================
// FIELD ALIASES MAPPING
// ========================================

export const fieldAliasMapping = pgTable("field_alias_mapping", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Source and Target Configuration
  sourceTable: varchar("source_table", { length: 100 }).notNull(), // favorecidos
  sourceField: varchar("source_field", { length: 100 }).notNull(), // cpf, cnpj, rg
  
  // Alias Configuration
  aliasField: varchar("alias_field", { length: 100 }).notNull(), // tax_id, business_tax_id, national_id
  aliasDisplayName: varchar("alias_display_name", { length: 200 }).notNull(), // "Tax ID", "Business Tax ID", "National ID"
  
  // Market-specific Configuration
  marketCode: varchar("market_code", { length: 10 }).notNull(), // BR, US, EU
  
  // Validation and Business Rules
  validationRules: jsonb("validation_rules").default({}).notNull(),
  transformationRules: jsonb("transformation_rules").default({}).notNull(),
  
  // Metadata
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("field_alias_tenant_table_idx").on(table.tenantId, table.sourceTable),
  index("field_alias_market_code_idx").on(table.marketCode),
  index("field_alias_active_idx").on(table.isActive),
]);

// ========================================
// LOCALIZATION CONTEXT
// ========================================

export const localizationContext = pgTable("localization_context", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Context Information
  contextKey: varchar("context_key", { length: 100 }).notNull(), // "favorecidos_form", "customer_display"
  contextType: varchar("context_type", { length: 50 }).notNull(), // "form", "display", "validation"
  
  // Market-specific Localization
  marketCode: varchar("market_code", { length: 10 }).notNull(),
  
  // Localization Data
  labels: jsonb("labels").default({
    // Field labels per language
    "pt-BR": {
      "cpf": "CPF",
      "cnpj": "CNPJ", 
      "rg": "RG",
      "name": "Nome",
      "email": "Email"
    },
    "en-US": {
      "cpf": "Tax ID (CPF)",
      "cnpj": "Business Tax ID (CNPJ)",
      "rg": "National ID (RG)",
      "name": "Full Name",
      "email": "Email Address"
    }
  }).notNull(),
  
  placeholders: jsonb("placeholders").default({
    "pt-BR": {
      "cpf": "000.000.000-00",
      "cnpj": "00.000.000/0000-00",
      "rg": "00.000.000-0"
    },
    "en-US": {
      "cpf": "Brazilian Tax ID",
      "cnpj": "Business Registration",
      "rg": "Identity Document"
    }
  }).notNull(),
  
  helpTexts: jsonb("help_texts").default({
    "pt-BR": {
      "cpf": "Informe o CPF (11 dígitos)",
      "cnpj": "Informe o CNPJ da empresa",
      "rg": "Documento de identidade brasileiro"
    },
    "en-US": {
      "cpf": "Brazilian individual taxpayer registry (11 digits)",
      "cnpj": "Brazilian national registry of legal entities",
      "rg": "Brazilian national identity document"
    }
  }).notNull(),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("localization_context_tenant_key_idx").on(table.tenantId, table.contextKey),
  index("localization_context_market_idx").on(table.marketCode),
  index("localization_context_type_idx").on(table.contextType),
]);

// ========================================
// ZOD SCHEMAS
// ========================================

export const insertMarketLocalizationSchema = createInsertSchema(marketLocalization);
export const insertFieldAliasMappingSchema = createInsertSchema(fieldAliasMapping);
export const insertLocalizationContextSchema = createInsertSchema(localizationContext);

// ========================================
// TYPE EXPORTS
// ========================================

export type MarketLocalization = typeof marketLocalization.$inferSelect;
export type InsertMarketLocalization = typeof marketLocalization.$inferInsert;

export type FieldAliasMapping = typeof fieldAliasMapping.$inferSelect;
export type InsertFieldAliasMapping = typeof fieldAliasMapping.$inferInsert;

export type LocalizationContext = typeof localizationContext.$inferSelect;
export type InsertLocalizationContext = typeof localizationContext.$inferInsert;

// ========================================
// MARKET CONFIGURATION TYPES
// ========================================

export interface MarketConfig {
  marketCode: string;
  countryCode: string;
  languageCode: string;
  currencyCode: string;
  legalFields: Record<string, LegalFieldConfig>;
  validationRules: Record<string, ValidationRule>;
  displayConfig: DisplayConfig;
}

export interface LegalFieldConfig {
  alias: string;
  type: string;
  required: boolean;
  validation: string;
  description: string;
}

export interface ValidationRule {
  pattern: string | Record<string, string>;
  required_for: string[];
  forbidden_for: string[];
}

export interface DisplayConfig {
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  addressFormat: string;
  nameOrder: string;
}

// ========================================
// PREDEFINED MARKET CONFIGURATIONS
// ========================================

export const MARKET_CONFIGS: Record<string, MarketConfig> = {
  BR: {
    marketCode: "BR",
    countryCode: "BR", 
    languageCode: "pt-BR",
    currencyCode: "BRL",
    legalFields: {
      cpf: { alias: "tax_id", type: "personal_tax_id", required: true, validation: "brazilian_cpf", description: "CPF - Cadastro de Pessoas Físicas" },
      cnpj: { alias: "business_tax_id", type: "business_tax_id", required: false, validation: "brazilian_cnpj", description: "CNPJ - Cadastro Nacional de Pessoas Jurídicas" },
      rg: { alias: "national_id", type: "national_identity", required: false, validation: "brazilian_rg", description: "RG - Registro Geral" }
    },
    validationRules: {
      cpf: { pattern: "^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$|^\\d{11}$", required_for: ["BR"], forbidden_for: [] },
      phone: { pattern: { "BR": "^\\+55\\s?\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$" }, required_for: [], forbidden_for: [] }
    },
    displayConfig: {
      dateFormat: "dd/MM/yyyy",
      timeFormat: "HH:mm", 
      numberFormat: "pt-BR",
      addressFormat: "brazilian",
      nameOrder: "first_last"
    }
  },
  US: {
    marketCode: "US",
    countryCode: "US",
    languageCode: "en-US", 
    currencyCode: "USD",
    legalFields: {
      ssn: { alias: "tax_id", type: "social_security", required: false, validation: "us_ssn", description: "Social Security Number" },
      ein: { alias: "business_tax_id", type: "employer_identification", required: false, validation: "us_ein", description: "Employer Identification Number" }
    },
    validationRules: {
      ssn: { pattern: "^\\d{3}-\\d{2}-\\d{4}$", required_for: [], forbidden_for: [] },
      phone: { pattern: { "US": "^\\+1\\s?\\(?\\d{3}\\)?\\s?\\d{3}-?\\d{4}$" }, required_for: [], forbidden_for: [] }
    },
    displayConfig: {
      dateFormat: "MM/dd/yyyy",
      timeFormat: "h:mm a",
      numberFormat: "en-US", 
      addressFormat: "us_standard",
      nameOrder: "first_last"
    }
  }
};

// ========================================
// CURRENCY AND EXCHANGE RATE TABLES
// ========================================

export const exchangeRates = pgTable("exchange_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull(), // USD, EUR, etc.
  targetCurrency: varchar("target_currency", { length: 3 }).notNull(), // BRL, GBP, etc.
  exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  baseTargetIdx: index("idx_exchange_rates_base_target").on(table.baseCurrency, table.targetCurrency),
  createdAtIdx: index("idx_exchange_rates_created_at").on(table.createdAt)
}));

export const currencyConversionLog = pgTable("currency_conversion_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  originalAmount: numeric("original_amount", { precision: 18, scale: 2 }).notNull(),
  originalCurrency: varchar("original_currency", { length: 3 }).notNull(),
  convertedAmount: numeric("converted_amount", { precision: 18, scale: 2 }).notNull(),
  targetCurrency: varchar("target_currency", { length: 3 }).notNull(),
  exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 }).notNull(),
  conversionTimestamp: timestamp("conversion_timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  tenantIdx: index("idx_currency_log_tenant").on(table.tenantId),
  timestampIdx: index("idx_currency_log_timestamp").on(table.conversionTimestamp)
}));

// Export additional schemas for the new tables
export const insertExchangeRatesSchema = createInsertSchema(exchangeRates);
export const insertCurrencyConversionLogSchema = createInsertSchema(currencyConversionLog);

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;

export type CurrencyConversionLog = typeof currencyConversionLog.$inferSelect;
export type InsertCurrencyConversionLog = typeof currencyConversionLog.$inferInsert;