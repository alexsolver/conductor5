#!/usr/bin/env node

/**
 * 🛠️ TRANSLATION IMPLEMENTATION TOOL - Automated Code Transformation
 * 
 * CLEAN ARCHITECTURE COMPLIANCE:
 * - Domain Layer: Translation replacement rules and patterns
 * - Application Layer: Code transformation use cases
 * - Infrastructure Layer: File operations and AST manipulation
 * - Presentation Layer: Progress tracking and reporting
 * 
 * Following 1qa.md standards for enterprise-grade code transformation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Domain Layer - Code Transformation Rules
class TranslationImplementationDomain {
  static TRANSFORMATION_PATTERNS = {
    // JSX text content
    jsxText: {
      pattern: />([^<>{}\n\r]+[a-zA-ZÀ-ÿ][^<>{}\n\r]*)</g,
      replacement: (text, keyMapping) => {
        const key = keyMapping[text.trim()];
        return key ? `>{t('${key}')}` : `>${text}`;
      }
    },

    // String properties in JSX
    stringProps: {
      pattern: /((?:title|placeholder|label|description|text|message|error|success|warning|info|name|aria-label)[\s]*[:=][\s]*)['"`]([^'"`\n\r]{3,})['"`]/g,
      replacement: (propName, text, keyMapping) => {
        const key = keyMapping[text.trim()];
        return key ? `${propName}{t('${key}')}` : `${propName}"${text}"`;
      }
    },

    // Button text
    buttonText: {
      pattern: /(<(?:button|Button)[^>]*>)([^<]+)(<\/(?:button|Button)>)/gi,
      replacement: (openTag, text, closeTag, keyMapping) => {
        const key = keyMapping[text.trim()];
        return key ? `${openTag}{t('${key}')}${closeTag}` : `${openTag}${text}${closeTag}`;
      }
    },

    // Toast messages
    toastMessages: {
      pattern: /(toast[\s]*\([\s]*)['"`]([^'"`\n\r]+)['"`]/g,
      replacement: (toastCall, text, keyMapping) => {
        const key = keyMapping[text.trim()];
        return key ? `${toastCall}t('${key}')` : `${toastCall}"${text}"`;
      }
    }
  };

  static IMPORT_PATTERNS = {
    useTranslation: "import { useTranslation } from 'react-i18next';",
    reactI18next: "import { useTranslation } from 'react-i18next';"
  };

  static isValidForTransformation(filePath) {
    const validExtensions = ['.tsx', '.jsx'];
    const ext = path.extname(filePath);
    return validExtensions.includes(ext) && 
           !filePath.includes('node_modules') && 
           !filePath.includes('.test.') &&
           !filePath.includes('.spec.');
  }
}

// Application Layer - Code Transformation Use Cases
class TranslationImplementationUseCase {
  constructor() {
    this.transformationResults = {
      filesProcessed: 0,
      transformationsApplied: 0,
      importsAdded: 0,
      errors: []
    };
    this.keyMapping = new Map();
  }

  async loadKeyMapping() {
    try {
      const mappingPath = 'translation-key-mapping.json';
      const content = fs.readFileSync(mappingPath, 'utf8');
      const mapping = JSON.parse(content);
      
      // Build reverse mapping: text -> key
      Object.entries(mapping.keys).forEach(([key, data]) => {
        if (data && data.pt) {
          this.keyMapping.set(data.pt, key);
        }
      });

      console.log(`📋 Carregado mapeamento com ${this.keyMapping.size} chaves de tradução`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao carregar mapeamento de chaves:', error.message);
      return false;
    }
  }

  async transformFile(filePath) {
    try {
      console.log(`🔄 Transformando: ${filePath}`);
      
      let content = fs.readFileSync(filePath, 'utf8');
      let transformations = 0;
      let importsAdded = false;

      // Check if useTranslation is already imported
      const hasUseTranslation = content.includes('useTranslation');
      
      // Add useTranslation import if needed
      if (!hasUseTranslation && this.needsTranslation(content)) {
        content = this.addUseTranslationImport(content);
        importsAdded = true;
        this.transformationResults.importsAdded++;
      }

      // Add useTranslation hook if needed
      if (!content.includes('const { t }') && this.needsTranslation(content)) {
        content = this.addUseTranslationHook(content);
      }

      // Apply transformations
      const originalContent = content;
      
      // Transform JSX text content
      content = this.transformJSXText(content);
      
      // Transform string properties
      content = this.transformStringProperties(content);
      
      // Transform button text
      content = this.transformButtonText(content);
      
      // Transform toast messages
      content = this.transformToastMessages(content);

      // Count transformations
      if (content !== originalContent) {
        transformations = this.countTransformations(originalContent, content);
        
        // Write transformed content
        fs.writeFileSync(filePath, content, 'utf8');
        
        this.transformationResults.filesProcessed++;
        this.transformationResults.transformationsApplied += transformations;

        console.log(`✅ ${filePath} - ${transformations} transformações aplicadas`);
        return { success: true, transformations, importsAdded };
      } else {
        console.log(`⏭️  ${filePath} - nenhuma transformação necessária`);
        return { success: true, transformations: 0, importsAdded: false };
      }

    } catch (error) {
      this.transformationResults.errors.push({
        file: filePath,
        error: error.message
      });
      console.error(`❌ Erro transformando ${filePath}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  needsTranslation(content) {
    // Check if content has translatable strings
    const patterns = Object.values(TranslationImplementationDomain.TRANSFORMATION_PATTERNS);
    return patterns.some(pattern => {
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      return regex.test(content);
    });
  }

  addUseTranslationImport(content) {
    // Find existing React imports
    const reactImportMatch = content.match(/import\s+.*from\s+['"]react['"];?/);
    
    if (reactImportMatch) {
      // Add after React import
      const insertIndex = content.indexOf(reactImportMatch[0]) + reactImportMatch[0].length;
      return content.slice(0, insertIndex) + 
             '\n' + TranslationImplementationDomain.IMPORT_PATTERNS.useTranslation + 
             content.slice(insertIndex);
    } else {
      // Add at the beginning
      return TranslationImplementationDomain.IMPORT_PATTERNS.useTranslation + '\n' + content;
    }
  }

  addUseTranslationHook(content) {
    // Find component function declaration
    const functionMatch = content.match(/(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*{|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{)/);
    
    if (functionMatch) {
      const insertIndex = content.indexOf(functionMatch[0]) + functionMatch[0].length;
      const hookDeclaration = '\n  const { t } = useTranslation();\n';
      return content.slice(0, insertIndex) + hookDeclaration + content.slice(insertIndex);
    }
    
    return content;
  }

  transformJSXText(content) {
    const pattern = TranslationImplementationDomain.TRANSFORMATION_PATTERNS.jsxText;
    return content.replace(pattern.pattern, (match, text) => {
      const trimmedText = text.trim();
      if (this.keyMapping.has(trimmedText)) {
        const key = this.keyMapping.get(trimmedText);
        return `>{t('${key}')}`;
      }
      return match;
    });
  }

  transformStringProperties(content) {
    const pattern = TranslationImplementationDomain.TRANSFORMATION_PATTERNS.stringProps;
    return content.replace(pattern.pattern, (match, propName, text) => {
      const trimmedText = text.trim();
      if (this.keyMapping.has(trimmedText)) {
        const key = this.keyMapping.get(trimmedText);
        return `${propName}{t('${key}')}`;
      }
      return match;
    });
  }

  transformButtonText(content) {
    const pattern = TranslationImplementationDomain.TRANSFORMATION_PATTERNS.buttonText;
    return content.replace(pattern.pattern, (match, openTag, text, closeTag) => {
      const trimmedText = text.trim();
      if (this.keyMapping.has(trimmedText)) {
        const key = this.keyMapping.get(trimmedText);
        return `${openTag}{t('${key}')}${closeTag}`;
      }
      return match;
    });
  }

  transformToastMessages(content) {
    const pattern = TranslationImplementationDomain.TRANSFORMATION_PATTERNS.toastMessages;
    return content.replace(pattern.pattern, (match, toastCall, text) => {
      const trimmedText = text.trim();
      if (this.keyMapping.has(trimmedText)) {
        const key = this.keyMapping.get(trimmedText);
        return `${toastCall}t('${key}')`;
      }
      return match;
    });
  }

  countTransformations(original, transformed) {
    // Count instances of t(' to estimate transformations
    const originalTCalls = (original.match(/t\('/g) || []).length;
    const transformedTCalls = (transformed.match(/t\('/g) || []).length;
    return transformedTCalls - originalTCalls;
  }
}

// Infrastructure Layer - File Operations
class TranslationFileOperations {
  static async getHighPriorityFiles() {
    try {
      const reportPath = 'translation-analysis-report.json';
      const content = fs.readFileSync(reportPath, 'utf8');
      const report = JSON.parse(content);
      
      // Get files with most hardcoded texts
      return report.detailedAnalysis
        .filter(file => 
          file.priority === 'HIGH' && 
          TranslationImplementationDomain.isValidForTransformation(file.file)
        )
        .slice(0, 10) // Limit to top 10 for safety
        .map(file => file.file);
    } catch (error) {
      console.error('❌ Erro ao carregar arquivos prioritários:', error.message);
      return [];
    }
  }

  static createBackup(filePath) {
    try {
      const backupDir = 'backups/translation-implementation';
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const backupPath = path.join(backupDir, path.basename(filePath) + '.backup');
      fs.copyFileSync(filePath, backupPath);
      
      return backupPath;
    } catch (error) {
      console.error(`⚠️  Erro criando backup para ${filePath}:`, error.message);
      return null;
    }
  }
}

// Presentation Layer - Implementation Controller
class TranslationImplementationController {
  constructor() {
    this.implementationUseCase = new TranslationImplementationUseCase();
  }

  async execute() {
    console.log('🚀 INICIANDO IMPLEMENTAÇÃO AUTOMÁTICA DE TRADUÇÕES...');
    console.log('📋 Seguindo padrões rigorosos do 1qa.md\n');

    try {
      // Load translation key mapping
      const mappingLoaded = await this.implementationUseCase.loadKeyMapping();
      if (!mappingLoaded) {
        throw new Error('Falha ao carregar mapeamento de chaves de tradução');
      }

      // Get high priority files
      const priorityFiles = await TranslationFileOperations.getHighPriorityFiles();
      console.log(`🎯 Processando ${priorityFiles.length} arquivos de alta prioridade...\n`);

      // Transform each file
      const results = [];
      for (const filePath of priorityFiles) {
        // Create backup before transformation
        const backupPath = TranslationFileOperations.createBackup(filePath);
        
        const result = await this.implementationUseCase.transformFile(filePath);
        results.push({ 
          file: filePath, 
          backup: backupPath,
          ...result 
        });
      }

      // Display results
      this.displayResults(results);

      return {
        success: true,
        ...this.implementationUseCase.transformationResults,
        processedFiles: results
      };

    } catch (error) {
      console.error('❌ Erro durante implementação:', error.message);
      throw error;
    }
  }

  displayResults(results) {
    const stats = this.implementationUseCase.transformationResults;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO DE IMPLEMENTAÇÃO DE TRADUÇÕES');
    console.log('='.repeat(80));
    
    console.log('\n📈 ESTATÍSTICAS:');
    console.log(`   • Arquivos processados: ${stats.filesProcessed}`);
    console.log(`   • Transformações aplicadas: ${stats.transformationsApplied}`);
    console.log(`   • Imports adicionados: ${stats.importsAdded}`);
    console.log(`   • Erros encontrados: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ ERROS:');
      stats.errors.forEach(error => {
        console.log(`   • ${error.file}: ${error.error}`);
      });
    }
    
    console.log('\n✅ ARQUIVOS TRANSFORMADOS:');
    results.forEach(result => {
      if (result.success && result.transformations > 0) {
        console.log(`   ✅ ${result.file} - ${result.transformations} transformações`);
      } else if (result.success) {
        console.log(`   ⏭️  ${result.file} - já traduzido ou sem textos aplicáveis`);
      } else {
        console.log(`   ❌ ${result.file} - erro: ${result.error}`);
      }
    });
    
    console.log('\n🎯 RESULTADOS:');
    console.log('   1. Imports useTranslation adicionados automaticamente');
    console.log('   2. Hooks const { t } = useTranslation() implementados');
    console.log('   3. Textos hardcoded substituídos por t(key)');
    console.log('   4. Backups criados em backups/translation-implementation/');
    
    console.log('\n💾 Sistema de backup:');
    console.log('   • Backups automáticos criados antes de cada transformação');
    console.log('   • Use os backups para reverter se necessário');
    console.log('='.repeat(80));
  }
}

// Execute implementation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const implementationTool = new TranslationImplementationController();
  implementationTool.execute().catch(console.error);
}

export {
  TranslationImplementationController,
  TranslationImplementationDomain,
  TranslationImplementationUseCase,
  TranslationFileOperations
};