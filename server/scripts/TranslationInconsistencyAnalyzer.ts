
import * as fs from 'fs';
import * as path from 'path';

interface TranslationFile {
  language: string;
  content: any;
  keys: Set<string>;
}

interface InconsistencyReport {
  missingKeys: { [language: string]: string[] };
  extraKeys: { [language: string]: string[] };
  inconsistentValues: { key: string; values: { [language: string]: string } }[];
  malformedKeys: { [language: string]: string[] };
  duplicatedKeys: { [language: string]: string[] };
  emptyValues: { [language: string]: string[] };
  keyStructureIssues: { [language: string]: string[] };
}

class TranslationInconsistencyAnalyzer {
  private readonly TRANSLATIONS_DIR = path.join(process.cwd(), 'client', 'public', 'locales');
  private readonly SUPPORTED_LANGUAGES = ['en', 'pt-BR', 'es', 'fr', 'de'];

  async analyzeAllInconsistencies(): Promise<InconsistencyReport> {
    console.log('🔍 [TRANSLATION-ANALYZER] Starting comprehensive inconsistency analysis...');

    const translationFiles = await this.loadAllTranslationFiles();
    const report: InconsistencyReport = {
      missingKeys: {},
      extraKeys: {},
      inconsistentValues: [],
      malformedKeys: {},
      duplicatedKeys: [],
      emptyValues: {},
      keyStructureIssues: {}
    };

    // 1. Analyze key consistency across languages
    await this.analyzeMissingKeys(translationFiles, report);
    
    // 2. Analyze malformed keys
    await this.analyzeMalformedKeys(translationFiles, report);
    
    // 3. Analyze empty values
    await this.analyzeEmptyValues(translationFiles, report);
    
    // 4. Analyze key structure issues
    await this.analyzeKeyStructureIssues(translationFiles, report);
    
    // 5. Analyze inconsistent values (keys that should have similar values)
    await this.analyzeInconsistentValues(translationFiles, report);

    await this.generateDetailedReport(report);
    
    return report;
  }

  private async loadAllTranslationFiles(): Promise<TranslationFile[]> {
    const files: TranslationFile[] = [];
    
    for (const language of this.SUPPORTED_LANGUAGES) {
      try {
        const filePath = path.join(this.TRANSLATIONS_DIR, language, 'translation.json');
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const keys = new Set(this.flattenObjectKeys(content));
        
        files.push({
          language,
          content,
          keys
        });
      } catch (error) {
        console.error(`❌ Error loading ${language}:`, error);
      }
    }
    
    return files;
  }

