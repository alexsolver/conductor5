import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Main database instance for tenant management and shared resources
export const db = drizzle({ client: pool, schema });

// Schema manager for tenant isolation
export class SchemaManager {
  private static instance: SchemaManager;
  private tenantConnections = new Map<string, { db: ReturnType<typeof drizzle>; schema: any }>();
  private initializedSchemas = new Set<string>(); // Cache for initialized schemas

  static getInstance(): SchemaManager {
    if (!SchemaManager.instance) {
      SchemaManager.instance = new SchemaManager();
    }
    return SchemaManager.instance;
  }

  // OPTIMIZED: Check if schema and required tables exist
  private async schemaExists(schemaName: string): Promise<boolean> {
    try {
      // Check schema + table count in single query for better performance
      const result = await db.execute(sql`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = ${schemaName}
      `);
      // Require minimum 11 tables for complete schema
      const tableCount = Number(result.rows[0]?.table_count || 0);
      return tableCount >= 11;
    } catch {
      return false;
    }
  }

  // Create a new schema for a tenant
  async createTenantSchema(tenantId: string): Promise<void> {
    const schemaName = this.getSchemaName(tenantId);

    // Check cache first to avoid unnecessary work
    if (this.initializedSchemas.has(tenantId)) {
      return; // Schema already initialized
    }

    // Check if schema actually exists in database
    if (await this.schemaExists(schemaName)) {
      this.initializedSchemas.add(tenantId);
      return; // Schema exists, mark as initialized
    }

    try {
      // Create the schema using parameterized query
      await db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(schemaName)}`);

      // Create tenant-specific tables in the new schema
      await this.createTenantTables(schemaName);

      // Mark as initialized in cache
      this.initializedSchemas.add(tenantId);

      const { logInfo } = await import('./utils/logger');
      logInfo(`New tenant schema created for ${tenantId}`, { schemaName });
    } catch (error) {
      const { logError } = await import('./utils/logger');
      logError(`Failed to create schema for tenant ${tenantId}`, error, { tenantId, schemaName });
      throw error;
    }
  }

  // Get database connection for a specific tenant
  async getTenantDb(tenantId: string): Promise<{ db: ReturnType<typeof drizzle>; schema: any }> {
    const schemaName = this.getSchemaName(tenantId);

    // Force recreation to test if schema connection is working properly
    if (this.tenantConnections.has(tenantId)) {
      this.tenantConnections.delete(tenantId);
    }

    if (!this.tenantConnections.has(tenantId)) {
      // Create a new connection with the tenant's schema as default - safe from SQL injection
      const baseConnectionString = process.env.DATABASE_URL;
      if (!baseConnectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      // Safely append search_path parameter using URL constructor - schema name is pre-sanitized
      const connectionUrl = new URL(baseConnectionString);
      // schemaName is already sanitized by getSchemaName() method - safe from SQL injection
      connectionUrl.searchParams.set('search_path', `${schemaName},public`);

      const tenantPool = new Pool({ 
        connectionString: connectionUrl.toString()
      });

      // Use simplified schema approach to avoid ExtraConfigBuilder error
      const tenantDb = drizzle({ 
        client: tenantPool
      });

      // Test connection and verify schema access
      try {
        // Test if we can access the schema directly
        const testResult = await tenantDb.execute(
          sql`SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ${schemaName}`
        );
        const { logInfo } = await import('./utils/logger');
        logInfo(`Tenant schema verification for ${tenantId}`, { 
          schemaName, 
          tableCount: testResult.rows?.[0]?.table_count || 0,
          connectionType: 'pool-based'
        });
      } catch (error) {
        const { logError } = await import('./utils/logger');
        logError(`Failed to verify tenant schema ${tenantId}`, error, { tenantId, schemaName });
      }

      // Import tenant-specific schema generator
      const { getTenantSpecificSchema } = await import('@shared/schema/tenant-specific');
      const tenantSchema = getTenantSpecificSchema(schemaName);

      this.tenantConnections.set(tenantId, { db: tenantDb, schema: tenantSchema });
    }

    return this.tenantConnections.get(tenantId)!;
  }

  // Drop a tenant schema (for cleanup)
  async dropTenantSchema(tenantId: string): Promise<void> {
    const schemaName = this.getSchemaName(tenantId);

    try {
      // Use parameterized query with sql.identifier for secure schema name handling
      await db.execute(sql`DROP SCHEMA IF EXISTS ${sql.identifier(schemaName)} CASCADE`);
      this.tenantConnections.delete(tenantId);

      const { logInfo } = await import('./utils/logger');
      logInfo(`Schema dropped successfully for tenant ${tenantId}`, { tenantId, schemaName });
    } catch (error) {
      const { logError } = await import('./utils/logger');
      logError(`Failed to drop schema for tenant ${tenantId}`, error, { tenantId, schemaName });
      throw error;
    }
  }

  // Get schema name for tenant - sanitized to prevent SQL injection
  private getSchemaName(tenantId: string): string {
    // Validate and sanitize tenant ID to prevent SQL injection
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Invalid tenant ID');
    }

    // Only allow alphanumeric characters, hyphens, and underscores
    const sanitizedTenantId = tenantId.replace(/[^a-zA-Z0-9\-_]/g, '');
    if (sanitizedTenantId !== tenantId) {
      throw new Error('Tenant ID contains invalid characters');
    }

    return `tenant_${sanitizedTenantId.replace(/-/g, '_')}`;
  }

  // Check if tables exist in schema
  private async tablesExist(schemaName: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables 
        WHERE table_schema = ${schemaName}
        AND table_name IN ('customers', 'tickets', 'ticket_messages', 'activity_logs', 'locations', 'customer_companies', 'customer_company_memberships', 'external_contacts')
      `);
      
