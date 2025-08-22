/**
 * Translations Management API Routes
 * Handles translation files management for SaaS admins
 */

import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { TranslationCompletionService } from '../services/TranslationCompletionService';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

// Type for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    roles: string[];
    email?: string;
  };
  params?: any;
}

const router = Router();

// Available languages
const SUPPORTED_LANGUAGES = ['en', 'pt-BR', 'es', 'fr', 'de'];
const TRANSLATIONS_DIR = path.join(process.cwd(), 'client', 'src', 'i18n', 'locales');

// Schema for translation updates
const updateTranslationSchema = z.object({
  language: z.enum(['en', 'pt', 'es', 'fr', 'de']),
  translations: z.record(z.any())
});

/**
 * GET /api/translations/languages
 * Get all available languages
 */
router.get('/languages', jwtAuth, async (req: any, res: any) => {
  try {
    // Only SaaS admins can manage translations
    if (!req.user?.roles?.includes('saas_admin')) {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const languages = SUPPORTED_LANGUAGES.map(lang => ({
      code: lang,
      name: getLanguageName(lang),
      flag: getLanguageFlag(lang)
    }));

    res.json({ languages });

  } catch (error) {
    console.error('Error getting languages:', error);
    res.status(500).json({ message: 'Failed to get languages' });
  }
});

/**
 * GET /api/translations/:language
 * Get translations for a specific language
 */
router.get('/:language', jwtAuth, async (req: any, res: any) => {
  try {
    // Only SaaS admins can manage translations
    if (!req.user?.roles?.includes('saas_admin')) {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const { language } = req.params;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    const filePath = path.join(TRANSLATIONS_DIR, `${language}.json`);

    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const translations = JSON.parse(fileContent);

      res.json({
        language,
        translations,
        lastModified: (await fs.stat(filePath)).mtime
      });
    } catch (fileError) {
      console.error(`Error reading translation file for ${language}:`, fileError);
      res.status(404).json({ message: 'Translation file not found' });
    }

  } catch (error) {
    console.error('Error getting translation:', error);
    res.status(500).json({ message: 'Failed to get translation' });
  }
});

/**
 * PUT /api/translations/:language
 * Update translations for a specific language
 */
router.put('/:language', jwtAuth, async (req: any, res: any) => {
  try {
    // Only SaaS admins can manage translations
    if (!req.user?.roles?.includes('saas_admin')) {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const { language } = req.params;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    const validationResult = updateTranslationSchema.safeParse({
      language,
      translations: req.body.translations
    });

    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid translation data',
        errors: validationResult.error.errors
      });
    }

    const filePath = path.join(TRANSLATIONS_DIR, `${language}.json`);

    // Create backup before updating
    const backupPath = path.join(TRANSLATIONS_DIR, language, 'translation.backup.json');
    try {
      const currentContent = await fs.readFile(filePath, 'utf8');
      await fs.writeFile(backupPath, currentContent);
    } catch (backupError) {
      console.warn('Could not create backup:', backupError);
    }

    // Write new translations
    const newContent = JSON.stringify(validationResult.data.translations, null, 2);
    await fs.writeFile(filePath, newContent, 'utf8');

    res.json({
      message: 'Translations updated successfully',
      language,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating translation:', error);
    res.status(500).json({ message: 'Failed to update translation' });
  }
});

/**
 * POST /api/translations/:language/restore
 * Restore translations from backup
 */
router.post('/:language/restore', jwtAuth, async (req: any, res: any) => {
  try {
    // Only SaaS admins can manage translations
    if (!req.user?.roles?.includes('saas_admin')) {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const { language } = req.params;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    const filePath = path.join(TRANSLATIONS_DIR, `${language}.json`);
    const backupPath = path.join(TRANSLATIONS_DIR, language, 'translation.backup.json');

    try {
      const backupContent = await fs.readFile(backupPath, 'utf8');
      await fs.writeFile(filePath, backupContent);

      res.json({
        message: 'Translations restored from backup',
        language,
        restoredAt: new Date().toISOString()
      });
    } catch (restoreError) {
      res.status(404).json({ message: 'No backup found for this language' });
    }

  } catch (error) {
    console.error('Error restoring translation:', error);
    res.status(500).json({ message: 'Failed to restore translation' });
  }
});

/**
 * Check if a translation key is valid - STRICT VALIDATION
 */
function isValidTranslationKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  const trimmedKey = key.trim();

  // Must not be empty
  if (trimmedKey.length === 0) {
    return false;
  }

  // Exclude technical patterns
  const invalidPatterns = [
    /^https?:\/\//,                                                               // URLs
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, // UUIDs
    /^\d{8,}$/,                                                                  // Long numbers
    /^\/[^/]+\/[^/]+\/[^/]+.*$/,                                                // Deep paths
    /^#[0-9a-fA-F]{3,8}$/,                                                      // Hex colors
    /^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)$/,                              // HTTP methods
    /^\d{3}:?$/,                                                                // Status codes
    /^[,\-\/\?\@\:\\\n\#\&\+\=\*\(\)\[\]\_\%\$\^\!\~\`\|]$/,                  // Single symbols
    /^(BRL|USD|EUR|America\/Sao_Paulo|Brasil|Ativo|T|AND|OR)$/,                // Technical constants
    /^[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*$/,                                    // camelCase
    /^[a-z_]+\.[a-z_]+$/,                                                       // Database fields
    /^\s*$/,                                                                    // Whitespace only
    /^\d+$/,                                                                    // Numbers only
    /^(true|false)$/i,                                                          // Booleans
    /^[A-Z]{2,}$/,                                                              // Abbreviations
    /\.[a-z]{2,4}$/i,                                                           // File extensions
    /^\?[a-zA-Z0-9_=&]+$/                                                       // Query params
  ];

  // Must be a valid translation key pattern (alphanumeric with dots, underscores, hyphens)
  const validKeyPattern = /^[a-zA-Z][a-zA-Z0-9._-]*$/;
  
  return validKeyPattern.test(trimmedKey) && !invalidPatterns.some(pattern => pattern.test(trimmedKey));
}

// Helper to extract all keys from a nested object
function extractKeysFromObject(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  if (!obj || typeof obj !== 'object') {
    return keys;
  }

  Object.keys(obj).forEach(key => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      // Recursively extract nested keys
      keys = keys.concat(extractKeysFromObject(obj[key], fullKey));
    } else {
      // This is a leaf node - add the full key path
      if (fullKey && typeof fullKey === 'string' && fullKey.trim().length > 0) {
        if (isValidTranslationKey(fullKey)) {
          keys.push(fullKey);
        }
      }
    }
  });
  return keys;
}

