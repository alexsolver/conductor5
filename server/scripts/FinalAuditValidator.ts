// FINAL AUDIT VALIDATION - All inconsistencies resolution verification
// Comprehensive validation of all audit fields in schema-master.ts

import { readFileSync } from 'fs';
import { join } from 'path';

interface TableAuditStatus {
  tableName: string;
  hasCreatedAt: boolean;
  hasUpdatedAt: boolean;
  hasIsActive: boolean;
  lineNumbers: {
    createdAt?: number;
    updatedAt?: number;
    isActive?: number;
  };
  status: 'compliant' | 'missing_updatedAt' | 'missing_fields';
}

class FinalAuditValidator {
  private schemaPath = join(process.cwd(), 'shared', 'schema-master.ts');

  async validateAllTables(): Promise<void> {
    try {
      const schemaContent = readFileSync(this.schemaPath, 'utf-8');
      const lines = schemaContent.split('\n');
      
      console.log('# FINAL AUDIT VALIDATION REPORT');
      console.log(`Generated: ${new Date().toISOString()}\n`);
      
      // Find all table exports
      const tableExports = lines
        .map((line, index) => ({ line, index: index + 1 }))
        .filter(({ line }) => line.includes('export const') && line.includes('= pgTable('));
      
      console.log(`## 📊 DETECTED TABLES: ${tableExports.length}`);
      
      const auditResults: TableAuditStatus[] = [];
      
      for (const tableExport of tableExports) {
        const tableName = this.extractTableName(tableExport.line);
        if (tableName) {
          const auditStatus = this.analyzeTableAudit(lines, tableExport.index, tableName);
          auditResults.push(auditStatus);
        }
      }
      
      // Generate detailed report
      this.generateDetailedReport(auditResults);
      
      // Check specific tables mentioned by user
      this.validateSpecificTables(auditResults);
      
    } catch (error) {
      console.error('Error during validation:', error);
    }
  }

  private extractTableName(line: string): string | null {
    const match = line.match(/export const (\w+) = pgTable/);
    return match ? match[1] : null;
  }

  private analyzeTableAudit(lines: string[], startLine: number, tableName: string): TableAuditStatus {
    // Find the table definition end
    let endLine = startLine;
    let braceCount = 0;
    let foundStart = false;
    
    for (let i = startLine; i < lines.length; i++) {
      if (lines[i].includes('{')) {
        foundStart = true;
        braceCount += (lines[i].match(/\{/g) || []).length;
      }
      if (foundStart) {
        braceCount -= (lines[i].match(/\}/g) || []).length;
        if (braceCount <= 0) {
          endLine = i;
          break;
        }
      }
    }
    
    // Analyze audit fields within table definition
    const tableDefinition = lines.slice(startLine, endLine + 1);
    const auditStatus: TableAuditStatus = {
      tableName,
      hasCreatedAt: false,
      hasUpdatedAt: false,
      hasIsActive: false,
      lineNumbers: {},
      status: 'missing_fields'
    };
    
    for (let i = 0; i < tableDefinition.length; i++) {
      const line = tableDefinition[i];
      const actualLineNumber = startLine + i + 1;
      
      if (line.includes('createdAt:') && line.includes('timestamp("created_at")')) {
        auditStatus.hasCreatedAt = true;
        auditStatus.lineNumbers.createdAt = actualLineNumber;
      }
      
      if (line.includes('updatedAt:') && line.includes('timestamp("updated_at")')) {
        auditStatus.hasUpdatedAt = true;
        auditStatus.lineNumbers.updatedAt = actualLineNumber;
      }
      
      if (line.includes('isActive:') && line.includes('boolean("is_active")')) {
        auditStatus.hasIsActive = true;
        auditStatus.lineNumbers.isActive = actualLineNumber;
      }
    }
    
    // Determine status
    if (auditStatus.hasCreatedAt && auditStatus.hasUpdatedAt && auditStatus.hasIsActive) {
      auditStatus.status = 'compliant';
    } else if (auditStatus.hasCreatedAt && !auditStatus.hasUpdatedAt) {
      auditStatus.status = 'missing_updatedAt';
    }
    
    return auditStatus;
  }

