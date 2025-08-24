/**
 * Translation Service
 * Core translation management following 1qa.md patterns
 */

import fs from 'fs/promises';
import path from 'path';

interface TranslationData {
  [key: string]: any;
}

export class TranslationService {
  private static readonly TRANSLATION_PATHS = {
    'pt-BR': 'client/src/i18n/locales/pt-BR.json',
    'en': 'client/src/i18n/locales/en.json',
    'es': 'client/src/i18n/locales/es.json',
    'fr': 'client/src/i18n/locales/fr.json',
    'de': 'client/src/i18n/locales/de.json'
  };

  /**
   * Get translations for a specific language
   */
  static async getTranslations(language: string): Promise<TranslationData> {
    try {
      const filePath = this.TRANSLATION_PATHS[language as keyof typeof this.TRANSLATION_PATHS];
      if (!filePath) {
        throw new Error(`Unsupported language: ${language}`);
      }

      const fullPath = path.resolve(filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error loading translations for ${language}:`, error);
      return {};
    }
  }

  /**
   * Save translations for a specific language
   */
  static async saveTranslations(language: string, translations: TranslationData): Promise<void> {
    try {
      const filePath = this.TRANSLATION_PATHS[language as keyof typeof this.TRANSLATION_PATHS];
      if (!filePath) {
        throw new Error(`Unsupported language: ${language}`);
      }

      const fullPath = path.resolve(filePath);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Save with proper formatting
      const content = JSON.stringify(translations, null, 2);
      await fs.writeFile(fullPath, content, 'utf-8');
      
      console.log(`✅ Translations saved for ${language}`);
    } catch (error) {
      console.error(`❌ Error saving translations for ${language}:`, error);
      throw error;
    }
  }

  /**
   * Get all translation keys
   */
  static async getAllTranslationKeys(): Promise<{ keys: string[]; languages: string[]; totalKeys: number }> {
    try {
      const languages = Object.keys(this.TRANSLATION_PATHS);
      const allKeys = new Set<string>();

      // Collect all keys from all languages
      for (const lang of languages) {
        try {
          const translations = await this.getTranslations(lang);
          this.extractKeys(translations).forEach(key => allKeys.add(key));
        } catch (error) {
          console.warn(`Warning: Could not load ${lang} translations`);
        }
      }

      return {
        keys: Array.from(allKeys).sort(),
        languages,
        totalKeys: allKeys.size
      };
    } catch (error) {
      console.error('Error getting all translation keys:', error);
      throw error;
    }
  }

  /**
   * Restore translations from backup (placeholder)
   */
  static async restoreTranslations(language: string): Promise<void> {
    console.log(`Restoring translations for ${language} - Feature not yet implemented`);
    // This would restore from a backup if we had one
  }

  /**
   * Expand translation scan (placeholder)
   */
  static async expandTranslationScan(): Promise<{ scannedKeys: number; expandedKeys: number }> {
    const result = await this.getAllTranslationKeys();
    return {
      scannedKeys: result.totalKeys,
      expandedKeys: result.totalKeys
    };
  }

  /**
   * Extract all keys from a nested translation object
   */
  private static extractKeys(obj: any, prefix = ''): string[] {
    const keys: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...this.extractKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }
}

// Named exports for compatibility
export const getTranslations = TranslationService.getTranslations.bind(TranslationService);
export const saveTranslations = TranslationService.saveTranslations.bind(TranslationService);
export const getAllTranslationKeys = TranslationService.getAllTranslationKeys.bind(TranslationService);
export const restoreTranslations = TranslationService.restoreTranslations.bind(TranslationService);
export const expandTranslationScan = TranslationService.expandTranslationScan.bind(TranslationService);