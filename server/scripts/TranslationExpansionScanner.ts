
import fs from 'fs/promises';
import path from 'path';

/**
 * Comprehensive Translation Expansion Scanner
 * Scans the entire codebase to find and expand translation keys
 */
class TranslationExpansionScanner {
  private readonly SUPPORTED_LANGUAGES = ['en', 'pt', 'pt-BR', 'es', 'de', 'fr'];
  private readonly TRANSLATIONS_DIR = path.join(process.cwd(), 'client/public/locales');
  private readonly SOURCE_DIRS = [
    'client/src',
    'server',
    'shared'
  ];

  async run() {
    console.log('🚀 [EXPANSION-SCANNER] Starting comprehensive translation expansion...');
    
    // Step 1: Scan all source files
    const sourceKeys = await this.scanAllSourceFiles();
    console.log(`📄 [EXPANSION-SCANNER] Found ${sourceKeys.size} keys from source files`);

    // Step 2: Scan existing translation files
    const existingKeys = await this.scanExistingTranslationFiles();
    console.log(`📁 [EXPANSION-SCANNER] Found ${existingKeys.size} keys from translation files`);

    // Step 3: Combine and deduplicate
    const allKeys = new Set([...sourceKeys, ...existingKeys]);
    console.log(`🎯 [EXPANSION-SCANNER] Total unique keys: ${allKeys.size}`);

    // Step 4: Generate missing keys report
    const missingKeys = await this.findMissingKeys(allKeys);
    
    // Step 5: Generate expansion report
    await this.generateExpansionReport(allKeys, missingKeys);

    console.log('✅ [EXPANSION-SCANNER] Translation expansion scan complete!');
    return { totalKeys: allKeys.size, missingKeys: missingKeys.size };
  }

