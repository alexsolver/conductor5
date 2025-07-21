import { sql } from 'drizzle-orm''[,;]
import { db } from '../db''[,;]

// ===========================
// ENTERPRISE MIGRATION MANAGER
// Resolver problema 8: Migration strategy riscosa sem transações adequadas
// ===========================

export class EnterpriseMigrationManager {
  private static instance: EnterpriseMigrationManager;
  
  static getInstance(): EnterpriseMigrationManager {
    if (!EnterpriseMigrationManager.instance) {
      EnterpriseMigrationManager.instance = new EnterpriseMigrationManager();
    }
    return EnterpriseMigrationManager.instance;
  }

  // ===========================
  // SAFE TRANSACTION WRAPPER
  // ===========================
  async executeInTransaction<T>(
    operations: () => Promise<T>,
    migrationName: string
  ): Promise<T> {
    console.log(`[MigrationManager] Starting migration: ${migrationName}`);
    
    // Create savepoint for rollback capability
    const savepointName = `migration_${Date.now()}`;
    
    try {
      await db.execute(sql`BEGIN`);
      await db.execute(sql.raw(`SAVEPOINT ${savepointName}`));
      
      const result = await operations();
      
      await db.execute(sql`COMMIT`);
      console.log(`[MigrationManager] ✅ Migration ${migrationName} completed successfully`);
      
      return result;
    } catch (error) {
      console.error(`[MigrationManager] ❌ Migration ${migrationName} failed:`, error);
      
      try {
        await db.execute(sql.raw(`ROLLBACK TO SAVEPOINT ${savepointName}`));
        await db.execute(sql`ROLLBACK`);
        console.log(`[MigrationManager] ↩️ Rollback completed for ${migrationName}`);
      } catch (rollbackError) {
        console.error(`[MigrationManager] 🚨 CRITICAL: Rollback failed for ${migrationName}:`, rollbackError);
      }
      
      throw error;
    }
  }

