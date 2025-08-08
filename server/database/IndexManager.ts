// INDEX MANAGER - UNIFIED INDEX OPTIMIZATION SYSTEM
// Resolves duplicate indexes and implements tenant-first indexing strategy

import { sql } from 'drizzle-orm';
import { db } from '../db';

export class IndexManager {
  private static instance: IndexManager;

  static getInstance(): IndexManager {
    if (!IndexManager.instance) {
      IndexManager.instance = new IndexManager();
    }
    return IndexManager.instance;
  }

  // CRITICAL: Standardized index naming convention
  private readonly INDEX_NAMING_CONVENTION = {
    tenant_first: (table: string, columns: string[]) => `${table}_tenant_${columns.join('_')}_idx`,
    unique: (table: string, columns: string[]) => `${table}_tenant_${columns.join('_')}_unique`,
    performance: (table: string, purpose: string) => `${table}_tenant_${purpose}_perf_idx`,
    composite: (table: string, columns: string[], suffix?: string) => `${table}_tenant_${columns.join('_')}${suffix ? '_' + suffix : ''}_idx`
  };

  // CRITICAL: Standard tenant-first indexes for all multi-tenant tables
  private readonly STANDARD_INDEXES = {
    customers: [
      { name: 'customers_tenant_email_idx', columns: ['tenant_id', 'email'], type: 'performance' },
      { name: 'customers_tenant_active_idx', columns: ['tenant_id', 'active'], type: 'performance' },
      { name: 'customers_tenant_created_idx', columns: ['tenant_id', 'created_at DESC'], type: 'performance' },
      { name: 'customers_tenant_company_idx', columns: ['tenant_id', 'company'], type: 'performance' },
      { name: 'customers_tenant_verified_idx', columns: ['tenant_id', 'verified', 'active'], type: 'composite' }
    ],
    favorecidos: [
      { name: 'favorecidos_tenant_email_idx', columns: ['tenant_id', 'email'], type: 'performance' },
      { name: 'favorecidos_tenant_active_idx', columns: ['tenant_id', 'is_active'], type: 'performance' },
      { name: 'favorecidos_tenant_cpf_idx', columns: ['tenant_id', 'cpf_cnpj'], type: 'performance' },
      { name: 'favorecidos_tenant_type_idx', columns: ['tenant_id', 'contact_type'], type: 'performance' }
    ],
    tickets: [
      { name: 'tickets_tenant_status_priority_idx', columns: ['tenant_id', 'status', 'priority'], type: 'composite' },
      { name: 'tickets_tenant_assigned_idx', columns: ['tenant_id', 'assigned_to_id', 'status'], type: 'composite' },
      { name: 'tickets_tenant_created_idx', columns: ['tenant_id', 'created_at DESC'], type: 'performance' },
      { name: 'tickets_tenant_customer_idx', columns: ['tenant_id', 'customer_id', 'status'], type: 'composite' },
      { name: 'tickets_tenant_number_idx', columns: ['tenant_id', 'number'], type: 'performance' },
      { name: 'tickets_tenant_urgency_impact_idx', columns: ['tenant_id', 'urgency', 'impact'], type: 'composite' }
    ],
    ticket_messages: [
      { name: 'ticket_messages_tenant_ticket_idx', columns: ['tenant_id', 'ticket_id', 'created_at DESC'], type: 'composite' },
      { name: 'ticket_messages_tenant_author_idx', columns: ['tenant_id', 'author_id'], type: 'performance' }
    ],
    activity_logs: [
      { name: 'activity_logs_tenant_entity_time_idx', columns: ['tenant_id', 'entity_type', 'created_at DESC'], type: 'composite' },
      { name: 'activity_logs_tenant_user_idx', columns: ['tenant_id', 'user_id', 'created_at DESC'], type: 'composite' },
      { name: 'activity_logs_tenant_entity_id_idx', columns: ['tenant_id', 'entity_id', 'entity_type'], type: 'composite' }
    ],
    locations: [
      { name: 'locations_tenant_active_idx', columns: ['tenant_id', 'active'], type: 'performance' },
      { name: 'locations_tenant_name_idx', columns: ['tenant_id', 'name'], type: 'performance' },
      { name: 'locations_tenant_city_idx', columns: ['tenant_id', 'city'], type: 'performance' }
    ],
    customer_companies: [
      { name: 'customer_companies_tenant_name_idx', columns: ['tenant_id', 'name'], type: 'performance' },
      { name: 'customer_companies_tenant_active_idx', columns: ['tenant_id', 'status'], type: 'performance' }
    ],
    skills: [
      { name: 'skills_tenant_category_idx', columns: ['tenant_id', 'category', 'name'], type: 'composite' },
      { name: 'skills_tenant_active_idx', columns: ['tenant_id', 'is_active'], type: 'performance' }
    ],
    certifications: [
      { name: 'certifications_tenant_issuer_idx', columns: ['tenant_id', 'issuer', 'name'], type: 'composite' },
      { name: 'certifications_tenant_validity_idx', columns: ['tenant_id', 'validity_months'], type: 'performance' }
    ],
    user_skills: [
      { name: 'user_skills_tenant_user_idx', columns: ['tenant_id', 'user_id', 'current_level DESC'], type: 'composite' },
      { name: 'user_skills_tenant_skill_idx', columns: ['tenant_id', 'skill_id', 'current_level DESC'], type: 'composite' }
    ],
    external_contacts: [
      { name: 'external_contacts_tenant_type_idx', columns: ['tenant_id', 'type', 'email'], type: 'composite' },
      { name: 'external_contacts_tenant_active_idx', columns: ['tenant_id', 'is_active'], type: 'performance' }
    ],
    // projects: Completely removed - module eliminated from system
  };

