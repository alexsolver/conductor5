#!/usr/bin/env node

/**
 * 🔧 TRANSLATION MIGRATION TOOL - Automated i18n Implementation
 * 
 * CLEAN ARCHITECTURE COMPLIANCE:
 * - Domain Layer: Translation key generation rules and validation
 * - Application Layer: Migration use cases and orchestration
 * - Infrastructure Layer: File system operations and key management
 * - Presentation Layer: Progress reporting and user interaction
 * 
 * Following 1qa.md standards for enterprise-grade migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Domain Layer - Translation Business Rules
class TranslationKeyDomain {
  static KEY_PATTERNS = {
    // Generate semantic keys based on context
    buttons: (text) => `buttons.${this.sanitizeKey(text)}`,
    labels: (text) => `labels.${this.sanitizeKey(text)}`,
    messages: (text) => `messages.${this.sanitizeKey(text)}`,
    titles: (text) => `titles.${this.sanitizeKey(text)}`,
    descriptions: (text) => `descriptions.${this.sanitizeKey(text)}`,
    placeholders: (text) => `placeholders.${this.sanitizeKey(text)}`,
    errors: (text) => `errors.${this.sanitizeKey(text)}`,
    success: (text) => `success.${this.sanitizeKey(text)}`,
    warnings: (text) => `warnings.${this.sanitizeKey(text)}`,
    navigation: (text) => `navigation.${this.sanitizeKey(text)}`,
    actions: (text) => `actions.${this.sanitizeKey(text)}`,
    status: (text) => `status.${this.sanitizeKey(text)}`,
    forms: (text) => `forms.${this.sanitizeKey(text)}`,
    tables: (text) => `tables.${this.sanitizeKey(text)}`,
    modals: (text) => `modals.${this.sanitizeKey(text)}`
  };

  static sanitizeKey(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50); // Limit key length
  }

  static categorizeText(text, context = '') {
    const lowerText = text.toLowerCase();
    const lowerContext = context.toLowerCase();
    
    // Button patterns
    if (lowerContext.includes('button') || 
        ['save', 'cancel', 'submit', 'delete', 'edit', 'create', 'update'].includes(lowerText)) {
      return 'buttons';
    }
    
    // Error patterns
    if (lowerContext.includes('error') || lowerText.includes('error') || 
        lowerText.includes('failed') || lowerText.includes('invalid')) {
      return 'errors';
    }
    
    // Success patterns
    if (lowerContext.includes('success') || lowerText.includes('success') || 
        lowerText.includes('successfully') || lowerText.includes('completed')) {
      return 'success';
    }
    
    // Placeholder patterns
    if (lowerContext.includes('placeholder') || lowerText.startsWith('enter ') || 
        lowerText.startsWith('select ') || lowerText.startsWith('choose ')) {
      return 'placeholders';
    }
    
    // Title patterns
    if (lowerContext.includes('title') || lowerContext.includes('heading') ||
        text === text.toUpperCase() || /^[A-Z][a-z\s]+$/.test(text)) {
      return 'titles';
    }
    
    // Label patterns
    if (lowerContext.includes('label') || text.endsWith(':')) {
      return 'labels';
    }
    
    // Navigation patterns
    if (lowerContext.includes('nav') || lowerContext.includes('menu') ||
        ['dashboard', 'settings', 'profile', 'admin', 'tickets'].includes(lowerText)) {
      return 'navigation';
    }
    
    // Modal patterns
    if (lowerContext.includes('modal') || lowerContext.includes('dialog')) {
      return 'modals';
    }
    
    // Form patterns
    if (lowerContext.includes('form') || lowerContext.includes('input')) {
      return 'forms';
    }
    
    // Table patterns
    if (lowerContext.includes('table') || lowerContext.includes('column') ||
        lowerContext.includes('header')) {
      return 'tables';
    }
    
    // Default to messages
    return 'messages';
  }

  static generateKey(text, context = '') {
    const category = this.categorizeText(text, context);
    return this.KEY_PATTERNS[category](text);
  }

  static isValidTranslationText(text) {
    // Filter criteria for valid translation texts
    return text &&
           text.length >= 2 &&
           text.length <= 200 &&
           /[a-zA-ZÀ-ÿ]/.test(text) && // Contains letters
           !this.isExcludedText(text);
  }

  static isExcludedText(text) {
    const excludePatterns = [
      /^[A-Z_]+$/, // ALL_CAPS constants
      /^[a-z][a-zA-Z0-9]*$/, // camelCase variables
      /^\d+$/, // Pure numbers
      /^[a-f0-9-]{8,}$/, // UUIDs or hashes
      /^https?:\/\//, // URLs
      /^[/.#@]/, // CSS selectors, paths
      /^(true|false|null|undefined)$/, // Boolean/null values
      /^(px|em|rem|%|vh|vw)$/, // CSS units
      /^[A-Z]{2,}(_[A-Z]{2,})*$/, // API constants
      /^\$[a-zA-Z]/, // Variables starting with $
      /^[{}[\](),.;:!?]+$/, // Pure punctuation
      /^(div|span|button|input|select|option|form|table|tr|td|th)$/i, // HTML tags
      /^(className|onClick|onChange|onSubmit|value|type|id)$/i, // React props
    ];

    return excludePatterns.some(pattern => pattern.test(text));
  }
}

// Application Layer - Migration Use Cases
class TranslationMigrationUseCase {
  constructor() {
    this.translationKeys = new Map();
    this.migrationProgress = {
      filesProcessed: 0,
      keysGenerated: 0,
      filesModified: 0,
      errors: []
    };
  }

  async migrateFile(filePath, reportData) {
    try {
      console.log(`🔄 Processando: ${filePath}`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const fileData = reportData.find(f => f.file === filePath);
      
      if (!fileData || fileData.hardcodedTexts === 0) {
        return { modified: false, keys: 0 };
      }

      // Extract hardcoded texts directly from file content
      const extractedTexts = this.extractHardcodedTextsFromContent(content);
      
      if (!extractedTexts.length) {
        return { modified: false, keys: 0 };
      }

      // Generate translation keys for this file
      const generatedKeys = this.generateKeysForFile(filePath, extractedTexts);
      
      // Add to global key collection
      generatedKeys.forEach((translation, key) => {
        this.translationKeys.set(key, translation);
      });

      this.migrationProgress.filesProcessed++;
      this.migrationProgress.keysGenerated += generatedKeys.size;

      return { 
        modified: true, 
        keys: generatedKeys.size,
        generatedKeys: Array.from(generatedKeys.keys()),
        extractedTexts: extractedTexts.length
      };

    } catch (error) {
      this.migrationProgress.errors.push({
        file: filePath,
        error: error.message
      });
      console.error(`❌ Erro processando ${filePath}:`, error.message);
      return { modified: false, keys: 0, error: error.message };
    }
  }

  extractHardcodedTextsFromContent(content) {
    const patterns = {
      // JSX text content (between tags)
      jsxText: />([^<>{}\n\r]+[a-zA-ZÀ-ÿ][^<>{}\n\r]*)</g,
      
      // String properties in JSX and objects
      stringProps: /(?:title|placeholder|label|description|text|message|error|success|warning|info|name|aria-label)[\s]*[:=][\s]*['"`]([^'"`\n\r]{3,})['"`]/g,
      
      // Button and UI text
      buttonText: /<(?:button|Button)[^>]*>([^<]+)</gi,
      
      // Form labels and inputs
      labelText: /<(?:label|Label)[^>]*>([^<]+)</gi,
      
      // Toast and notification messages
      toastMessages: /toast[\s]*\([\s]*['"`]([^'"`\n\r]+)['"`]/g,
      
      // Error and success messages
      errorMessages: /(?:error|Error|ERROR|success|Success|SUCCESS)[\s]*[:=][\s]*['"`]([^'"`\n\r]{3,})['"`]/g,
      
      // Modal and dialog titles
      modalTitles: /(?:title|Title|TITLE)[\s]*[:=][\s]*['"`]([^'"`\n\r]{3,})['"`]/g,
      
      // String literals that look like UI text
      uiStrings: /['"`]([A-Z][a-zA-ZÀ-ÿ\s]{2,30})['"`]/g,
      
      // Portuguese text patterns
      portugueseText: /['"`]([a-zA-ZÀ-ÿ\s]{5,}(?:ção|ade|ment|izar|áti|õe|ndo)[a-zA-ZÀ-ÿ\s]*)['"`]/g
    };

    const extractedTexts = new Set();

    // Extract texts using all patterns
    Object.entries(patterns).forEach(([patternName, pattern]) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(content)) !== null) {
        const text = match[1]?.trim();
        if (text && this.isValidUIText(text)) {
          extractedTexts.add(text);
        }
      }
    });

    return Array.from(extractedTexts);
  }

  isValidUIText(text) {
    // Enhanced validation for UI text
    return text &&
           text.length >= 3 &&
           text.length <= 100 &&
           /[a-zA-ZÀ-ÿ]/.test(text) && // Contains letters
           !this.isExcludedUIText(text) &&
           !this.isCodeOrTechnical(text);
  }

  isExcludedUIText(text) {
    const excludePatterns = [
      /^[A-Z_]+$/, // ALL_CAPS constants
      /^[a-z][a-zA-Z0-9]*$/, // camelCase variables
      /^\d+$/, // Pure numbers
      /^[a-f0-9-]{8,}$/, // UUIDs or hashes
      /^https?:\/\//, // URLs
      /^[/.#@]/, // CSS selectors, paths
      /^(true|false|null|undefined)$/, // Boolean/null values
      /^(px|em|rem|%|vh|vw|auto|none|inherit)$/, // CSS units
      /^[A-Z]{2,}(_[A-Z]{2,})*$/, // API constants
      /^\$[a-zA-Z]/, // Variables starting with $
      /^[{}[\](),.;:!?]+$/, // Pure punctuation
      /^(div|span|button|input|select|option|form|table|tr|td|th|img|a|p|h[1-6])$/i, // HTML tags
      /^(className|onClick|onChange|onSubmit|value|type|id|key|ref|style)$/i, // React props
      /^(GET|POST|PUT|DELETE|PATCH)$/i, // HTTP methods
      /^(\d{4}-\d{2}-\d{2}|\d{2}:\d{2}:\d{2})/, // Dates and times
    ];

    return excludePatterns.some(pattern => pattern.test(text));
  }

  isCodeOrTechnical(text) {
    // Check if text looks like code, filenames, or technical terms
    const technicalPatterns = [
      /\.(tsx?|jsx?|css|html|json|md)$/i, // File extensions
      /^[a-z]+([A-Z][a-z]*)+$/, // PascalCase
      /^[a-z]+(_[a-z]+)+$/, // snake_case
      /^[a-z]+-[a-z-]+$/, // kebab-case
      /\bfunction\b|\bconst\b|\blet\b|\bvar\b|\breturn\b/i, // Code keywords
      /^\w+\(\)$/, // Function calls
      /^[A-Z][a-z]*[A-Z]/, // Likely component names
      /^use[A-Z]/, // React hooks
      /^\d+[a-z]+$/, // Numbers with units
    ];

    return technicalPatterns.some(pattern => pattern.test(text));
  }

  generateKeysForFile(filePath, hardcodedTexts) {
    const keys = new Map();
    const context = this.getFileContext(filePath);
    
    // Process each hardcoded text
    hardcodedTexts.forEach(text => {
      if (TranslationKeyDomain.isValidTranslationText(text)) {
        const key = TranslationKeyDomain.generateKey(text, context);
        
        // Ensure unique keys
        let finalKey = key;
        let counter = 1;
        while (keys.has(finalKey) || this.translationKeys.has(finalKey)) {
          finalKey = `${key}_${counter}`;
          counter++;
        }
        
        keys.set(finalKey, {
          pt: text, // Original Portuguese text
          en: text, // Will need translation
          es: text, // Will need translation
          fr: text, // Will need translation
          de: text, // Will need translation
          context: context,
          file: filePath,
          category: TranslationKeyDomain.categorizeText(text, context)
        });
      }
    });

    return keys;
  }

  getFileContext(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    const dirName = path.dirname(filePath).split('/').pop();
    
    return `${dirName}/${fileName}`;
  }

  async generateTranslationFiles() {
    console.log('\n📝 Gerando arquivos de tradução...');
    
    const translations = {
      'pt-BR': {},
      'en': {},
      'es': {},
      'fr': {},
      'de': {}
    };

    // Organize keys by category
    const categories = {};
    
    this.translationKeys.forEach((translation, key) => {
      const category = translation.category;
      
      if (!categories[category]) {
        categories[category] = {};
      }
      
      const keyParts = key.split('.');
      const categoryKey = keyParts.slice(1).join('.');
      
      categories[category][categoryKey] = translation.pt;
    });

    // Build nested translation objects
    Object.keys(translations).forEach(lang => {
      Object.keys(categories).forEach(category => {
        translations[lang][category] = categories[category];
      });
    });

    return translations;
  }
}

// Infrastructure Layer - File Operations
class TranslationFileRepository {
  static async loadReportData() {
    try {
      const reportPath = 'translation-analysis-report.json';
      const content = fs.readFileSync(reportPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load analysis report: ${error.message}`);
    }
  }

  static async saveTranslationFiles(translations) {
    const localesDir = 'client/src/i18n/locales';
    
    // Ensure directory exists
    if (!fs.existsSync(localesDir)) {
      fs.mkdirSync(localesDir, { recursive: true });
    }

    // Load existing translations to merge
    const existingTranslations = {};
    
    Object.keys(translations).forEach(lang => {
      const langFile = path.join(localesDir, `${lang}.json`);
      if (fs.existsSync(langFile)) {
        try {
          existingTranslations[lang] = JSON.parse(fs.readFileSync(langFile, 'utf8'));
        } catch (error) {
          existingTranslations[lang] = {};
        }
      } else {
        existingTranslations[lang] = {};
      }
    });

    // Merge with existing translations
    Object.keys(translations).forEach(lang => {
      const merged = this.deepMerge(existingTranslations[lang], translations[lang]);
      const langFile = path.join(localesDir, `${lang}.json`);
      
      fs.writeFileSync(langFile, JSON.stringify(merged, null, 2), 'utf8');
      console.log(`✅ ${lang}.json atualizado com ${Object.keys(translations[lang]).length} categorias`);
    });
  }

  static deepMerge(target, source) {
    const result = { ...target };
    
    Object.keys(source).forEach(key => {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  }

  static async saveKeyMappingFile(keys) {
    const mappingFile = 'translation-key-mapping.json';
    const mapping = {
      timestamp: new Date().toISOString(),
      totalKeys: keys.size,
      keys: Object.fromEntries(keys)
    };
    
    fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2), 'utf8');
    console.log(`📋 Mapeamento de chaves salvo em: ${mappingFile}`);
  }
}

// Presentation Layer - Migration Controller
class TranslationMigrationController {
  constructor() {
    this.migrationUseCase = new TranslationMigrationUseCase();
  }

  async execute() {
    console.log('🚀 INICIANDO MIGRAÇÃO AUTOMÁTICA DE TRADUÇÕES...');
    console.log('📋 Seguindo padrões rigorosos do 1qa.md\n');

    try {
      // Load analysis report
      const reportData = await TranslationFileRepository.loadReportData();
      console.log(`📊 Carregado relatório com ${reportData.detailedAnalysis.length} arquivos para migração`);

      // Process high priority files first
      const highPriorityFiles = reportData.detailedAnalysis
        .filter(f => f.priority === 'HIGH')
        .slice(0, 20); // Limit to top 20 for initial migration

      console.log(`🎯 Processando ${highPriorityFiles.length} arquivos de alta prioridade...\n`);

      // Migrate each file
      const results = [];
      for (const fileData of highPriorityFiles) {
        const result = await this.migrationUseCase.migrateFile(fileData.file, reportData.detailedAnalysis);
        results.push({ file: fileData.file, ...result });
      }

      // Generate translation files
      const translations = await this.migrationUseCase.generateTranslationFiles();
      await TranslationFileRepository.saveTranslationFiles(translations);

      // Save key mapping for developers
      await TranslationFileRepository.saveKeyMappingFile(this.migrationUseCase.translationKeys);

      // Display results
      this.displayResults(results);

      return {
        success: true,
        ...this.migrationUseCase.migrationProgress,
        translations
      };

    } catch (error) {
      console.error('❌ Erro durante migração:', error.message);
      throw error;
    }
  }

  displayResults(results) {
    const progress = this.migrationUseCase.migrationProgress;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO DE MIGRAÇÃO DE TRADUÇÕES');
    console.log('='.repeat(80));
    
    console.log('\n📈 ESTATÍSTICAS:');
    console.log(`   • Arquivos processados: ${progress.filesProcessed}`);
    console.log(`   • Chaves geradas: ${progress.keysGenerated}`);
    console.log(`   • Arquivos modificados: ${progress.filesModified}`);
    console.log(`   • Erros encontrados: ${progress.errors.length}`);
    
    if (progress.errors.length > 0) {
      console.log('\n❌ ERROS:');
      progress.errors.forEach(error => {
        console.log(`   • ${error.file}: ${error.error}`);
      });
    }
    
    console.log('\n✅ ARQUIVOS PROCESSADOS:');
    results.forEach(result => {
      if (result.modified) {
        console.log(`   ✅ ${result.file} - ${result.keys} chaves geradas`);
      } else {
        console.log(`   ⏭️  ${result.file} - pulado ${result.error ? '(erro)' : '(sem textos)'}`);
      }
    });
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Revisar arquivos de tradução gerados em client/src/i18n/locales/');
    console.log('   2. Implementar useTranslation nos componentes com mais textos hardcoded');
    console.log('   3. Substituir textos hardcoded por chamadas t(key)');
    console.log('   4. Solicitar traduções para outros idiomas');
    
    console.log('\n💾 Arquivos gerados:');
    console.log('   • translation-key-mapping.json (mapeamento completo)');
    console.log('   • client/src/i18n/locales/*.json (arquivos de tradução)');
    console.log('='.repeat(80));
  }
}

// Execute migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrationTool = new TranslationMigrationController();
  migrationTool.execute().catch(console.error);
}

export {
  TranslationMigrationController,
  TranslationKeyDomain,
  TranslationMigrationUseCase,
  TranslationFileRepository
};