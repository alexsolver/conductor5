
import fs from 'fs/promises';
import path from 'path';

interface MissingTranslation {
  key: string;
  language: string;
  file?: string;
  context?: string;
}

interface TranslationAuditReport {
  totalMissingKeys: number;
  missingByLanguage: Record<string, MissingTranslation[]>;
  missingByKey: Record<string, string[]>;
  criticalMissing: MissingTranslation[];
  recommendations: string[];
}

class ComprehensiveTranslationAuditor {
  private readonly SUPPORTED_LANGUAGES = ['en', 'pt-BR', 'es', 'fr', 'de'];
  private readonly TRANSLATIONS_DIR = path.join(process.cwd(), 'client', 'public', 'locales');
  private readonly SOURCE_DIRS = [
    'client/src/components',
    'client/src/pages',
    'client/src/hooks',
    'client/src/utils'
  ];

  private readonly CRITICAL_NAMESPACES = [
    'common',
    'navigation',
    'tickets',
    'forms',
    'errors',
    'buttons'
  ];

  async auditAllTranslations(): Promise<TranslationAuditReport> {
    console.log('🔍 [TRANSLATION-AUDIT] Starting comprehensive translation audit...');
    
    const report: TranslationAuditReport = {
      totalMissingKeys: 0,
      missingByLanguage: {},
      missingByKey: {},
      criticalMissing: [],
      recommendations: []
    };

    // 1. Load all translation files
    const translations = await this.loadAllTranslations();
    
    // 2. Extract all translation keys used in code
    const usedKeys = await this.extractAllUsedTranslationKeys();
    
    // 3. Find missing keys for each language
    for (const language of this.SUPPORTED_LANGUAGES) {
      const languageTranslations = translations[language] || {};
      const missingKeys: MissingTranslation[] = [];
      
      for (const key of usedKeys) {
        if (!this.hasTranslation(languageTranslations, key)) {
          const missing: MissingTranslation = {
            key,
            language,
            context: this.getKeyContext(key)
          };
          
          missingKeys.push(missing);
          
          // Track by key for cross-language analysis
          if (!report.missingByKey[key]) {
            report.missingByKey[key] = [];
          }
          report.missingByKey[key].push(language);
          
          // Mark as critical if it's in a critical namespace
          if (this.isCriticalKey(key)) {
            report.criticalMissing.push(missing);
          }
        }
      }
      
      report.missingByLanguage[language] = missingKeys;
      report.totalMissingKeys += missingKeys.length;
    }

    // 4. Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    // 5. Log detailed report
    this.logDetailedReport(report);

    return report;
  }

  private async loadAllTranslations(): Promise<Record<string, any>> {
    const translations: Record<string, any> = {};
    
    for (const language of this.SUPPORTED_LANGUAGES) {
      try {
        const filePath = path.join(this.TRANSLATIONS_DIR, language, 'translation.json');
        const content = await fs.readFile(filePath, 'utf-8');
        translations[language] = JSON.parse(content);
      } catch (error) {
        console.warn(`⚠️ [TRANSLATION-AUDIT] Could not load ${language} translations:`, (error as Error).message);
        translations[language] = {};
      }
    }
    
    return translations;
  }

