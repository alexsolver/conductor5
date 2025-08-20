/**
 * Translation Management Schema
 * Database schema for enterprise translation system following 1qa.md patterns
 */

import { pgTable, text, varchar, uuid, timestamp, boolean, integer, json, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema-master";

// Enums for translation system
export const translationActionEnum = pgEnum('translation_action', ['create', 'update', 'delete']);
export const translationPriorityEnum = pgEnum('translation_priority', ['high', 'medium', 'low']);

// Main translations table
export const translations = pgTable('translations', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 200 }).notNull(),
  language: varchar('language', { length: 10 }).notNull(),
  value: text('value').notNull(),
  module: varchar('module', { length: 100 }).notNull(),
  context: text('context'),
  tenantId: uuid('tenant_id'), // NULL for global translations
  isGlobal: boolean('is_global').default(true).notNull(),
  isCustomizable: boolean('is_customizable').default(true).notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
  // Unique constraint for key + language + tenant combination
  uniqueTranslation: uniqueIndex('unique_translation_key_lang_tenant').on(
    table.key, 
    table.language, 
    table.tenantId
  ),
  // Index for performance
  keyLanguageIdx: uniqueIndex('translations_key_language_idx').on(table.key, table.language),
  moduleLanguageIdx: uniqueIndex('translations_module_language_idx').on(table.module, table.language),
  tenantLanguageIdx: uniqueIndex('translations_tenant_language_idx').on(table.tenantId, table.language),
}));

// Translation keys registry (master list of all translation keys)
export const translationKeys = pgTable('translation_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 200 }).notNull().unique(),
  module: varchar('module', { length: 100 }).notNull(),
  context: text('context'),
  defaultValue: text('default_value').notNull(),
  description: text('description'),
  parameters: json('parameters').$type<string[]>(),
  isCustomizable: boolean('is_customizable').default(true).notNull(),
  priority: translationPriorityEnum('priority').default('medium').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
}, (table) => ({
  moduleIdx: uniqueIndex('translation_keys_module_idx').on(table.module),
  priorityIdx: uniqueIndex('translation_keys_priority_idx').on(table.priority),
}));

// Translation audit log
export const translationAudits = pgTable('translation_audits', {
  id: uuid('id').primaryKey().defaultRandom(),
  translationId: uuid('translation_id').references(() => translations.id, { onDelete: 'cascade' }),
  translationKey: varchar('translation_key', { length: 200 }).notNull(),
  language: varchar('language', { length: 10 }).notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value').notNull(),
  action: translationActionEnum('action').notNull(),
  tenantId: uuid('tenant_id'),
  changedBy: uuid('changed_by').notNull().references(() => users.id),
  changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  metadata: json('metadata').$type<Record<string, any>>(),
}, (table) => ({
  translationKeyIdx: uniqueIndex('translation_audits_key_idx').on(table.translationKey),
  tenantIdx: uniqueIndex('translation_audits_tenant_idx').on(table.tenantId),
  changedAtIdx: uniqueIndex('translation_audits_changed_at_idx').on(table.changedAt),
}));

// Translation cache table (for performance optimization)
export const translationCache = pgTable('translation_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  cacheKey: varchar('cache_key', { length: 300 }).notNull().unique(),
  value: text('value').notNull(),
  language: varchar('language', { length: 10 }).notNull(),
  tenantId: uuid('tenant_id'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  hitCount: integer('hit_count').default(0).notNull(),
}, (table) => ({
  languageIdx: uniqueIndex('translation_cache_language_idx').on(table.language),
  tenantIdx: uniqueIndex('translation_cache_tenant_idx').on(table.tenantId),
  expiresAtIdx: uniqueIndex('translation_cache_expires_at_idx').on(table.expiresAt),
}));

// Translation statistics table (for dashboard and analytics)
export const translationStats = pgTable('translation_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  language: varchar('language', { length: 10 }).notNull(),
  module: varchar('module', { length: 100 }),
  tenantId: uuid('tenant_id'),
  totalKeys: integer('total_keys').default(0).notNull(),
  translatedKeys: integer('translated_keys').default(0).notNull(),
  missingKeys: integer('missing_keys').default(0).notNull(),
  completeness: integer('completeness').default(0).notNull(), // percentage
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  languageModuleIdx: uniqueIndex('translation_stats_lang_module_idx').on(table.language, table.module),
  tenantLanguageIdx: uniqueIndex('translation_stats_tenant_lang_idx').on(table.tenantId, table.language),
  completenessIdx: uniqueIndex('translation_stats_completeness_idx').on(table.completeness),
}));

// Zod schemas for validation
export const insertTranslationSchema = createInsertSchema(translations, {
  key: z.string().min(1).max(200).regex(/^[a-z][a-zA-Z0-9._-]*$/, 'Invalid key format'),
  language: z.string().min(2).max(10),
  value: z.string().min(0).max(5000),
  module: z.string().min(1).max(100),
  context: z.string().optional(),
  version: z.number().min(1).default(1),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTranslationSchema = createInsertSchema(translations, {
  value: z.string().min(0).max(5000),
  context: z.string().optional(),
}).omit({
  id: true,
  key: true,
  language: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
}).partial();

export const insertTranslationKeySchema = createInsertSchema(translationKeys, {
  key: z.string().min(1).max(200).regex(/^[a-z][a-zA-Z0-9._-]*$/, 'Invalid key format'),
  module: z.string().min(1).max(100),
  defaultValue: z.string().min(1),
  description: z.string().optional(),
  parameters: z.array(z.string()).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const bulkTranslationImportSchema = z.object({
  language: z.string().min(2).max(10),
  module: z.string().min(1).max(100).optional(),
  translations: z.record(z.string().min(0).max(5000)),
  overwrite: z.boolean().default(false),
  validateOnly: z.boolean().default(false),
});

// Type exports
export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type UpdateTranslation = z.infer<typeof updateTranslationSchema>;

export type TranslationKey = typeof translationKeys.$inferSelect;
export type InsertTranslationKey = z.infer<typeof insertTranslationKeySchema>;

export type TranslationAudit = typeof translationAudits.$inferSelect;
export type TranslationCache = typeof translationCache.$inferSelect;
export type TranslationStats = typeof translationStats.$inferSelect;

export type BulkTranslationImport = z.infer<typeof bulkTranslationImportSchema>;