  // ===========================
  // TENANT SCHEMA MIGRATION WITH VALIDATION
  // ===========================
  async migrateTenantSchema(
    tenantId: string,
    migrations: Array<{
      name: string;
      sql: string;
      validationQuery?: string;
    }>
  ): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    await this.executeInTransaction(async () => {
      for (const migration of migrations) {
        console.log(`[MigrationManager] Executing ${migration.name} for ${schemaName}`);
        
        try {
          // Execute migration
          await db.execute(sql.raw(migration.sql.replace(/\{schemaName\}/g, schemaName)));
          
          // Validate migration if validation query provided
          if (migration.validationQuery) {
            const validation = await db.execute(sql.raw(
              migration.validationQuery.replace(/\{schemaName\}/g, schemaName)
            ));
            
            if (!validation.rows || validation.rows.length === 0) {
              throw new Error(`Migration validation failed for ${migration.name}`);
            }
          }
          
          console.log(`[MigrationManager] ✅ ${migration.name} completed for ${schemaName}`);
        } catch (error) {
          console.error(`[MigrationManager] ❌ ${migration.name} failed for ${schemaName}:`, error);
          throw error;
        }
      }
    }, `TenantMigration_${tenantId}`);
  }

  // ===========================
  // REPAIR MISSING TENANT TABLES
  // ===========================
  async repairMissingTables(tenantId: string): Promise<void> {
    const migrations = [
      {
        name: 'create_customers_table''[,;]
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.customers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}''[,;]
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            active BOOLEAN DEFAULT true,
            verified BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT customers_tenant_email_unique UNIQUE (tenant_id, email),
            CONSTRAINT customers_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'customers'
        `
      },
      {
        name: 'create_skills_table''[,;]
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.skills (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}''[,;]
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            description TEXT,
            level_min INTEGER DEFAULT 1,
            level_max INTEGER DEFAULT 5,
            certification_suggested VARCHAR(255),
            validity_months INTEGER,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT skills_tenant_id_format CHECK (LENGTH(tenant_id) = 36),
            CONSTRAINT skills_tenant_name_unique UNIQUE (tenant_id, name)
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'skills'
        `
      },
      {
        name: 'create_certifications_table''[,;]
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.certifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}''[,;]
            name VARCHAR(255) NOT NULL,
            issuer VARCHAR(255) NOT NULL,
            description TEXT,
            validity_months INTEGER,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT certifications_tenant_id_format CHECK (LENGTH(tenant_id) = 36),
            CONSTRAINT certifications_tenant_name_issuer_unique UNIQUE (tenant_id, name, issuer)
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'certifications'
        `
      },
      {
        name: 'create_performance_indexes''[,;]
        sql: `
          CREATE INDEX IF NOT EXISTS customers_tenant_email_idx 
          ON {schemaName}.customers (tenant_id, email);
          
          CREATE INDEX IF NOT EXISTS customers_tenant_active_idx 
          ON {schemaName}.customers (tenant_id, active) WHERE active = true;
          
          CREATE INDEX IF NOT EXISTS skills_tenant_category_idx 
          ON {schemaName}.skills (tenant_id, category, name);
          
          CREATE INDEX IF NOT EXISTS certifications_tenant_issuer_idx 
          ON {schemaName}.certifications (tenant_id, issuer, name);
        `,
        validationQuery: `
          SELECT 1 FROM pg_indexes 
          WHERE schemaname = '{schemaName}' AND indexname LIKE '%tenant_%'
          LIMIT 1
        `
      }
    ];

    await this.migrateTenantSchema(tenantId, migrations);
  }

  // ===========================
  // ADD TENANT_ID TO EXISTING TABLES
  // ===========================
  async addTenantIdColumns(tenantId: string, tables: string[]): Promise<void> {
    const migrations = tables.map(tableName => ({
      name: `add_tenant_id_to_${tableName}`,
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = '{schemaName}' 
            AND table_name = '${tableName}'
            AND column_name = 'tenant_id'
          ) THEN
            ALTER TABLE {schemaName}.${tableName} 
            ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}''[,;]
            
            ALTER TABLE {schemaName}.${tableName} 
            ADD CONSTRAINT ${tableName}_tenant_id_format 
            CHECK (LENGTH(tenant_id) = 36);
          END IF;
        END $$;
      `,
      validationQuery: `
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = '{schemaName}' 
        AND table_name = '${tableName}'
        AND column_name = 'tenant_id'
      `
    }));

    await this.migrateTenantSchema(tenantId, migrations);
  }

  // ===========================
  // BACKUP BEFORE MIGRATION
  // ===========================
  async createSchemaBackup(tenantId: string): Promise<string> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const backupSchemaName = `${schemaName}_backup_${Date.now()}`;
    
    try {
      // Create backup schema
      await db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS ${backupSchemaName}`));
      
      // Get all tables in source schema
      const tables = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ${schemaName}
        AND table_type = 'BASE TABLE'
      `);

      // Copy each table structure and data
      for (const table of tables.rows) {
        const tableName = table.table_name as string;
        
        await db.execute(sql.raw(`
          CREATE TABLE ${backupSchemaName}.${tableName} 
          (LIKE ${schemaName}.${tableName} INCLUDING ALL)
        `));
        
        await db.execute(sql.raw(`
          INSERT INTO ${backupSchemaName}.${tableName} 
          SELECT * FROM ${schemaName}.${tableName}
        `));
      }

      console.log(`[MigrationManager] ✅ Schema backup created: ${backupSchemaName}`);
      return backupSchemaName;
    } catch (error) {
      console.error(`[MigrationManager] ❌ Backup creation failed for ${schemaName}:`, error);
      throw error;
    }
  }

  // ===========================
  // VALIDATE SCHEMA INTEGRITY
  // ===========================
  async validateSchemaIntegrity(tenantId: string): Promise<boolean> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Check required tables exist
      const requiredTables = [
        'customers', 'tickets', 'ticket_messages', 'activity_logs''[,;]
        'locations', 'customer_companies', 'skills', 'certifications'
      ];

      const tableCheck = await db.execute(sql`
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_schema = ${schemaName}
        AND table_name = ANY(${requiredTables})
      `);

      const foundTables = new Set(tableCheck.rows.map(row => row.table_name as string));
      const missingTables = requiredTables.filter(table => !foundTables.has(table));

      if (missingTables.length > 0) {
        console.warn(`[MigrationManager] Missing tables in ${schemaName}: ${missingTables.join(', ')}`);
        return false;
      }

      // Check tenant_id columns exist
      const tenantIdCheck = await db.execute(sql`
        SELECT table_name
        FROM information_schema.columns 
        WHERE table_schema = ${schemaName}
        AND column_name = 'tenant_id'
        AND table_name = ANY(${requiredTables})
      `);

      const tablesWithTenantId = new Set(tenantIdCheck.rows.map(row => row.table_name as string));
      const tablesWithoutTenantId = requiredTables.filter(table => !tablesWithTenantId.has(table));

      if (tablesWithoutTenantId.length > 0) {
        console.warn(`[MigrationManager] Tables missing tenant_id: ${tablesWithoutTenantId.join(', ')}`);
        return false;
      }

      console.log(`[MigrationManager] ✅ Schema integrity validated for ${schemaName}`);
      return true;
    } catch (error) {
      console.error(`[MigrationManager] Schema validation failed for tenant ${tenantId}:`, error);
      return false;
    }
  }
}

export const enterpriseMigrationManager = EnterpriseMigrationManager.getInstance();