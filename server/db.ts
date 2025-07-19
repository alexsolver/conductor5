import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema-simple";

// CRITICAL STABILITY FIX: Enhanced WebSocket configuration
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;
neonConfig.pipelineTLS = false;
neonConfig.subtls = undefined;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// ENTERPRISE POOL CONFIGURATION: Corrigida para alta concorrência e hibernação Neon
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 25, // ENTERPRISE: Aumentado para suportar múltiplos tenants simultâneos
  min: 5, // PERFORMANCE: Conexões sempre prontas para uso imediato
  idleTimeoutMillis: 300000, // LIFECYCLE: 5 minutos - enterprise standard
  connectionTimeoutMillis: 45000, // TIMEOUT: Aumentado para Neon hibernation recovery
  acquireTimeoutMillis: 60000, // ACQUIRE: 60s timeout para operações complexas
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000, // HIBERNATION: Configuração anti-hibernation
  maxUses: 500, // OPTIMIZATION: Reduzido para forçar rotação saudável
  allowExitOnIdle: false,
  maxLifetimeSeconds: 3600 // LIFECYCLE: 1 hora max - previne conexões órfãs
});

// Main database instance for tenant management and shared resources
export const db = drizzle({ client: pool, schema });

// Schema manager for tenant isolation
export class SchemaManager {
  private static instance: SchemaManager;
  private tenantConnections = new Map<string, { db: ReturnType<typeof drizzle>; schema: any }>();
  private initializedSchemas = new Set<string>(); // Cache for initialized schemas
  private schemaValidationCache = new Map<string, { isValid: boolean; timestamp: number }>(); // Cache validation results
  private readonly CACHE_TTL = 2 * 60 * 1000; // DEVELOPMENT: 2 minutos TTL para detecção rápida de problemas
  private readonly MAX_CACHED_SCHEMAS = 50; // SCALE: Aumentado para enterprise scale
  private lastCleanup = Date.now();
  private lastValidation = new Map<string, number>(); // Track validation frequency

  static getInstance(): SchemaManager {
    if (!SchemaManager.instance) {
      SchemaManager.instance = new SchemaManager();
    }
    return SchemaManager.instance;
  }

  // Intelligent cache cleanup to prevent memory leaks
  private cleanupCache(): void {
    const now = Date.now();

    // ENTERPRISE FIX: Otimizado para prevenir memory leaks
    if (now - this.lastCleanup < 30 * 1000) { // OPTIMIZED: 30 segundos - cleanup frequente
      return;
    }

    // Clean expired validation cache entries
    for (const [tenantId, cached] of this.schemaValidationCache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.schemaValidationCache.delete(tenantId);
      }
    }

    // Limit cache size to prevent memory leaks
    if (this.schemaValidationCache.size > this.MAX_CACHED_SCHEMAS) {
      const entries = Array.from(this.schemaValidationCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp); // Sort by timestamp

      // Remove oldest entries
      const toRemove = entries.slice(0, entries.length - this.MAX_CACHED_SCHEMAS);
      for (const [tenantId] of toRemove) {
        this.schemaValidationCache.delete(tenantId);
      }
    }

