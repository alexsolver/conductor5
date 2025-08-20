/**
 * Translation Repository Interface
 * Domain interface for translation persistence
 */

import { Translation, TranslationKey, TranslationGap, TranslationAudit, BulkTranslationImport } from '../entities/Translation';

export interface ITranslationRepository {
  // Basic CRUD operations
  findById(id: string, tenantId?: string): Promise<Translation | null>;
  findByKey(key: string, language: string, tenantId?: string): Promise<Translation | null>;
  findByLanguage(language: string, tenantId?: string): Promise<Translation[]>;
  findByModule(module: string, language: string, tenantId?: string): Promise<Translation[]>;
  create(translation: Omit<Translation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Translation>;
  update(id: string, translation: Partial<Translation>, tenantId?: string): Promise<Translation>;
  delete(id: string, tenantId?: string): Promise<void>;

  // Advanced queries
  findMissingKeys(language: string, module?: string, tenantId?: string): Promise<string[]>;
  getTranslationStats(language: string, tenantId?: string): Promise<Record<string, any>>;
  getGapsAnalysis(tenantId?: string): Promise<TranslationGap[]>;
  searchTranslations(query: string, language?: string, module?: string, tenantId?: string): Promise<Translation[]>;

  // Bulk operations
  bulkCreate(translations: Omit<Translation, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Translation[]>;
  bulkUpdate(updates: Array<{ id: string; translation: Partial<Translation> }>, tenantId?: string): Promise<Translation[]>;
  bulkImport(importData: BulkTranslationImport, tenantId?: string): Promise<{ created: number; updated: number; errors: string[] }>;

  // Cache operations
  invalidateCache(pattern?: string, tenantId?: string): Promise<void>;
  warmupCache(language?: string, module?: string, tenantId?: string): Promise<void>;

  // Multi-tenant operations
  getTenantOverrides(key: string, language: string, tenantId: string): Promise<Translation | null>;
  createTenantOverride(translation: Omit<Translation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Translation>;
  listTenantOverrides(tenantId: string, language?: string): Promise<Translation[]>;

  // Audit operations
  getAuditLog(translationId?: string, tenantId?: string, limit?: number): Promise<TranslationAudit[]>;
  createAuditEntry(audit: Omit<TranslationAudit, 'id' | 'changedAt'>): Promise<TranslationAudit>;
}