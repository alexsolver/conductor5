/**
 * Translation Domain Service
 * Core business logic for translation management
 */

import { Translation, TranslationKey, TranslationGap, BulkTranslationImport } from '../entities/Translation';

export class TranslationDomainService {
  private readonly SUPPORTED_LANGUAGES = ['en', 'pt-BR', 'es', 'fr', 'de'];
  private readonly RESERVED_MODULES = ['auth', 'system', 'core'];

  /**
   * Validates if a language is supported
   */
  isLanguageSupported(language: string): boolean {
    return this.SUPPORTED_LANGUAGES.includes(language);
  }

  /**
   * Validates translation key format
   */
  validateTranslationKey(key: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!key || key.trim().length === 0) {
      errors.push('Translation key cannot be empty');
    }

    if (key && !/^[a-z][a-zA-Z0-9._-]*$/.test(key)) {
      errors.push('Translation key must start with lowercase letter and contain only alphanumeric characters, dots, hyphens, and underscores');
    }

    if (key && key.length > 200) {
      errors.push('Translation key cannot exceed 200 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates translation value
   */
  validateTranslationValue(value: string, key: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (value === null || value === undefined) {
      errors.push('Translation value cannot be null or undefined');
    }

    if (typeof value !== 'string') {
      errors.push('Translation value must be a string');
    }

    if (value && value.length > 5000) {
      errors.push('Translation value cannot exceed 5000 characters');
    }

    // Validate interpolation parameters
    const paramMatches = value.match(/\{\{([^}]+)\}\}/g);
    if (paramMatches) {
      const params = paramMatches.map(match => match.slice(2, -2).trim());
      const invalidParams = params.filter(param => !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(param));
      
      if (invalidParams.length > 0) {
        errors.push(`Invalid interpolation parameters: ${invalidParams.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Checks if a module can have custom translations
   */
  isModuleCustomizable(module: string): boolean {
    return !this.RESERVED_MODULES.includes(module.toLowerCase());
  }

  /**
   * Generates translation inheritance hierarchy
   */
  getTranslationHierarchy(key: string, language: string, tenantId?: string): string[] {
    const hierarchy: string[] = [];

    // 1. Tenant-specific override (highest priority)
    if (tenantId) {
      hierarchy.push(`tenant:${tenantId}:${language}:${key}`);
    }

    // 2. Global translation for language
    hierarchy.push(`global:${language}:${key}`);

    // 3. Fallback to English if not English
    if (language !== 'en') {
      if (tenantId) {
        hierarchy.push(`tenant:${tenantId}:en:${key}`);
      }
      hierarchy.push(`global:en:${key}`);
    }

    // 4. Key itself as ultimate fallback
    hierarchy.push(key);

    return hierarchy;
  }

  /**
   * Calculates completeness percentage
   */
  calculateCompleteness(totalKeys: number, translatedKeys: number): number {
    if (totalKeys === 0) return 100;
    return Math.round((translatedKeys / totalKeys) * 100);
  }

  /**
   * Validates bulk import data
   */
  validateBulkImport(importData: BulkTranslationImport): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.isLanguageSupported(importData.language)) {
      errors.push(`Unsupported language: ${importData.language}`);
    }

    if (importData.module && !this.isModuleCustomizable(importData.module)) {
      errors.push(`Module "${importData.module}" is not customizable`);
    }

    const translations = importData.translations || {};
    const keyCount = Object.keys(translations).length;

    if (keyCount === 0) {
      errors.push('No translations provided');
    }

    if (keyCount > 1000) {
      errors.push('Cannot import more than 1000 translations at once');
    }

    // Validate each translation
    for (const [key, value] of Object.entries(translations)) {
      const keyValidation = this.validateTranslationKey(key);
      if (!keyValidation.valid) {
        errors.push(`Invalid key "${key}": ${keyValidation.errors.join(', ')}`);
      }

      const valueValidation = this.validateTranslationValue(value, key);
      if (!valueValidation.valid) {
        errors.push(`Invalid value for key "${key}": ${valueValidation.errors.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.slice(0, 10) // Limit to first 10 errors
    };
  }

  /**
   * Generates cache key for translation
   */
  generateCacheKey(key: string, language: string, tenantId?: string): string {
    const tenantPrefix = tenantId ? `tenant:${tenantId}:` : 'global:';
    return `translation:${tenantPrefix}${language}:${key}`;
  }

  /**
   * Extracts module from translation key
   */
  extractModuleFromKey(key: string): string {
    const parts = key.split('.');
    return parts.length > 1 ? parts[0] : 'common';
  }

  /**
   * Determines if translation requires tenant isolation
   */
  requiresTenantIsolation(key: string, tenantId?: string): boolean {
    // System translations are always global
    if (this.RESERVED_MODULES.some(module => key.startsWith(`${module}.`))) {
      return false;
    }

    // Everything else can be tenant-specific if tenant is provided
    return !!tenantId;
  }

  /**
   * Formats translation for API response
   */
  formatTranslationForAPI(translation: Translation): any {
    return {
      id: translation.id,
      key: translation.key,
      language: translation.language,
      value: translation.value,
      module: translation.module,
      context: translation.context,
      isGlobal: translation.isGlobal,
      isCustomizable: translation.isCustomizable,
      version: translation.version,
      createdAt: translation.createdAt.toISOString(),
      updatedAt: translation.updatedAt.toISOString()
    };
  }
}