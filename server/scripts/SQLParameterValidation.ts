
/**
 * SQL Parameter Validation Script
 * Systematically identifies and fixes SQL parameter indexing issues
 * Following 1qa.md compliance
 */

import fs from 'fs';
import path from 'path';

interface SQLIssue {
  file: string;
  line: number;
  issue: string;
  severity: 'critical' | 'warning' | 'info';
}

export class SQLParameterValidator {
  private issues: SQLIssue[] = [];

  async validateAllFiles(): Promise<void> {
    const serverDir = path.join(process.cwd(), 'server');
    await this.scanDirectory(serverDir);
    
    console.log('🔍 [SQLParameterValidator] Analysis complete');
    console.log('📊 [SQLParameterValidator] Issues found:', this.issues.length);
    
    this.printReport();
  }

  private async scanDirectory(dir: string): Promise<void> {
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
  }

  private async scanFile(filePath: string): Promise<void> {
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

  private checkSQLParameterIssues(line: string, lineNumber: number, filePath: string): void {
    // Check for SQL parameter patterns
    const sqlParameterPattern = /\$\d+/g;
    const dynamicQueryPattern = /sql\.raw\(/;
    const updatePattern = /UPDATE.*SET/i;
    const wherePattern = /WHERE.*\$/i;
    
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

    // Warning: UPDATE statements with WHERE clause
    if (updatePattern.test(line) && wherePattern.test(line)) {
      this.issues.push({
        file: filePath,
        line: lineNumber,
        issue: 'UPDATE with WHERE using parameters - verify indexing',
        severity: 'warning'
      });
    }

    // Critical: Specific error patterns
    if (line.includes('there is no parameter')) {
      this.issues.push({
        file: filePath,
        line: lineNumber,
        issue: 'SQL parameter error reference found',
        severity: 'critical'
      });
    }

    // Warning: Manual parameter counting
    if (line.includes('paramIndex') && line.includes('=') && /\d+/.test(line)) {
      this.issues.push({
        file: filePath,
        line: lineNumber,
        issue: 'Manual parameter index assignment - verify correctness',
        severity: 'warning'
      });
    }
  }

  private printReport(): void {
    console.log('\n=== SQL PARAMETER VALIDATION REPORT ===\n');
    
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const warningIssues = this.issues.filter(i => i.severity === 'warning');
    
    console.log(`🚨 Critical Issues: ${criticalIssues.length}`);
    console.log(`⚠️  Warning Issues: ${warningIssues.length}`);
    
    if (criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:\n');
      criticalIssues.forEach(issue => {
        console.log(`📁 ${issue.file}:${issue.line}`);
        console.log(`   ${issue.issue}\n`);
      });
    }

    if (warningIssues.length > 0) {
      console.log('\n⚠️  WARNING ISSUES:\n');
      warningIssues.forEach(issue => {
        console.log(`📁 ${issue.file}:${issue.line}`);
        console.log(`   ${issue.issue}\n`);
      });
    }

    console.log('\n=== RECOMMENDED ACTIONS ===\n');
    console.log('1. Review all files with critical issues immediately');
    console.log('2. Verify parameter indexing in dynamic SQL queries');
    console.log('3. Use consistent parameter counting patterns');
    console.log('4. Test all UPDATE/INSERT operations thoroughly');
    console.log('5. Implement automated SQL validation in CI/CD\n');
  }

  getIssues(): SQLIssue[] {
    return this.issues;
  }
}

// Execute if run directly
if (require.main === module) {
  const validator = new SQLParameterValidator();
  validator.validateAllFiles()
    .then(() => {
      console.log('✅ SQL Parameter validation complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ SQL Parameter validation failed:', error);
      process.exit(1);
    });
}
