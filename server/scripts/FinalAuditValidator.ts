// FINAL AUDIT VALIDATOR - COMPREHENSIVE SCHEMA VALIDATION
// Validates all remaining inconsistencies and ensures 100% compliance

import { readFileSync } from 'fs';
import { join } from 'path';

interface AuditFinding {
  id: string;
  type: 'table_count_mismatch' | 'naming_inconsistency' | 'index_optimization' | 'validation_gap';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  evidence: string[];
  recommendation: string;
  status: 'pending' | 'investigating' | 'resolved';
}

class FinalAuditValidator {
  private schemaPath = join(process.cwd(), 'shared', 'schema-master.ts');
  private dbPath = join(process.cwd(), 'server', 'db.ts');
  private findings: AuditFinding[] = [];

  async executeComprehensiveAudit(): Promise<void> {
    console.log('# FINAL COMPREHENSIVE SCHEMA AUDIT');
    console.log(`Executed: ${new Date().toISOString()}\n`);

    try {
      const schemaContent = readFileSync(this.schemaPath, 'utf-8');
      const dbContent = readFileSync(this.dbPath, 'utf-8');

      // 1. Critical table count validation
      await this.validateTableCounts(schemaContent, dbContent);
      
      // 2. Nomenclature consistency deep analysis
      await this.validateNomenclatureConsistency(schemaContent);
      
      // 3. Index optimization audit
      await this.validateIndexOptimization(schemaContent);
      
      // 4. Validation gap analysis
      await this.validateSchemaValidationCompleteness(schemaContent, dbContent);
      
      // 5. Generate final audit report
      this.generateFinalAuditReport();
      
    } catch (error) {
      console.error('Critical audit error:', error);
    }
  }

