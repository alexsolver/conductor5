// SCHEMA VALIDATION INCONSISTENCIES RESOLVER
// Resolves discrepancies between schema-master.ts definitions and db.ts validation

import { readFileSync } from 'fs';
import { join } from 'path';

interface TableDefinition {
  name: string;
  dbTableName: string;
  isPublicSchema: boolean;
  lineNumber: number;
}

class SchemaValidationResolver {
  private schemaContent: string;
  private dbContent: string;

  constructor() {
    const schemaPath = join(process.cwd(), 'shared', 'schema-master.ts');
    const dbPath = join(process.cwd(), 'server', 'db.ts');
    
    this.schemaContent = readFileSync(schemaPath, 'utf-8');
    this.dbContent = readFileSync(dbPath, 'utf-8');
  }

  extractTablesFromSchema(): TableDefinition[] {
    const tables: TableDefinition[] = [];
    const lines = this.schemaContent.split('\n');
    
    // Extract all table definitions with proper categorization
    const tableRegex = /export const (\w+) = pgTable\("([^"]+)"/g;
    let match;
    
    while ((match = tableRegex.exec(this.schemaContent)) !== null) {
      const tableName = match[1];
      const dbTableName = match[2];
      const lineNumber = this.schemaContent.substring(0, match.index).split('\n').length;
      
      // Determine if it's a public schema table based on position in file
      const isPublicSchema = this.isPublicSchemaTable(tableName, lineNumber);
      
      tables.push({
        name: tableName,
        dbTableName,
        isPublicSchema,
        lineNumber
      });
    }

