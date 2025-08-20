/**
 * Drizzle Translation Repository
 * Infrastructure layer implementation of translation repository
 */

import { eq, and, like, or, sql, desc } from 'drizzle-orm';
import { db } from '../../../../shared/schema';
import { 
  translations, 
  translationKeys, 
  translationAudits, 
  translationCache,
  translationStats
} from '../../../../shared/schema-translations';
import { Translation, TranslationAudit } from '../../domain/entities/Translation';
import { ITranslationRepository } from '../../domain/repositories/ITranslationRepository';
import { TranslationGap, BulkTranslationImport } from '../../domain/entities/Translation';

export class DrizzleTranslationRepository implements ITranslationRepository {
  
  async findById(id: string, tenantId?: string): Promise<Translation | null> {
    const conditions = [eq(translations.id, id)];
    if (tenantId) {
      conditions.push(
        or(
          eq(translations.tenantId, tenantId),
          eq(translations.isGlobal, true)
        )!
      );
    }

    const result = await db
      .select()
      .from(translations)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  async findByKey(key: string, language: string, tenantId?: string): Promise<Translation | null> {
    // Search hierarchy: tenant-specific -> global
    if (tenantId) {
      // First try tenant-specific
      const tenantResult = await db
        .select()
        .from(translations)
        .where(
          and(
            eq(translations.key, key),
            eq(translations.language, language),
            eq(translations.tenantId, tenantId)
          )
        )
        .limit(1);

      if (tenantResult[0]) return tenantResult[0];
    }

    // Fallback to global
    const globalResult = await db
      .select()
      .from(translations)
      .where(
        and(
          eq(translations.key, key),
          eq(translations.language, language),
          eq(translations.isGlobal, true)
        )
      )
      .limit(1);

    return globalResult[0] || null;
  }

  async findByLanguage(language: string, tenantId?: string): Promise<Translation[]> {
    const conditions = [eq(translations.language, language)];
    
    if (tenantId) {
      conditions.push(
        or(
          eq(translations.tenantId, tenantId),
          eq(translations.isGlobal, true)
        )!
      );
    }

    return await db
      .select()
      .from(translations)
      .where(and(...conditions))
      .orderBy(translations.key);
  }

  async findByModule(module: string, language: string, tenantId?: string): Promise<Translation[]> {
    const conditions = [
      eq(translations.module, module),
      eq(translations.language, language)
    ];
    
    if (tenantId) {
      conditions.push(
        or(
          eq(translations.tenantId, tenantId),
          eq(translations.isGlobal, true)
        )!
      );
    }

    return await db
      .select()
      .from(translations)
      .where(and(...conditions))
      .orderBy(translations.key);
  }

  async create(translation: Omit<Translation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Translation> {
    const [created] = await db
      .insert(translations)
      .values({
        ...translation,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)
      .returning();

    return created;
  }

  async update(id: string, translation: Partial<Translation>, tenantId?: string): Promise<Translation> {
    const conditions = [eq(translations.id, id)];
    if (tenantId) {
      conditions.push(eq(translations.tenantId, tenantId));
    }

    const [updated] = await db
      .update(translations)
      .set({
        ...translation,
        updatedAt: new Date()
      })
      .where(and(...conditions))
      .returning();

    if (!updated) {
      throw new Error('Translation not found or access denied');
    }

    return updated;
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    const conditions = [eq(translations.id, id)];
    if (tenantId) {
      conditions.push(eq(translations.tenantId, tenantId));
    }

    const result = await db
      .delete(translations)
      .where(and(...conditions));

    if (result.rowCount === 0) {
      throw new Error('Translation not found or access denied');
    }
  }

  async findMissingKeys(language: string, module?: string, tenantId?: string): Promise<string[]> {
    // Get all registered keys for the module
    const keyConditions = [];
    if (module) {
      keyConditions.push(eq(translationKeys.module, module));
    }

    const allKeys = await db
      .select({ key: translationKeys.key })
      .from(translationKeys)
      .where(keyConditions.length > 0 ? and(...keyConditions) : undefined);

    // Get existing translations
    const translationConditions = [eq(translations.language, language)];
    if (module) {
      translationConditions.push(eq(translations.module, module));
    }
    if (tenantId) {
      translationConditions.push(
        or(
          eq(translations.tenantId, tenantId),
          eq(translations.isGlobal, true)
        )!
      );
    }

    const existingTranslations = await db
      .select({ key: translations.key })
      .from(translations)
      .where(and(...translationConditions));

    const existingKeys = new Set(existingTranslations.map(t => t.key));
    return allKeys.map(k => k.key).filter(key => !existingKeys.has(key));
  }

  async getTranslationStats(language?: string, tenantId?: string): Promise<Record<string, any>> {
    // Get statistics from the stats table
    const conditions = [];
    if (language) {
      conditions.push(eq(translationStats.language, language));
    }
    if (tenantId) {
      conditions.push(eq(translationStats.tenantId, tenantId));
    }

    const stats = await db
      .select()
      .from(translationStats)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Process stats into structured format
    const result: Record<string, any> = {
      languages: {},
      modules: {}
    };

    for (const stat of stats) {
      if (!result.languages[stat.language]) {
        result.languages[stat.language] = {
          totalKeys: 0,
          translatedKeys: 0,
          missingKeys: 0
        };
      }

      result.languages[stat.language].totalKeys += stat.totalKeys;
      result.languages[stat.language].translatedKeys += stat.translatedKeys;
      result.languages[stat.language].missingKeys += stat.missingKeys;

      if (stat.module) {
        if (!result.modules[stat.module]) {
          result.modules[stat.module] = {
            totalKeys: 0,
            translatedKeys: 0,
            missingKeys: 0
          };
        }

        result.modules[stat.module].totalKeys += stat.totalKeys;
        result.modules[stat.module].translatedKeys += stat.translatedKeys;
        result.modules[stat.module].missingKeys += stat.missingKeys;
      }
    }

    return result;
  }

  async getGapsAnalysis(tenantId?: string): Promise<TranslationGap[]> {
    const supportedLanguages = ['en', 'pt-BR', 'es', 'fr', 'de'];
    const gaps: TranslationGap[] = [];

    for (const language of supportedLanguages) {
      const missingKeys = await this.findMissingKeys(language, undefined, tenantId);
      
      // Group missing keys by module
      const moduleGaps: Record<string, string[]> = {};
      for (const key of missingKeys) {
        const module = key.split('.')[0] || 'common';
        if (!moduleGaps[module]) {
          moduleGaps[module] = [];
        }
        moduleGaps[module].push(key);
      }

      gaps.push({
        language,
        missingKeys,
        moduleGaps,
        stats: {
          totalKeys: 0, // Will be calculated
          translatedKeys: 0,
          missingKeys: missingKeys.length,
          completeness: 0,
          lastUpdated: new Date()
        }
      });
    }

    return gaps;
  }

  async searchTranslations(query: string, language?: string, module?: string, tenantId?: string): Promise<Translation[]> {
    const conditions = [];

    if (query) {
      conditions.push(
        or(
          like(translations.key, `%${query}%`),
          like(translations.value, `%${query}%`)
        )!
      );
    }

    if (language) {
      conditions.push(eq(translations.language, language));
    }

    if (module) {
      conditions.push(eq(translations.module, module));
    }

    if (tenantId) {
      conditions.push(
        or(
          eq(translations.tenantId, tenantId),
          eq(translations.isGlobal, true)
        )!
      );
    }

    return await db
      .select()
      .from(translations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(translations.key)
      .limit(1000); // Reasonable limit for search
  }

  async bulkCreate(translationsData: Omit<Translation, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Translation[]> {
    if (translationsData.length === 0) return [];

    const now = new Date();
    const toInsert = translationsData.map(t => ({
      ...t,
      createdAt: now,
      updatedAt: now
    }));

    return await db
      .insert(translations)
      .values(toInsert as any[])
      .returning();
  }

  async bulkUpdate(updates: Array<{ id: string; translation: Partial<Translation> }>, tenantId?: string): Promise<Translation[]> {
    const results: Translation[] = [];

    // Execute updates in batches for better performance
    for (const update of updates) {
      const updated = await this.update(update.id, update.translation, tenantId);
      results.push(updated);
    }

    return results;
  }

  async bulkImport(importData: BulkTranslationImport, tenantId?: string): Promise<{ created: number; updated: number; errors: string[] }> {
    // This method would typically be implemented in a use case
    // For now, return a basic structure
    return {
      created: 0,
      updated: 0,
      errors: ['Bulk import should be handled by use case']
    };
  }

  async invalidateCache(pattern?: string, tenantId?: string): Promise<void> {
    const conditions = [];
    
    if (pattern) {
      conditions.push(like(translationCache.cacheKey, pattern));
    }
    
    if (tenantId) {
      conditions.push(eq(translationCache.tenantId, tenantId));
    }

    await db
      .delete(translationCache)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
  }

  async warmupCache(language?: string, module?: string, tenantId?: string): Promise<void> {
    // Implementation would pre-load frequently accessed translations
    // For now, this is a placeholder
  }

  async getTenantOverrides(key: string, language: string, tenantId: string): Promise<Translation | null> {
    const result = await db
      .select()
      .from(translations)
      .where(
        and(
          eq(translations.key, key),
          eq(translations.language, language),
          eq(translations.tenantId, tenantId)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  async createTenantOverride(translation: Omit<Translation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Translation> {
    return await this.create({
      ...translation,
      isGlobal: false
    });
  }

  async listTenantOverrides(tenantId: string, language?: string): Promise<Translation[]> {
    const conditions = [eq(translations.tenantId, tenantId)];
    
    if (language) {
      conditions.push(eq(translations.language, language));
    }

    return await db
      .select()
      .from(translations)
      .where(and(...conditions))
      .orderBy(translations.key);
  }

  async getAuditLog(translationId?: string, tenantId?: string, limit: number = 100): Promise<TranslationAudit[]> {
    const conditions = [];
    
    if (translationId) {
      conditions.push(eq(translationAudits.translationId, translationId));
    }
    
    if (tenantId) {
      conditions.push(eq(translationAudits.tenantId, tenantId));
    }

    return await db
      .select()
      .from(translationAudits)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(translationAudits.changedAt))
      .limit(limit);
  }

  async createAuditEntry(audit: Omit<TranslationAudit, 'id' | 'changedAt'>): Promise<TranslationAudit> {
    const [created] = await db
      .insert(translationAudits)
      .values({
        ...audit,
        changedAt: new Date()
      })
      .returning();

    return created;
  }
}