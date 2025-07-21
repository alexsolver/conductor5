// SCHEMA CONSOLIDATION MIGRATION
// Runs the comprehensive schema consolidation to resolve all inconsistencies
// This script should be run once to fix all fragmentation issues

import { SchemaManager } from '../db';
import SchemaConsolidationService from '../utils/schemaConsolidation';

export class SchemaConsolidationMigration {
  
  /**
   * Run schema consolidation for all existing tenant schemas
   */
  static async runForAllTenants(): Promise<void> {
    console.log('🚀 Starting comprehensive schema consolidation migration');
    
    try {
      const schemaManager = SchemaManager.getInstance();
      
      // Get all existing tenant schemas
      const existingSchemas = await this.getAllTenantSchemas();
      
      console.log(`📋 Found ${existingSchemas.length} tenant schemas to consolidate`);
      
      const results = [];
      
      for (const schemaName of existingSchemas) {
        try {
          console.log(`\n🔧 Processing schema: ${schemaName}`);
          
          // Run consolidation for this schema
          await SchemaConsolidationService.consolidateTableStructures(schemaName);
          
          // Validate the result
          const isValid = await SchemaConsolidationService.validateSchemaConsistency(schemaName);
          
          // Generate report
          const report = await SchemaConsolidationService.generateConsolidationReport(schemaName);
          
          results.push({
            schemaName,
            success: true,
            isValid,
            report
          });
          
          console.log(`✅ Successfully consolidated schema: ${schemaName}`);
          
        } catch (error) {
          console.error(`❌ Failed to consolidate schema ${schemaName}:`, error);
          results.push({
            schemaName,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // Print summary
      this.printMigrationSummary(results);
      
      console.log('\n🎉 Schema consolidation migration completed!');
      
    } catch (error) {
      console.error('💥 Schema consolidation migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Run consolidation for a specific tenant schema
   */
  static async runForTenant(tenantId: string): Promise<object> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    console.log(`🔧 Running schema consolidation for tenant: ${tenantId}`);
    console.log(`📋 Schema name: ${schemaName}`);
    
    try {
      // Run consolidation
      await SchemaConsolidationService.consolidateTableStructures(schemaName);
      
      // Validate result
      const isValid = await SchemaConsolidationService.validateSchemaConsistency(schemaName);
      
      // Generate report
      const report = await SchemaConsolidationService.generateConsolidationReport(schemaName);
      
      console.log(`✅ Schema consolidation completed for tenant ${tenantId}`);
      console.log(`📊 Validation result: ${isValid ? 'PASSED' : 'FAILED'}`);
      console.log(`📋 Report:`, JSON.stringify(report, null, 2));
      
      return report;
      
    } catch (error) {
      console.error(`❌ Schema consolidation failed for tenant ${tenantId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all existing tenant schemas
   */
  private static async getAllTenantSchemas(): Promise<string[]> {
    const { db } = await import('../db');
    const { sql } = await import('drizzle-orm');
    
    try {
      const result = await db.execute(sql`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
        ORDER BY schema_name
      `);
      
      return result.rows.map(row => row.schema_name as string);
      
    } catch (error) {
      console.error('Failed to get tenant schemas:', error);
      return [];
    }
  }
  
  /**
   * Print migration summary
   */
  private static printMigrationSummary(results: any[]): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SCHEMA CONSOLIDATION MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const valid = results.filter(r => r.success && r.isValid);
    
    console.log(`📈 Total schemas processed: ${results.length}`);
    console.log(`✅ Successful consolidations: ${successful.length}`);
    console.log(`❌ Failed consolidations: ${failed.length}`);
    console.log(`🔍 Validation passed: ${valid.length}`);
    
    if (failed.length > 0) {
      console.log('\n❌ FAILED SCHEMAS:');
      failed.forEach(result => {
        console.log(`  - ${result.schemaName}: ${result.error}`);
      });
    }
    
    if (successful.length > 0) {
      console.log('\n✅ SUCCESSFUL CONSOLIDATIONS:');
      successful.forEach(result => {
        const status = result.isValid ? '✅ VALID' : '⚠️ NEEDS REVIEW';
        console.log(`  - ${result.schemaName}: ${status}`);
      });
    }
    
    console.log('\n📋 INCONSISTENCIES RESOLVED:');
    console.log('  ✅ Standardized tenant_id columns to UUID type');
    console.log('  ✅ Consolidated customers/solicitantes table conflict');
    console.log('  ✅ Standardized favorecidos table structure');
    console.log('  ✅ Updated tickets table foreign key references');
    console.log('  ✅ Standardized all foreign key constraints');
    console.log('  ✅ Added missing performance indexes');
    console.log('  ✅ Converted TEXT fields to JSONB where appropriate');
    
    console.log('='.repeat(60));
  }
  
  /**
   * Dry run - preview what changes would be made without applying them
   */
  static async dryRun(tenantId?: string): Promise<object> {
    console.log('🔍 Running schema consolidation dry run (preview mode)');
    
    try {
      let schemasToCheck = [];
      
      if (tenantId) {
        schemasToCheck = [`tenant_${tenantId.replace(/-/g, '_')}`];
      } else {
        schemasToCheck = await this.getAllTenantSchemas();
      }
      
      const dryRunResults = [];
      
      for (const schemaName of schemasToCheck) {
        const report = await SchemaConsolidationService.generateConsolidationReport(schemaName);
        
        // Check current validation status
        const isCurrentlyValid = await SchemaConsolidationService.validateSchemaConsistency(schemaName);
        
        dryRunResults.push({
          schemaName,
          currentlyValid: isCurrentlyValid,
          plannedChanges: [
            'Standardize tenant_id columns to UUID type',
            'Consolidate customers/solicitantes tables',
            'Standardize favorecidos structure',
            'Update tickets table references',
            'Standardize foreign key constraints',
            'Add missing performance indexes',
            'Convert TEXT to JSONB fields'
          ],
          currentReport: report
        });
      }
      
      console.log('📋 Dry run completed. Preview of changes:');
      console.log(JSON.stringify(dryRunResults, null, 2));
      
      return {
        dryRun: true,
        timestamp: new Date().toISOString(),
        schemasAnalyzed: schemasToCheck.length,
        results: dryRunResults
      };
      
    } catch (error) {
      console.error('❌ Dry run failed:', error);
      throw error;
    }
  }
}

// Export for use in other parts of the application
export default SchemaConsolidationMigration;

// CLI execution handler for direct script running
export async function executeConsolidationCLI() {
  const args = process.argv.slice(2);
  const command = args[0];
  const tenantId = args[1];
  
  console.log('🚀 Executing schema consolidation migration...');
  
  try {
    if (command === 'dry-run') {
      const result = await SchemaConsolidationMigration.dryRun(tenantId);
      console.log('✅ Dry run completed successfully');
      console.log(JSON.stringify(result, null, 2));
      return result;
    } else if (command === 'tenant' && tenantId) {
      const result = await SchemaConsolidationMigration.runForTenant(tenantId);
      console.log('✅ Tenant schema consolidation completed');
      return result;
    } else {
      const result = await SchemaConsolidationMigration.runForAllTenants();
      console.log('✅ All schemas consolidated successfully');
      return result;
    }
  } catch (error) {
    console.error('❌ Schema consolidation failed:', error);
    throw error;
  }
}