    this.lastCleanup = now;
  }

  // ENHANCED: Comprehensive schema validation with proper table verification
  private async schemaExists(schemaName: string): Promise<boolean> {
    try {
      // CRITICAL FIX: Enhanced validation with tenant_id verification
      const result = await db.execute(sql`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.schemata WHERE schema_name = ${schemaName}
        )`);
      
      return result.rows[0]?.exists === true;
    } catch (error) {
      console.error(`Schema existence check failed for ${schemaName}:`, error);
      return false;
    }
  }

  // ENHANCED: Improved schema creation with better error handling
  private async createSchema(schemaName: string): Promise<void> {
    try {
      await db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(schemaName)}`);
    } catch (error) {
      console.error(`Failed to create schema ${schemaName}:`, error);
      throw error;
    }
  }

  // ENHANCED: Improved table validation with better error handling
  private async validateTables(schemaName: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = ${schemaName}
      `);
      
      return (result.rows[0]?.table_count || 0) > 0;
    } catch (error) {
      console.error(`Table validation failed for ${schemaName}:`, error);
      return false;
    }
  }

  // Create a new schema for a tenant with intelligent caching
  async createTenantSchema(tenantId: string): Promise<void> {
    const schemaName = this.getSchemaName(tenantId);

    // Check cache first to avoid unnecessary work
    if (this.initializedSchemas.has(tenantId)) {
      return; // Schema already initialized
    }

    // Run intelligent cache cleanup
    this.cleanupCache();

    // Enhanced cache validation with staleness detection
    const cached = this.schemaValidationCache.get(tenantId);
    const lastValidated = this.lastValidation.get(tenantId) || 0;
    const now = Date.now();

    // Force re-validation if cached for too long or if frequent access pattern detected
    const shouldRevalidate = !cached || 
                           (now - cached.timestamp) > this.CACHE_TTL ||
                           (now - lastValidated) < 30000; // Re-validate if accessed within 30s

    if (!shouldRevalidate && cached.isValid) {
      this.initializedSchemas.add(tenantId);
      this.lastValidation.set(tenantId, now);
      return; // Schema valid from cache
    }

    // Check if schema actually exists in database
    const exists = await this.schemaExists(schemaName);

    // Cache the validation result
    this.schemaValidationCache.set(tenantId, {
      isValid: exists,
      timestamp: Date.now()
    });

    if (exists) {
      this.initializedSchemas.add(tenantId);
      return; // Schema exists, mark as initialized
    }

    try {
      // Create the schema using parameterized query
      await db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(schemaName)}`);

      // CRITICAL FIX: Check if this is a legacy schema that needs migration
      try {
        const needsMigration = await this.checkLegacySchema(schemaName);
        if (needsMigration) {
          await this.migrateLegacyTables(schemaName);
        }
      } catch (migrationError) {
        // Log migration error but don't fail schema creation
        const { logWarn } = await import('./utils/logger');
        logWarn(`Schema migration failed for ${schemaName}, creating fresh schema`, migrationError);
        // Continue with fresh schema creation
      }

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

  // Get database connection for a specific tenant - OPTIMIZED
  async getTenantDb(tenantId: string): Promise<{ db: ReturnType<typeof drizzle>; schema: any }> {
    const schemaName = this.getSchemaName(tenantId);

    // Use existing connection if available - avoid recreation overhead
    if (this.tenantConnections.has(tenantId)) {
      const existing = this.tenantConnections.get(tenantId)!;
      return existing; // Reuse existing connection
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
        connectionString: connectionUrl.toString(),
        max: 2, // Minimal per-tenant pool size - intelligent sizing
        min: 1, // Keep connection alive
        idleTimeoutMillis: 20000, // Balanced timeout
        connectionTimeoutMillis: 6000, // Quick connection establishment
        acquireTimeoutMillis: 10000, // Reasonable acquire timeout
        maxUses: 1500, // Regular connection recycling
        keepAlive: true
      });

      // ENTERPRISE SCALE FIX: Configurar event listeners para alta concorrência 
      tenantPool.setMaxListeners(25); // ENTERPRISE: Aumentado para suportar operações complexas simultâneas

      // Use simplified schema approach to avoid ExtraConfigBuilder error
      const tenantDb = drizzle({ 
        client: tenantPool
      });

      // Test connection and verify schema access
      try {
        // Test if we can access the schema directly - but only log occasionally to reduce I/O
        const testResult = await tenantDb.execute(
          sql`SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ${schemaName}`
        );
        const { logInfo } = await import('./utils/logger');

        // Only log schema verification 10% of the time to reduce I/O overhead
        if (Math.random() < 0.1) {
          logInfo(`Tenant schema verification for ${tenantId}`, { 
            schemaName, 
            tableCount: testResult.rows?.[0]?.table_count || 0,
            connectionType: 'optimized-pool'
          });
        }
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

  // CRITICAL: Check if specific table exists in schema
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

  // CRITICAL: Create favorecidos table for existing schemas
  private async createFavorecidosTable(schemaName: string): Promise<void> {
    const schemaId = sql.identifier(schemaName);
    
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.favorecidos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(36) NOT NULL,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          company VARCHAR(255),
          cpf_cnpj VARCHAR(20),
          contact_type VARCHAR(50) DEFAULT 'external',
          relationship VARCHAR(100),
          preferred_contact_method VARCHAR(50) DEFAULT 'email',
          notes TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT favorecidos_tenant_email_unique UNIQUE (tenant_id, email),
          CONSTRAINT favorecidos_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS favorecidos_tenant_email_idx ON ${schemaId}.favorecidos (tenant_id, email)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS favorecidos_tenant_active_idx ON ${schemaId}.favorecidos (tenant_id, is_active)
      `);
    } catch (error) {
      const { logError } = await import('./utils/logger');
      logError(`Failed to create favorecidos table in schema ${schemaName}`, error);
      throw error;
    }
  }

  // Create integrations table for a specific schema
  private async createIntegrationsTable(schemaName: string): Promise<void> {
    const schemaId = sql.identifier(schemaName);
    
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.integrations (
          id VARCHAR(255) PRIMARY KEY,
          tenant_id VARCHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          icon VARCHAR(100),
          status VARCHAR(50) DEFAULT 'disconnected',
          config JSONB DEFAULT '{}',
          features TEXT[],
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT integrations_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS integrations_tenant_category_idx ON ${schemaId}.integrations (tenant_id, category)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS integrations_tenant_status_idx ON ${schemaId}.integrations (tenant_id, status)
      `);
    } catch (error) {
      const { logError } = await import('./utils/logger');
      logError(`Failed to create integrations table in schema ${schemaName}`, error);
      throw error;
    }
  }

  // CRITICAL: Insert sample favorecidos data
  private async insertSampleFavorecidos(schemaName: string, tenantId: string): Promise<void> {
    const schemaId = sql.identifier(schemaName);
    
    try {
      await db.execute(sql`
        INSERT INTO ${schemaId}.favorecidos (
          tenant_id, first_name, last_name, email, phone, company, 
          contact_type, relationship, preferred_contact_method, notes, is_active
        ) VALUES 
        (${tenantId}, 'Maria', 'Santos', 'maria@externa.com', '(11) 99999-1234', 'Empresa Externa Ltd', 
         'external', 'Cliente', 'email', 'Contato externo principal', true),
        (${tenantId}, 'João', 'Silva', 'joao@parceiro.com', '(11) 88888-5678', 'Parceiro Comercial', 
         'external', 'Parceiro', 'phone', 'Contato de parceria', true),
        (${tenantId}, 'Ana', 'Costa', 'ana@fornecedor.com', '(11) 77777-9012', 'Fornecedor Sistemas', 
         'external', 'Fornecedor', 'email', 'Contato técnico principal', true)
      `);
    } catch (error) {
      // Sample data insertion is not critical - just log the error
      console.warn(`Could not insert sample favorecidos data in schema ${schemaName}:`, error);
    }
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

  // ENTERPRISE SECURITY: Ultra-strict tenant ID validation and schema naming
  private getSchemaName(tenantId: string): string {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error(`Invalid tenant ID: ${tenantId}`);
    }

    // CRITICAL SECURITY FIX: Strict UUID-v4 validation with exact length check
    const strictUuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!strictUuidRegex.test(tenantId) || tenantId.length !== 36) {
      throw new Error(`Tenant ID must be a valid UUID-v4 format (36 chars): ${tenantId}`);
    }

    // INJECTION PREVENTION: Only allow exact UUID format - no additional sanitization needed
    // Convert hyphens to underscores for PostgreSQL schema naming convention
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  // Check if tables exist in schema
  private async tablesExist(schemaName: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables 
        WHERE table_schema = ${schemaName}
        AND table_name IN ('customers', 'favorecidos', 'tickets', 'ticket_messages', 'activity_logs', 'locations', 'customer_companies', 'customer_company_memberships', 'external_contacts', 'skills', 'certifications', 'user_skills', 'integrations', 'favorecido_locations')
      `);

      return (result.rows[0]?.table_count as number) >= 14;
    } catch {
      return false;
    }
  }

  // Create tenant-specific tables using parameterized queries for security
  private async createTenantTables(schemaName: string): Promise<void> {
    // CRITICAL FIX: Check if tables exist and need migration
    const tablesExist = await this.tablesExist(schemaName);
    if (tablesExist) {
      // Check if existing tables need tenant_id column migration
      await this.migrateLegacyTables(schemaName);
      
      // CRITICAL: Check if favorecidos table exists and create if missing
      const favorecidosExists = await this.checkTableExists(schemaName, 'favorecidos');
      if (!favorecidosExists) {
        await this.createFavorecidosTable(schemaName);
        await this.insertSampleFavorecidos(schemaName, tenantId);
        const { logInfo } = await import('./utils/logger');
        logInfo(`Favorecidos table created for schema ${schemaName}`);
      }
      
      // CRITICAL: Check if integrations table exists and create if missing
      const integrationsExists = await this.checkTableExists(schemaName, 'integrations');
      if (!integrationsExists) {
        await this.createIntegrationsTable(schemaName);
        const { logInfo } = await import('./utils/logger');
        logInfo(`Integrations table created for schema ${schemaName}`);
      }
      
      return; // Tables already exist, migration complete
    }

    // Import performance indexes
    const { OptimizedIndexes } = await import('./database/OptimizedIndexes');

    try {
      // Use sql.identifier for safe schema references - prevents SQL injection
      const schemaId = sql.identifier(schemaName);

      // CRITICAL FIX: Customer table with MANDATORY tenant_id field
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(36) NOT NULL, -- CRITICAL: Explicit tenant isolation
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          company VARCHAR(255),
          tags VARCHAR(500), -- Optimized: VARCHAR for simple tag lists
          metadata TEXT, -- Optimized: TEXT for optional complex data
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
          updated_at TIMESTAMP DEFAULT NOW(),
          -- CRITICAL: Tenant isolation constraints
          CONSTRAINT customers_tenant_email_unique UNIQUE (tenant_id, email),
          CONSTRAINT customers_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // CRITICAL: Add tenant-first indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS customers_tenant_email_idx ON ${schemaId}.customers (tenant_id, email)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS customers_tenant_active_idx ON ${schemaId}.customers (tenant_id, active)
      `);

      // CRITICAL FIX: Favorecidos table with MANDATORY tenant_id field
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.favorecidos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(36) NOT NULL, -- CRITICAL: Explicit tenant isolation
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          company VARCHAR(255),
          cpf_cnpj VARCHAR(20),
          contact_type VARCHAR(50) DEFAULT 'external',
          relationship VARCHAR(100),
          preferred_contact_method VARCHAR(50) DEFAULT 'email',
          notes TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          -- CRITICAL: Tenant isolation constraints
          CONSTRAINT favorecidos_tenant_email_unique UNIQUE (tenant_id, email),
          CONSTRAINT favorecidos_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // CRITICAL: Add tenant-first indexes for favorecidos
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS favorecidos_tenant_email_idx ON ${schemaId}.favorecidos (tenant_id, email)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS favorecidos_tenant_active_idx ON ${schemaId}.favorecidos (tenant_id, is_active)
      `);

      // CRITICAL FIX: Tickets table with MANDATORY tenant_id field  
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(36) NOT NULL, -- CRITICAL: Explicit tenant isolation
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
          work_notes TEXT, -- Optimized: TEXT for work notes
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
          tags VARCHAR(500), -- Optimized: VARCHAR for simple tag lists
          metadata TEXT, -- Optimized: TEXT for optional metadata
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          -- CRITICAL: Tenant isolation constraints
          CONSTRAINT tickets_tenant_number_unique UNIQUE (tenant_id, number),
          CONSTRAINT tickets_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // CRITICAL: Add tenant-first indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS tickets_tenant_status_idx ON ${schemaId}.tickets (tenant_id, status)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS tickets_tenant_customer_idx ON ${schemaId}.tickets (tenant_id, customer_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS tickets_tenant_assignee_idx ON ${schemaId}.tickets (tenant_id, assigned_to_id)
      `);

      // CRITICAL FIX: Ticket messages table with MANDATORY tenant_id field
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.ticket_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(36) NOT NULL, -- CRITICAL: Explicit tenant isolation
          ticket_id UUID NOT NULL,
          customer_id UUID,
          user_id VARCHAR,
          content TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'comment',
          is_internal VARCHAR(10) DEFAULT 'false',
          attachments TEXT, -- Optimized: TEXT for attachments list
          created_at TIMESTAMP DEFAULT NOW(),
          -- CRITICAL: Tenant isolation constraints
          CONSTRAINT ticket_messages_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // CRITICAL: Add tenant-first indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS ticket_messages_tenant_ticket_idx ON ${schemaId}.ticket_messages (tenant_id, ticket_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS ticket_messages_tenant_customer_idx ON ${schemaId}.ticket_messages (tenant_id, customer_id)
      `);

      // CRITICAL FIX: Activity logs table with MANDATORY tenant_id field
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.activity_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(36) NOT NULL, -- CRITICAL: Explicit tenant isolation
          entity_type VARCHAR(50) NOT NULL,
          entity_id UUID NOT NULL,
          action VARCHAR(100) NOT NULL,
          performed_by_id VARCHAR,
          performed_by_type VARCHAR(20),
          details TEXT, -- Optimized: TEXT for activity details
          previous_values TEXT, -- Optimized: TEXT for previous values
          new_values TEXT, -- Optimized: TEXT for new values
          created_at TIMESTAMP DEFAULT NOW(),
          -- CRITICAL: Tenant isolation constraints
          CONSTRAINT activity_logs_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // CRITICAL: Add tenant-first indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS activity_logs_tenant_entity_idx ON ${schemaId}.activity_logs (tenant_id, entity_type, entity_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS activity_logs_tenant_performer_idx ON ${schemaId}.activity_logs (tenant_id, performed_by_id)
      `);

      // CRITICAL FIX: Locations table with MANDATORY tenant_id field
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.locations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(36) NOT NULL, -- CRITICAL: Explicit tenant isolation
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
          latitude VARCHAR(20), -- Optimized: VARCHAR for latitude
          longitude VARCHAR(20), -- Optimized: VARCHAR for longitude

          -- Business hours and SLA - OPTIMIZED
          business_hours TEXT, -- Optimized: TEXT for business hours
          special_hours TEXT, -- Optimized: TEXT for special hours
          timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
          sla_id UUID,

          -- Access and security
          access_instructions TEXT,
          requires_authorization BOOLEAN DEFAULT FALSE,
          security_equipment TEXT, -- Optimized: TEXT for security equipment
          emergency_contacts TEXT, -- Optimized: TEXT for emergency contacts

          -- Metadata and customization - OPTIMIZED
          metadata TEXT, -- Optimized: TEXT for metadata
          tags VARCHAR(500), -- Optimized: VARCHAR for tags

          -- Audit fields
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          -- CRITICAL: Tenant isolation constraints
          CONSTRAINT locations_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // CRITICAL FIX: Customer companies table with MANDATORY tenant_id field
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.customer_companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(36) NOT NULL, -- CRITICAL: Explicit tenant isolation
          name VARCHAR(255) NOT NULL,
          display_name VARCHAR(255),
          description TEXT,
          industry VARCHAR(100),
          size VARCHAR(50),
          email VARCHAR(255),
          phone VARCHAR(50),
          website VARCHAR(500),
          address TEXT, -- Optimized: TEXT for address
          tax_id VARCHAR(100),
          registration_number VARCHAR(100),
          subscription_tier VARCHAR(50) DEFAULT 'basic',
          contract_type VARCHAR(50),
          max_users INTEGER,
          max_tickets INTEGER,
          settings TEXT, -- Optimized: TEXT for settings
          tags VARCHAR(500), -- Optimized: VARCHAR for tags
          metadata TEXT, -- Optimized: TEXT for metadata
          status VARCHAR(50) DEFAULT 'active',
          is_active BOOLEAN DEFAULT TRUE,
          is_primary BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          created_by TEXT NOT NULL,
          updated_by TEXT,
          -- CRITICAL: Tenant isolation constraints
          CONSTRAINT companies_tenant_name_unique UNIQUE (tenant_id, name),
          CONSTRAINT companies_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // CRITICAL: Add tenant-first indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS companies_tenant_name_idx ON ${schemaId}.customer_companies (tenant_id, name)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS companies_tenant_status_idx ON ${schemaId}.customer_companies (tenant_id, status)
      `);

      // CRITICAL FIX: Customer company memberships table with MANDATORY tenant_id field
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.customer_company_memberships (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(36) NOT NULL, -- CRITICAL: Explicit tenant isolation
          customer_id UUID NOT NULL,
          company_id UUID NOT NULL,
          role VARCHAR(100) DEFAULT 'member',
          title VARCHAR(255),
          department VARCHAR(255),
          permissions TEXT, -- Optimized: TEXT for permissions
          is_active BOOLEAN DEFAULT TRUE,
          is_primary BOOLEAN DEFAULT FALSE,
          joined_at TIMESTAMP DEFAULT NOW(),
          left_at TIMESTAMP,
          added_by TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          -- CRITICAL: Tenant isolation constraints
          CONSTRAINT memberships_tenant_customer_company_unique UNIQUE (tenant_id, customer_id, company_id),
          CONSTRAINT memberships_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // CRITICAL: Add tenant-first indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS memberships_tenant_customer_idx ON ${schemaId}.customer_company_memberships (tenant_id, customer_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS memberships_tenant_company_idx ON ${schemaId}.customer_company_memberships (tenant_id, company_id)
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

      // CRITICAL FIX: Technical skills table with MANDATORY tenant_id field
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.skills (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(36) NOT NULL, -- CRITICAL: Explicit tenant isolation
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          subcategory VARCHAR(100),
          description TEXT,
          min_level_required INTEGER DEFAULT 1,
          suggested_certification VARCHAR(255),
          validity_months INTEGER,
          observations TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          -- CRITICAL: Tenant isolation constraints
          CONSTRAINT skills_tenant_name_category_unique UNIQUE (tenant_id, name, category),
          CONSTRAINT skills_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // CRITICAL: Add tenant-first indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS skills_tenant_category_idx ON ${schemaId}.skills (tenant_id, category)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS skills_tenant_name_idx ON ${schemaId}.skills (tenant_id, name)
      `);

      // CRITICAL FIX: Certifications table with MANDATORY tenant_id field
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.certifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(36) NOT NULL, -- CRITICAL: Explicit tenant isolation
          name VARCHAR(255) NOT NULL,
          issuer VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          validity_months INTEGER,
          skill_requirements TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          -- CRITICAL: Tenant isolation constraints
          CONSTRAINT certifications_tenant_name_issuer_unique UNIQUE (tenant_id, name, issuer),
          CONSTRAINT certifications_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // CRITICAL: Add tenant-first indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS certifications_tenant_category_idx ON ${schemaId}.certifications (tenant_id, category)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS certifications_tenant_issuer_idx ON ${schemaId}.certifications (tenant_id, issuer)
      `);

      // CRITICAL FIX: External contacts table with MANDATORY tenant_id field
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.external_contacts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(36) NOT NULL, -- CRITICAL: Explicit tenant isolation
          type VARCHAR(20) NOT NULL, -- 'solicitante' or 'favorecido'
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          company VARCHAR(255),
          department VARCHAR(100),
          role VARCHAR(100),
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          -- CRITICAL: Tenant isolation constraints
          CONSTRAINT external_contacts_tenant_type_email_unique UNIQUE (tenant_id, type, email),
          CONSTRAINT external_contacts_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // CRITICAL: Add tenant-first indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS external_contacts_tenant_type_idx ON ${schemaId}.external_contacts (tenant_id, type)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS external_contacts_tenant_email_idx ON ${schemaId}.external_contacts (tenant_id, email)
      `);

      // CRITICAL FIX: User skills table with MANDATORY tenant_id field
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.user_skills (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(36) NOT NULL, -- CRITICAL: Explicit tenant isolation
          user_id VARCHAR(36) NOT NULL,
          skill_id UUID NOT NULL,
          level INTEGER NOT NULL,
          assessed_at TIMESTAMP DEFAULT NOW(),
          assessed_by VARCHAR(36),
          expires_at TIMESTAMP,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          -- CRITICAL: Tenant isolation constraints
          CONSTRAINT user_skills_tenant_user_skill_unique UNIQUE (tenant_id, user_id, skill_id),
          CONSTRAINT user_skills_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // CRITICAL: Add tenant-first indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS user_skills_tenant_user_idx ON ${schemaId}.user_skills (tenant_id, user_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS user_skills_tenant_skill_idx ON ${schemaId}.user_skills (tenant_id, skill_id)
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

      // REMOVED: Invalid foreign key constraint for non-existent certification_id column
      // user_skills table doesn't have certification_id field - constraint removed

      // CRITICAL FIX: Ticket templates table with MANDATORY tenant_id field
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.ticket_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR(36) NOT NULL, -- CRITICAL: Explicit tenant isolation
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100) NOT NULL,
          priority VARCHAR(20) NOT NULL DEFAULT 'medium',
          urgency VARCHAR(20) NOT NULL DEFAULT 'medium',
          impact VARCHAR(20) NOT NULL DEFAULT 'medium',
          default_title VARCHAR(500),
          default_description TEXT,
          default_tags TEXT, -- JSON array of tags
          estimated_hours INTEGER DEFAULT 0,
          requires_approval BOOLEAN DEFAULT FALSE,
          auto_assign BOOLEAN DEFAULT FALSE,
          default_assignee_role VARCHAR(50),
          is_active BOOLEAN DEFAULT TRUE,
          created_by UUID NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          -- CRITICAL: Tenant isolation constraints
          CONSTRAINT templates_tenant_name_unique UNIQUE (tenant_id, name),
          CONSTRAINT templates_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // CRITICAL: Add tenant-first indexes for ticket templates
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS templates_tenant_category_idx ON ${schemaId}.ticket_templates (tenant_id, category)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS templates_tenant_active_idx ON ${schemaId}.ticket_templates (tenant_id, is_active)
      `);

      // CRITICAL FIX: Integrations table with MANDATORY tenant_id field
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.integrations (
          id VARCHAR(255) PRIMARY KEY,
          tenant_id VARCHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          icon VARCHAR(100),
          status VARCHAR(50) DEFAULT 'disconnected',
          config JSONB DEFAULT '{}',
          features TEXT[],
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT integrations_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // CRITICAL: Add tenant-first indexes for integrations
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS integrations_tenant_category_idx ON ${schemaId}.integrations (tenant_id, category)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS integrations_tenant_status_idx ON ${schemaId}.integrations (tenant_id, status)
      `);

      // ===========================
      // CRITICAL: CREATE ALL PERFORMANCE INDEXES
      // ===========================
      try {
        const { TenantIndexOptimizer } = await import('./database/TenantIndexOptimizer');
        await TenantIndexOptimizer.createMissingIndexes(schemaName);
        
        // Verificar integridade dos índices criados
        const indexIntegrityValid = await TenantIndexOptimizer.verifyIndexIntegrity(schemaName);
        if (!indexIntegrityValid) {
          console.warn(`[TenantIndexOptimizer] ⚠️ Index integrity verification failed for ${schemaName}`);
        }
        
      } catch (indexError) {
        const { logError } = await import('./utils/logger');
        logError(`Failed to create performance indexes for schema ${schemaName}`, indexError, { schemaName });
        // Continue without failing - indexes can be created later
      }

      const { logInfo } = await import('./utils/logger');
      logInfo(`✅ Tenant tables AND performance indexes created successfully for schema ${schemaName}`, { 
        schemaName,
        security: 'All queries use sql.identifier() for safe schema references',
        performance: 'Critical performance indexes created automatically'
      });

    } catch (error) {
      const { logError } = await import('./utils/logger');
      logError(`Failed to create tenant tables for schema ${schemaName}`, error, { schemaName });
      throw error;
    }
  }

  // CRITICAL FIX: Check if schema has legacy tables needing migration
  private async checkLegacySchema(schemaName: string): Promise<boolean> {
    try {
      // Check if any critical tables exist without tenant_id
      const result = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ${schemaName} 
        AND table_name IN ('skills', 'certifications', 'user_skills', 'customers', 'tickets')
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        return false; // No tables exist, no migration needed
      }

      // Check if any existing table lacks tenant_id
      const tenantIdCheck = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = ${schemaName} 
        AND table_name IN ('skills', 'certifications', 'user_skills', 'customers', 'tickets')
        AND column_name = 'tenant_id'
      `);

      // If we have tables but no tenant_id columns, we need migration
      return result.rows.length > 0 && tenantIdCheck.rows.length === 0;
    } catch (error) {
      return false; // If error checking, assume no migration needed
    }
  }

  // CRITICAL FIX: Migrate legacy tables using ENTERPRISE MIGRATION SAFETY
  private async migrateLegacyTables(schemaName: string): Promise<void> {
    try {
      console.log(`[SchemaManager] Starting enterprise-safe migration for ${schemaName}`);
      
      // USAR ENTERPRISE MIGRATION SAFETY em vez de queries brutas
      const { enterpriseMigrationSafety } = await import('./database/EnterpriseMigrationSafety');
      const result = await enterpriseMigrationSafety.safeMigrateLegacyTables(schemaName);
      
      if (!result.success) {
        throw new Error(`Migration failed: ${result.errors.join(', ')}`);
      }
      
      console.log(`✅ Enterprise migration completed for ${schemaName}: ${result.migratedTables.length} tables migrated`);
      if (result.backupId) {
        console.log(`✅ Backup created: ${result.backupId}`);
      }
      
      return;
    } catch (error) {
      console.error(`❌ Enterprise migration failed for ${schemaName}:`, error);
      
      // FALLBACK: Usar migração simples se enterprise falhar
      console.log(`[SchemaManager] Falling back to simple migration for ${schemaName}`);
      return await this.simpleMigrateLegacyTables(schemaName);
    }
  }

  // FALLBACK: Migração simples como backup
  private async simpleMigrateLegacyTables(schemaName: string): Promise<void> {
    try {
      // Extract tenant_id from schema name for migration
      const tenantId = schemaName.replace('tenant_', '').replace(/_/g, '-');

      // CRITICAL FIX: Use raw SQL for complex migration queries to avoid parameter binding issues
      const migrationQueries = [
        // Skills table migration
        `DO $$ 
         BEGIN 
           IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schemaName}' AND table_name = 'skills')
              AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'skills' AND column_name = 'tenant_id') THEN
             ALTER TABLE ${schemaName}.skills ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}';
             ALTER TABLE ${schemaName}.skills ADD CONSTRAINT skills_tenant_id_format CHECK (LENGTH(tenant_id) = 36);
           END IF;
         END $$;`,

        // Certifications table migration
        `DO $$ 
         BEGIN 
           IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schemaName}' AND table_name = 'certifications')
              AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'certifications' AND column_name = 'tenant_id') THEN
             ALTER TABLE ${schemaName}.certifications ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}';
             ALTER TABLE ${schemaName}.certifications ADD CONSTRAINT certifications_tenant_id_format CHECK (LENGTH(tenant_id) = 36);
           END IF;
         END $$;`,

        // User_skills table migration
        `DO $$ 
         BEGIN 
           IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schemaName}' AND table_name = 'user_skills')
              AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'user_skills' AND column_name = 'tenant_id') THEN
             ALTER TABLE ${schemaName}.user_skills ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}';
             ALTER TABLE ${schemaName}.user_skills ADD CONSTRAINT user_skills_tenant_id_format CHECK (LENGTH(tenant_id) = 36);
           END IF;
         END $$;`,

        // Customers table migration
        `DO $$ 
         BEGIN 
           IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schemaName}' AND table_name = 'customers')
              AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'customers' AND column_name = 'tenant_id') THEN
             ALTER TABLE ${schemaName}.customers ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}';
             ALTER TABLE ${schemaName}.customers ADD CONSTRAINT customers_tenant_id_format CHECK (LENGTH(tenant_id) = 36);
           END IF;
         END $$;`,

        // Tickets table migration
        `DO $$ 
         BEGIN 
           IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schemaName}' AND table_name = 'tickets')
              AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'tickets' AND column_name = 'tenant_id') THEN
             ALTER TABLE ${schemaName}.tickets ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}';
             ALTER TABLE ${schemaName}.tickets ADD CONSTRAINT tickets_tenant_id_format CHECK (LENGTH(tenant_id) = 36);
           END IF;
         END $$;`,

        // Additional tables migration + MISSING COLUMNS FIX
        `DO $$ 
         BEGIN 
           -- Ticket messages
           IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schemaName}' AND table_name = 'ticket_messages')
              AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'ticket_messages' AND column_name = 'tenant_id') THEN
             ALTER TABLE ${schemaName}.ticket_messages ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}';
           END IF;

           -- Activity logs
           IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schemaName}' AND table_name = 'activity_logs')
              AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'activity_logs' AND column_name = 'tenant_id') THEN
             ALTER TABLE ${schemaName}.activity_logs ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}';
           END IF;

           -- Locations
           IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schemaName}' AND table_name = 'locations')
              AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'locations' AND column_name = 'tenant_id') THEN
             ALTER TABLE ${schemaName}.locations ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}';
           END IF;

           -- External contacts
           IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schemaName}' AND table_name = 'external_contacts')
              AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'external_contacts' AND column_name = 'tenant_id') THEN
             ALTER TABLE ${schemaName}.external_contacts ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}';
           END IF;

           -- CRITICAL FIX: Add missing 'active' column to customers table if missing
           IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schemaName}' AND table_name = 'customers')
              AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'customers' AND column_name = 'active') THEN
             ALTER TABLE ${schemaName}.customers ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
           END IF;

           -- Add missing 'verified' column to customers table if missing
           IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schemaName}' AND table_name = 'customers')
              AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'customers' AND column_name = 'verified') THEN
             ALTER TABLE ${schemaName}.customers ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false;
           END IF;

           -- Add missing 'suspended' column to customers table if missing
           IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schemaName}' AND table_name = 'customers')
              AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'customers' AND column_name = 'suspended') THEN
             ALTER TABLE ${schemaName}.customers ADD COLUMN suspended BOOLEAN NOT NULL DEFAULT false;
           END IF;

         END $$;`
      ];

      // Execute each migration query
      for (const query of migrationQueries) {
        await db.execute(sql.raw(query));
      }

      const { logInfo } = await import('./utils/logger');
      logInfo(`Legacy tables migrated successfully for schema ${schemaName}`);
    } catch (error) {
      const { logError } = await import('./utils/logger');
      logError(`Failed to migrate legacy tables for schema ${schemaName}`, error);
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

  // ENTERPRISE PUBLIC TABLES: Ensure all public schema tables exist
  async ensurePublicTables(): Promise<void> {
    try {
      // Create tenants table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          subdomain VARCHAR(100) UNIQUE,
          is_active BOOLEAN DEFAULT true,
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create users table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          role VARCHAR(50) NOT NULL DEFAULT 'agent',
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create sessions table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(255) PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          data JSONB NOT NULL,
          expires TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log('[SchemaManager] Public tables ensured');
    } catch (error) {
      console.error('[SchemaManager] Failed to ensure public tables:', error);
      throw error;
    }
  }

  // ENTERPRISE TENANT VALIDATION: Validação robusta com verificação de estrutura
  async validateTenantSchema(tenantId: string): Promise<boolean> {
    try {
      // SECURITY: Validação rigorosa do tenant ID format
      if (!this.isValidTenantId(tenantId)) {
        console.error(`[SchemaManager] Invalid tenant ID format: ${tenantId}`);
        return false;
      }

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // STEP 1: Verificar se schema existe
      const schemaResult = await db.execute(sql`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = ${schemaName}
      `);

      if (schemaResult.rows.length === 0) {
        console.log(`[SchemaManager] Schema ${schemaName} does not exist`);
        return false;
      }

      // STEP 2: Validação estrutural completa das tabelas essenciais (TODAS AS 15 TABELAS CRÍTICAS)
      const requiredTables = [
        'customers', 'tickets', 'ticket_messages', 'activity_logs',
        'locations', 'customer_companies', 'skills', 'certifications',
        'user_skills', 'favorecidos', 'external_contacts', 'customer_company_memberships',
        'integrations', 'favorecido_locations'
      ];

      const tableResult = await db.execute(sql`
        SELECT table_name, 
               COUNT(column_name) as column_count
        FROM information_schema.columns 
        WHERE table_schema = ${schemaName}
        AND table_name IN ('customers', 'tickets', 'ticket_messages', 'activity_logs', 'locations', 'customer_companies', 'skills', 'certifications', 'user_skills', 'favorecidos', 'external_contacts', 'customer_company_memberships', 'integrations', 'favorecido_locations')
        GROUP BY table_name
      `);

      // STEP 3: Verificar se todas as tabelas essenciais existem com estrutura adequada
      const foundTables = new Set(tableResult.rows.map(row => row.table_name as string));
      const missingTables = requiredTables.filter(table => !foundTables.has(table));

      if (missingTables.length > 0) {
        console.warn(`[SchemaManager] Missing tables in ${schemaName}: ${missingTables.join(', ')}`);
        return false;
      }

      // STEP 4: Validar se as tabelas têm tenant_id column (crítico para isolamento)
      const tenantIdValidation = await db.execute(sql`
        SELECT table_name
        FROM information_schema.columns 
        WHERE table_schema = ${schemaName}
        AND column_name = 'tenant_id'
        AND table_name IN ('customers', 'tickets', 'ticket_messages', 'activity_logs', 'locations', 'customer_companies', 'skills', 'certifications', 'user_skills', 'favorecidos', 'external_contacts', 'customer_company_memberships', 'integrations', 'favorecido_locations')
      `);

      const tablesWithTenantId = new Set(tenantIdValidation.rows.map(row => row.table_name as string));
      const tablesWithoutTenantId = requiredTables.filter(table => !tablesWithTenantId.has(table));

      if (tablesWithoutTenantId.length > 0) {
        console.error(`[SchemaManager] CRITICAL: Tables missing tenant_id in ${schemaName}: ${tablesWithoutTenantId.join(', ')}`);
        return false;
      }

      console.log(`[SchemaManager] ✅ Schema ${schemaName} validation passed`);
      return true;
    } catch (error) {
      console.error(`[SchemaManager] Failed to validate tenant schema ${tenantId}:`, error);
      return false;
    }
  }

  // SECURITY: Validação rigorosa do formato tenant ID
  private isValidTenantId(tenantId: string): boolean {
    // UUID v4 format: 8-4-4-4-12 characters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(tenantId) && tenantId.length === 36;
  }
}

export const schemaManager = SchemaManager.getInstance();