  private generateDetailedReport(results: TableAuditStatus[]): void {
    const compliant = results.filter(r => r.status === 'compliant');
    const missingUpdatedAt = results.filter(r => r.status === 'missing_updatedAt');
    const missingFields = results.filter(r => r.status === 'missing_fields');
    
    console.log(`\n## ✅ COMPLIANCE OVERVIEW`);
    console.log(`- Fully Compliant: ${compliant.length}/${results.length} tables`);
    console.log(`- Missing updatedAt: ${missingUpdatedAt.length} tables`);
    console.log(`- Missing multiple fields: ${missingFields.length} tables`);
    
    if (compliant.length > 0) {
      console.log(`\n### ✅ COMPLIANT TABLES:`);
      compliant.forEach(table => {
        console.log(`- ${table.tableName}: ✅ (lines: createdAt=${table.lineNumbers.createdAt}, updatedAt=${table.lineNumbers.updatedAt})`);
      });
    }
    
    if (missingUpdatedAt.length > 0) {
      console.log(`\n### ⚠️ TABLES MISSING updatedAt ONLY:`);
      missingUpdatedAt.forEach(table => {
        console.log(`- ${table.tableName}: Missing updatedAt field (has createdAt at line ${table.lineNumbers.createdAt})`);
      });
    }
    
    if (missingFields.length > 0) {
      console.log(`\n### ❌ TABLES WITH MULTIPLE MISSING FIELDS:`);
      missingFields.forEach(table => {
        const missing = [];
        if (!table.hasCreatedAt) missing.push('createdAt');
        if (!table.hasUpdatedAt) missing.push('updatedAt');
        if (!table.hasIsActive) missing.push('isActive');
        console.log(`- ${table.tableName}: Missing [${missing.join(', ')}]`);
      });
    }
  }

  private validateSpecificTables(results: TableAuditStatus[]): void {
    console.log(`\n## 🎯 USER-REPORTED ISSUE VALIDATION`);
    
    // Check ticketMessages specifically
    const ticketMessages = results.find(r => r.tableName === 'ticketMessages');
    if (ticketMessages) {
      console.log(`\n### ticketMessages Table Analysis:`);
      console.log(`- createdAt: ${ticketMessages.hasCreatedAt ? '✅' : '❌'} ${ticketMessages.lineNumbers.createdAt ? `(line ${ticketMessages.lineNumbers.createdAt})` : ''}`);
      console.log(`- updatedAt: ${ticketMessages.hasUpdatedAt ? '✅' : '❌'} ${ticketMessages.lineNumbers.updatedAt ? `(line ${ticketMessages.lineNumbers.updatedAt})` : ''}`);
      console.log(`- isActive: ${ticketMessages.hasIsActive ? '✅' : '❌'} ${ticketMessages.lineNumbers.isActive ? `(line ${ticketMessages.lineNumbers.isActive})` : ''}`);
      console.log(`- Overall Status: ${ticketMessages.status}`);
      
      if (ticketMessages.status === 'compliant') {
        console.log(`✅ USER REPORT RESOLVED: ticketMessages now has all required audit fields`);
      } else {
        console.log(`❌ USER REPORT CONFIRMED: ticketMessages still missing fields`);
      }
    } else {
      console.log(`❌ ticketMessages table not found in schema`);
    }
    
    // Summary
    const totalCompliant = results.filter(r => r.status === 'compliant').length;
    const percentage = Math.round((totalCompliant / results.length) * 100);
    
    console.log(`\n## 🎯 FINAL AUDIT COMPLIANCE: ${percentage}%`);
    if (percentage === 100) {
      console.log(`✅ ALL AUDIT INCONSISTENCIES RESOLVED`);
    } else {
      console.log(`⚠️ ${results.length - totalCompliant} tables still need attention`);
    }
  }
}

// Execute validation
const validator = new FinalAuditValidator();
validator.validateAllTables();

export { FinalAuditValidator };