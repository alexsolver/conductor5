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

/**
 * GET /api/translations/keys/all
 * Get all translation keys across all languages (filtered)
 */
router.get('/keys/all', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can manage translations
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const allKeys = new Set<string>();
    const translations: Record<string, any> = {};

    // Scan all supported language directories (including pt-BR, de, fr)
    const allLanguages = ['en', 'pt', 'pt-BR', 'es', 'de', 'fr'];

    for (const lang of allLanguages) {
      try {
        const filePath = path.join(TRANSLATIONS_DIR, `${lang}/translation.json`);
        
        // Check if file exists
        const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
        if (!fileExists) {
          console.log(`Translation file not found for ${lang}, skipping...`);
          continue;
        }

        const fileContent = await fs.readFile(filePath, 'utf8');
        const langTranslations = JSON.parse(fileContent);

        translations[lang] = langTranslations;

        // Extract all keys recursively with very minimal filtering
        const extractKeys = (obj: any, prefix = '') => {
          if (!obj || typeof obj !== 'object') return;
          
          Object.keys(obj).forEach(key => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              extractKeys(obj[key], fullKey);
            } else {
              // Add key with very minimal filtering - much more permissive
              if (key && typeof key === 'string' && key.trim().length > 0) {
                if (isValidTranslationKey(fullKey)) {
                  allKeys.add(fullKey);
                }
                // Also add the bare key without prefix in case it's useful
                if (isValidTranslationKey(key)) {
                  allKeys.add(key);
                }
              }
            }
          });
        };

        extractKeys(langTranslations);
      } catch (error) {
        console.warn(`Could not read ${lang} translations:`, error);
      }
    }

    // Also scan source code files for additional keys
    const sourceDirectories = [
      path.join(process.cwd(), 'client/src/pages'),
      path.join(process.cwd(), 'client/src/components'),
      path.join(process.cwd(), 'client/src/hooks'),
      path.join(process.cwd(), 'client/src/utils')
    ];

    for (const sourceDir of sourceDirectories) {
      try {
        const files = await fs.readdir(sourceDir, { recursive: true });
        
        for (const file of files) {
          if (typeof file === 'string' && /\.(tsx?|jsx?)$/.test(file)) {
            try {
              const filePath = path.join(sourceDir, file);
              const content = await fs.readFile(filePath, 'utf8');
              
              // Look for translation keys in source code
              const translationPatterns = [
                /t\(\s*['"`]([^'"`\n]+)['"`]/g,
                /useTranslation\(\).*?t\(\s*['"`]([^'"`\n]+)['"`]/g,
                /\{\s*t\(\s*['"`]([^'"`\n]+)['"`]/g,
              ];

              for (const pattern of translationPatterns) {
                const matches = [...content.matchAll(pattern)];
                for (const match of matches) {
                  if (match[1] && isValidTranslationKey(match[1])) {
                    allKeys.add(match[1]);
                  }
                }
              }
            } catch (fileError) {
              // Continue if we can't read a specific file
            }
          }
        }
      } catch (dirError) {
        console.warn(`Could not scan source directory ${sourceDir}:`, dirError);
      }
    }

    const allKeysArray = Array.from(allKeys);
    const validKeys = allKeysArray.filter(key => isValidTranslationKey(key)).sort();

    console.log(`🔍 [TRANSLATION-KEYS] Total keys found: ${allKeysArray.length}`);
    console.log(`✅ [TRANSLATION-KEYS] Valid keys after filtering: ${validKeys.length}`);
    console.log(`❌ [TRANSLATION-KEYS] Filtered out: ${allKeysArray.length - validKeys.length}`);

    res.json({
      keys: validKeys,
      translations,
      languages: SUPPORTED_LANGUAGES,
      debug: {
        totalFound: allKeysArray.length,
        validAfterFilter: validKeys.length,
        filteredOut: allKeysArray.length - validKeys.length
      }
    });

  } catch (error) {
    console.error('Error getting all translation keys:', error);
    res.status(500).json({ message: 'Failed to get translation keys' });
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