/**
 * GET /api/translations/keys/all - Get all available translation keys (prioritizing scanned keys)
 */
router.get('/keys/all', jwtAuth, async (req: any, res: any) => {
  try {
    const allLanguages = ['en', 'pt', 'es', 'fr', 'de'];
    const allKeysSet = new Set<string>();
    const translations: Record<string, any> = {};
    let fromScanner = 0;
    let fromFiles = 0;

    // FIRST: Get scanned keys from the ultra-comprehensive code scanner (priority)
    try {
      const translationService = new TranslationCompletionService();
      const scannedKeys = await translationService.scanCodebaseForTranslationKeys();

      // Add all scanned keys with ultra-permissive validation  
      scannedKeys.forEach((keyObj: any) => {
        if (keyObj.key && typeof keyObj.key === 'string' && isValidTranslationKey(keyObj.key)) {
          allKeysSet.add(keyObj.key);
          fromScanner++;
        }
      });

      console.log(`📊 [TRANSLATIONS] Added ${fromScanner} keys from codebase scanner out of ${scannedKeys.length} scanned`);
    } catch (error) {
      console.warn('Failed to get scanned keys:', error instanceof Error ? error.message : 'Unknown error');
    }

    // SECOND: Get keys from existing translation files
    for (const lang of allLanguages) {
      try {
        const filePath = path.join(TRANSLATIONS_DIR, `${lang}.json`);

        const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
        if (fileExists) {
          const content = await fs.readFile(filePath, 'utf-8');
          const langTranslations = JSON.parse(content);
          translations[lang] = langTranslations;

          // Extract all keys from this language file
          const keys = extractKeysFromObject(langTranslations);
          keys.forEach(key => {
            if (isValidTranslationKey(key) && !allKeysSet.has(key)) {
              allKeysSet.add(key);
              fromFiles++;
            }
          });
        }
      } catch (error) {
        console.warn(`Failed to load translations for ${lang}:`, (error as Error).message);
      }
    }

    const allKeys = Array.from(allKeysSet).sort();

    console.log(`📊 [TRANSLATIONS] FINAL COUNT: ${allKeys.length} total keys (${fromScanner} from scanner, ${fromFiles} from files)`);

    res.json({
      success: true,
      data: {
        keys: allKeys,
        languages: allLanguages,
        translations,
        totalKeys: allKeys.length,
        fromFiles: fromFiles,
        fromScanner: fromScanner,
        scannerVsFiles: {
          scannerFound: fromScanner,
          filesFound: fromFiles,
          total: allKeys.length,
          note: 'Scanner keys have priority'
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching all translation keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch translation keys',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/translations/expand-scan - Ultra-comprehensive scanning for thousands more keys
 */
router.get('/expand-scan', jwtAuth, async (req: any, res: any) => {
  try {
    console.log('🚀 [EXPAND-SCAN] Starting ultra-comprehensive translation scan...');
    
    const translationService = new TranslationCompletionService();
    const result = await translationService.performExpandedScan();

    res.json({
      success: true,
      data: result,
      message: `Ultra-comprehensive scan complete! Found ${result.totalKeys} translation keys (${result.improvement} more than before, ${result.expansionRatio} expansion rate)`
    });

  } catch (error) {
    console.error('❌ [EXPAND-SCAN] Error during ultra-comprehensive scan:', (error as Error).message);
    res.status(500).json({
      success: false,
      message: 'Failed to perform ultra-comprehensive scan',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
});

// Helper functions
function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    'en': 'English',
    'pt': 'Português (Brasil)',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch'
  };
  return names[code] || code;
}

function getLanguageFlag(code: string): string {
  const flags: Record<string, string> = {
    'en': '🇺🇸',
    'pt': '🇧🇷',
    'es': '🇪🇸',
    'fr': '🇫🇷',
    'de': '🇩🇪'
  };
  return flags[code] || '🌐';
}

export default router;