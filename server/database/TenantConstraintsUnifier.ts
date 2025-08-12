// TENANT CONSTRAINTS UNIFIER - CRITICAL SECURITY STANDARDIZATION
// Resolves inconsistent tenant_id validation and unique constraints across all schemas

import { sql } from 'drizzle-orm';
import { db } from '../db';

export class TenantConstraintsUnifier {
  private static instance: TenantConstraintsUnifier;

  static getInstance(): TenantConstraintsUnifier {
    if (!TenantConstraintsUnifier.instance) {
      TenantConstraintsUnifier.instance = new TenantConstraintsUnifier();
    }
    return TenantConstraintsUnifier.instance;
  }

  // CRITICAL: Standardized tenant_id validation pattern
  private readonly STANDARD_TENANT_ID_CHECK = "CHECK (LENGTH(tenant_id::text) = 36 AND tenant_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$')";

  // CRITICAL: Multi-tenant safe unique constraints definition
  private readonly MULTI_TENANT_CONSTRAINTS = {
    customers: [
      'UNIQUE (tenant_id, email)',
      'UNIQUE (tenant_id, external_id) WHERE external_id IS NOT NULL'
    ],
    favorecidos: [
      'UNIQUE (tenant_id, email)',
      'UNIQUE (tenant_id, cpf_cnpj) WHERE cpf_cnpj IS NOT NULL'
    ],
    tickets: [
      'UNIQUE (tenant_id, number)',
      'UNIQUE (tenant_id, external_reference) WHERE external_reference IS NOT NULL'
    ],
    users: [
      'UNIQUE (tenant_id, email)',
      'UNIQUE (tenant_id, username) WHERE username IS NOT NULL'
    ],
    locations: [
      'UNIQUE (tenant_id, name)',
      'UNIQUE (tenant_id, external_id) WHERE external_id IS NOT NULL'
    ],
    customer_companies: [
      'UNIQUE (tenant_id, name)',
      'UNIQUE (tenant_id, registration_number) WHERE registration_number IS NOT NULL'
    ],
    skills: [
      'UNIQUE (tenant_id, name, category)',
      'UNIQUE (tenant_id, external_code) WHERE external_code IS NOT NULL'
    ],
    certifications: [
      'UNIQUE (tenant_id, name, issuer)',
      'UNIQUE (tenant_id, external_id) WHERE external_id IS NOT NULL'
    ],
    external_contacts: [
      'UNIQUE (tenant_id, email, type)',
      'UNIQUE (tenant_id, external_reference) WHERE external_reference IS NOT NULL'
    ],
    user_skills: [
      'UNIQUE (tenant_id, user_id, skill_id)'
    ],
    company_memberships: [
      'UNIQUE (tenant_id, customer_id, company_id)'
    ]
  };

  // CRITICAL: Unify all tenant constraints across all schemas
  async unifyAllTenantConstraints(): Promise<void> {
    console.log('🔒 Starting tenant constraints unification...');

    try {
      // Get all tenant schemas
      const schemas = await this.getAllTenantSchemas();
      
      for (const schemaName of schemas) {
        console.log(`🛡️ Unifying constraints for schema: ${schemaName}`);
        await this.unifySchemaConstraints(schemaName);
      }

      console.log('✅ Tenant constraints unification completed successfully');
    } catch (error) {
      console.error('❌ Error during constraints unification:', error);
      throw error;
    }
  }

