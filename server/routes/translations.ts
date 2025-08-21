/**
 * Translations Management API Routes
 * Handles translation files management for SaaS admins
 */

import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Available languages
const SUPPORTED_LANGUAGES = ['en', 'pt', 'es', 'fr', 'de'];
const TRANSLATIONS_DIR = path.join(process.cwd(), 'client/public/locales');

// Schema for translation updates
const updateTranslationSchema = z.object({
  language: z.enum(['en', 'pt', 'es']),
  translations: z.record(z.any())
});

/**
 * GET /api/translations/languages
 * Get all available languages
 */
router.get('/languages', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can manage translations
    if (req.user?.role !== 'saas_admin') {
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
router.get('/:language', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can manage translations
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const { language } = req.params;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    const filePath = path.join(TRANSLATIONS_DIR, language, 'translation.json');

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
router.put('/:language', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can manage translations
    if (req.user?.role !== 'saas_admin') {
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

    const filePath = path.join(TRANSLATIONS_DIR, language, 'translation.json');

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
router.post('/:language/restore', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can manage translations
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const { language } = req.params;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    const filePath = path.join(TRANSLATIONS_DIR, language, 'translation.json');
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
 * Check if a translation key is valid - MUCH MORE PERMISSIVE VERSION
 */
function isValidTranslationKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  const trimmedKey = key.trim();

  // Allow very short keys (minimum 1 character)
  if (trimmedKey.length < 1) {
    return false;
  }

  // Only exclude VERY obvious technical patterns - much more permissive
  const technicalPatterns = [
    /^\/api\/.*$/,        // Full API routes only
    /^https?:\/\/.*$/,    // Full URLs only
    /^\d{3,4}$/,          // HTTP status codes (3-4 digits)
    /^#[0-9a-fA-F]{6}$/,  // Hex colors (6 digits exactly)
    /^\$\{[^}]+\}$/,      // Complete template variables only
    /^[A-Z_]{4,}_[A-Z_]{3,}$/, // Long constants only (more restrictive)
    /^0x[0-9a-fA-F]+$/,   // Hex numbers
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, // UUIDs
  ];

  for (const pattern of technicalPatterns) {
    if (pattern.test(trimmedKey)) {
      return false;
    }
  }

  // Allow numbers in keys (they might be valid translation keys)
  // Only skip pure long numbers
  if (/^\d{10,}$/.test(trimmedKey)) {
    return false;
  }

  // Much smaller list of technical constants to exclude
  const technicalConstants = [
    'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD',
    'console', 'window', 'document', 'undefined', 'function',
    'import', 'export', 'const', 'let', 'var', 'class', 'extends'
  ];

  if (technicalConstants.includes(trimmedKey)) {
    return false;
  }

  // Accept almost everything else - very permissive
  return true;
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
      keys = keys.concat(extractKeysFromObject(obj[key], fullKey));
    } else {
      if (key && typeof key === 'string' && key.trim().length > 0) {
        if (isValidTranslationKey(fullKey)) {
          keys.push(fullKey);
        }
        // Also add the bare key without prefix in case it's useful
        if (isValidTranslationKey(key)) {
          keys.push(key);
        }
      }
    }
  });
  return keys;
}

/**
 * GET /api/translations/keys/all - Get all available translation keys (including scanned keys)
 */
router.get('/keys/all', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const allLanguages = ['en', 'pt', 'es', 'fr', 'de'];
    const allKeysSet = new Set<string>();
    const translations: Record<string, any> = {};

    // First, get all keys from existing translation files
    for (const lang of allLanguages) {
      try {
        const langDir = lang === 'pt-BR' ? 'pt' : lang;
        const filePath = path.join(process.cwd(), 'client/public/locales', langDir, 'translation.json');

        const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
        if (fileExists) {
          const content = await fs.readFile(filePath, 'utf-8');
          const langTranslations = JSON.parse(content);
          translations[lang] = langTranslations;

          // Extract all keys from this language file
          const keys = extractKeysFromObject(langTranslations);
          keys.forEach(key => allKeysSet.add(key));
        }
      } catch (error) {
        console.warn(`Failed to load translations for ${lang}:`, error);
      }
    }

    // Additionally, get scanned keys from the scanner
    try {
      const { TranslationCompletionService } = await import('../services/TranslationCompletionService');
      const translationService = new TranslationCompletionService();
      const scannedKeys = await translationService.scanTranslationKeys();

      // Add all scanned keys
      scannedKeys.forEach(keyObj => {
        if (keyObj.key && typeof keyObj.key === 'string') {
          allKeysSet.add(keyObj.key);
        }
      });

      console.log(`📊 [TRANSLATIONS] Loaded ${allKeysSet.size} total keys (${scannedKeys.length} from scanner)`);
    } catch (error) {
      console.warn('Failed to get scanned keys:', error);
    }

    const allKeys = Array.from(allKeysSet).sort();

    res.json({
      success: true,
      data: {
        keys: allKeys,
        languages: allLanguages,
        translations,
        totalKeys: allKeys.length,
        fromFiles: allKeys.length - allKeysSet.size,
        fromScanner: allKeysSet.size - (allKeys.length - allKeysSet.size),
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