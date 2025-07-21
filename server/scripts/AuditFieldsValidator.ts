// AUDIT FIELDS COMPREHENSIVE VALIDATOR
// Validates all schema audit fields consistency and identifies missing ones

import { readFileSync } from 'fs';
import { join } from 'path';

interface AuditValidationResult {
  tableName: string;
  hasCreatedAt: boolean;
  hasUpdatedAt: boolean;
  isConsistent: boolean;
  lineNumbers: {
    createdAt?: number;
    updatedAt?: number;
  };
}

class AuditFieldsValidator {
  private schemaContent: string;
  private lines: string[];

  constructor() {
    const schemaPath = join(process.cwd(), 'shared', 'schema-master.ts');
    this.schemaContent = readFileSync(schemaPath, 'utf-8');
    this.lines = this.schemaContent.split('\n');
  }

  validateAllTables(): AuditValidationResult[] {
    const results: AuditValidationResult[] = [];
    
    // Extract all table definitions
    const tableRegex = /export const (\w+) = pgTable\("([^"]+)"/g;
    let match;
    
    while ((match = tableRegex.exec(this.schemaContent)) !== null) {
      const tableName = match[1];
      const dbTableName = match[2];
      
      // Skip public schema tables (sessions, tenants, users)
      if (['sessions', 'tenants', 'users'].includes(tableName)) {
        continue;
      }

      const result = this.validateTable(tableName);
      results.push(result);
    }

    return results;
  }

  private validateTable(tableName: string): AuditValidationResult {
    const result: AuditValidationResult = {
      tableName,
      hasCreatedAt: false,
      hasUpdatedAt: false,
      isConsistent: false,
      lineNumbers: {}
    };

    // Find table definition boundaries
    const tableStart = this.lines.findIndex(line => 
      line.includes(`export const ${tableName} = pgTable`)
    );
    
    if (tableStart === -1) {
      return result;
    }

    // Find table end (closing bracket and parenthesis)
    let tableEnd = tableStart;
    let braceCount = 0;
    let foundOpenBrace = false;

    for (let i = tableStart; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      if (line.includes('{')) {
        foundOpenBrace = true;
        braceCount += (line.match(/\{/g) || []).length;
      }
      
      if (foundOpenBrace) {
        braceCount -= (line.match(/\}/g) || []).length;
        
        if (braceCount === 0 && line.includes('}')) {
          tableEnd = i;
          break;
        }
      }
    }

    // Check for audit fields within table definition
    for (let i = tableStart; i <= tableEnd; i++) {
      const line = this.lines[i];
      
      if (line.includes('createdAt:') && line.includes('timestamp') && line.includes('defaultNow')) {
        result.hasCreatedAt = true;
        result.lineNumbers.createdAt = i + 1;
      }
      
      if (line.includes('updatedAt:') && line.includes('timestamp') && line.includes('defaultNow')) {
        result.hasUpdatedAt = true;
        result.lineNumbers.updatedAt = i + 1;
      }
    }

    result.isConsistent = result.hasCreatedAt && result.hasUpdatedAt;
    return result;
  }

  generateReport(): string {
    const results = this.validateAllTables();
    
    let report = `# AUDIT FIELDS VALIDATION REPORT\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    const consistent = results.filter(r => r.isConsistent);
    const inconsistent = results.filter(r => !r.isConsistent);

    report += `## ✅ SUMMARY\n`;
    report += `Total Tables Analyzed: ${results.length}\n`;
    report += `Consistent Tables: ${consistent.length}\n`;
    report += `Inconsistent Tables: ${inconsistent.length}\n\n`;

    if (consistent.length > 0) {
      report += `## ✅ CONSISTENT TABLES (${consistent.length})\n`;
      consistent.forEach(table => {
        report += `- **${table.tableName}**: createdAt (L${table.lineNumbers.createdAt}), updatedAt (L${table.lineNumbers.updatedAt})\n`;
      });
      report += `\n`;
    }

    if (inconsistent.length > 0) {
      report += `## ❌ INCONSISTENT TABLES (${inconsistent.length})\n`;
      inconsistent.forEach(table => {
        report += `- **${table.tableName}**:\n`;
        report += `  - createdAt: ${table.hasCreatedAt ? '✅' : '❌'} ${table.lineNumbers.createdAt ? `(L${table.lineNumbers.createdAt})` : ''}\n`;
        report += `  - updatedAt: ${table.hasUpdatedAt ? '✅' : '❌'} ${table.lineNumbers.updatedAt ? `(L${table.lineNumbers.updatedAt})` : ''}\n`;
      });
      report += `\n`;
    }

    report += `## 🎯 AUDIT FIELDS STANDARD\n`;
    report += `All tenant-scoped tables MUST have both:\n`;
    report += `\`\`\`typescript\n`;
    report += `createdAt: timestamp("created_at").defaultNow(),\n`;
    report += `updatedAt: timestamp("updated_at").defaultNow(),\n`;
    report += `\`\`\`\n\n`;

    if (inconsistent.length === 0) {
      report += `## 🚀 RESULT: ALL AUDIT FIELDS COMPLIANT ✅\n`;
      report += `Schema audit consistency: 100% compliant\n`;
      report += `Enterprise-ready audit trail implemented across all ${results.length} tables\n`;
    } else {
      report += `## ⚠️ RESULT: AUDIT INCONSISTENCIES DETECTED\n`;
      report += `${inconsistent.length} tables require audit field updates\n`;
    }

    return report;
  }
}

// Execute validation
const validator = new AuditFieldsValidator();
const report = validator.generateReport();

console.log(report);

// Export for programmatic usage
export { AuditFieldsValidator, type AuditValidationResult };