  // Duplicate indexes to be removed
  private readonly DUPLICATE_INDEXES_TO_REMOVE = [
    'idx_customers_tenant_id_email', // Duplicate of customers_tenant_email_idx
    'idx_favorecidos_tenant_id_email', // Duplicate of favorecidos_tenant_email_idx
    'tenant_customer_email_index', // Old naming convention
    'customer_tenant_idx', // Non-standard naming
    'idx_customers_tenant_id', // Replaced by more specific indexes
    'idx_favorecidos_tenant_id', // Replaced by more specific indexes
    'idx_tickets_tenant_id', // Replaced by composite indexes
    'tickets_tenant_id_idx' // Replaced by composite indexes
  ];

  // Unify all indexes across tenant schemas
  async unifyAllIndexes(): Promise<void> {
    console.log('🔧 Starting index unification process...');

    try {
      const schemas = await this.getAllTenantSchemas();
      
      for (const schemaName of schemas) {
        console.log(`📊 Unifying indexes for schema: ${schemaName}`);
        await this.unifySchemaIndexes(schemaName);
      }

      console.log('✅ Index unification completed successfully');
    } catch (error) {
      console.error('❌ Error during index unification:', error);
      throw error;
    }
  }

  // Get all tenant schemas
  private async getAllTenantSchemas(): Promise<string[]> {
    const result = await db.execute(sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
    `);

    return result.rows.map(row => row.schema_name as string);
  }

  // Unify indexes for a specific schema
  private async unifySchemaIndexes(schemaName: string): Promise<void> {
    try {
      // 1. Remove duplicate/conflicting indexes
      await this.removeDuplicateIndexes(schemaName);

      // 2. Create standardized tenant-first indexes
      await this.createStandardIndexes(schemaName);

      // 3. Analyze performance impact
      await this.analyzeIndexPerformance(schemaName);

      console.log(`✅ Indexes unified for schema: ${schemaName}`);
    } catch (error) {
      console.error(`❌ Error unifying indexes for ${schemaName}:`, error);
      throw error;
    }
  }

  // Remove duplicate and conflicting indexes
  private async removeDuplicateIndexes(schemaName: string): Promise<void> {
    console.log(`🗑️ Removing duplicate indexes from ${schemaName}...`);

    for (const indexName of this.DUPLICATE_INDEXES_TO_REMOVE) {
      try {
        await db.execute(sql.raw(`
          DROP INDEX IF EXISTS ${schemaName}.${indexName}
        `));
        console.log(`  ✅ Removed duplicate index: ${indexName}`);
      } catch (error) {
        // Log but continue - index might not exist
        console.log(`  ⚠️ Could not remove index ${indexName}: ${error.message}`);
      }
    }

    // Remove indexes with problematic naming patterns
    const problematicIndexes = await db.execute(sql`
      SELECT indexname
      FROM pg_indexes 
      WHERE schemaname = ${schemaName}
      AND (
        indexname LIKE 'idx_tenant_%_tickets_tenant_%' OR
        indexname LIKE '%_tenant_id_idx' OR
        indexname LIKE 'tenant_%_idx' OR
        (indexname LIKE '%tenant%' AND indexname NOT LIKE '%_tenant_%_idx')
      )
    `);

    for (const row of problematicIndexes.rows) {
      const indexName = row.indexname as string;
      try {
        await db.execute(sql.raw(`
          DROP INDEX IF EXISTS ${schemaName}.${indexName}
        `));
        console.log(`  ✅ Removed problematic index: ${indexName}`);
      } catch (error) {
        console.log(`  ⚠️ Could not remove problematic index ${indexName}: ${error.message}`);
      }
    }
  }

  // Create standardized tenant-first indexes
  private async createStandardIndexes(schemaName: string): Promise<void> {
    console.log(`📊 Creating standardized indexes for ${schemaName}...`);

    for (const [tableName, indexes] of Object.entries(this.STANDARD_INDEXES)) {
      // Check if table exists in this schema
      const tableExists = await this.checkTableExists(schemaName, tableName);
      if (!tableExists) {
        console.log(`  ⚠️ Table ${tableName} does not exist in ${schemaName}, skipping`);
        continue;
      }

      for (const indexConfig of indexes) {
        try {
          const columnsClause = indexConfig.columns.join(', ');
          
          await db.execute(sql.raw(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexConfig.name} 
            ON ${schemaName}.${tableName} (${columnsClause})
          `));
          
