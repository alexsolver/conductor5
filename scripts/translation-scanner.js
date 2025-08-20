#!/usr/bin/env node

/**
 * 🔍 TRANSLATION SCANNER - Complete Analysis Tool
 * 
 * CLEAN ARCHITECTURE COMPLIANCE:
 * - Domain Layer: Pure scanning logic without external dependencies
 * - Application Layer: Translation analysis use cases
 * - Infrastructure Layer: File system operations
 * - Presentation Layer: Report generation and output
 * 
 * Following 1qa.md standards for enterprise-grade analysis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TranslationScannerDomain {
  static TRANSLATION_PATTERNS = {
    // React i18next patterns
    useTranslation: /useTranslation\(\)/g,
    tFunction: /\bt\(['"`]([^'"`]+)['"`]\)/g,
    tFunctionTemplate: /\bt\(`([^`]+)`\)/g,
    
    // Hardcoded text patterns (excluding JSX props and common words)
    hardcodedStrings: /(?:title|placeholder|label|description|text|message|error|success|warning|info)[\s]*[:=][\s]*['"`]([^'"`\n\r]{3,})['"`]/g,
    
    // JSX Text content
    jsxText: />([^<>{}\n\r]+[a-zA-ZÀ-ÿ][^<>{}\n\r]*)</g,
    
    // String literals in quotes (potential hardcoded text)
    stringLiterals: /['"`]([^'"`\n\r]{10,})['"`]/g,
    
    // Toast messages and notifications
    toastMessages: /toast\s*\(\s*\{[^}]*['"`]([^'"`]+)['"`]/g,
    
    // Error messages
    errorMessages: /(?:error|Error|ERROR)[\s]*[:=][\s]*['"`]([^'"`\n\r]+)['"`]/g,
    
    // Button text and labels
    buttonText: /<(?:button|Button)[^>]*>([^<]+)</g,
    
    // Modal and dialog titles
    modalTitles: /(?:title|Title|TITLE)[\s]*[:=][\s]*['"`]([^'"`\n\r]+)['"`]/g
  };

  static FILE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];
  static EXCLUDE_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.cache',
    'coverage',
    '.vscode',
    '.replit'
  ];
}

class TranslationAnalysisUseCase {
  constructor() {
    this.results = {
      translationKeys: new Set(),
      hardcodedTexts: new Set(),
      fileAnalysis: [],
      statistics: {
        filesScanned: 0,
        translationKeysFound: 0,
        hardcodedTextsFound: 0,
        translatedFiles: 0,
        untranslatedFiles: 0
      }
    };
  }

  analyzeFile(filePath, content) {
    const analysis = {
      filePath,
      translationKeys: [],
      hardcodedTexts: [],
      hasTranslations: false,
      translationCoverage: 0
    };

    // Extract translation keys
    this.extractTranslationKeys(content, analysis);
    
    // Extract hardcoded texts
    this.extractHardcodedTexts(content, analysis);
    
    // Calculate coverage
    const totalTexts = analysis.translationKeys.length + analysis.hardcodedTexts.length;
    analysis.translationCoverage = totalTexts > 0 
      ? (analysis.translationKeys.length / totalTexts) * 100 
      : 0;

    analysis.hasTranslations = analysis.translationKeys.length > 0;

    return analysis;
  }

  extractTranslationKeys(content, analysis) {
    const patterns = TranslationScannerDomain.TRANSLATION_PATTERNS;
    
    // Extract t() function calls
    let match;
    
    // Regular t('key') pattern
    while ((match = patterns.tFunction.exec(content)) !== null) {
      const key = match[1];
      analysis.translationKeys.push(key);
      this.results.translationKeys.add(key);
    }
    
    // Template t(`key`) pattern
    while ((match = patterns.tFunctionTemplate.exec(content)) !== null) {
      const key = match[1];
      analysis.translationKeys.push(key);
      this.results.translationKeys.add(key);
    }
  }

  extractHardcodedTexts(content, analysis) {
    const patterns = TranslationScannerDomain.TRANSLATION_PATTERNS;
    
    // Extract various hardcoded text patterns
    this.extractPattern(content, patterns.hardcodedStrings, analysis.hardcodedTexts);
    this.extractPattern(content, patterns.jsxText, analysis.hardcodedTexts);
    this.extractPattern(content, patterns.toastMessages, analysis.hardcodedTexts);
    this.extractPattern(content, patterns.errorMessages, analysis.hardcodedTexts);
    this.extractPattern(content, patterns.buttonText, analysis.hardcodedTexts);
    this.extractPattern(content, patterns.modalTitles, analysis.hardcodedTexts);
    
    // Filter out common technical terms and variable names
    analysis.hardcodedTexts = analysis.hardcodedTexts.filter(text => 
      this.isLikelyHumanReadableText(text)
    );
  }

  extractPattern(content, pattern, collection) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    
    while ((match = regex.exec(content)) !== null) {
      const text = match[1]?.trim();
      if (text && text.length > 2) {
        collection.push(text);
        this.results.hardcodedTexts.add(text);
      }
    }
  }

  isLikelyHumanReadableText(text) {
    // Filter out technical terms, variable names, and non-translatable content
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
    ];

    return !excludePatterns.some(pattern => pattern.test(text)) && 
           text.length >= 3 && 
           /[a-zA-ZÀ-ÿ]/.test(text); // Contains letters
  }

  updateStatistics() {
    this.results.statistics.translationKeysFound = this.results.translationKeys.size;
    this.results.statistics.hardcodedTextsFound = this.results.hardcodedTexts.size;
    this.results.statistics.translatedFiles = this.results.fileAnalysis.filter(f => f.hasTranslations).length;
    this.results.statistics.untranslatedFiles = this.results.fileAnalysis.filter(f => !f.hasTranslations && f.hardcodedTexts.length > 0).length;
  }
}

class FileSystemRepository {
  static isValidFile(filePath) {
    const ext = path.extname(filePath);
    return TranslationScannerDomain.FILE_EXTENSIONS.includes(ext);
  }

  static shouldExclude(filePath) {
    return TranslationScannerDomain.EXCLUDE_PATTERNS.some(pattern => 
      filePath.includes(pattern)
    );
  }

  static scanDirectory(dirPath, fileList = []) {
    if (!fs.existsSync(dirPath)) return fileList;
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      
      if (this.shouldExclude(fullPath)) continue;
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.scanDirectory(fullPath, fileList);
      } else if (this.isValidFile(fullPath)) {
        fileList.push(fullPath);
      }
    }
    
    return fileList;
  }

  static readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
      return '';
    }
  }
}

class TranslationReportGenerator {
  static generateReport(analysisResults) {
    const { fileAnalysis, statistics, translationKeys, hardcodedTexts } = analysisResults;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(statistics),
      detailedAnalysis: this.generateDetailedAnalysis(fileAnalysis),
      translationKeys: Array.from(translationKeys).sort(),
      hardcodedTexts: Array.from(hardcodedTexts).sort(),
      recommendations: this.generateRecommendations(statistics, fileAnalysis),
      coverageReport: this.generateCoverageReport(fileAnalysis)
    };

    return report;
  }

  static generateSummary(stats) {
    return {
      totalFiles: stats.filesScanned,
      translationKeysFound: stats.translationKeysFound,
      hardcodedTextsFound: stats.hardcodedTextsFound,
      translatedFiles: stats.translatedFiles,
      untranslatedFiles: stats.untranslatedFiles,
      overallCoverage: stats.filesScanned > 0 
        ? ((stats.translatedFiles / stats.filesScanned) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  static generateDetailedAnalysis(fileAnalysis) {
    return fileAnalysis
      .filter(file => file.hardcodedTexts.length > 0 || file.translationKeys.length > 0)
      .sort((a, b) => b.hardcodedTexts.length - a.hardcodedTexts.length)
      .map(file => ({
        file: file.filePath,
        translationCoverage: file.translationCoverage.toFixed(1) + '%',
        translationKeys: file.translationKeys.length,
        hardcodedTexts: file.hardcodedTexts.length,
        priority: file.hardcodedTexts.length > 10 ? 'HIGH' : 
                 file.hardcodedTexts.length > 5 ? 'MEDIUM' : 'LOW'
      }));
  }

  static generateRecommendations(stats, fileAnalysis) {
    const recommendations = [];
    
    if (stats.hardcodedTextsFound > 0) {
      recommendations.push({
        type: 'CRITICAL',
        message: `Found ${stats.hardcodedTextsFound} hardcoded texts that should be moved to translation files`
      });
    }
    
    const highPriorityFiles = fileAnalysis.filter(f => f.hardcodedTexts.length > 10);
    if (highPriorityFiles.length > 0) {
      recommendations.push({
        type: 'HIGH',
        message: `${highPriorityFiles.length} files have more than 10 hardcoded texts and need immediate attention`
      });
    }
    
    const untranslatedComponents = fileAnalysis.filter(f => 
      f.hardcodedTexts.length > 0 && f.translationKeys.length === 0
    );
    if (untranslatedComponents.length > 0) {
      recommendations.push({
        type: 'MEDIUM',
        message: `${untranslatedComponents.length} components have no translations implemented`
      });
    }
    
    return recommendations;
  }

  static generateCoverageReport(fileAnalysis) {
    const coverageRanges = {
      '0%': 0,
      '1-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-99%': 0,
      '100%': 0
    };
    
    fileAnalysis.forEach(file => {
      const coverage = file.translationCoverage;
      if (coverage === 0) coverageRanges['0%']++;
      else if (coverage <= 25) coverageRanges['1-25%']++;
      else if (coverage <= 50) coverageRanges['26-50%']++;
      else if (coverage <= 75) coverageRanges['51-75%']++;
      else if (coverage < 100) coverageRanges['76-99%']++;
      else coverageRanges['100%']++;
    });
    
    return coverageRanges;
  }
}

// Main Scanner Controller
class TranslationScannerController {
  constructor() {
    this.analysisUseCase = new TranslationAnalysisUseCase();
  }

  async execute(targetDirectory = './client/src') {
    console.log('🔍 INICIANDO ESCANEAMENTO COMPLETO DE TRADUÇÕES...');
    console.log('📋 Seguindo padrões rigorosos do 1qa.md\n');
    
    try {
      // Scan all files following Clean Architecture patterns
      const files = FileSystemRepository.scanDirectory(targetDirectory);
      console.log(`📁 Encontrados ${files.length} arquivos para análise\n`);
      
      // Analyze each file
      for (const filePath of files) {
        const content = FileSystemRepository.readFile(filePath);
        if (content) {
          const analysis = this.analysisUseCase.analyzeFile(filePath, content);
          this.analysisUseCase.results.fileAnalysis.push(analysis);
          this.analysisUseCase.results.statistics.filesScanned++;
        }
      }
      
      // Update statistics
      this.analysisUseCase.updateStatistics();
      
      // Generate comprehensive report
      const report = TranslationReportGenerator.generateReport(this.analysisUseCase.results);
      
      // Output results
      this.displayResults(report);
      
      // Save detailed report
      this.saveDetailedReport(report);
      
      return report;
      
    } catch (error) {
      console.error('❌ Erro durante o escaneamento:', error.message);
      throw error;
    }
  }

  displayResults(report) {
    console.log('=' .repeat(80));
    console.log('📊 RELATÓRIO DE ANÁLISE DE TRADUÇÕES');
    console.log('=' .repeat(80));
    
    console.log('\n📈 RESUMO EXECUTIVO:');
    console.log(`   • Arquivos escaneados: ${report.summary.totalFiles}`);
    console.log(`   • Chaves de tradução encontradas: ${report.summary.translationKeysFound}`);
    console.log(`   • Textos hardcoded encontrados: ${report.summary.hardcodedTextsFound}`);
    console.log(`   • Arquivos com traduções: ${report.summary.translatedFiles}`);
    console.log(`   • Arquivos sem traduções: ${report.summary.untranslatedFiles}`);
    console.log(`   • Cobertura geral: ${report.summary.overallCoverage}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n🎯 RECOMENDAÇÕES PRIORITÁRIAS:');
      report.recommendations.forEach(rec => {
        console.log(`   ${rec.type === 'CRITICAL' ? '🔴' : rec.type === 'HIGH' ? '🟡' : '🟢'} ${rec.message}`);
      });
    }
    
    console.log('\n📋 ARQUIVOS COM MAIS TEXTOS HARDCODED:');
    report.detailedAnalysis.slice(0, 10).forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.file}`);
      console.log(`      • Cobertura: ${file.translationCoverage}`);
      console.log(`      • Hardcoded: ${file.hardcodedTexts}`);
      console.log(`      • Prioridade: ${file.priority}`);
    });
    
    console.log('\n📊 DISTRIBUIÇÃO DE COBERTURA:');
    Object.entries(report.coverageReport).forEach(([range, count]) => {
      if (count > 0) {
        console.log(`   • ${range}: ${count} arquivos`);
      }
    });
    
    console.log('\n💾 Relatório detalhado salvo em: translation-analysis-report.json');
    console.log('=' .repeat(80));
  }

  saveDetailedReport(report) {
    try {
      fs.writeFileSync(
        'translation-analysis-report.json', 
        JSON.stringify(report, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('❌ Erro ao salvar relatório detalhado:', error.message);
    }
  }
}

// Execute scanner if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scanner = new TranslationScannerController();
  scanner.execute().catch(console.error);
}

export {
  TranslationScannerController,
  TranslationScannerDomain,
  TranslationAnalysisUseCase,
  FileSystemRepository,
  TranslationReportGenerator
};