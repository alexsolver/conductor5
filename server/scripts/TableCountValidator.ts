// TABLE COUNT VALIDATION SYSTEM
// Validates correct counting of PUBLIC vs TENANT tables as per schema-master.ts

import { readFileSync } from 'fs';
import { join } from 'path';

class TableCountValidator {
  private schemaPath = join(process.cwd(), 'shared', 'schema-master.ts');
  private dbPath = join(process.cwd(), 'server', 'db.ts');

  async validateTableCounts(): Promise<void> {
    console.log('# TABLE COUNT VALIDATION REPORT');
    console.log(`Generated: ${new Date().toISOString()}\n`);

    try {
      // 1. Analyze schema-master.ts for actual table definitions
      const schemaTables = await this.extractSchemaTablesWithLines();
      
      // 2. Analyze server/db.ts for validation logic
      const dbValidation = await this.extractDbValidationLogic();
      
      // 3. Compare and report inconsistencies
      this.compareAndReport(schemaTables, dbValidation);
      
    } catch (error) {
      console.error('Error during table count validation:', error);
    }
  }

  private async extractSchemaTablesWithLines(): Promise<{public: any[], tenant: any[], total: number}> {
    const schemaContent = readFileSync(this.schemaPath, 'utf-8');
    const lines = schemaContent.split('\n');
    
    const tableExports: any[] = [];
    
    // Find all table definitions with line numbers
    lines.forEach((line, index) => {
      if (line.includes('export const') && line.includes('= pgTable(')) {
        const match = line.match(/export const (\w+) = pgTable\("(\w+)"/);
        if (match) {
          tableExports.push({
            constName: match[1],
            tableName: match[2],
            lineNumber: index + 1
          });
        }
      }
    });

    // Classify tables based on schema location analysis
    const publicTables = tableExports.filter(table => 
      ['sessions', 'tenants', 'users'].includes(table.constName)
    );
    
    const tenantTables = tableExports.filter(table => 
      !['sessions', 'tenants', 'users'].includes(table.constName)
    );

    console.log('## 📊 SCHEMA-MASTER.TS ANALYSIS\n');
    console.log(`### PUBLIC SCHEMA TABLES (${publicTables.length}):`);
    publicTables.forEach(table => {
      console.log(`- ${table.constName} ("${table.tableName}") - line ${table.lineNumber}`);
    });
    
    console.log(`\n### TENANT SCHEMA TABLES (${tenantTables.length}):`);
    tenantTables.forEach(table => {
      console.log(`- ${table.constName} ("${table.tableName}") - line ${table.lineNumber}`);
    });
    
    console.log(`\n### TOTAL TABLES: ${tableExports.length}\n`);

    return {
      public: publicTables,
      tenant: tenantTables,
      total: tableExports.length
    };
  }

  private async extractDbValidationLogic(): Promise<{publicCount: number, tenantCount: number, publicTables: string[], tenantTables: string[]}> {
    const dbContent = readFileSync(this.dbPath, 'utf-8');
    
    console.log('## 🔍 SERVER/DB.TS VALIDATION ANALYSIS\n');
    
    // Extract public tables validation
    const publicTablesMatch = dbContent.match(/const requiredPublicTables = \[(.*?)\]/s);
    let publicTables: string[] = [];
    if (publicTablesMatch) {
      publicTables = publicTablesMatch[1]
        .split(',')
        .map(item => item.trim().replace(/['"]/g, ''))
        .filter(item => item.length > 0);
    }
    
    // Extract tenant tables validation
    const tenantTablesMatch = dbContent.match(/const requiredTables = \[(.*?)\]/s);
    let tenantTables: string[] = [];
    if (tenantTablesMatch) {
      tenantTables = tenantTablesMatch[1]
        .split(',')
        .map(item => item.trim().replace(/['"]/g, ''))
        .filter(item => item.length > 0);
    }

    console.log(`### PUBLIC TABLES VALIDATION (${publicTables.length}):`);
    publicTables.forEach(table => {
      console.log(`- "${table}"`);
    });
    
    console.log(`\n### TENANT TABLES VALIDATION (${tenantTables.length}):`);
    tenantTables.forEach(table => {
      console.log(`- "${table}"`);
    });
    
    console.log(`\n### TOTAL VALIDATED: ${publicTables.length + tenantTables.length}\n`);

    return {
      publicCount: publicTables.length,
      tenantCount: tenantTables.length,
      publicTables,
      tenantTables
    };
  }

  private compareAndReport(schemaTables: any, dbValidation: any): void {
    console.log('## 🎯 COMPARISON RESULTS\n');
    
    const schemaTotal = schemaTables.total;
    const validationTotal = dbValidation.publicCount + dbValidation.tenantCount;
    
    console.log('### COUNT COMPARISON:');
    console.log(`- Schema defines: ${schemaTotal} tables total`);
    console.log(`  - Public: ${schemaTables.public.length}`);
    console.log(`  - Tenant: ${schemaTables.tenant.length}`);
    console.log(`- Validation checks: ${validationTotal} tables total`);
    console.log(`  - Public: ${dbValidation.publicCount}`);
    console.log(`  - Tenant: ${dbValidation.tenantCount}`);
    
    // Check for discrepancies
    const countMatch = schemaTotal === validationTotal;
    const publicMatch = schemaTables.public.length === dbValidation.publicCount;
    const tenantMatch = schemaTables.tenant.length === dbValidation.tenantCount;
    
    console.log('\n### CONSISTENCY CHECK:');
    console.log(`- Total count match: ${countMatch ? '✅' : '❌'}`);
    console.log(`- Public count match: ${publicMatch ? '✅' : '❌'}`);
    console.log(`- Tenant count match: ${tenantMatch ? '✅' : '❌'}`);
    
    if (!countMatch || !publicMatch || !tenantMatch) {
      console.log('\n### ❌ INCONSISTENCIES DETECTED:');
      
      if (!countMatch) {
        console.log(`- Total count mismatch: Schema has ${schemaTotal}, validation checks ${validationTotal}`);
      }
      
      if (!publicMatch) {
        console.log(`- Public count mismatch: Schema has ${schemaTables.public.length}, validation checks ${dbValidation.publicCount}`);
      }
      
      if (!tenantMatch) {
        console.log(`- Tenant count mismatch: Schema has ${schemaTables.tenant.length}, validation checks ${dbValidation.tenantCount}`);
      }
      
      console.log('\n### 🔧 RECOMMENDED FIXES:');
      console.log('1. Update server/db.ts requiredPublicTables to match schema public tables');
      console.log('2. Update server/db.ts requiredTables to match schema tenant tables');
      console.log('3. Ensure all table names match exactly between schema and validation');
    } else {
      console.log('\n✅ ALL COUNTS MATCH - TABLE VALIDATION IS CONSISTENT');
    }
    
    // Detailed table-by-table comparison
    console.log('\n### 📋 DETAILED TABLE MAPPING:');
    
    // Check public tables
    const schemaPublicNames = schemaTables.public.map((t: any) => t.tableName);
    const missingPublic = schemaPublicNames.filter((name: string) => !dbValidation.publicTables.includes(name));
    const extraPublic = dbValidation.publicTables.filter(name => !schemaPublicNames.includes(name));
    
    if (missingPublic.length > 0) {
      console.log(`❌ Public tables in schema but not validated: ${missingPublic.join(', ')}`);
    }
    if (extraPublic.length > 0) {
      console.log(`❌ Public tables validated but not in schema: ${extraPublic.join(', ')}`);
    }
    
    // Check tenant tables  
    const schemaTenantNames = schemaTables.tenant.map((t: any) => t.tableName);
    const missingTenant = schemaTenantNames.filter((name: string) => !dbValidation.tenantTables.includes(name));
    const extraTenant = dbValidation.tenantTables.filter(name => !schemaTenantNames.includes(name));
    
    if (missingTenant.length > 0) {
      console.log(`❌ Tenant tables in schema but not validated: ${missingTenant.join(', ')}`);
    }
    if (extraTenant.length > 0) {
      console.log(`❌ Tenant tables validated but not in schema: ${extraTenant.join(', ')}`);
    }
    
    if (missingPublic.length === 0 && extraPublic.length === 0 && 
        missingTenant.length === 0 && extraTenant.length === 0) {
      console.log('✅ All table names match between schema and validation');
    }
  }
}

// Execute validation
const validator = new TableCountValidator();
validator.validateTableCounts();

export { TableCountValidator };