  private async scanAllSourceFiles(): Promise<Set<string>> {
    const keys = new Set<string>();
    
    const patterns = [
      // Standard translation calls
      /(?:t\(|useTranslation\(\)\.t\(|i18n\.t\()\s*['"`]([^'"`\n]+)['"`]/g,
      
      // JSX props with translations
      /\b(?:title|label|placeholder|text|description|tooltip|aria-label|alt|message|error|success|warning|info)\s*=\s*\{\s*t\(\s*['"`]([^'"`\n]+)['"`]/g,
      
      // Translation keys in objects/configs
      /['"`]([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*?)['"`]\s*:/g,
      
      // Destructured translations
      /const\s*\{\s*t\s*\}\s*=\s*useTranslation\(\)[\s\S]*?t\(\s*['"`]([^'"`\n]+)['"`]/g,
      
      // Translation in JSX
      /\{\s*t\(\s*['"`]([^'"`\n]+)['"`]\s*\)\s*\}/g,
      
      // Translation in template literals
      /\$\{\s*t\(\s*['"`]([^'"`\n]+)['"`]\s*\)\s*\}/g,
      
      // Translation in function calls
      /(?:toast|notify|alert|console\.(?:log|error|warn))\s*\(\s*.*?t\(\s*['"`]([^'"`\n]+)['"`]/g,
    ];

    for (const sourceDir of this.SOURCE_DIRS) {
      const fullPath = path.join(process.cwd(), sourceDir);
      await this.scanDirectoryForKeys(fullPath, keys, patterns);
    }

    return keys;
  }

  private async scanDirectoryForKeys(dirPath: string, keys: Set<string>, patterns: RegExp[]): Promise<void> {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);

        if (item.isDirectory() && !['node_modules', '.git', 'dist', 'build', 'coverage'].includes(item.name)) {
          await this.scanDirectoryForKeys(itemPath, keys, patterns);
        } else if (item.isFile() && /\.(tsx?|jsx?|vue|svelte|js|ts)$/.test(item.name)) {
          try {
            const content = await fs.readFile(itemPath, 'utf8');
            
            for (const pattern of patterns) {
              const matches = [...content.matchAll(pattern)];
              for (const match of matches) {
                if (match[1] && this.isValidTranslationKey(match[1])) {
                  keys.add(match[1]);
                }
              }
            }
          } catch (fileError) {
            console.warn(`Could not read file ${itemPath}:`, fileError.message);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not scan directory ${dirPath}:`, error.message);
    }
  }

  private async scanExistingTranslationFiles(): Promise<Set<string>> {
    const keys = new Set<string>();

    for (const language of this.SUPPORTED_LANGUAGES) {
      try {
        const filePath = path.join(this.TRANSLATIONS_DIR, language, 'translation.json');
        
        const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
        if (!fileExists) continue;

        const fileContent = await fs.readFile(filePath, 'utf8');
        const translations = JSON.parse(fileContent);

        this.extractKeysFromObject(translations, '', keys);
      } catch (error) {
        console.warn(`Could not scan ${language} translations:`, error.message);
      }
    }

    return keys;
  }

  private extractKeysFromObject(obj: any, prefix: string, keys: Set<string>): void {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;

    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        this.extractKeysFromObject(obj[key], fullKey, keys);
      } else {
        if (this.isValidTranslationKey(fullKey)) {
          keys.add(fullKey);
        }
      }
    });
  }

  private isValidTranslationKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    
    const trimmedKey = key.trim();
    if (trimmedKey.length < 1) return false;

    // Very permissive - only exclude obvious technical patterns
    const exclusions = [
      /^https?:\/\//,
      /^\/api\//,
      /^\d{8,}$/,
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      /^#[0-9a-fA-F]{6}$/,
      /^0x[0-9a-fA-F]+$/,
    ];

    return !exclusions.some(pattern => pattern.test(trimmedKey));
  }

  private async findMissingKeys(allKeys: Set<string>): Promise<Set<string>> {
    const missingKeys = new Set<string>();

    for (const language of this.SUPPORTED_LANGUAGES) {
      try {
        const filePath = path.join(this.TRANSLATIONS_DIR, language, 'translation.json');
        
        const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
        if (!fileExists) {
          // If file doesn't exist, all keys are missing for this language
          allKeys.forEach(key => missingKeys.add(`${language}:${key}`));
          continue;
        }

        const fileContent = await fs.readFile(filePath, 'utf8');
        const translations = JSON.parse(fileContent);

        // Check which keys are missing in this language
        for (const key of allKeys) {
          if (!this.keyExistsInTranslations(key, translations)) {
            missingKeys.add(`${language}:${key}`);
          }
        }
      } catch (error) {
        console.warn(`Could not check missing keys for ${language}:`, error.message);
      }
    }

    return missingKeys;
  }

  private keyExistsInTranslations(key: string, translations: any): boolean {
    const keyParts = key.split('.');
    let current = translations;

    for (const part of keyParts) {
      if (!current || typeof current !== 'object' || !(part in current)) {
        return false;
      }
      current = current[part];
    }

    return true;
  }

  private async generateExpansionReport(allKeys: Set<string>, missingKeys: Set<string>): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalKeysFound: allKeys.size,
        totalMissingKeys: missingKeys.size,
        expansionRatio: `${(allKeys.size / 270 * 100).toFixed(1)}%` // Compare to current 270
      },
      allKeys: Array.from(allKeys).sort(),
      missingKeysByLanguage: {} as Record<string, string[]>,
      recommendations: [
        'Review all found keys for relevance',
        'Add missing translations using the auto-completion service',
        'Validate generated translations with native speakers',
        'Consider grouping related keys under common prefixes'
      ]
    };

    // Group missing keys by language
    for (const missingKey of missingKeys) {
      const [language, key] = missingKey.split(':');
      if (!report.missingKeysByLanguage[language]) {
        report.missingKeysByLanguage[language] = [];
      }
      report.missingKeysByLanguage[language].push(key);
    }

    const reportPath = path.join(process.cwd(), 'translation-expansion-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 [EXPANSION-SCANNER] Report saved to: ${reportPath}`);
    console.log(`📈 [EXPANSION-SCANNER] Expansion: ${270} → ${allKeys.size} keys (${report.summary.expansionRatio} increase)`);
  }
}

// Execute if run directly
if (require.main === module) {
  const scanner = new TranslationExpansionScanner();
  scanner.run().catch(console.error);
}

export { TranslationExpansionScanner };
