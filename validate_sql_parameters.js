
/**
 * SQL Parameter Validation Script - ES Modules Compatible
 * Systematically identifies and fixes SQL parameter indexing issues
 * Following 1qa.md compliance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SQLParameterValidator {
  constructor() {
    this.issues = [];
  }

  async validateAllFiles() {
    const serverDir = path.join(process.cwd(), 'server');
    await this.scanDirectory(serverDir);
    
    console.log('🔍 [SQLParameterValidator] Analysis complete');
    console.log('📊 [SQLParameterValidator] Issues found:', this.issues.length);
    
    this.printReport();
    this.generateFixSuggestions();
  }

  async scanDirectory(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          await this.scanDirectory(filePath);
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
          await this.scanFile(filePath);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not scan directory:', dir);
    }
  }

  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        this.checkSQLParameterIssues(line, index + 1, filePath);
      });
    } catch (error) {
      console.warn('⚠️ Could not read file:', filePath);
    }
  }

  checkSQLParameterIssues(line, lineNumber, filePath) {
    // Check for SQL parameter patterns that commonly cause issues
    const sqlParameterPattern = /\$\d+/g;
    const dynamicQueryPattern = /sql\.raw\(/;
    const updatePattern = /UPDATE.*SET/i;
    const wherePattern = /WHERE.*\$/i;
    const setFieldsPattern = /setFields.*\d+/;
    const valuesPattern = /values.*\d+/;
    
    // Critical: Dynamic parameter building without proper indexing
    if (line.includes('paramIndex') && line.includes('$')) {
      if (line.includes('++') || line.includes('+=')) {
        this.issues.push({
          file: filePath,
          line: lineNumber,
          issue: 'Dynamic parameter indexing - potential off-by-one error',
          severity: 'critical'
        });
      }
    }

    // Critical: Raw SQL with parameters
    if (dynamicQueryPattern.test(line) && sqlParameterPattern.test(line)) {
      this.issues.push({
        file: filePath,
        line: lineNumber,
        issue: 'Raw SQL with parameters - verify parameter count',
        severity: 'critical'
      });
    }

    // Critical: Mismatch between setFields and values count
    if (line.includes('setFields:') && line.includes('values:')) {
      this.issues.push({
        file: filePath,
        line: lineNumber,
        issue: 'Potential setFields/values count mismatch',
        severity: 'critical'
      });
    }

    // Critical: Parameter count inconsistency in logs
    if (setFieldsPattern.test(line) && valuesPattern.test(line)) {
      const setFieldsMatch = line.match(/setFields:\s*(\d+)/);
      const valuesMatch = line.match(/values:\s*(\d+)/);
      
      if (setFieldsMatch && valuesMatch) {
        const setFieldsCount = parseInt(setFieldsMatch[1]);
        const valuesCount = parseInt(valuesMatch[1]);
        
        if (setFieldsCount !== valuesCount) {
          this.issues.push({
            file: filePath,
            line: lineNumber,
            issue: `Parameter count mismatch: setFields=${setFieldsCount}, values=${valuesCount}`,
            severity: 'critical'
          });
        }
      }
    }

    // Critical: Known problematic patterns from DrizzleTicketRepositoryClean
    if (line.includes('DrizzleTicketRepositoryClean') && line.includes('update')) {
      this.issues.push({
        file: filePath,
        line: lineNumber,
        issue: 'DrizzleTicketRepositoryClean update method - known parameter indexing issues',
        severity: 'critical'
      });
    }

    // Critical: Specific error patterns from logs
    if (line.includes('there is no parameter')) {
      this.issues.push({
        file: filePath,
        line: lineNumber,
        issue: 'SQL parameter error reference found',
        severity: 'critical'
      });
    }
  }

  printReport() {
    console.log('\n=== SQL PARAMETER VALIDATION REPORT ===\n');
    
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const warningIssues = this.issues.filter(i => i.severity === 'warning');
    
    console.log(`🚨 Critical Issues: ${criticalIssues.length}`);
    console.log(`⚠️  Warning Issues: ${warningIssues.length}`);
    
    if (criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:\n');
      criticalIssues.forEach(issue => {
        console.log(`📁 ${issue.file.replace(process.cwd(), '')}:${issue.line}`);
        console.log(`   ${issue.issue}\n`);
      });
    }

    if (warningIssues.length > 0) {
      console.log('\n⚠️  WARNING ISSUES:\n');
      warningIssues.forEach(issue => {
        console.log(`📁 ${issue.file.replace(process.cwd(), '')}:${issue.line}`);
        console.log(`   ${issue.issue}\n`);
      });
    }
  }

  generateFixSuggestions() {
    console.log('\n=== AUTOMATED FIX SUGGESTIONS ===\n');
    
    const criticalFiles = [...new Set(this.issues
      .filter(i => i.severity === 'critical')
      .map(i => i.file)
    )];

    console.log('📋 Files requiring immediate attention:');
    criticalFiles.forEach(file => {
      console.log(`   • ${file.replace(process.cwd(), '')}`);
    });

    console.log('\n🔧 RECOMMENDED ACTIONS:\n');
    console.log('1. Fix DrizzleTicketRepositoryClean parameter indexing');
    console.log('2. Standardize SQL parameter counting across all repositories');
    console.log('3. Implement parameter validation in SQL query builders');
    console.log('4. Add unit tests for all SQL parameter scenarios');
    console.log('5. Use consistent parameter indexing patterns');
    console.log('6. Implement automated SQL parameter validation in CI/CD');
    
    console.log('\n💡 IMMEDIATE FIXES TO APPLY:\n');
    console.log('• Review all UPDATE queries with dynamic parameters');
    console.log('• Ensure setFields count matches parameter array length');
    console.log('• Add parameter count validation before executing queries');
    console.log('• Use prepared statement parameter placeholders consistently');

    // Focus on the main issue from logs
    console.log('\n🎯 PRIMARY ISSUE TO FIX:\n');
    console.log('The "there is no parameter $34/$35" error indicates that');
    console.log('DrizzleTicketRepositoryClean.update() is building SQL with');
    console.log('mismatched parameter counts. This needs immediate attention.');
  }

  getIssues() {
    return this.issues;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new SQLParameterValidator();
  validator.validateAllFiles()
    .then(() => {
      console.log('\n✅ SQL Parameter validation complete');
      const criticalCount = validator.getIssues().filter(i => i.severity === 'critical').length;
      
      if (criticalCount > 0) {
        console.log(`\n❌ Found ${criticalCount} critical issues that need immediate attention`);
        console.log('Focus on DrizzleTicketRepositoryClean.update() method first');
      }
      
      process.exit(criticalCount > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ SQL Parameter validation failed:', error);
      process.exit(1);
    });
}

export { SQLParameterValidator };