          console.log(`  ✅ Created index: ${indexConfig.name} on ${tableName}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`  ✓ Index already exists: ${indexConfig.name}`);
          } else {
            console.error(`  ❌ Error creating index ${indexConfig.name}:`, error.message);
          }
        }
      }
    }
  }

  // Analyze index performance and usage
  private async analyzeIndexPerformance(schemaName: string): Promise<void> {
    try {
      // Update table statistics for better query planning
      const tables = Object.keys(this.STANDARD_INDEXES);
      
      for (const tableName of tables) {
        const tableExists = await this.checkTableExists(schemaName, tableName);
        if (tableExists) {
          await db.execute(sql.raw(`ANALYZE ${schemaName}.${tableName}`));
        }
      }

      console.log(`📈 Performance analysis completed for ${schemaName}`);
    } catch (error) {
      console.error(`❌ Error analyzing performance for ${schemaName}:`, error.message);
    }
  }

  // Check if table exists in schema
  private async checkTableExists(schemaName: string, tableName: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables 
        WHERE table_schema = ${schemaName} AND table_name = ${tableName}
      `);

      return (result.rows[0]?.table_count as number) >= 1;
    } catch {
      return false;
    }
  }

  // Generate comprehensive index report
  async generateIndexReport(): Promise<{
    totalSchemas: number;
    totalIndexes: number;
    duplicatesFound: number;
    standardIndexes: number;
    issues: string[];
  }> {
    console.log('📊 Generating comprehensive index report...');
    
    const report = {
      totalSchemas: 0,
      totalIndexes: 0,
      duplicatesFound: 0,
      standardIndexes: 0,
      issues: [] as string[]
    };

    try {
      const schemas = await this.getAllTenantSchemas();
      report.totalSchemas = schemas.length;

      for (const schemaName of schemas) {
        // Count total indexes
        const indexCount = await db.execute(sql`
          SELECT COUNT(*) as index_count
          FROM pg_indexes 
          WHERE schemaname = ${schemaName}
          AND indexname LIKE '%tenant%'
        `);
        
        report.totalIndexes += (indexCount.rows[0]?.index_count as number) || 0;

        // Check for duplicates
        const duplicates = await db.execute(sql`
          SELECT indexname
          FROM pg_indexes 
          WHERE schemaname = ${schemaName}
          AND indexname ~ '(idx_.*_tenant_|tenant_.*_index|.*_tenant_id_idx)'
        `);

        report.duplicatesFound += duplicates.rows.length;

        // Check for missing standard indexes
        for (const [tableName, indexes] of Object.entries(this.STANDARD_INDEXES)) {
          const tableExists = await this.checkTableExists(schemaName, tableName);
          if (!tableExists) continue;

          for (const indexConfig of indexes) {
            const indexExists = await db.execute(sql`
              SELECT COUNT(*) as exists
              FROM pg_indexes 
              WHERE schemaname = ${schemaName}
              AND tablename = ${tableName}
              AND indexname = ${indexConfig.name}
            `);

            if ((indexExists.rows[0]?.exists as number) > 0) {
              report.standardIndexes++;
            } else {
              report.issues.push(`❌ Missing standard index: ${indexConfig.name} on ${schemaName}.${tableName}`);
            }
          }
        }
      }

      console.log(`📊 Index report generated: ${report.totalIndexes} total indexes across ${report.totalSchemas} schemas`);
      return report;
    } catch (error) {
      console.error('❌ Error generating index report:', error);
      report.issues.push(`Report generation failed: ${error.message}`);
      return report;
    }
  }

  // Validate index consistency across all schemas
  async validateIndexConsistency(): Promise<{
    valid: boolean;
    issues: string[];
    summary: any;
  }> {
    console.log('🔍 Validating index consistency across all tenant schemas...');
    
    const issues: string[] = [];
    const summary = {
      schemasChecked: 0,
      indexesValidated: 0,
      duplicatesFound: 0,
      missingStandardIndexes: 0
    };

    try {
      const schemas = await this.getAllTenantSchemas();
      summary.schemasChecked = schemas.length;

      for (const schemaName of schemas) {
        // Check for duplicate naming patterns
        const duplicateCheck = await this.checkDuplicateIndexes(schemaName);
        issues.push(...duplicateCheck);
        summary.duplicatesFound += duplicateCheck.length;

        // Check for missing standard indexes  
        const missingCheck = await this.checkMissingStandardIndexes(schemaName);
        issues.push(...missingCheck);
        summary.missingStandardIndexes += missingCheck.length;

        summary.indexesValidated += Object.values(this.STANDARD_INDEXES).flat().length;
      }

      const valid = issues.length === 0;
      console.log(`🔍 Index validation complete: ${valid ? '✅ CONSISTENT' : '❌ ISSUES FOUND'}`);
      
      return { valid, issues, summary };
    } catch (error) {
      console.error('❌ Error during index validation:', error);
      return { 
        valid: false, 
        issues: [`Validation failed: ${error.message}`], 
        summary 
      };
    }
  }

  // Check for duplicate indexes in a schema
  private async checkDuplicateIndexes(schemaName: string): Promise<string[]> {
    const issues: string[] = [];

    // Check for known duplicate patterns
    for (const duplicateIndex of this.DUPLICATE_INDEXES_TO_REMOVE) {
      const exists = await db.execute(sql`
        SELECT COUNT(*) as exists
        FROM pg_indexes 
        WHERE schemaname = ${schemaName}
        AND indexname = ${duplicateIndex}
      `);

      if ((exists.rows[0]?.exists as number) > 0) {
        issues.push(`🚨 Duplicate index found: ${schemaName}.${duplicateIndex}`);
      }
    }

    return issues;
  }

  // Check for missing standard indexes in a schema
  private async checkMissingStandardIndexes(schemaName: string): Promise<string[]> {
    const issues: string[] = [];

    for (const [tableName, indexes] of Object.entries(this.STANDARD_INDEXES)) {
      const tableExists = await this.checkTableExists(schemaName, tableName);
      if (!tableExists) continue;

      for (const indexConfig of indexes) {
        const indexExists = await db.execute(sql`
          SELECT COUNT(*) as exists
          FROM pg_indexes 
          WHERE schemaname = ${schemaName}
          AND tablename = ${tableName}
          AND indexname = ${indexConfig.name}
        `);

        if ((indexExists.rows[0]?.exists as number) === 0) {
          issues.push(`❌ Missing standard index: ${indexConfig.name} on ${schemaName}.${tableName}`);
        }
      }
    }

    return issues;
  }
}

// Export singleton instance
export const indexManager = IndexManager.getInstance();