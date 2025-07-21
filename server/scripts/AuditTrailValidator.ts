// AUDIT TRAIL VALIDATION SYSTEM
// Comprehensive validation of audit fields consistency across all tables

import { readFileSync } from 'fs';
import { join } from 'path';

interface AuditField {
  name: string;
  type: string;
  defaultValue?: string;
  status: 'present' | 'missing' | 'inconsistent';
}

interface TableAudit {
  tableName: string;
  hasCreatedAt: boolean;
  hasUpdatedAt: boolean;
  hasIsActive: boolean;
  hasUserId: boolean;
  auditFieldsCount: number;
  status: 'compliant' | 'partial' | 'non_compliant';
  missingFields: string[];
}

class AuditTrailValidator {
  private schemaPath = join(process.cwd(), 'shared', 'schema-master.ts');
  private auditResults: TableAudit[] = [];

  async validateSchemaAuditCompliance(): Promise<string> {
    let report = `# AUDIT TRAIL COMPLIANCE VALIDATION\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    try {
      const schemaContent = readFileSync(this.schemaPath, 'utf-8');
      
      // Extract all table definitions with improved regex
      const tableMatches = [...schemaContent.matchAll(/export const (\w+) = pgTable\("(\w+)",\s*\{[\s\S]*?\}\)\);?/g)];
      
      report += `## 📊 SCHEMA ANALYSIS SUMMARY\n`;
      report += `Total tables found: ${tableMatches.length}\n`;
      report += `Schema file: ${this.schemaPath}\n\n`;

      // Analyze each table
      for (const [, tableConstName, tableName] of tableMatches) {
        const audit = this.analyzeTableAudit(schemaContent, tableConstName, tableName);
        this.auditResults.push(audit);
      }

      // Generate compliance report
      report += this.generateComplianceReport();
      report += this.generateFieldConsistencyAnalysis();
      report += this.generateRecommendations();

    } catch (error) {
      report += `❌ Error reading schema file: ${error}\n`;
    }