      return (result.rows[0]?.table_count as number) >= 7;
    } catch {
      return false;
    }
  }

  // Create tenant-specific tables using parameterized queries for security
  private async createTenantTables(schemaName: string): Promise<void> {
    // Check if tables already exist to avoid recreation
    if (await this.tablesExist(schemaName)) {
      return; // Tables already exist, skip creation
    }

    // Import performance indexes
    const { OptimizedIndexes } = await import('./database/OptimizedIndexes');

    try {
      // Use sql.identifier for safe schema references - prevents SQL injection
      const schemaId = sql.identifier(schemaName);

      // Customer table with comprehensive fields using parameterized queries
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          company VARCHAR(255),
          tags JSONB DEFAULT '[]',
          metadata JSONB DEFAULT '{}',
          verified BOOLEAN DEFAULT FALSE,
          active BOOLEAN DEFAULT TRUE,
          suspended BOOLEAN DEFAULT FALSE,
          last_login TIMESTAMP,
          timezone VARCHAR(50) DEFAULT 'UTC',
          locale VARCHAR(10) DEFAULT 'en-US',
          language VARCHAR(5) DEFAULT 'en',
          external_id VARCHAR(255),
          role VARCHAR(100),
          notes VARCHAR(1000),
          avatar VARCHAR(500),
          signature VARCHAR(500),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Tickets table with ServiceNow-style fields using parameterized queries
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          subject VARCHAR(500) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'open',
          priority VARCHAR(20) DEFAULT 'medium',
          number VARCHAR(40),
          short_description VARCHAR(160),
          category VARCHAR(50),
          subcategory VARCHAR(50),
          impact VARCHAR(20) DEFAULT 'medium',
          urgency VARCHAR(20) DEFAULT 'medium',
          state VARCHAR(20) DEFAULT 'new',
          customer_id UUID,
          assigned_to_id VARCHAR,
          caller_id UUID,
          opened_by_id UUID,
          assignment_group VARCHAR(100),
          location VARCHAR(100),
          opened_at TIMESTAMP DEFAULT NOW(),
          resolved_at TIMESTAMP,
          closed_at TIMESTAMP,
          resolution_code VARCHAR(50),
          resolution_notes TEXT,
          work_notes JSONB DEFAULT '[]',
          configuration_item VARCHAR(100),
          business_service VARCHAR(100),
          contact_type VARCHAR(20) DEFAULT 'email',
          notify VARCHAR(20) DEFAULT 'do_not_notify',
          close_notes TEXT,
          business_impact VARCHAR(50),
          symptoms TEXT,
          root_cause TEXT,
          workaround TEXT,
          beneficiary_id UUID,
          beneficiary_type VARCHAR(20),
          caller_type VARCHAR(20),
          tags JSONB DEFAULT '[]',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Ticket messages table using parameterized queries
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.ticket_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ticket_id UUID NOT NULL,
          customer_id UUID,
          user_id VARCHAR,
          content TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'comment',
          is_internal VARCHAR(10) DEFAULT 'false',
          attachments JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Activity logs table using parameterized queries
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.activity_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_type VARCHAR(50) NOT NULL,
          entity_id UUID NOT NULL,
          action VARCHAR(50) NOT NULL,
          performed_by_id VARCHAR,
          performed_by_type VARCHAR(20),
          details JSONB DEFAULT '{}',
          previous_values JSONB DEFAULT '{}',
          new_values JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Locations table with comprehensive fields for location management
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.locations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          type VARCHAR(20) NOT NULL CHECK (type IN ('cliente', 'ativo', 'filial', 'tecnico', 'parceiro')),
          status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'manutencao', 'suspenso')),
          
          -- Address fields
          address TEXT NOT NULL,
          number VARCHAR(20),
          complement VARCHAR(100),
          neighborhood VARCHAR(100),
          city VARCHAR(100) NOT NULL,
          state VARCHAR(50) NOT NULL,
          zip_code VARCHAR(20) NOT NULL,
          country VARCHAR(50) NOT NULL DEFAULT 'Brasil',
          
          -- Geographic coordinates
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          
          -- Business hours and SLA
          business_hours JSONB DEFAULT '{}',
          special_hours JSONB DEFAULT '{}',
          timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
          sla_id UUID,
          
          -- Access and security
          access_instructions TEXT,
          requires_authorization BOOLEAN DEFAULT FALSE,
          security_equipment JSONB DEFAULT '[]',
          emergency_contacts JSONB DEFAULT '[]',
          
          -- Metadata and customization
          metadata JSONB DEFAULT '{}',
          tags JSONB DEFAULT '[]',
          
          -- Audit fields
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          created_by UUID,
          updated_by UUID
        )
      `);

      // Customer companies table using parameterized queries
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.customer_companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          display_name VARCHAR(255),
          description TEXT,
          industry VARCHAR(100),
          size VARCHAR(50),
          email VARCHAR(255),
          phone VARCHAR(50),
          website VARCHAR(500),
          address JSONB DEFAULT '{}',
          tax_id VARCHAR(100),
          registration_number VARCHAR(100),
          subscription_tier VARCHAR(50) DEFAULT 'basic',
          contract_type VARCHAR(50),
          max_users INTEGER,
          max_tickets INTEGER,
          settings JSONB DEFAULT '{}',
          tags JSONB DEFAULT '[]',
          metadata JSONB DEFAULT '{}',
          status VARCHAR(50) DEFAULT 'active',
          is_active BOOLEAN DEFAULT TRUE,
          is_primary BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          created_by TEXT NOT NULL,
          updated_by TEXT
        )
      `);

      // Customer company memberships table using parameterized queries
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.customer_company_memberships (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_id UUID NOT NULL,
          company_id UUID NOT NULL,
          role VARCHAR(100) DEFAULT 'member',
          title VARCHAR(255),
          department VARCHAR(255),
          permissions JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT TRUE,
          is_primary BOOLEAN DEFAULT FALSE,
          joined_at TIMESTAMP DEFAULT NOW(),
          left_at TIMESTAMP,
          added_by TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Add foreign key constraints using parameterized queries - safer approach
      await db.execute(sql`
        ALTER TABLE ${schemaId}.tickets 
        ADD CONSTRAINT IF NOT EXISTS fk_tickets_customer 
        FOREIGN KEY (customer_id) REFERENCES ${schemaId}.customers(id) 
        ON DELETE SET NULL
      `).catch(() => {
        // Constraint may already exist - ignore error
      });

      await db.execute(sql`
        ALTER TABLE ${schemaId}.ticket_messages 
        ADD CONSTRAINT IF NOT EXISTS fk_ticket_messages_ticket 
        FOREIGN KEY (ticket_id) REFERENCES ${schemaId}.tickets(id) 
        ON DELETE CASCADE
      `).catch(() => {
        // Constraint may already exist - ignore error
      });

      await db.execute(sql`
        ALTER TABLE ${schemaId}.ticket_messages 
        ADD CONSTRAINT IF NOT EXISTS fk_ticket_messages_customer 
        FOREIGN KEY (customer_id) REFERENCES ${schemaId}.customers(id) 
        ON DELETE SET NULL
      `).catch(() => {
        // Constraint may already exist - ignore error
      });

      // Add foreign key constraints for customer company memberships
      await db.execute(sql`
        ALTER TABLE ${schemaId}.customer_company_memberships 
        ADD CONSTRAINT IF NOT EXISTS fk_customer_memberships_customer 
        FOREIGN KEY (customer_id) REFERENCES ${schemaId}.customers(id) 
        ON DELETE CASCADE
      `).catch(() => {
        // Constraint may already exist - ignore error
      });

      await db.execute(sql`
        ALTER TABLE ${schemaId}.customer_company_memberships 
        ADD CONSTRAINT IF NOT EXISTS fk_customer_memberships_company 
        FOREIGN KEY (company_id) REFERENCES ${schemaId}.customer_companies(id) 
        ON DELETE CASCADE
      `).catch(() => {
        // Constraint may already exist - ignore error
      });

      // Create technical skills tables using parameterized queries
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.skills (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          min_level_required INTEGER DEFAULT 1,
          suggested_certification VARCHAR(255),
          certification_validity_months INTEGER,
          description TEXT,
          observations TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          created_by UUID,
          updated_by UUID
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.certifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          issuing_organization VARCHAR(255),
          description TEXT,
          validity_months INTEGER,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // External contacts table for solicitantes/favorecidos
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.external_contacts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          document VARCHAR(50),
          type VARCHAR(20) NOT NULL CHECK (type IN ('solicitante', 'favorecido')),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.user_skills (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          skill_id UUID NOT NULL,
          proficiency_level INTEGER NOT NULL,
          certification_id UUID,
          certification_number VARCHAR(100),
          certification_issued_at TIMESTAMP,
          certification_expires_at TIMESTAMP,
          certification_file TEXT,
          average_rating DECIMAL(3,2) DEFAULT 0,
          total_evaluations INTEGER DEFAULT 0,
          assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
          assigned_by UUID NOT NULL,
          justification TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Add foreign key constraints for technical skills
      await db.execute(sql`
        ALTER TABLE ${schemaId}.user_skills 
        ADD CONSTRAINT IF NOT EXISTS fk_user_skills_skill 
        FOREIGN KEY (skill_id) REFERENCES ${schemaId}.skills(id)
        ON DELETE CASCADE
      `).catch(() => {
        // Constraint may already exist - ignore error
      });

      await db.execute(sql`
        ALTER TABLE ${schemaId}.user_skills 
        ADD CONSTRAINT IF NOT EXISTS fk_user_skills_certification 
        FOREIGN KEY (certification_id) REFERENCES ${schemaId}.certifications(id)
        ON DELETE SET NULL
      `).catch(() => {
        // Constraint may already exist - ignore error
      });

      const { logInfo } = await import('./utils/logger');
      logInfo(`Tenant tables created successfully using parameterized queries for schema ${schemaName}`, { 
        schemaName,
        security: 'All queries use sql.identifier() for safe schema references'
      });

    } catch (error) {
      const { logError } = await import('./utils/logger');
      logError(`Failed to create tenant tables for schema ${schemaName}`, error, { schemaName });
      throw error;
    }
  }

  // List all tenant schemas using parameterized query
  async listTenantSchemas(): Promise<string[]> {
    try {
      // Use direct LIKE pattern - safe as it's a literal string, not user input
      const result = await db.execute(sql`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
      `);

      return result.rows.map(row => row.schema_name as string);
    } catch (error) {
      const { logError } = await import('./utils/logger');
      logError('Failed to list tenant schemas', error);
      throw error;
    }
  }
}

export const schemaManager = SchemaManager.getInstance();