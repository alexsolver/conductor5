/**
 * PostgreSQL Translation Repository
 * Real database implementation following 1qa.md compliance
 */

import { db, sql } from '../../../../../shared/schema';
import { translations, translationKeys } from '../../../../../shared/schema-translations';
import { eq, and, ilike, desc, asc, count } from 'drizzle-orm';

export interface Translation {
  id: string;
  key: string;
  language: string;
  value: string;
  module: string;
  context?: string;
  tenantId?: string;
  isGlobal: boolean;
  isCustomizable: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface TranslationKey {
  id: string;
  key: string;
  module: string;
  context?: string;
  defaultValue: string;
  description?: string;
  parameters?: string[];
  isCustomizable: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TranslationSearchFilters {
  language?: string;
  module?: string;
  search?: string;
  tenantId?: string;
  isGlobal?: boolean;
  limit?: number;
  offset?: number;
}

export interface TranslationStats {
  totalKeys: number;
  totalTranslations: number;
  completionRate: number;
  languages: string[];
  modules: string[];
  byLanguage: Record<string, { completeness: number; translatedKeys: number; totalKeys: number }>;
  byModule: Record<string, { completeness: number; translatedKeys: number; totalKeys: number }>;
}

export class PostgreSQLTranslationRepository {
  
  async search(filters: TranslationSearchFilters): Promise<{
    translations: Translation[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        language = 'en',
        module,
        search,
        tenantId,
        isGlobal,
        limit = 100,
        offset = 0
      } = filters;

      // Build query conditions
      const conditions = [];
      
      // Language filter
      conditions.push(eq(translations.language, language));
      
      // Module filter
      if (module) {
        conditions.push(eq(translations.module, module));
      }
      
      // Search filter
      if (search && search.trim()) {
        conditions.push(
          sql`(${translations.key} ILIKE ${`%${search.trim()}%`} OR ${translations.value} ILIKE ${`%${search.trim()}%`})`
        );
      }
      
      // Tenant filter
      if (tenantId) {
        conditions.push(eq(translations.tenantId, tenantId));
      }
      
      // Global filter
      if (isGlobal !== undefined) {
        conditions.push(eq(translations.isGlobal, isGlobal));
      }

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(translations)
        .where(and(...conditions));
      
      const total = totalResult?.count || 0;

      // Get paginated results
      const results = await db
        .select({
          id: translations.id,
          key: translations.key,
          language: translations.language,
          value: translations.value,
          module: translations.module,
          context: translations.context,
          tenantId: translations.tenantId,
          isGlobal: translations.isGlobal,
          isCustomizable: translations.isCustomizable,
          version: translations.version,
          createdAt: translations.createdAt,
          updatedAt: translations.updatedAt,
          createdBy: translations.createdBy,
          updatedBy: translations.updatedBy,
        })
        .from(translations)
        .where(and(...conditions))
        .orderBy(asc(translations.module), asc(translations.key))
        .limit(limit)
        .offset(offset);

      const formattedResults: Translation[] = results.map(row => ({
        id: row.id,
        key: row.key,
        language: row.language,
        value: row.value,
        module: row.module,
        context: row.context || undefined,
        tenantId: row.tenantId || undefined,
        isGlobal: row.isGlobal,
        isCustomizable: row.isCustomizable,
        version: row.version,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        createdBy: row.createdBy,
        updatedBy: row.updatedBy || undefined,
      }));

      return {
        translations: formattedResults,
        total,
        hasMore: offset + limit < total
      };

    } catch (error) {
      console.error('❌ [PostgreSQLTranslationRepository] Search error:', error);
      throw new Error('Failed to search translations');
    }
  }

  async getStats(): Promise<TranslationStats> {
    try {
      // Get total keys count
      const [totalKeysResult] = await db
        .select({ count: count() })
        .from(translationKeys);
      
      const totalKeys = totalKeysResult?.count || 0;

      // Get total translations count
      const [totalTranslationsResult] = await db
        .select({ count: count() })
        .from(translations);
      
      const totalTranslations = totalTranslationsResult?.count || 0;

      // Get unique languages
      const languageResults = await db
        .selectDistinct({ language: translations.language })
        .from(translations)
        .orderBy(asc(translations.language));
      
      const languages = languageResults.map(row => row.language);

      // Get unique modules
      const moduleResults = await db
        .selectDistinct({ module: translations.module })
        .from(translations)
        .orderBy(asc(translations.module));
      
      const modules = moduleResults.map(row => row.module);

      // Calculate completion rate
      const completionRate = totalKeys > 0 ? Math.round((totalTranslations / (totalKeys * languages.length)) * 100) : 0;

      // Get stats by language
      const byLanguage: Record<string, { completeness: number; translatedKeys: number; totalKeys: number }> = {};
      
      for (const language of languages) {
        const [langResult] = await db
          .select({ count: count() })
          .from(translations)
          .where(eq(translations.language, language));
        
        const translatedKeys = langResult?.count || 0;
        const completeness = totalKeys > 0 ? Math.round((translatedKeys / totalKeys) * 100) : 0;
        
        byLanguage[language] = {
          completeness,
          translatedKeys,
          totalKeys
        };
      }

      // Get stats by module
      const byModule: Record<string, { completeness: number; translatedKeys: number; totalKeys: number }> = {};
      
      for (const module of modules) {
        // Get total keys for this module
        const [moduleKeysResult] = await db
          .select({ count: count() })
          .from(translationKeys)
          .where(eq(translationKeys.module, module));
        
        const moduleKeys = moduleKeysResult?.count || 0;

        // Get translated keys for this module
        const [moduleTranslationsResult] = await db
          .select({ count: count() })
          .from(translations)
          .where(eq(translations.module, module));
        
        const translatedKeys = moduleTranslationsResult?.count || 0;
        const completeness = moduleKeys > 0 ? Math.round((translatedKeys / (moduleKeys * languages.length)) * 100) : 0;
        
        byModule[module] = {
          completeness,
          translatedKeys: Math.round(translatedKeys / languages.length), // Average per language
          totalKeys: moduleKeys
        };
      }

      return {
        totalKeys,
        totalTranslations,
        completionRate,
        languages,
        modules,
        byLanguage,
        byModule
      };

    } catch (error) {
      console.error('❌ [PostgreSQLTranslationRepository] Stats error:', error);
      throw new Error('Failed to get translation statistics');
    }
  }

  async getSupportedLanguages(): Promise<Array<{ code: string; name: string; nativeName: string }>> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' }
    ];
  }

  async seedTranslations(userId: string): Promise<void> {
    try {
      console.log('🌱 [SEED] Starting translation seeding process...');
      
      // Sample translation keys with their translations
      const seedData = [
        // Auth module
        { key: 'auth.login.title', module: 'auth', context: 'Login page title', en: 'Login', 'pt-BR': 'Entrar', es: 'Iniciar Sesión' },
        { key: 'auth.logout', module: 'auth', context: 'Logout button', en: 'Logout', 'pt-BR': 'Sair', es: 'Cerrar Sesión' },
        { key: 'auth.email.label', module: 'auth', context: 'Email field label', en: 'Email', 'pt-BR': 'E-mail', es: 'Correo' },
        { key: 'auth.password.label', module: 'auth', context: 'Password field label', en: 'Password', 'pt-BR': 'Senha', es: 'Contraseña' },
        
        // Dashboard module
        { key: 'dashboard.title', module: 'dashboard', context: 'Main dashboard title', en: 'Dashboard', 'pt-BR': 'Painel', es: 'Panel' },
        { key: 'dashboard.overview', module: 'dashboard', context: 'Overview section', en: 'Overview', 'pt-BR': 'Visão Geral', es: 'Resumen' },
        
        // Tickets module
        { key: 'tickets.title', module: 'tickets', context: 'Tickets page title', en: 'Tickets', 'pt-BR': 'Chamados', es: 'Tickets' },
        { key: 'tickets.create.new', module: 'tickets', context: 'Create ticket button', en: 'Create New Ticket', 'pt-BR': 'Criar Novo Chamado', es: 'Crear Nuevo Ticket' },
        
        // Customers module
        { key: 'customers.title', module: 'customers', context: 'Customers page title', en: 'Customers', 'pt-BR': 'Clientes', es: 'Clientes' },
        
        // Common module
        { key: 'common.save', module: 'common', context: 'Save button', en: 'Save', 'pt-BR': 'Salvar', es: 'Guardar' },
        { key: 'common.cancel', module: 'common', context: 'Cancel button', en: 'Cancel', 'pt-BR': 'Cancelar', es: 'Cancelar' }
      ];

      // First, insert translation keys
      for (const item of seedData) {
        await db.insert(translationKeys)
          .values({
            key: item.key,
            module: item.module,
            context: item.context,
            defaultValue: item.en,
            createdBy: userId,
            isCustomizable: true,
            priority: 'medium'
          })
          .onConflictDoNothing();
      }

      // Then, insert translations for each language
      const languages = ['en', 'pt-BR', 'es'] as const;
      
      for (const item of seedData) {
        for (const lang of languages) {
          const value = item[lang];
          if (value) {
            await db.insert(translations)
              .values({
                key: item.key,
                language: lang,
                value: value,
                module: item.module,
                context: item.context,
                isGlobal: true,
                isCustomizable: true,
                version: 1,
                createdBy: userId
              })
              .onConflictDoNothing();
          }
        }
      }

      console.log('✅ [SEED] Translation seeding completed successfully');
      
    } catch (error) {
      console.error('❌ [SEED] Translation seeding failed:', error);
      throw new Error('Failed to seed translations');
    }
  }
}