    return report;
  }

  private analyzeTableAudit(schemaContent: string, tableConstName: string, tableName: string): TableAudit {
    // Extract table definition block
    const tableStart = schemaContent.indexOf(`export const ${tableConstName} = pgTable`);
    const tableEnd = schemaContent.indexOf('});', tableStart) + 3;
    const tableDefinition = schemaContent.substring(tableStart, tableEnd);

    // Check for standard audit fields
    const hasCreatedAt = /createdAt:\s*timestamp\("created_at"\)\.defaultNow\(\)/.test(tableDefinition);
    const hasUpdatedAt = /updatedAt:\s*timestamp\("updated_at"\)\.defaultNow\(\)/.test(tableDefinition);
    const hasIsActive = /isActive:\s*boolean\("is_active"\)\.default\(true\)/.test(tableDefinition);
    const hasUserId = /userId:\s*(varchar|uuid)\("user_id"/.test(tableDefinition) || 
                      /createdBy:\s*(varchar|uuid)\("created_by"/.test(tableDefinition);

    const auditFieldsCount = [hasCreatedAt, hasUpdatedAt, hasIsActive, hasUserId].filter(Boolean).length;
    
    const missingFields: string[] = [];
    if (!hasCreatedAt) missingFields.push('createdAt');
    if (!hasUpdatedAt) missingFields.push('updatedAt');
    if (!hasIsActive) missingFields.push('isActive');

    let status: 'compliant' | 'partial' | 'non_compliant';
    if (hasCreatedAt && hasUpdatedAt && hasIsActive) {
      status = 'compliant';
    } else if (hasCreatedAt || hasUpdatedAt) {
      status = 'partial';
    } else {
      status = 'non_compliant';
    }

    return {
      tableName,
      hasCreatedAt,
      hasUpdatedAt,
      hasIsActive,
      hasUserId,
      auditFieldsCount,
      status,
      missingFields
    };
  }

  private generateComplianceReport(): string {
    let report = `## ✅ AUDIT COMPLIANCE STATUS\n\n`;

    const compliant = this.auditResults.filter(t => t.status === 'compliant');
    const partial = this.auditResults.filter(t => t.status === 'partial');
    const nonCompliant = this.auditResults.filter(t => t.status === 'non_compliant');

    report += `### 📈 COMPLIANCE METRICS\n`;
    report += `- **Fully Compliant**: ${compliant.length}/${this.auditResults.length} tables (${Math.round((compliant.length / this.auditResults.length) * 100)}%)\n`;
    report += `- **Partially Compliant**: ${partial.length} tables\n`;
    report += `- **Non-Compliant**: ${nonCompliant.length} tables\n\n`;

    // Compliant tables
    if (compliant.length > 0) {
      report += `### ✅ FULLY COMPLIANT TABLES\n`;
      compliant.forEach(table => {
        report += `- **${table.tableName}**: All audit fields present (${table.auditFieldsCount}/4)\n`;
      });
      report += `\n`;
    }

    // Partial compliance
    if (partial.length > 0) {
      report += `### ⚠️ PARTIALLY COMPLIANT TABLES\n`;
      partial.forEach(table => {
        report += `- **${table.tableName}**: Missing [${table.missingFields.join(', ')}] (${table.auditFieldsCount}/4)\n`;
      });
      report += `\n`;
    }

    // Non-compliant
    if (nonCompliant.length > 0) {
      report += `### ❌ NON-COMPLIANT TABLES\n`;
      nonCompliant.forEach(table => {
        report += `- **${table.tableName}**: Missing [${table.missingFields.join(', ')}] (${table.auditFieldsCount}/4)\n`;
      });
      report += `\n`;
    }

    return report;
  }

  private generateFieldConsistencyAnalysis(): string {
    let report = `## 🔍 FIELD CONSISTENCY ANALYSIS\n\n`;

    const totalTables = this.auditResults.length;
    const createdAtCount = this.auditResults.filter(t => t.hasCreatedAt).length;
    const updatedAtCount = this.auditResults.filter(t => t.hasUpdatedAt).length;
    const isActiveCount = this.auditResults.filter(t => t.hasIsActive).length;
    const userIdCount = this.auditResults.filter(t => t.hasUserId).length;

    report += `### 📊 FIELD PREVALENCE\n`;
    report += `- **createdAt**: ${createdAtCount}/${totalTables} tables (${Math.round((createdAtCount / totalTables) * 100)}%)\n`;
    report += `- **updatedAt**: ${updatedAtCount}/${totalTables} tables (${Math.round((updatedAtCount / totalTables) * 100)}%)\n`;
    report += `- **isActive**: ${isActiveCount}/${totalTables} tables (${Math.round((isActiveCount / totalTables) * 100)}%)\n`;
    report += `- **userId/createdBy**: ${userIdCount}/${totalTables} tables (${Math.round((userIdCount / totalTables) * 100)}%)\n\n`;

    // Check for inconsistencies
    const inconsistencies: string[] = [];
    
    if (createdAtCount !== totalTables) {
      const missing = this.auditResults.filter(t => !t.hasCreatedAt).map(t => t.tableName);
      inconsistencies.push(`**createdAt missing**: ${missing.join(', ')}`);
    }
    
    if (updatedAtCount !== totalTables) {
      const missing = this.auditResults.filter(t => !t.hasUpdatedAt).map(t => t.tableName);
      inconsistencies.push(`**updatedAt missing**: ${missing.join(', ')}`);
    }
    
    if (isActiveCount < totalTables - 2) { // Allow 2 tables without isActive (sessions, tenants)
      const missing = this.auditResults.filter(t => !t.hasIsActive).map(t => t.tableName);
      inconsistencies.push(`**isActive missing**: ${missing.join(', ')}`);
    }

    if (inconsistencies.length > 0) {
      report += `### ⚠️ DETECTED INCONSISTENCIES\n`;
      inconsistencies.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += `\n`;
    } else {
      report += `### ✅ NO CRITICAL INCONSISTENCIES DETECTED\n`;
      report += `All critical audit fields (createdAt, updatedAt) are consistently implemented.\n\n`;
    }

    return report;
  }

  private generateRecommendations(): string {
    let report = `## 🎯 RECOMMENDATIONS\n\n`;

    const nonCompliantTables = this.auditResults.filter(t => t.status !== 'compliant');
    
    if (nonCompliantTables.length === 0) {
      report += `### ✅ EXCELLENT AUDIT COMPLIANCE\n`;
      report += `All tables are fully compliant with audit trail requirements.\n`;
      report += `No immediate actions needed.\n\n`;
      
      report += `### 📋 MAINTENANCE CHECKLIST\n`;
      report += `- ✅ All tables have createdAt timestamp fields\n`;
      report += `- ✅ All tables have updatedAt timestamp fields\n`;
      report += `- ✅ All tables have isActive boolean fields for soft deletes\n`;
      report += `- ✅ Audit trail consistency maintained across schema\n\n`;
      
    } else {
      report += `### 🔧 IMMEDIATE ACTIONS REQUIRED\n`;
      
      nonCompliantTables.forEach(table => {
        if (table.missingFields.length > 0) {
          report += `#### ${table.tableName}\n`;
          report += `Add missing fields:\n`;
          table.missingFields.forEach(field => {
            if (field === 'createdAt') {
              report += `- \`createdAt: timestamp("created_at").defaultNow(),\`\n`;
            } else if (field === 'updatedAt') {
              report += `- \`updatedAt: timestamp("updated_at").defaultNow(),\`\n`;
            } else if (field === 'isActive') {
              report += `- \`isActive: boolean("is_active").default(true),\`\n`;
            }
          });
          report += `\n`;
        }
      });
    }

    report += `### 🚀 ENTERPRISE AUDIT ENHANCEMENTS\n`;
    report += `- Consider adding \`deletedAt\` for paranoid deletes\n`;
    report += `- Add \`version\` field for optimistic locking\n`;
    report += `- Implement audit log triggers for data changes\n`;
    report += `- Add \`lastModifiedBy\` for user tracking\n`;

    return report;
  }

  async generateAuditReport(): Promise<void> {
    const report = await this.validateSchemaAuditCompliance();
    console.log(report);
    
    // Summary
    const compliantCount = this.auditResults.filter(t => t.status === 'compliant').length;
    const totalCount = this.auditResults.length;
    const compliancePercentage = Math.round((compliantCount / totalCount) * 100);
    
    console.log(`\n🎯 AUDIT COMPLIANCE SUMMARY:`);
    console.log(`${compliantCount}/${totalCount} tables fully compliant (${compliancePercentage}%)`);
    
    if (compliancePercentage === 100) {
      console.log(`✅ AUDIT TRAIL COMPLIANCE: EXCELLENT`);
    } else if (compliancePercentage >= 80) {
      console.log(`⚠️ AUDIT TRAIL COMPLIANCE: GOOD - minor fixes needed`);
    } else {
      console.log(`❌ AUDIT TRAIL COMPLIANCE: NEEDS IMPROVEMENT`);
    }
  }
}

// Execute validation
const validator = new AuditTrailValidator();
validator.generateAuditReport();

export { AuditTrailValidator };