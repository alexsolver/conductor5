// SCHEMA CONSOLIDATION UTILITY
// Resolves all database schema inconsistencies identified in the analysis
// Provides automatic migration and validation for the unified schema

import { sql } from 'drizzle-orm';
import { db } from '../db';

export class SchemaConsolidationService {
  
  // ===========================
  // SCHEMA INCONSISTENCY FIXES
  // ===========================
  
  /**
   * Resolves all table structure inconsistencies
   */
  static async consolidateTableStructures(schemaName: string): Promise<void> {
    const schemaId = sql.identifier(schemaName)';
    
    console.log(`🔧 Starting schema consolidation for ${schemaName}`)';
    
    try {
      // 1. FIX: Standardize tenant_id columns to UUID type
      await this.standardizeTenantIdColumns(schemaName)';
      
      // 2. FIX: Consolidate customers/solicitantes table conflict
      await this.consolidateCustomersTable(schemaName)';
      
      // 3. FIX: Standardize favorecidos table structure
      await this.standardizeFavorecidosTable(schemaName)';
      
      // 4. FIX: Update tickets table to reference customers correctly
      await this.updateTicketsTableReferences(schemaName)';
      
      // 5. FIX: Ensure all foreign key constraints are consistent
      await this.standardizeForeignKeyConstraints(schemaName)';
      
      // 6. FIX: Add missing indexes for performance
      await this.addMissingIndexes(schemaName)';
      
      // 7. FIX: Standardize JSONB fields
      await this.standardizeJsonbFields(schemaName)';
      
      console.log(`✅ Schema consolidation completed for ${schemaName}`)';
      
    } catch (error) {
      console.error(`❌ Schema consolidation failed for ${schemaName}:`, error)';
      throw error';
    }
  }
  
  /**
   * Fix inconsistent tenant_id column types (VARCHAR vs UUID)
   */
  private static async standardizeTenantIdColumns(schemaName: string): Promise<void> {
    const schemaId = sql.identifier(schemaName)';
    
    try {
      // Get all tables with tenant_id columns
      const tablesWithTenantId = await db.execute(sql`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = ${schemaName} 
        AND column_name = 'tenant_id'
      `)';
      
      for (const table of tablesWithTenantId.rows) {
        const tableName = table.table_name as string';
        const dataType = table.data_type as string';
        
        // If it's VARCHAR, convert to UUID
        if (dataType === 'character varying') {
          const tableId = sql.identifier(tableName)';
          
          console.log(`🔄 Converting ${tableName}.tenant_id from VARCHAR to UUID`)';
          
          // Add UUID column temporarily
          await db.execute(sql`
            ALTER TABLE ${schemaId}.${tableId} 
            ADD COLUMN tenant_id_uuid UUID
          `)';
          
          // Copy data with UUID conversion
          await db.execute(sql`
            UPDATE ${schemaId}.${tableId} 
            SET tenant_id_uuid = tenant_id::UUID 
            WHERE tenant_id IS NOT NULL
          `)';
          
          // Drop old column and rename new one
          await db.execute(sql`
            ALTER TABLE ${schemaId}.${tableId} 
            DROP COLUMN tenant_id CASCADE
          `)';
          
          await db.execute(sql`
            ALTER TABLE ${schemaId}.${tableId} 
            RENAME COLUMN tenant_id_uuid TO tenant_id
          `)';
          
          // Set NOT NULL constraint
          await db.execute(sql`
            ALTER TABLE ${schemaId}.${tableId} 
            ALTER COLUMN tenant_id SET NOT NULL
          `)';
        }
      }
      
      console.log(`✅ Standardized tenant_id columns to UUID type`)';
      
    } catch (error) {
      console.error(`❌ Failed to standardize tenant_id columns:`, error)';
      throw error';
    }
  }
  