  private async extractAllUsedTranslationKeys(): Promise<Set<string>> {
    const keys = new Set<string>();
    
    // Patterns to match translation usage
    const patterns = [
      // Standard t() functions
      /(?:t\(|useTranslation\(\)\.t\(|i18n\.t\()\s*['"`]([^'"`\n]+)['"`]/g,
      
      // JSX props with translations
      /\b(?:title|label|placeholder|text|description|tooltip|aria-label|alt|message|error|success|warning|info)\s*=\s*\{\s*t\(\s*['"`]([^'"`\n]+)['"`]/g,
      
      // Translation keys in objects/configs
      /['"`]([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*?)['"`]\s*:/g,
      
      // Console logs showing missing keys (extract from pattern)
      /missingKey['"`,\s]+['"`,\s]*([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*)/g,
    ];

    for (const sourceDir of this.SOURCE_DIRS) {
      const fullPath = path.join(process.cwd(), sourceDir);
      await this.scanDirectoryForKeys(fullPath, keys, patterns);
    }

    // Add commonly missing keys from console logs
    const commonMissingKeys = [
      'tickets.search_placeholder',
      'tickets.filter_by_status',
      'tickets.filter_by_priority',
      'tickets.clear_filters',
      'common.loading_attachments',
      'common.loading_communications',
      'common.loading_notes',
      'common.loading_history',
      'common.retry',
      'common.creating',
      'common.view',
      'common.close',
      'common.open',
      'common.description',
      'common.use',
      'common.active',
      'common.inactive',
      'common.saving'
    ];

    commonMissingKeys.forEach(key => keys.add(key));

    return keys;
  }

  private async scanDirectoryForKeys(dirPath: string, keys: Set<string>, patterns: RegExp[]): Promise<void> {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);

        if (item.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(item.name)) {
          await this.scanDirectoryForKeys(itemPath, keys, patterns);
        } else if (item.isFile() && /\.(tsx?|jsx?|vue|svelte)$/.test(item.name)) {
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
            console.warn(`⚠️ [TRANSLATION-AUDIT] Could not read file ${itemPath}:`, (fileError as Error).message);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ [TRANSLATION-AUDIT] Could not scan directory ${dirPath}:`, (error as Error).message);
    }
  }

  private isValidTranslationKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    
    const trimmedKey = key.trim();
    if (trimmedKey.length < 1) return false;

    // Exclude obvious technical patterns
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

  private hasTranslation(translations: any, key: string): boolean {
    const keyParts = key.split('.');
    let current = translations;

    for (const part of keyParts) {
      if (!current || typeof current !== 'object' || !(part in current)) {
        return false;
      }
      current = current[part];
    }

    return current !== undefined && current !== null;
  }

  private getKeyContext(key: string): string {
    const namespace = key.split('.')[0];
    
    const contextMap: Record<string, string> = {
      'common': 'Common UI elements',
      'navigation': 'Navigation menu items',
      'tickets': 'Ticket management system',
      'forms': 'Form fields and validation',
      'errors': 'Error messages',
      'success': 'Success messages',
      'buttons': 'Button labels',
      'modals': 'Modal dialogs',
      'placeholders': 'Input placeholders',
      'messages': 'User messages',
      'userManagement': 'User management system',
      'TranslationManager': 'Translation management tool'
    };

    return contextMap[namespace] || `${namespace} module`;
  }

  private isCriticalKey(key: string): boolean {
    const namespace = key.split('.')[0];
    return this.CRITICAL_NAMESPACES.includes(namespace);
  }

  private generateRecommendations(report: TranslationAuditReport): string[] {
    const recommendations: string[] = [];

    // 1. Most missing languages
    const languagesByMissingCount = Object.entries(report.missingByLanguage)
      .sort(([,a], [,b]) => b.length - a.length);

    if (languagesByMissingCount.length > 0) {
      recommendations.push(`Priority language to fix: ${languagesByMissingCount[0][0]} (${languagesByMissingCount[0][1].length} missing keys)`);
    }

    // 2. Most common missing keys
    const keysByMissingLanguages = Object.entries(report.missingByKey)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 5);

    if (keysByMissingLanguages.length > 0) {
      recommendations.push(`Most common missing keys: ${keysByMissingLanguages.map(([key, langs]) => `${key} (${langs.length} languages)`).join(', ')}`);
    }

    // 3. Critical missing keys
    if (report.criticalMissing.length > 0) {
      recommendations.push(`Critical missing translations: ${report.criticalMissing.length} keys need immediate attention`);
    }

    // 4. Completion percentage
    const totalPossibleKeys = Object.keys(report.missingByKey).length * this.SUPPORTED_LANGUAGES.length;
    const completionPercentage = totalPossibleKeys > 0 ? 
      ((totalPossibleKeys - report.totalMissingKeys) / totalPossibleKeys * 100).toFixed(1) : 100;
    
    recommendations.push(`Overall translation completion: ${completionPercentage}%`);

    return recommendations;
  }

  private logDetailedReport(report: TranslationAuditReport): void {
    console.log('\n🎯 [TRANSLATION-AUDIT] === COMPREHENSIVE AUDIT REPORT ===');
    console.log(`📊 Total missing keys: ${report.totalMissingKeys}`);
    
    console.log('\n📋 Missing keys by language:');
    for (const [language, missing] of Object.entries(report.missingByLanguage)) {
      console.log(`  ${language}: ${missing.length} missing keys`);
      if (missing.length > 0) {
        console.log(`    First 5: ${missing.slice(0, 5).map(m => m.key).join(', ')}`);
      }
    }

    console.log('\n🔥 Most problematic keys (missing in multiple languages):');
    const sortedKeys = Object.entries(report.missingByKey)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 10);
    
    for (const [key, languages] of sortedKeys) {
      console.log(`  ${key}: missing in ${languages.join(', ')}`);
    }

    console.log('\n⚠️ Critical missing translations:');
    const criticalByLanguage = report.criticalMissing.reduce((acc, missing) => {
      if (!acc[missing.language]) acc[missing.language] = [];
      acc[missing.language].push(missing.key);
      return acc;
    }, {} as Record<string, string[]>);

    for (const [language, keys] of Object.entries(criticalByLanguage)) {
      console.log(`  ${language}: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? ` (and ${keys.length - 5} more)` : ''}`);
    }

    console.log('\n💡 Recommendations:');
    for (const recommendation of report.recommendations) {
      console.log(`  • ${recommendation}`);
    }

    console.log('\n✅ [TRANSLATION-AUDIT] Audit complete!');
  }

  async generateFixScript(): Promise<void> {
    console.log('🔧 [TRANSLATION-AUDIT] Generating automatic fix script...');
    
    const report = await this.auditAllTranslations();
    
    // Generate missing translations for each language
    for (const [language, missingKeys] of Object.entries(report.missingByLanguage)) {
      if (missingKeys.length === 0) continue;

      console.log(`\n🔨 [TRANSLATION-AUDIT] Generating fixes for ${language}...`);
      
      const filePath = path.join(this.TRANSLATIONS_DIR, language, 'translation.json');
      
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const translations = JSON.parse(content);
        
        let addedCount = 0;
        
        for (const missing of missingKeys) {
          if (this.addTranslationKey(translations, missing.key, missing.key)) {
            addedCount++;
          }
        }
        
        // Write back the updated translations
        await fs.writeFile(filePath, JSON.stringify(translations, null, 2));
        console.log(`✅ [TRANSLATION-AUDIT] Added ${addedCount} missing keys to ${language}`);
        
      } catch (error) {
        console.error(`❌ [TRANSLATION-AUDIT] Error fixing ${language}:`, error);
      }
    }
  }

  private addTranslationKey(translations: any, key: string, defaultValue: string): boolean {
    const keyParts = key.split('.');
    let current = translations;

    // Navigate to the parent object
    for (let i = 0; i < keyParts.length - 1; i++) {
      const part = keyParts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    // Add the final key if it doesn't exist
    const finalKey = keyParts[keyParts.length - 1];
    if (!current[finalKey]) {
      current[finalKey] = defaultValue;
      return true;
    }

    return false;
  }
}

// Execute audit
const auditor = new ComprehensiveTranslationAuditor();

async function runAudit() {
  try {
    const report = await auditor.auditAllTranslations();
    
    // Save report to file
    const reportPath = path.join(process.cwd(), 'translation-audit-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 [TRANSLATION-AUDIT] Report saved to: ${reportPath}`);
    
    // Generate fix script if needed
    if (report.totalMissingKeys > 0) {
      await auditor.generateFixScript();
    }
    
  } catch (error) {
    console.error('❌ [TRANSLATION-AUDIT] Audit failed:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAudit();
}

export { ComprehensiveTranslationAuditor, type TranslationAuditReport };