  // Get all existing tenant schemas
  private async getAllTenantSchemas(): Promise<string[]> {
    const result = await db.execute(sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
    `);

    return result.rows.map(row => row.schema_name as string);
  }

  // Unify constraints for a specific schema
  private async unifySchemaConstraints(schemaName: string): Promise<void> {
    try {
      // 1. Drop all existing inconsistent constraints
      await this.dropInconsistentConstraints(schemaName);

      // 2. Apply standardized tenant_id validation constraints
      await this.applyStandardTenantIdConstraints(schemaName);

      // 3. Apply multi-tenant safe unique constraints
      await this.applyMultiTenantUniqueConstraints(schemaName);

      console.log(`✅ Constraints unified for schema: ${schemaName}`);
    } catch (error) {
      console.error(`❌ Error unifying constraints for ${schemaName}:`, error);
      throw error;
    }
  }

  // CRITICAL: Drop inconsistent constraints that compromise multi-tenant isolation
  private async dropInconsistentConstraints(schemaName: string): Promise<void> {
    const schemaId = sql.identifier(schemaName);

    // Get all constraint names that need to be dropped
    const constraints = await db.execute(sql`
      SELECT constraint_name, table_name
      FROM information_schema.table_constraints 
      WHERE table_schema = ${schemaName}
      AND constraint_type IN ('CHECK', 'UNIQUE')
      AND (
        -- Drop old tenant_id format constraints
        constraint_name LIKE '%tenant_id%' OR
        -- Drop unsafe unique constraints without tenant_id
        (constraint_type = 'UNIQUE' AND constraint_name NOT LIKE '%tenant%')
      )
    `);

    for (const constraint of constraints.rows) {
      const tableName = constraint.table_name as string;
      const constraintName = constraint.constraint_name as string;
      
      try {
        await db.execute(sql.raw(`
          ALTER TABLE ${schemaName}.${tableName} 
          DROP CONSTRAINT IF EXISTS "${constraintName}"
        `));
        console.log(`🗑️ Dropped constraint: ${constraintName} from ${tableName}`);
      } catch (error) {
        // Log but continue - constraint might not exist
        console.log(`⚠️ Could not drop constraint ${constraintName}: ${error.message}`);
      }
    }
  }

  // Apply standardized tenant_id validation constraints
  private async applyStandardTenantIdConstraints(schemaName: string): Promise<void> {
    const tables = Object.keys(this.MULTI_TENANT_CONSTRAINTS);

    for (const tableName of tables) {
      try {
        // Check if table exists in this schema
        const tableExists = await this.checkTableExists(schemaName, tableName);
        if (!tableExists) {
          console.log(`⚠️ Table ${tableName} does not exist in ${schemaName}, skipping`);
          continue;
        }

        const constraintName = `${tableName}_tenant_id_uuid_format`;
        
        await db.execute(sql.raw(`
          ALTER TABLE ${schemaName}.${tableName} 
          ADD CONSTRAINT ${constraintName} ${this.STANDARD_TENANT_ID_CHECK}
        `));
        
        console.log(`✅ Applied tenant_id constraint to ${tableName}: ${constraintName}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`✓ Tenant_id constraint already exists for ${tableName}`);
        } else {
          console.error(`❌ Error applying tenant_id constraint to ${tableName}:`, error.message);
        }
      }
    }
  }

  // Apply multi-tenant safe unique constraints
  private async applyMultiTenantUniqueConstraints(schemaName: string): Promise<void> {
    for (const [tableName, constraints] of Object.entries(this.MULTI_TENANT_CONSTRAINTS)) {
      try {
        // Check if table exists in this schema
        const tableExists = await this.checkTableExists(schemaName, tableName);
        if (!tableExists) {
          console.log(`⚠️ Table ${tableName} does not exist in ${schemaName}, skipping`);
          continue;
        }

        for (let i = 0; i < constraints.length; i++) {
          const constraint = constraints[i];
          const constraintName = `${tableName}_tenant_unique_${i + 1}`;
          
          try {
            await db.execute(sql.raw(`
              ALTER TABLE ${schemaName}.${tableName} 
              ADD CONSTRAINT ${constraintName} ${constraint}
            `));
            
            console.log(`✅ Applied unique constraint to ${tableName}: ${constraintName}`);
          } catch (error) {
            if (error.message.includes('already exists')) {
              console.log(`✓ Unique constraint already exists for ${tableName}: ${constraintName}`);
            } else {
              console.error(`❌ Error applying unique constraint ${constraintName}:`, error.message);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing table ${tableName}:`, error);
      }
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

  // CRITICAL: Validate current constraint status across all schemas
  async validateConstraintConsistency(): Promise<{
    valid: boolean;
    issues: string[];
    report: any;
  }> {
    console.log('🔍 Validating constraint consistency across all tenant schemas...');
    
    const issues: string[] = [];
    const report: any = {
      schemasChecked: 0,
      tablesValidated: 0,
      constraintsFound: 0,
      inconsistencies: []
    };

    try {
      const schemas = await this.getAllTenantSchemas();
      report.schemasChecked = schemas.length;

      for (const schemaName of schemas) {
        // Check tenant_id constraints
        const tenantIdIssues = await this.validateTenantIdConstraints(schemaName);
        issues.push(...tenantIdIssues);

        // Check unique constraints
        const uniqueIssues = await this.validateUniqueConstraints(schemaName);
        issues.push(...uniqueIssues);

        report.tablesValidated += Object.keys(this.MULTI_TENANT_CONSTRAINTS).length;
      }

      report.inconsistencies = issues;
      const valid = issues.length === 0;

      console.log(`🔍 Validation complete: ${valid ? '✅ VALID' : '❌ ISSUES FOUND'}`);
      if (!valid) {
        console.log(`📋 Issues found: ${issues.length}`);
        issues.forEach(issue => console.log(`  - ${issue}`));
      }

      return { valid, issues, report };
    } catch (error) {
      console.error('❌ Error during constraint validation:', error);
      return { 
        valid: false, 
        issues: [`Validation failed: ${error.message}`], 
        report 
      };
    }
  }

  // Validate tenant_id constraints for a schema
  private async validateTenantIdConstraints(schemaName: string): Promise<string[]> {
    const issues: string[] = [];

    for (const tableName of Object.keys(this.MULTI_TENANT_CONSTRAINTS)) {
      try {
        const tableExists = await this.checkTableExists(schemaName, tableName);
        if (!tableExists) continue;

        const constraints = await db.execute(sql`
          SELECT constraint_name, check_clause
          FROM information_schema.check_constraints cc
          JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
          WHERE tc.table_schema = ${schemaName} 
          AND tc.table_name = ${tableName}
          AND cc.check_clause LIKE '%tenant_id%'
        `);

        if (constraints.rows.length === 0) {
          issues.push(`❌ ${schemaName}.${tableName}: Missing tenant_id validation constraint`);
        } else {
          // Check if constraint is using the standard format
          const hasStandardConstraint = constraints.rows.some(row => 
            (row.check_clause as string).includes('LENGTH(tenant_id') && 
            (row.check_clause as string).includes('36')
          );

          if (!hasStandardConstraint) {
            issues.push(`⚠️ ${schemaName}.${tableName}: Non-standard tenant_id constraint format`);
          }
        }
      } catch (error) {
        issues.push(`❌ ${schemaName}.${tableName}: Error checking tenant_id constraints - ${error.message}`);
      }
    }

    return issues;
  }

  // Validate unique constraints for a schema
  private async validateUniqueConstraints(schemaName: string): Promise<string[]> {
    const issues: string[] = [];

    for (const tableName of Object.keys(this.MULTI_TENANT_CONSTRAINTS)) {
      try {
        const tableExists = await this.checkTableExists(schemaName, tableName);
        if (!tableExists) continue;

        // Check for unsafe unique constraints (not including tenant_id)
        const unsafeConstraints = await db.execute(sql`
          SELECT tc.constraint_name, STRING_AGG(kcu.column_name, ', ') as columns
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_schema = ${schemaName}
          AND tc.table_name = ${tableName}
          AND tc.constraint_type = 'UNIQUE'
          GROUP BY tc.constraint_name
          HAVING NOT STRING_AGG(kcu.column_name, ', ') LIKE '%tenant_id%'
        `);

        if (unsafeConstraints.rows.length > 0) {
          unsafeConstraints.rows.forEach(row => {
            issues.push(`🚨 ${schemaName}.${tableName}: UNSAFE unique constraint without tenant_id: ${row.constraint_name} (${row.columns})`);
          });
        }

        // Check for missing essential unique constraints
        const allConstraints = await db.execute(sql`
          SELECT tc.constraint_name, STRING_AGG(kcu.column_name, ', ') as columns
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_schema = ${schemaName}
          AND tc.table_name = ${tableName}
          AND tc.constraint_type = 'UNIQUE'
          GROUP BY tc.constraint_name
        `);

        const hasMultiTenantConstraints = allConstraints.rows.some(row => 
          (row.columns as string).includes('tenant_id')
        );

        if (!hasMultiTenantConstraints && this.MULTI_TENANT_CONSTRAINTS[tableName].length > 0) {
          issues.push(`❌ ${schemaName}.${tableName}: Missing multi-tenant unique constraints`);
        }
      } catch (error) {
        issues.push(`❌ ${schemaName}.${tableName}: Error checking unique constraints - ${error.message}`);
      }
    }

    return issues;
  }
}

// Export singleton instance
export const tenantConstraintsUnifier = TenantConstraintsUnifier.getInstance();