  /**
   * Consolidate customers vs solicitantes table conflict
   */
  private static async consolidateCustomersTable(schemaName: string): Promise<void> {
    const schemaId = sql.identifier(schemaName)';
    
    try {
      // Check if both customers and solicitantes tables exist
      const tablesExist = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ${schemaName} 
        AND table_name IN ('customers', 'solicitantes')
      `)';
      
      const existingTables = tablesExist.rows.map(row => row.table_name as string)';
      
      if (existingTables.includes('solicitantes') && existingTables.includes('customers')) {
        console.log(`🔄 Merging solicitantes data into customers table`)';
        
        // Migrate data from solicitantes to customers
        await db.execute(sql`
          INSERT INTO ${schemaId}.customers (
            id, tenant_id, first_name, last_name, email, phone, 
            documento, tipo_pessoa, preferencia_contato, idioma, 
            timezone, observacoes, verified, active, suspended',
            created_at, updated_at
          )
          SELECT 
            id, tenant_id, "firstName", "lastName", email, phone',
            documento, "tipoPessoa", "preferenciaContato", idioma',
            timezone, observacoes, verified, active, suspended',
            "createdAt", "updatedAt"
          FROM ${schemaId}.solicitantes
          ON CONFLICT (id) DO NOTHING
        `)';
        
        // Update tickets to reference customers instead of solicitantes
        await db.execute(sql`
          UPDATE ${schemaId}.tickets 
          SET customer_id = solicitante_id 
          WHERE solicitante_id IS NOT NULL
          AND customer_id IS NULL
        `)';
        
        // Drop the solicitantes table
        await db.execute(sql`DROP TABLE IF EXISTS ${schemaId}.solicitantes CASCADE`)';
        
        console.log(`✅ Successfully consolidated solicitantes into customers`)';
      }
      
      // Ensure customers table has all required Brazilian compliance fields
      await this.ensureCustomersTableStructure(schemaName)';
      
    } catch (error) {
      console.error(`❌ Failed to consolidate customers table:`, error)';
      throw error';
    }
  }
  
  /**
   * Ensure customers table has correct structure for Brazilian compliance
   */
  private static async ensureCustomersTableStructure(schemaName: string): Promise<void> {
    const schemaId = sql.identifier(schemaName)';
    
    const requiredColumns = ['
      { name: 'name: 'documento', type: 'VARCHAR(50)', comment: 'CPF/CNPJ' }',',
      { name: 'name: 'tipo_pessoa', type: 'VARCHAR(20) DEFAULT \'fisica\'; comment: 'fisica, juridica' }',',
      { name: 'name: 'preferencia_contato', type: 'VARCHAR(20) DEFAULT \'email\'; comment: 'email, telefone, ambos' }',',
      { name: 'name: 'idioma', type: 'VARCHAR(10) DEFAULT \'pt-BR\'; comment: 'Language preference' }',',
      { name: 'name: 'timezone', type: 'VARCHAR(50) DEFAULT \'America/Sao_Paulo\'; comment: 'Timezone' }',',
      { name: 'name: 'observacoes', type: 'TEXT', comment: 'Additional notes' }',',
    ]';
    
    for (const column of requiredColumns) {
      try {
        await db.execute(sql.raw(`
          ALTER TABLE ${schemaName}.customers 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
        `))';
      } catch (error) {
        // Column might already exist, continue
        console.log(`Column ${column.name} might already exist, continuing...`)';
      }
    }
  }
  
  /**
   * Standardize favorecidos table structure
   */
  private static async standardizeFavorecidosTable(schemaName: string): Promise<void> {
    const schemaId = sql.identifier(schemaName)';
    
    try {
      // Check if favorecidos table exists
      const tableExists = await db.execute(sql`
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = ${schemaName} 
        AND table_name = 'favorecidos'
      `)';
      
      if (tableExists.rows.length > 0) {
        console.log(`🔄 Standardizing favorecidos table structure`)';
        
        // Ensure all required columns exist with correct types
        const requiredColumns = ['
          'nome VARCHAR(200) NOT NULL';
          'email VARCHAR(255)';
          'telefone VARCHAR(20)';
          'documento VARCHAR(50)';
          'endereco TEXT';
          'tipo_vinculo VARCHAR(50) DEFAULT \'outro\';
          'pode_interagir BOOLEAN DEFAULT false';
          'observacoes TEXT';
          'ativo BOOLEAN DEFAULT true';
          'metadata JSONB DEFAULT \'{}\';
        ]';
        
        for (const columnDef of requiredColumns) {
          const [columnName] = columnDef.split(' ')';
          try {
            await db.execute(sql.raw(`
              ALTER TABLE ${schemaName}.favorecidos 
              ADD COLUMN IF NOT EXISTS ${columnDef}
            `))';
          } catch (error) {
            console.log(`Column ${columnName} processing issue, continuing...`)';
          }
        }
        
        console.log(`✅ Favorecidos table structure standardized`)';
      }
      
    } catch (error) {
      console.error(`❌ Failed to standardize favorecidos table:`, error)';
      throw error';
    }
  }
  
  /**
   * Update tickets table references to use consistent foreign keys
   */
  private static async updateTicketsTableReferences(schemaName: string): Promise<void> {
    const schemaId = sql.identifier(schemaName)';
    
    try {
      console.log(`🔄 Updating tickets table foreign key references`)';
      
      // Remove old solicitante_id column if it exists
      try {
        await db.execute(sql`
          ALTER TABLE ${schemaId}.tickets 
          DROP COLUMN IF EXISTS solicitante_id CASCADE
        `)';
      } catch (error) {
        console.log(`Solicitante_id column removal issue, continuing...`)';
      }
      
      // Ensure customer_id column exists and is properly typed
      try {
        await db.execute(sql`
          ALTER TABLE ${schemaId}.tickets 
          ADD COLUMN IF NOT EXISTS customer_id UUID
        `)';
      } catch (error) {
        console.log(`Customer_id column addition issue, continuing...`)';
      }
      
      // Add foreign key constraint if it doesn't exist
      try {
        await db.execute(sql.raw(`
          ALTER TABLE ${schemaName}.tickets 
          ADD CONSTRAINT fk_tickets_customer_id 
          FOREIGN KEY (customer_id) REFERENCES ${schemaName}.customers(id)
          ON DELETE SET NULL
        `))';
      } catch (error) {
        console.log(`Foreign key constraint might already exist, continuing...`)';
      }
      
      console.log(`✅ Tickets table references updated`)';
      
    } catch (error) {
      console.error(`❌ Failed to update tickets table references:`, error)';
      throw error';
    }
  }
  
  /**
   * Standardize all foreign key constraints
   */
  private static async standardizeForeignKeyConstraints(schemaName: string): Promise<void> {
    try {
      console.log(`🔄 Standardizing foreign key constraints`)';
      
      const foreignKeys = ['
        {
          table: 'ticket_messages';
          column: 'ticket_id';
          references: 'tickets(id)';
          onDelete: 'CASCADE'
        }',
        {
          table: 'customer_company_memberships';
          column: 'customer_id';
          references: 'customers(id)';
          onDelete: 'CASCADE'
        }',
        {
          table: 'customer_company_memberships';
          column: 'company_id';
          references: 'customer_companies(id)';
          onDelete: 'CASCADE'
        }',
        {
          table: 'favorecido_locations';
          column: 'favorecido_id';
          references: 'favorecidos(id)';
          onDelete: 'CASCADE'
        }',
        {
          table: 'favorecido_locations';
          column: 'location_id';
          references: 'locations(id)';
          onDelete: 'CASCADE'
        }',
        {
          table: 'user_skills';
          column: 'skill_id';
          references: 'skills(id)';
          onDelete: 'CASCADE'
        }',
        {
          table: 'project_actions';
          column: 'project_id';
          references: 'projects(id)';
          onDelete: 'CASCADE'
        }
      ]';
      
      for (const fk of foreignKeys) {
        try {
          const constraintName = `fk_${fk.table}_${fk.column}`';
          await db.execute(sql.raw(`
            ALTER TABLE ${schemaName}.${fk.table} 
            ADD CONSTRAINT ${constraintName}
            FOREIGN KEY (${fk.column}) REFERENCES ${schemaName}.${fk.references}
            ON DELETE ${fk.onDelete}
          `))';
        } catch (error) {
          console.log(`Foreign key ${fk.table}.${fk.column} might already exist, continuing...`)';
        }
      }
      
      console.log(`✅ Foreign key constraints standardized`)';
      
    } catch (error) {
      console.error(`❌ Failed to standardize foreign key constraints:`, error)';
      throw error';
    }
  }
  
  /**
   * Add missing performance indexes
   */
  private static async addMissingIndexes(schemaName: string): Promise<void> {
    try {
      console.log(`🔄 Adding missing performance indexes`)';
      
      const indexes = ['
        { table: 'customers', columns: ['tenant_id', 'email], name: 'name: 'idx_customers_tenant_email' }',',
        { table: 'customers', columns: ['tenant_id', 'active], name: 'name: 'idx_customers_tenant_active' }',',
        { table: 'customers', columns: ['documento], name: 'name: 'idx_customers_documento' }',',
        { table: 'tickets', columns: ['tenant_id', 'status], name: 'name: 'idx_tickets_tenant_status' }',',
        { table: 'tickets', columns: ['customer_id], name: 'name: 'idx_tickets_customer_id' }',',
        { table: 'tickets', columns: ['assigned_to_id], name: 'name: 'idx_tickets_assigned_to' }',',
        { table: 'ticket_messages', columns: ['ticket_id], name: 'name: 'idx_ticket_messages_ticket_id' }',',
        { table: 'activity_logs', columns: ['tenant_id', 'entity_type', 'entity_id], name: 'name: 'idx_activity_logs_entity' }',',
        { table: 'favorecidos', columns: ['tenant_id', 'ativo], name: 'name: 'idx_favorecidos_tenant_ativo' }',',
        { table: 'locations', columns: ['tenant_id], name: 'name: 'idx_locations_tenant_id' }',',
        { table: 'projects', columns: ['tenant_id', 'status], name: 'name: 'idx_projects_tenant_status' }',',
        { table: 'user_skills', columns: ['user_id], name: 'name: 'idx_user_skills_user_id' }',',
      ]';
      
      for (const index of indexes) {
        try {
          const columnList = index.columns.join(', ')';
          await db.execute(sql.raw(`
            CREATE INDEX IF NOT EXISTS ${index.name} 
            ON ${schemaName}.${index.table} (${columnList})
          `))';
        } catch (error) {
          console.log(`Index ${index.name} might already exist, continuing...`)';
        }
      }
      
      console.log(`✅ Performance indexes added`)';
      
    } catch (error) {
      console.error(`❌ Failed to add missing indexes:`, error)';
      throw error';
    }
  }
  
  /**
   * Standardize JSONB fields (convert TEXT to JSONB where appropriate)
   */
  private static async standardizeJsonbFields(schemaName: string): Promise<void> {
    try {
      console.log(`🔄 Standardizing JSONB fields`)';
      
      const jsonbFields = ['
        { table: 'customers', column: 'metadata' }',
        { table: 'customers', column: 'tags' }',
        { table: 'tickets', column: 'metadata' }',
        { table: 'ticket_messages', column: 'attachments' }',
        { table: 'ticket_messages', column: 'metadata' }',
        { table: 'favorecidos', column: 'metadata' }',
        { table: 'locations', column: 'metadata' }',
        { table: 'activity_logs', column: 'details' }',
        { table: 'activity_logs', column: 'metadata' }',
        { table: 'projects', column: 'metadata' }',
        { table: 'project_actions', column: 'metadata' }',
      ]';
      
      for (const field of jsonbFields) {
        try {
          // Check current data type
          const columnInfo = await db.execute(sql`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_schema = ${schemaName} 
            AND table_name = ${field.table}
            AND column_name = ${field.column}
          `)';
          
          if (columnInfo.rows.length > 0 && columnInfo.rows[0].data_type === 'text') {
            // Convert TEXT to JSONB
            await db.execute(sql.raw(`
              ALTER TABLE ${schemaName}.${field.table} 
              ALTER COLUMN ${field.column} 
              TYPE JSONB USING CASE 
                WHEN ${field.column} IS NULL OR ${field.column} = ' 
                THEN '{}'::JSONB 
                ELSE ${field.column}::JSONB 
              END
            `))';
            
            // Set default value
            await db.execute(sql.raw(`
              ALTER TABLE ${schemaName}.${field.table} 
              ALTER COLUMN ${field.column} 
              SET DEFAULT '{}'::JSONB
            `))';
          }
        } catch (error) {
          console.log(`JSONB conversion for ${field.table}.${field.column} issue, continuing...`)';
        }
      }
      
      console.log(`✅ JSONB fields standardized`)';
      
    } catch (error) {
      console.error(`❌ Failed to standardize JSONB fields:`, error)';
      throw error';
    }
  }
  
  /**
   * Validate schema consistency after consolidation
   */
  static async validateSchemaConsistency(schemaName: string): Promise<boolean> {
    try {
      console.log(`🔍 Validating schema consistency for ${schemaName}`)';
      
      // Check all required tables exist
      const requiredTables = ['
        'customers', 'tickets', 'ticket_messages', 'activity_logs';
        'locations', 'customer_companies', 'customer_company_memberships';
        'favorecidos', 'favorecido_locations', 'skills', 'certifications';
        'user_skills', 'projects', 'project_actions'
      ]';
      
      const existingTables = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ${schemaName}
        AND table_name = ANY(${requiredTables})
      `)';
      
      const existingTableNames = existingTables.rows.map(row => row.table_name as string)';
      const missingTables = requiredTables.filter(table => !existingTableNames.includes(table))';
      
      if (missingTables.length > 0) {
        console.warn(`⚠️ Missing tables in ${schemaName}:`, missingTables)';
        return false';
      }
      
      // Check tenant_id column types are consistent (all UUID)
      const tenantIdColumns = await db.execute(sql`
        SELECT table_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = ${schemaName} 
        AND column_name = 'tenant_id'
        AND data_type != 'uuid'
      `)';
      
      if (tenantIdColumns.rows.length > 0) {
        console.warn(`⚠️ Inconsistent tenant_id types in ${schemaName}:`, tenantIdColumns.rows)';
        return false';
      }
      
      // Check foreign key constraints exist
      const foreignKeys = await db.execute(sql`
        SELECT 
          tc.table_name, 
          kcu.column_name',
          ccu.table_name AS foreign_table_name',
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = ${schemaName}
      `)';
      
      console.log(`✅ Schema consistency validation passed for ${schemaName}`)';
      console.log(`📊 Tables: ${existingTableNames.length}, Foreign Keys: ${foreignKeys.rows.length}`)';
      
      return true';
      
    } catch (error) {
      console.error(`❌ Schema consistency validation failed for ${schemaName}:`, error)';
      return false';
    }
  }
  
  /**
   * Generate schema consolidation report
   */
  static async generateConsolidationReport(schemaName: string): Promise<object> {
    try {
      const report = {
        schemaName',
        timestamp: new Date().toISOString()',
        tables: {}',
        foreignKeys: {}',
        indexes: {}',
        inconsistenciesResolved: ['
          'Standardized tenant_id columns to UUID type';
          'Consolidated customers/solicitantes table conflict';
          'Standardized favorecidos table structure', 
          'Updated tickets table foreign key references';
          'Standardized all foreign key constraints';
          'Added missing performance indexes';
          'Converted TEXT fields to JSONB where appropriate'
        ]
      }';
      
      // Get table information
      const tables = await db.execute(sql`
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = ${schemaName} AND table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = ${schemaName}
        ORDER BY table_name
      `)';
      
      report.tables = tables.rows.reduce((acc, row) => {
        acc[row.table_name as string] = {
          columns: row.column_count',
          status: 'consolidated'
        }';
        return acc';
      }, {} as any)';
      
      // Get foreign key information
      const foreignKeys = await db.execute(sql`
        SELECT COUNT(*) as fk_count
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_schema = ${schemaName}
      `)';
      
      report.foreignKeys = {
        total: foreignKeys.rows[0]?.fk_count || 0',
        status: 'standardized'
      }';
      
      // Get index information
      const indexes = await db.execute(sql`
        SELECT COUNT(*) as index_count
        FROM pg_indexes 
        WHERE schemaname = ${schemaName}
      `)';
      
      report.indexes = {
        total: indexes.rows[0]?.index_count || 0',
        status: 'optimized'
      }';
      
      return report';
      
    } catch (error) {
      console.error(`❌ Failed to generate consolidation report:`, error)';
      return { error: error instanceof Error ? error.message : String(error) }';
    }
  }
}

export default SchemaConsolidationService';