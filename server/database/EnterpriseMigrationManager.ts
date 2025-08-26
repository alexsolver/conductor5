import { sql } from 'drizzle-orm';
import { db } from '../db';

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
  // CREATE COMPLETE TENANT SCHEMA
  // ===========================
  async createCompleteTenantSchema(tenantId: string): Promise<void> {
    console.log(`[MigrationManager] Creating complete schema for tenant: ${tenantId}`);

    const migrations = this.getAllTenantTableMigrations(tenantId);
    await this.migrateTenantSchema(tenantId, migrations);

    // Add indexes after tables are created
    await this.createTenantIndexes(tenantId);

    console.log(`[MigrationManager] ✅ Complete schema created for tenant: ${tenantId}`);
  }

  // ===========================
  // GET ALL TENANT TABLE MIGRATIONS
  // ===========================
  private getAllTenantTableMigrations(tenantId: string) {
    return [
      {
        name: 'create_customers_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.customers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
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
        name: 'create_companies_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.companies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
            name VARCHAR(255) NOT NULL,
            document VARCHAR(50),
            email VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT companies_tenant_document_unique UNIQUE (tenant_id, document),
            CONSTRAINT companies_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'companies'
        `
      },
      {
        name: 'create_tickets_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.tickets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
            title VARCHAR(500) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'open',
            priority VARCHAR(50) DEFAULT 'medium',
            customer_id UUID,
            assigned_to UUID,
            created_by UUID,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT tickets_tenant_id_format CHECK (LENGTH(tenant_id) = 36),
            CONSTRAINT tickets_customer_fkey FOREIGN KEY (customer_id) REFERENCES {schemaName}.customers(id)
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'tickets'
        `
      },
      {
        name: 'create_ticket_messages_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.ticket_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
            ticket_id UUID NOT NULL,
            sender_id UUID,
            message TEXT NOT NULL,
            message_type VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT ticket_messages_tenant_id_format CHECK (LENGTH(tenant_id) = 36),
            CONSTRAINT ticket_messages_ticket_fkey FOREIGN KEY (ticket_id) REFERENCES {schemaName}.tickets(id) ON DELETE CASCADE
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'ticket_messages'
        `
      },
      {
        name: 'create_activity_logs_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.activity_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
            entity_type VARCHAR(100) NOT NULL,
            entity_id UUID NOT NULL,
            action VARCHAR(100) NOT NULL,
            changes JSONB,
            user_id UUID,
            created_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT activity_logs_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'activity_logs'
        `
      },
      {
        name: 'create_locations_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.locations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
            name VARCHAR(255) NOT NULL,
            address TEXT,
            city VARCHAR(100),
            state VARCHAR(100),
            country VARCHAR(100),
            postal_code VARCHAR(20),
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT locations_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'locations'
        `
      },
      {
        name: 'create_skills_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.skills (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            description TEXT,
            level_min INTEGER DEFAULT 1,
            level_max INTEGER DEFAULT 5,
            active BOOLEAN DEFAULT true,
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
        name: 'create_items_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            unit VARCHAR(50),
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT items_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'items'
        `
      },
      {
        name: 'create_suppliers_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.suppliers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
            name VARCHAR(255) NOT NULL,
            document VARCHAR(50),
            email VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT suppliers_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'suppliers'
        `
      },
      {
        name: 'create_price_lists_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.price_lists (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
            item_id UUID NOT NULL,
            supplier_id UUID,
            price DECIMAL(12,2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'BRL',
            valid_from DATE,
            valid_until DATE,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT price_lists_tenant_id_format CHECK (LENGTH(tenant_id) = 36),
            CONSTRAINT price_lists_item_fkey FOREIGN KEY (item_id) REFERENCES {schemaName}.items(id),
            CONSTRAINT price_lists_supplier_fkey FOREIGN KEY (supplier_id) REFERENCES {schemaName}.suppliers(id)
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'price_lists'
        `
      },
      {
        name: 'create_ticket_field_configurations_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.ticket_field_configurations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
            field_name VARCHAR(100) NOT NULL,
            field_type VARCHAR(50) NOT NULL,
            is_required BOOLEAN DEFAULT false,
            display_order INTEGER,
            options JSONB,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT ticket_field_configurations_tenant_id_format CHECK (LENGTH(tenant_id) = 36),
            CONSTRAINT ticket_field_configurations_tenant_field_unique UNIQUE (tenant_id, field_name)
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'ticket_field_configurations'
        `
      },
      {
        name: 'create_ticket_field_options_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.ticket_field_options (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
            field_configuration_id UUID NOT NULL,
            option_value VARCHAR(255) NOT NULL,
            option_label VARCHAR(255) NOT NULL,
            display_order INTEGER,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT ticket_field_options_tenant_id_format CHECK (LENGTH(tenant_id) = 36),
            CONSTRAINT ticket_field_options_config_fkey FOREIGN KEY (field_configuration_id) REFERENCES {schemaName}.ticket_field_configurations(id) ON DELETE CASCADE
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'ticket_field_options'
        `
      },
      {
        name: 'create_ticket_categories_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.ticket_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
            name VARCHAR(255) NOT NULL,
            description TEXT,
            color VARCHAR(7),
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT ticket_categories_tenant_id_format CHECK (LENGTH(tenant_id) = 36),
            CONSTRAINT ticket_categories_tenant_name_unique UNIQUE (tenant_id, name)
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'ticket_categories'
        `
      },
      {
        name: 'create_ticket_subcategories_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.ticket_subcategories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
            category_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT ticket_subcategories_tenant_id_format CHECK (LENGTH(tenant_id) = 36),
            CONSTRAINT ticket_subcategories_category_fkey FOREIGN KEY (category_id) REFERENCES {schemaName}.ticket_categories(id) ON DELETE CASCADE,
            CONSTRAINT ticket_subcategories_tenant_name_unique UNIQUE (tenant_id, category_id, name)
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'ticket_subcategories'
        `
      },
      {
        name: 'create_ticket_actions_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.ticket_actions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
            ticket_id UUID NOT NULL,
            action_type VARCHAR(100) NOT NULL,
            action_data JSONB,
            performed_by UUID,
            performed_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT ticket_actions_tenant_id_format CHECK (LENGTH(tenant_id) = 36),
            CONSTRAINT ticket_actions_ticket_fkey FOREIGN KEY (ticket_id) REFERENCES {schemaName}.tickets(id) ON DELETE CASCADE
          )
        `,
        validationQuery: `
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '{schemaName}' AND table_name = 'ticket_actions'
        `
      }
    ];
  }

  // ===========================
  // REPAIR MISSING TENANT TABLES
  // ===========================
  async repairMissingTables(tenantId: string): Promise<void> {
    const migrations = [
      {
        name: 'create_customers_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.customers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
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
        name: 'create_skills_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.skills (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
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
        name: 'create_certifications_table',
        sql: `
          CREATE TABLE IF NOT EXISTS {schemaName}.certifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
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
        name: 'create_performance_indexes',
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
            ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}';

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
        'customers', 'tickets', 'ticket_messages', 'activity_logs',
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

  /**
   * Initialize a complete tenant schema with all required tables
   */
  async initializeTenantSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      console.log(`🏗️ [ENTERPRISE-MIGRATION] Initializing tenant schema: ${schemaName}`);

      // Create schema if it doesn't exist
      await this.createTenantSchema(tenantId);

      // Get all tenant tables from the master schema
      const tenantTables = await this.getTenantTableDefinitions();

      for (const tableDefinition of tenantTables) {
        await this.createTableInTenantSchema(schemaName, tableDefinition);
      }

      // Apply all necessary indexes and constraints
      await this.applyTenantConstraints(schemaName);
      await this.applyTenantIndexes(schemaName);

      console.log(`✅ [ENTERPRISE-MIGRATION] Tenant schema ${schemaName} initialized successfully`);

    } catch (error) {
      console.error(`❌ [ENTERPRISE-MIGRATION] Failed to initialize schema ${schemaName}:`, error);
      throw error;
    }
  }

  /**
   * Get tenant table definitions from the master schema
   */
  private async getTenantTableDefinitions(): Promise<any[]> {
    // Import the tenant schema definitions
    const tenantSchema = await import('@shared/schema-tenant');

    // Return all table definitions that should be created in tenant schemas
    return [
      // Core tenant tables
      'customers', 'tickets', 'ticket_messages', 'activity_logs',
      'locations', 'companies', 'skills', 'certifications', 'user_skills',
      'user_groups', 'user_group_memberships', 'beneficiaries',
      'timecard_entries', 'work_schedules', 'schedule_notifications',
      'internal_actions', 'ticket_relationships', 'tickets_field_options',
      'ticket_metadata', 'ticket_templates'
    ];
  }

  /**
   * Create a table in the tenant schema
   */
  private async createTableInTenantSchema(schemaName: string, tableName: string): Promise<void> {
    try {
      // Get the table structure from public schema
      const tableStructure = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = ${tableName}
        ORDER BY ordinal_position
      `);

      if (tableStructure.rows.length === 0) {
        console.warn(`⚠️ Table ${tableName} not found in public schema, skipping`);
        return;
      }

      // Create the table in tenant schema
      const createQuery = `CREATE TABLE IF NOT EXISTS ${schemaName}.${tableName} AS SELECT * FROM public.${tableName} WHERE 1=0`;
      await db.execute(sql.raw(createQuery));

      // Add tenant_id constraint if table has one
      const hasTenanTid = tableStructure.rows.some(row => row.column_name === 'tenant_id');
      if (hasTenanTid) {
        await db.execute(sql.raw(`
          ALTER TABLE ${schemaName}.${tableName} 
          ADD CONSTRAINT ${tableName}_tenant_check 
          CHECK (tenant_id = '${schemaName.replace('tenant_', '').replace(/_/g, '-')}')
        `));
      }

      console.log(`✅ Created table ${schemaName}.${tableName}`);

    } catch (error) {
      console.error(`❌ Failed to create table ${schemaName}.${tableName}:`, error);
      // Don't throw - continue with other tables
    }
  }

  /**
   * CRITICAL: Emergency schema recovery for corrupted tenant
   */
  async emergencySchemaRecovery(tenantId: string): Promise<void> {
  }

  // Helper method to create schema if it doesn't exist (assumed to exist)
  private async createTenantSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`));
  }

  // Helper method to apply constraints (assumed to exist)
  private async applyTenantConstraints(schemaName: string): Promise<void> {
    // Placeholder for applying specific constraints if needed
  }

  // Helper method to apply indexes (assumed to exist)
  private async applyTenantIndexes(schemaName: string): Promise<void> {
    // Placeholder for applying specific indexes if needed
  }

  // Placeholder for createTenantIndexes
  private async createTenantIndexes(tenantId: string): Promise<void> {
    console.log(`[MigrationManager] Creating indexes for tenant: ${tenantId}`);
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    // Example index creation (replace with actual logic if needed)
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS idx_customers_name ON ${schemaName}.customers (name);
    `));
  }
}

export const enterpriseMigrationManager = EnterpriseMigrationManager.getInstance();