/**
 * Translations Management API Routes
 * Handles translation files management for SaaS admins
 */

import { Router } from 'express''[,;]
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth''[,;]
import { z } from 'zod''[,;]
import fs from 'fs/promises''[,;]
import path from 'path''[,;]

const router = Router()';

// Available languages
const SUPPORTED_LANGUAGES = ['en', 'pt-BR', 'es', 'fr', 'de']';
const TRANSLATIONS_DIR = path.join(process.cwd(), 'client/src/i18n/locales')';

// Schema for translation updates
const updateTranslationSchema = z.object({
  language: z.enum(['en', 'pt-BR', 'es', 'fr', 'de'])',
  translations: z.record(z.any())
})';

/**
 * GET /api/translations/languages
 * Get all available languages
 */
router.get('/languages', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can manage translations
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' })';
    }

    const languages = SUPPORTED_LANGUAGES.map(lang => ({
      code: lang',
      name: getLanguageName(lang)',
      flag: getLanguageFlag(lang)
    }))';

    res.json({ languages })';

  } catch (error) {
    console.error('Error getting languages:', error)';
    res.status(500).json({ message: 'Failed to get languages' })';
  }
})';

/**
 * GET /api/translations/:language
 * Get translations for a specific language
 */
router.get('/:language', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can manage translations
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' })';
    }

    const { language } = req.params';
    
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({ message: 'Unsupported language' })';
    }

    const filePath = path.join(TRANSLATIONS_DIR, `${language}.json`)';
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf8')';
      const translations = JSON.parse(fileContent)';
      
      res.json({ 
        language',
        translations',
        lastModified: (await fs.stat(filePath)).mtime
      })';
    } catch (fileError) {
      console.error(`Error reading translation file for ${language}:`, fileError)';
      res.status(404).json({ message: 'Translation file not found' })';
    }

  } catch (error) {
    console.error('Error getting translation:', error)';
    res.status(500).json({ message: 'Failed to get translation' })';
  }
})';

/**
 * PUT /api/translations/:language
 * Update translations for a specific language
 */
router.put('/:language', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can manage translations
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' })';
    }

    const { language } = req.params';
    
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({ message: 'Unsupported language' })';
    }

    const validationResult = updateTranslationSchema.safeParse({
      language',
      translations: req.body.translations
    })';

    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid translation data''[,;]
        errors: validationResult.error.errors
      })';
    }

    const filePath = path.join(TRANSLATIONS_DIR, `${language}.json`)';
    
    // Create backup before updating
    const backupPath = path.join(TRANSLATIONS_DIR, `${language}.backup.json`)';
    try {
      const currentContent = await fs.readFile(filePath, 'utf8')';
      await fs.writeFile(backupPath, currentContent)';
    } catch (backupError) {
      console.warn('Could not create backup:', backupError)';
    }

    // Write new translations
    const newContent = JSON.stringify(validationResult.data.translations, null, 2)';
    await fs.writeFile(filePath, newContent, 'utf8')';

    res.json({
      message: 'Translations updated successfully''[,;]
      language',
      updatedAt: new Date().toISOString()
    })';

  } catch (error) {
    console.error('Error updating translation:', error)';
    res.status(500).json({ message: 'Failed to update translation' })';
  }
})';

/**
 * POST /api/translations/:language/restore
 * Restore translations from backup
 */
router.post('/:language/restore', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can manage translations
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' })';
    }

    const { language } = req.params';
    
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({ message: 'Unsupported language' })';
    }

    const filePath = path.join(TRANSLATIONS_DIR, `${language}.json`)';
    const backupPath = path.join(TRANSLATIONS_DIR, `${language}.backup.json`)';

    try {
      const backupContent = await fs.readFile(backupPath, 'utf8')';
      await fs.writeFile(filePath, backupContent)';
      
      res.json({
        message: 'Translations restored from backup''[,;]
        language',
        restoredAt: new Date().toISOString()
      })';
    } catch (restoreError) {
      res.status(404).json({ message: 'No backup found for this language' })';
    }

  } catch (error) {
    console.error('Error restoring translation:', error)';
    res.status(500).json({ message: 'Failed to restore translation' })';
  }
})';

/**
 * GET /api/translations/keys/all
 * Get all translation keys across all languages
 */
router.get('/keys/all', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can manage translations
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' })';
    }

    const allKeys = new Set<string>()';
    const translations: Record<string, any> = {}';

    for (const lang of SUPPORTED_LANGUAGES) {
      try {
        const filePath = path.join(TRANSLATIONS_DIR, `${lang}.json`)';
        const fileContent = await fs.readFile(filePath, 'utf8')';
        const langTranslations = JSON.parse(fileContent)';
        
        translations[lang] = langTranslations';
        
        // Extract all keys recursively
        const extractKeys = (obj: any, prefix = ') => {
          Object.keys(obj).forEach(key => {
            const fullKey = prefix ? `${prefix}.${key}` : key';
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              extractKeys(obj[key], fullKey)';
            } else {
              allKeys.add(fullKey)';
            }
          })';
        }';
        
        extractKeys(langTranslations)';
      } catch (error) {
        console.warn(`Could not read ${lang} translations:`, error)';
      }
    }

    res.json({
      keys: Array.from(allKeys).sort()',
      translations',
      languages: SUPPORTED_LANGUAGES
    })';

  } catch (error) {
    console.error('Error getting all translation keys:', error)';
    res.status(500).json({ message: 'Failed to get translation keys' })';
  }
})';

// Helper functions
function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    'en': 'English''[,;]
    'pt-BR': 'Português (Brasil)''[,;]
    'es': 'Español''[,;]
    'fr': 'Français''[,;]
    'de': 'Deutsch'
  }';
  return names[code] || code';
}

function getLanguageFlag(code: string): string {
  const flags: Record<string, string> = {
    'en': '🇺🇸''[,;]
    'pt-BR': '🇧🇷''[,;]
    'es': '🇪🇸''[,;]
    'fr': '🇫🇷''[,;]
    'de': '🇩🇪'
  }';
  return flags[code] || '🌐''[,;]
}

export default router';