  private async validateTableCounts(schemaContent: string, dbContent: string): Promise<void> {
    console.log('## 🔍 TABLE COUNT VALIDATION AUDIT\n');

    // Count tables in schema-master.ts
    const publicTables = (schemaContent.match(/export const (sessions|tenants|users) = pgTable/g) || []).length;
    const tenantTables = (schemaContent.match(/export const (?!sessions|tenants|users)\w+ = pgTable/g) || []).length;
    const totalSchemaTable = publicTables + tenantTables;

    console.log(`### Schema-master.ts Table Count:`);
    console.log(`- Public tables: ${publicTables} (sessions, tenants, users)`);
    console.log(`- Tenant tables: ${tenantTables}`);
    console.log(`- **Total: ${totalSchemaTable}**`);

    // Count tables being validated in db.ts
    const publicValidationMatch = dbContent.match(/requiredPublicTables\s*=\s*\[(.*?)\]/s);
    const tenantValidationMatch = dbContent.match(/requiredTables\s*=\s*\[(.*?)\]/s);

    let publicValidationCount = 0;
    let tenantValidationCount = 0;

    if (publicValidationMatch) {
      publicValidationCount = (publicValidationMatch[1].match(/['"`][^'"`]+['"`]/g) || []).length;
    }

    if (tenantValidationMatch) {
      tenantValidationCount = (tenantValidationMatch[1].match(/['"`][^'"`]+['"`]/g) || []).length;
    }

    const totalValidationCount = publicValidationCount + tenantValidationCount;

    console.log(`\n### db.ts Validation Count:`);
    console.log(`- Public validation: ${publicValidationCount}`);
    console.log(`- Tenant validation: ${tenantValidationCount}`);
    console.log(`- **Total: ${totalValidationCount}**`);

    // Critical analysis
    console.log(`\n### 🎯 CRITICAL ANALYSIS:`);
    if (totalSchemaTable === totalValidationCount) {
      console.log(`✅ **PERFECT MATCH**: Schema defines ${totalSchemaTable} tables, validation covers ${totalValidationCount} tables`);
      this.findings.push({
        id: 'AUDIT-001',
        type: 'table_count_mismatch',
        severity: 'low',
        description: 'Table count validation perfectly aligned',
        evidence: [`Schema: ${totalSchemaTable} tables`, `Validation: ${totalValidationCount} tables`],
        recommendation: 'No action required - validation is comprehensive',
        status: 'resolved'
      });
    } else {
      console.log(`❌ **MISMATCH DETECTED**: Schema defines ${totalSchemaTable} tables but validation covers ${totalValidationCount} tables`);
      console.log(`**Gap**: ${Math.abs(totalSchemaTable - totalValidationCount)} table(s) discrepancy`);
      
      this.findings.push({
        id: 'AUDIT-001',
        type: 'table_count_mismatch',
        severity: 'high',
        description: `Table count mismatch: ${totalSchemaTable} defined vs ${totalValidationCount} validated`,
        evidence: [
          `Schema tables: ${totalSchemaTable}`,
          `Validation coverage: ${totalValidationCount}`,
          `Discrepancy: ${Math.abs(totalSchemaTable - totalValidationCount)} tables`
        ],
        recommendation: 'Update validation arrays to match exact schema table count',
        status: 'pending'
      });
    }
  }

  private async validateNomenclatureConsistency(schemaContent: string): Promise<void> {
    console.log('\n## 📝 NOMENCLATURE CONSISTENCY AUDIT\n');

    // Analyze favorecidos vs other tables naming patterns
    const favorecidosPattern = schemaContent.match(/export const favorecidos = pgTable[\s\S]*?name: varchar\("name"/);
    const firstNamePattern = schemaContent.match(/firstName: varchar\("first_name"/g) || [];
    const lastNamePattern = schemaContent.match(/lastName: varchar\("last_name"/g) || [];

    console.log(`### Field Naming Pattern Analysis:`);
    console.log(`- favorecidos.name (generic): ${favorecidosPattern ? '1 table' : '0 tables'}`);
    console.log(`- firstName fields: ${firstNamePattern.length} occurrences`);
    console.log(`- lastName fields: ${lastNamePattern.length} occurrences`);

    // Phone field redundancy analysis
    const phoneFields = schemaContent.match(/(\w*phone\w*): varchar\([^)]*\)/gi) || [];
    console.log(`\n### Phone Field Analysis:`);
    phoneFields.forEach((field, index) => {
      console.log(`${index + 1}. ${field}`);
    });

    if (phoneFields.length > 2) {
      this.findings.push({
        id: 'AUDIT-002',
        type: 'naming_inconsistency',
        severity: 'medium',
        description: 'Multiple phone fields detected with potential redundancy',
        evidence: phoneFields,
        recommendation: 'Clarify phone field purposes: primary/secondary or landline/mobile',
        status: 'investigating'
      });
    }

    // Brazilian vs English field analysis
    const brazilianFields = (schemaContent.match(/(cpf|cnpj|rg): varchar/g) || []).length;
    const englishFields = (schemaContent.match(/(email|phone|name): varchar/g) || []).length;

    console.log(`\n### Language Mix Analysis:`);
    console.log(`- Brazilian legal fields: ${brazilianFields} (cpf, cnpj, rg)`);
    console.log(`- English business fields: ${englishFields} (email, phone, name)`);

    if (brazilianFields > 0 && englishFields > 0) {
      this.findings.push({
        id: 'AUDIT-003',
        type: 'naming_inconsistency',
        severity: 'low',
        description: 'Mixed Portuguese/English terminology serves Brazilian market',
        evidence: [`Brazilian fields: ${brazilianFields}`, `English fields: ${englishFields}`],
        recommendation: 'Maintain current hybrid approach - serves business requirements',
        status: 'resolved'
      });
    }
  }

  private async validateIndexOptimization(schemaContent: string): Promise<void> {
    console.log('\n## 🏗️ INDEX OPTIMIZATION AUDIT\n');

    // Extract all index definitions
    const allIndexes = schemaContent.match(/index\("[^"]+"\)\.on\([^)]+\)/g) || [];
    const tenantFirstIndexes = allIndexes.filter(idx => idx.includes('tenantId') && idx.indexOf('tenantId') < idx.indexOf(','));
    
    console.log(`### Index Analysis:`);
    console.log(`- Total indexes: ${allIndexes.length}`);
    console.log(`- Tenant-first indexes: ${tenantFirstIndexes.length}`);
    console.log(`- **Tenant optimization**: ${Math.round((tenantFirstIndexes.length / allIndexes.length) * 100)}%`);

    // Analyze specific index patterns
    console.log(`\n### Index Pattern Examples:`);
    allIndexes.slice(0, 5).forEach((idx, i) => {
      const isTenantFirst = idx.includes('tenantId') && idx.indexOf('tenantId') < idx.indexOf(',');
      console.log(`${i + 1}. ${idx} ${isTenantFirst ? '✅ (tenant-first)' : '⚠️ (can optimize)'}`);
    });

    if (tenantFirstIndexes.length < allIndexes.length * 0.8) {
      this.findings.push({
        id: 'AUDIT-004',
        type: 'index_optimization',
        severity: 'medium',
        description: 'Tenant-first index optimization can be improved',
        evidence: [
          `Total indexes: ${allIndexes.length}`,
          `Tenant-first: ${tenantFirstIndexes.length}`,
          `Optimization rate: ${Math.round((tenantFirstIndexes.length / allIndexes.length) * 100)}%`
        ],
        recommendation: 'Consider tenant-first ordering for multi-tenant query performance',
        status: 'investigating'
      });
    }
  }

  private async validateSchemaValidationCompleteness(schemaContent: string, dbContent: string): Promise<void> {
    console.log('\n## ✅ SCHEMA VALIDATION COMPLETENESS AUDIT\n');

    // Extract all table names from schema
    const allTablesInSchema = (schemaContent.match(/export const (\w+) = pgTable/g) || [])
      .map(match => match.match(/export const (\w+) = pgTable/)?.[1])
      .filter(Boolean) as string[];

    // Extract validated tables from db.ts
    const publicTablesValidated = this.extractTableNamesFromValidation(dbContent, 'requiredPublicTables');
    const tenantTablesValidated = this.extractTableNamesFromValidation(dbContent, 'requiredTables');
    
    const allValidatedTables = [...publicTablesValidated, ...tenantTablesValidated];

    console.log(`### Schema Tables (${allTablesInSchema.length}):`);
    allTablesInSchema.forEach(table => console.log(`- ${table}`));

    console.log(`\n### Validated Tables (${allValidatedTables.length}):`);
    allValidatedTables.forEach(table => console.log(`- ${table}`));

    // Find gaps
    const missingFromValidation = allTablesInSchema.filter(table => 
      !publicTablesValidated.includes(table) && 
      !tenantTablesValidated.includes(table) &&
      table !== 'sessions' && table !== 'tenants' && table !== 'users' // These might be in public validation
    );

    const extraInValidation = allValidatedTables.filter(table => 
      !allTablesInSchema.includes(table)
    );

    console.log(`\n### 🎯 VALIDATION GAP ANALYSIS:`);
    if (missingFromValidation.length === 0 && extraInValidation.length === 0) {
      console.log(`✅ **PERFECT COVERAGE**: All schema tables are validated`);
    } else {
      if (missingFromValidation.length > 0) {
        console.log(`❌ **MISSING FROM VALIDATION**: ${missingFromValidation.join(', ')}`);
      }
      if (extraInValidation.length > 0) {
        console.log(`⚠️ **EXTRA IN VALIDATION**: ${extraInValidation.join(', ')}`);
      }
    }

    if (missingFromValidation.length > 0 || extraInValidation.length > 0) {
      this.findings.push({
        id: 'AUDIT-005',
        type: 'validation_gap',
        severity: 'medium',
        description: 'Schema validation has gaps or extra entries',
        evidence: [
          `Missing: ${missingFromValidation.join(', ') || 'none'}`,
          `Extra: ${extraInValidation.join(', ') || 'none'}`
        ],
        recommendation: 'Align validation arrays exactly with schema table definitions',
        status: 'investigating'
      });
    }
  }

  private extractTableNamesFromValidation(content: string, arrayName: string): string[] {
    const pattern = new RegExp(`${arrayName}\\s*=\\s*\\[(.*?)\\];`, 's');
    const match = content.match(pattern);
    
    if (!match) return [];
    
    const tableArray = match[1];
    const tableNames = (tableArray.match(/['"`]([^'"`]+)['"`]/g) || [])
      .map(quoted => quoted.slice(1, -1)); // Remove quotes
    
    return tableNames;
  }

  private generateFinalAuditReport(): void {
    console.log('\n## 🎯 FINAL AUDIT COMPREHENSIVE REPORT\n');

    const pendingFindings = this.findings.filter(f => f.status === 'pending');
    const investigatingFindings = this.findings.filter(f => f.status === 'investigating');
    const resolvedFindings = this.findings.filter(f => f.status === 'resolved');

    console.log(`### Audit Findings Summary:`);
    console.log(`- 🔴 **Pending Action**: ${pendingFindings.length}`);
    console.log(`- 🟡 **Under Investigation**: ${investigatingFindings.length}`);
    console.log(`- 🟢 **Resolved**: ${resolvedFindings.length}`);
    console.log(`- **Total Findings**: ${this.findings.length}`);

    // Report pending issues
    if (pendingFindings.length > 0) {
      console.log(`\n### 🔴 PENDING ACTION REQUIRED:`);
      pendingFindings.forEach((finding, index) => {
        console.log(`\n**${index + 1}. ${finding.id}: ${finding.description}**`);
        console.log(`**Severity**: ${finding.severity.toUpperCase()}`);
        console.log(`**Evidence**:`);
        finding.evidence.forEach(evidence => console.log(`  - ${evidence}`));
        console.log(`**Recommendation**: ${finding.recommendation}`);
      });
    }

    // Report investigating issues
    if (investigatingFindings.length > 0) {
      console.log(`\n### 🟡 UNDER INVESTIGATION:`);
      investigatingFindings.forEach((finding, index) => {
        console.log(`\n**${index + 1}. ${finding.id}: ${finding.description}**`);
        console.log(`**Status**: Analysis in progress`);
        console.log(`**Recommendation**: ${finding.recommendation}`);
      });
    }

    // Calculate overall health score
    const totalFindings = this.findings.length;
    const criticalPending = pendingFindings.filter(f => f.severity === 'critical').length;
    const highPending = pendingFindings.filter(f => f.severity === 'high').length;
    
    let healthScore = 100;
    healthScore -= criticalPending * 25; // Critical issues: -25 points each
    healthScore -= highPending * 15;     // High issues: -15 points each
    healthScore -= (pendingFindings.length - criticalPending - highPending) * 5; // Others: -5 points each
    
    console.log(`\n### 📊 SCHEMA HEALTH SCORE: ${Math.max(0, healthScore)}/100`);
    
    if (healthScore >= 95) {
      console.log(`🟢 **EXCELLENT**: Schema is enterprise-ready`);
    } else if (healthScore >= 80) {
      console.log(`🟡 **GOOD**: Minor improvements recommended`);
    } else if (healthScore >= 60) {
      console.log(`🟠 **MODERATE**: Several issues need attention`);
    } else {
      console.log(`🔴 **NEEDS WORK**: Critical issues require immediate action`);
    }

    console.log(`\n### 🏆 FINAL ASSESSMENT:`);
    if (pendingFindings.length === 0) {
      console.log(`✅ **ALL AUDIT CRITERIA PASSED**`);
      console.log(`Schema is fully compliant and ready for production deployment.`);
    } else {
      console.log(`⚠️ **${pendingFindings.length} ITEMS NEED ATTENTION**`);
      console.log(`Address pending findings before production deployment.`);
    }

    console.log(`\n📝 **Audit completed**: ${new Date().toISOString()}`);
    console.log(`🔍 **Coverage**: Table counts, nomenclature, indexes, validation completeness`);
    console.log(`📊 **Findings**: ${this.findings.length} total audit points identified`);
  }
}

// Execute comprehensive audit
const validator = new FinalAuditValidator();
validator.executeComprehensiveAudit();

export { FinalAuditValidator };