    return tables;
  }

  private isPublicSchemaTable(tableName: string, lineNumber: number): boolean {
    // Public schema tables are defined before "TENANT-SPECIFIC SCHEMA TABLES" comment
    const tenantSectionLine = this.schemaContent.indexOf('TENANT-SPECIFIC SCHEMA TABLES');
    const tableLine = this.schemaContent.split('\n').slice(0, lineNumber).join('\n').length;
    
    return tableLine < tenantSectionLine || ['sessions', 'tenants', 'users'].includes(tableName);
  }

  extractValidationTablesFromDb(): { 
    publicTables: string[], 
    tenantTables: string[] 
  } {
    // Extract required public tables
    const publicMatch = this.dbContent.match(/requiredPublicTables = \[([\s\S]*?)\]/);
    const publicTables = publicMatch 
      ? publicMatch[1].split(',').map(t => t.trim().replace(/['"`]/g, ''))
      : [];

    // Extract required tenant tables
    const tenantMatch = this.dbContent.match(/requiredTables = \[([\s\S]*?)\]/);
    const tenantTables = tenantMatch 
      ? tenantMatch[1].split(',').map(t => t.trim().replace(/['"`]/g, ''))
      : [];

    return { publicTables, tenantTables };
  }

  analyzeInconsistencies(): {
    schemaTables: TableDefinition[],
    validationTables: { publicTables: string[], tenantTables: string[] },
    inconsistencies: {
      missingFromValidation: string[],
      extraInValidation: string[],
      publicMismatches: string[],
      tenantMismatches: string[]
    }
  } {
    const schemaTables = this.extractTablesFromSchema();
    const validationTables = this.extractValidationTablesFromDb();

    const schemaPublic = schemaTables.filter(t => t.isPublicSchema).map(t => t.dbTableName);
    const schemaTenant = schemaTables.filter(t => !t.isPublicSchema).map(t => t.dbTableName);

    const inconsistencies = {
      missingFromValidation: [] as string[],
      extraInValidation: [] as string[],
      publicMismatches: [] as string[],
      tenantMismatches: [] as string[]
    };

    // Check public schema mismatches
    inconsistencies.publicMismatches = [
      ...schemaPublic.filter(t => !validationTables.publicTables.includes(t)),
      ...validationTables.publicTables.filter(t => !schemaPublic.includes(t))
    ];

    // Check tenant schema mismatches
    inconsistencies.tenantMismatches = [
      ...schemaTenant.filter(t => !validationTables.tenantTables.includes(t)),
      ...validationTables.tenantTables.filter(t => !schemaTenant.includes(t))
    ];

    // Overall missing/extra tables
    const allSchemaTables = schemaTables.map(t => t.dbTableName);
    const allValidationTables = [...validationTables.publicTables, ...validationTables.tenantTables];

    inconsistencies.missingFromValidation = allSchemaTables.filter(t => !allValidationTables.includes(t));
    inconsistencies.extraInValidation = allValidationTables.filter(t => !allSchemaTables.includes(t));

    return {
      schemaTables,
      validationTables,
      inconsistencies
    };
  }

  generateResolutionReport(): string {
    const analysis = this.analyzeInconsistencies();
    
    let report = `# SCHEMA VALIDATION INCONSISTENCIES RESOLUTION REPORT\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    // Schema Analysis
    report += `## 📊 SCHEMA ANALYSIS\n`;
    report += `Total tables in schema-master.ts: ${analysis.schemaTables.length}\n`;
    report += `Public schema tables: ${analysis.schemaTables.filter(t => t.isPublicSchema).length}\n`;
    report += `Tenant-specific tables: ${analysis.schemaTables.filter(t => !t.isPublicSchema).length}\n\n`;

    // Validation Analysis
    report += `## 🔍 VALIDATION ANALYSIS\n`;
    report += `Public tables validated: ${analysis.validationTables.publicTables.length}\n`;
    report += `Tenant tables validated: ${analysis.validationTables.tenantTables.length}\n`;
    report += `Total validation coverage: ${analysis.validationTables.publicTables.length + analysis.validationTables.tenantTables.length}\n\n`;

    // Table Listings
    report += `## 📋 SCHEMA DEFINITIONS\n`;
    report += `### Public Schema Tables:\n`;
    analysis.schemaTables.filter(t => t.isPublicSchema).forEach(table => {
      report += `- **${table.name}** (${table.dbTableName}) - Line ${table.lineNumber}\n`;
    });

    report += `\n### Tenant-Specific Tables:\n`;
    analysis.schemaTables.filter(t => !t.isPublicSchema).forEach(table => {
      report += `- **${table.name}** (${table.dbTableName}) - Line ${table.lineNumber}\n`;
    });

    // Inconsistencies
    report += `\n## ❌ INCONSISTENCIES DETECTED\n`;
    
    if (analysis.inconsistencies.publicMismatches.length > 0) {
      report += `### Public Schema Mismatches:\n`;
      analysis.inconsistencies.publicMismatches.forEach(table => {
        report += `- ${table}\n`;
      });
    }

    if (analysis.inconsistencies.tenantMismatches.length > 0) {
      report += `### Tenant Schema Mismatches:\n`;
      analysis.inconsistencies.tenantMismatches.forEach(table => {
        report += `- ${table}\n`;
      });
    }

    if (analysis.inconsistencies.missingFromValidation.length > 0) {
      report += `### Missing from Validation:\n`;
      analysis.inconsistencies.missingFromValidation.forEach(table => {
        report += `- ${table}\n`;
      });
    }

    if (analysis.inconsistencies.extraInValidation.length > 0) {
      report += `### Extra in Validation:\n`;
      analysis.inconsistencies.extraInValidation.forEach(table => {
        report += `- ${table}\n`;
      });
    }

    // Resolution Status
    const totalInconsistencies = Object.values(analysis.inconsistencies).reduce((sum, arr) => sum + arr.length, 0);
    
    if (totalInconsistencies === 0) {
      report += `\n## ✅ RESOLUTION STATUS: FULLY CONSISTENT\n`;
      report += `All schema definitions match validation requirements.\n`;
      report += `Public validation: ${analysis.validationTables.publicTables.length} tables\n`;
      report += `Tenant validation: ${analysis.validationTables.tenantTables.length} tables\n`;
    } else {
      report += `\n## ⚠️ RESOLUTION STATUS: ${totalInconsistencies} INCONSISTENCIES FOUND\n`;
      report += `Immediate action required to align validation with schema definitions.\n`;
    }

    return report;
  }
}

// Execute analysis
const resolver = new SchemaValidationResolver();
const report = resolver.generateResolutionReport();

console.log(report);

export { SchemaValidationResolver };