  private flattenObjectKeys(obj: any, prefix = ''): string[] {
    const keys: string[] = [];
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          keys.push(...this.flattenObjectKeys(obj[key], fullKey));
        } else {
          keys.push(fullKey);
        }
      }
    }
    
    return keys;
  }

  private async analyzeMissingKeys(files: TranslationFile[], report: InconsistencyReport) {
    console.log('📊 [ANALYZER] Analyzing missing keys...');
    
    // Get all unique keys across all languages
    const allKeys = new Set<string>();
    files.forEach(file => {
      file.keys.forEach(key => allKeys.add(key));
    });

    // Check which keys are missing in each language
    for (const file of files) {
      const missingKeys: string[] = [];
      const extraKeys: string[] = [];
      
      for (const key of allKeys) {
        if (!file.keys.has(key)) {
          missingKeys.push(key);
        }
      }
      
      // Check for keys that exist in this language but not in others
      for (const key of file.keys) {
        const existsInOtherLanguages = files.some(otherFile => 
          otherFile.language !== file.language && otherFile.keys.has(key)
        );
        
        if (!existsInOtherLanguages && files.length > 1) {
          extraKeys.push(key);
        }
      }
      
      if (missingKeys.length > 0) {
        report.missingKeys[file.language] = missingKeys;
      }
      
      if (extraKeys.length > 0) {
        report.extraKeys[file.language] = extraKeys;
      }
    }
  }

  private async analyzeMalformedKeys(files: TranslationFile[], report: InconsistencyReport) {
    console.log('📊 [ANALYZER] Analyzing malformed keys...');
    
    const validKeyPattern = /^[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*$/;
    
    for (const file of files) {
      const malformedKeys: string[] = [];
      
      for (const key of file.keys) {
        // Check for malformed key patterns
        if (!validKeyPattern.test(key)) {
          malformedKeys.push(key);
        }
        
        // Check for keys with special characters that might cause issues
        if (key.includes(' ') || key.includes('-') || key.includes('$') || key.includes('{') || key.includes('}')) {
          malformedKeys.push(key);
        }
        
        // Check for keys that look like they have translation syntax issues
        if (key.includes('{{') || key.includes('}}') || key.includes('${')) {
          malformedKeys.push(key);
        }
      }
      
      if (malformedKeys.length > 0) {
        report.malformedKeys[file.language] = [...new Set(malformedKeys)];
      }
    }
  }

  private async analyzeEmptyValues(files: TranslationFile[], report: InconsistencyReport) {
    console.log('📊 [ANALYZER] Analyzing empty values...');
    
    for (const file of files) {
      const emptyValues: string[] = [];
      
      this.findEmptyValues(file.content, '', emptyValues);
      
      if (emptyValues.length > 0) {
        report.emptyValues[file.language] = emptyValues;
      }
    }
  }

  private findEmptyValues(obj: any, prefix: string, emptyValues: string[]) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          this.findEmptyValues(obj[key], fullKey, emptyValues);
        } else if (typeof obj[key] === 'string') {
          const value = obj[key].trim();
          if (value === '' || value === 'TODO' || value === 'FIXME' || value.startsWith('[') && value.endsWith(']')) {
            emptyValues.push(fullKey);
          }
        }
      }
    }
  }

  private async analyzeKeyStructureIssues(files: TranslationFile[], report: InconsistencyReport) {
    console.log('📊 [ANALYZER] Analyzing key structure issues...');
    
    for (const file of files) {
      const structureIssues: string[] = [];
      
      // Check for keys that reference other keys but those keys don't exist
      for (const key of file.keys) {
        const value = this.getValueByKey(file.content, key);
        
        if (typeof value === 'string') {
          // Check for key references like "common.loading" but used as values
          if (value.includes('.') && value.split('.').length > 1) {
            const potentialKeyRef = value.trim();
            if (!file.keys.has(potentialKeyRef) && potentialKeyRef.match(/^[a-zA-Z]/)) {
              structureIssues.push(`${key} -> references non-existent key: ${potentialKeyRef}`);
            }
          }
        }
      }
      
      if (structureIssues.length > 0) {
        report.keyStructureIssues[file.language] = structureIssues;
      }
    }
  }

  private async analyzeInconsistentValues(files: TranslationFile[], report: InconsistencyReport) {
    console.log('📊 [ANALYZER] Analyzing inconsistent values...');
    
    // Find keys that exist in multiple languages
    const commonKeys = new Set<string>();
    
    if (files.length > 1) {
      const firstFileKeys = files[0].keys;
      for (const key of firstFileKeys) {
        if (files.every(file => file.keys.has(key))) {
          commonKeys.add(key);
        }
      }
    }

    // Check for inconsistent patterns in common keys
    for (const key of commonKeys) {
      const values: { [language: string]: string } = {};
      let hasInconsistency = false;
      
      for (const file of files) {
        const value = this.getValueByKey(file.content, key);
        if (typeof value === 'string') {
          values[file.language] = value;
          
          // Check for obvious inconsistencies
          if (value === key || value.includes('{{') || value.includes('}}')) {
            hasInconsistency = true;
          }
        }
      }
      
      if (hasInconsistency && Object.keys(values).length > 1) {
        report.inconsistentValues.push({ key, values });
      }
    }
  }

  private getValueByKey(obj: any, key: string): any {
    const keys = key.split('.');
    let current = obj;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  private async generateDetailedReport(report: InconsistencyReport) {
    const reportPath = path.join(process.cwd(), 'TRANSLATION_INCONSISTENCIES_REPORT.md');
    
    let markdown = `# 🔍 Translation Inconsistencies Report\n\n`;
    markdown += `Generated at: ${new Date().toISOString()}\n\n`;

    // Missing Keys Section
    markdown += `## 📋 Missing Keys\n\n`;
    for (const [language, keys] of Object.entries(report.missingKeys)) {
      if (keys.length > 0) {
        markdown += `### ${language.toUpperCase()}\n`;
        markdown += `Missing ${keys.length} keys:\n\n`;
        keys.slice(0, 20).forEach(key => {
          markdown += `- \`${key}\`\n`;
        });
        if (keys.length > 20) {
          markdown += `... and ${keys.length - 20} more\n`;
        }
        markdown += `\n`;
      }
    }

    // Malformed Keys Section
    markdown += `## ⚠️ Malformed Keys\n\n`;
    for (const [language, keys] of Object.entries(report.malformedKeys)) {
      if (keys.length > 0) {
        markdown += `### ${language.toUpperCase()}\n`;
        keys.forEach(key => {
          markdown += `- \`${key}\` - Invalid key format\n`;
        });
        markdown += `\n`;
      }
    }

    // Empty Values Section
    markdown += `## 🔲 Empty/Invalid Values\n\n`;
    for (const [language, keys] of Object.entries(report.emptyValues)) {
      if (keys.length > 0) {
        markdown += `### ${language.toUpperCase()}\n`;
        keys.forEach(key => {
          markdown += `- \`${key}\` - Empty or placeholder value\n`;
        });
        markdown += `\n`;
      }
    }

    // Key Structure Issues Section
    markdown += `## 🔗 Key Structure Issues\n\n`;
    for (const [language, issues] of Object.entries(report.keyStructureIssues)) {
      if (issues.length > 0) {
        markdown += `### ${language.toUpperCase()}\n`;
        issues.forEach(issue => {
          markdown += `- ${issue}\n`;
        });
        markdown += `\n`;
      }
    }

    // Inconsistent Values Section
    markdown += `## 🔄 Inconsistent Values\n\n`;
    if (report.inconsistentValues.length > 0) {
      report.inconsistentValues.slice(0, 10).forEach(item => {
        markdown += `### \`${item.key}\`\n`;
        for (const [lang, value] of Object.entries(item.values)) {
          markdown += `- **${lang}**: "${value}"\n`;
        }
        markdown += `\n`;
      });
    }

    // Summary Section
    markdown += `## 📊 Summary\n\n`;
    const totalMissing = Object.values(report.missingKeys).reduce((sum, keys) => sum + keys.length, 0);
    const totalMalformed = Object.values(report.malformedKeys).reduce((sum, keys) => sum + keys.length, 0);
    const totalEmpty = Object.values(report.emptyValues).reduce((sum, keys) => sum + keys.length, 0);
    
    markdown += `- **Total Missing Keys**: ${totalMissing}\n`;
    markdown += `- **Total Malformed Keys**: ${totalMalformed}\n`;
    markdown += `- **Total Empty Values**: ${totalEmpty}\n`;
    markdown += `- **Total Inconsistent Values**: ${report.inconsistentValues.length}\n\n`;

    markdown += `## 🎯 Priority Issues\n\n`;
    markdown += `1. **Critical**: Fix missing navigation keys that break UI\n`;
    markdown += `2. **High**: Remove malformed keys that cause parsing errors\n`;
    markdown += `3. **Medium**: Fill empty values with proper translations\n`;
    markdown += `4. **Low**: Standardize inconsistent value patterns\n\n`;

    fs.writeFileSync(reportPath, markdown);
    console.log(`📄 [REPORT] Detailed report written to: ${reportPath}`);
  }
}

// Execute if run directly
if (require.main === module) {
  const analyzer = new TranslationInconsistencyAnalyzer();
  analyzer.analyzeAllInconsistencies()
    .then(report => {
      console.log('✅ [ANALYZER] Analysis complete!');
      console.log('📊 [SUMMARY] Found inconsistencies:');
      console.log(`   - Missing keys: ${Object.values(report.missingKeys).reduce((sum, keys) => sum + keys.length, 0)}`);
      console.log(`   - Malformed keys: ${Object.values(report.malformedKeys).reduce((sum, keys) => sum + keys.length, 0)}`);
      console.log(`   - Empty values: ${Object.values(report.emptyValues).reduce((sum, keys) => sum + keys.length, 0)}`);
      console.log(`   - Inconsistent values: ${report.inconsistentValues.length}`);
    })
    .catch(error => {
      console.error('❌ [ANALYZER] Analysis failed:', error);
      process.exit(1);
    });
}

export { TranslationInconsistencyAnalyzer };
