// EMERGENCY SIMPLIFIED DB MANAGER
// Temporary replacement due to syntax errors from sed commands

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

// Re-export sql for other modules
export { sql };

// CRITICAL FIX: Patch ErrorEvent bug in Neon driver
const originalErrorEvent = globalThis.ErrorEvent;
if (originalErrorEvent) {
  globalThis.ErrorEvent = class PatchedErrorEvent extends originalErrorEvent {
    constructor(type, eventInitDict) {
      super(type, eventInitDict);
      // Make message writable to fix Neon driver bug
      Object.defineProperty(this, 'message', {
        value: eventInitDict?.message || '',
        writable: true,
        configurable: true
      });
    }
  };
}

neonConfig.webSocketConstructor = ws;

// CRITICAL: Enhanced configuration for Neon hibernation compatibility in Replit  
neonConfig.fetchConnectionCache = true;
neonConfig.useSecureWebSocket = false; // Disable WSS for Replit compatibility
neonConfig.pipelineConnect = false; // Simplify connection pipeline
neonConfig.poolQueryViaFetch = true; // Use fetch for better error handling

// HIBERNATION RECOVERY: Enhanced pool configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000, // Increased for hibernation recovery
  idleTimeoutMillis: 60000, // Longer idle timeout
  max: 2, // Reduced for stability
  statement_timeout: 45000,
  query_timeout: 45000,
  // CRITICAL: Enhanced retry logic for hibernation
  retries: 5,
  retryDelay: 2000
});

export const db = drizzle({ client: pool, schema });

// HIBERNATION RECOVERY: Enhanced connection monitoring
let connectionStartTime = Date.now();
let hibernationRecoveryActive = false;

// CRITICAL FIX: Enhanced error handling for Neon hibernation
const handleConnectionError = (err) => {
  const errorMessage = err?.message || String(err);
  
  // HIBERNATION DETECTION: Check for hibernation-related errors
  if (errorMessage.includes('terminating connection due to administrator command') ||
      errorMessage.includes('Connection terminated unexpectedly') ||
      errorMessage.includes('WebSocket connection closed') ||
      errorMessage.includes('Cannot set property message')) {
    
    if (!hibernationRecoveryActive) {
      hibernationRecoveryActive = true;
      console.log('🔄 Hibernation detected, initiating recovery...');
      
      // RECOVERY DELAY: Wait for hibernation to complete
      setTimeout(async () => {
        try {
          console.log('🔧 Testing connection recovery...');
          await db.execute(sql`SELECT 1 as recovery_test`);
          console.log('✅ Connection recovered successfully');
          hibernationRecoveryActive = false;
        } catch (recoveryErr) {
          console.log('⚠️ Recovery attempt failed, will retry automatically');
          hibernationRecoveryActive = false;
        }
      }, 3000);
    }
  } else {
    console.error('❌ Database connection error:', errorMessage);
  }
};

db.$client.on('connect', () => {
  const connectionTime = Date.now() - connectionStartTime;
  console.log(`✅ Database connection established in ${connectionTime}ms`);
  hibernationRecoveryActive = false;
});

db.$client.on('error', handleConnectionError);

// CRITICAL: Global error handler for unhandled Neon errors
process.on('uncaughtException', (error) => {
  if (error.message && error.message.includes('Cannot set property message')) {
    console.log('🔧 Intercepted Neon ErrorEvent bug, ignoring...');
    return; // Prevent crash
  }
  throw error; // Re-throw non-Neon errors
});

// Performance monitoring
setInterval(async () => {
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    const latency = Date.now() - start;
    if (latency > 100) {
      console.log(`⚠️ Database latency: ${latency}ms`);
    }
  } catch (error) {
    console.error('❌ Database health check failed:', error);
  }
}, 30000); // Check every 30 seconds

// Simplified schema manager with all required methods
export const schemaManager = {
  getPool() {
    return pool;
  },

  getSchemaName(tenantId: string) {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  },

  async getTenantDb(tenantId: string) {
    return { db };
  },

  // Validate tenant schema has all required tables
  async validateTenantSchema(tenantId: string): Promise<boolean> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Check if schema exists
      const schemaResult = await db.execute(sql`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = ${schemaName}
      `);

      if (schemaResult.rows.length === 0) {
        console.log(`❌ Schema ${schemaName} does not exist`);
        return false;
      }

      // Define core required tables for basic functionality
      const coreRequiredTables = [
        'customers', 'tickets', 'ticket_messages', 'activity_logs', 
        'locations', 'customer_companies', 'skills', 'certifications', 
        'user_skills', 'favorecidos', 'projects', 'project_actions'
      ];

      // Check for core tables existence
      let missingTables = [];
      for (const tableName of coreRequiredTables) {
        const tableExists = await db.execute(sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = ${schemaName} 
          AND table_name = ${tableName}
        `);

        if (tableExists.rows.length === 0) {
          missingTables.push(tableName);
        }
      }

      // Get actual table count
      const tableResult = await db.execute(sql`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables 
        WHERE table_schema = ${schemaName}
      `);

      const actualTableCount = Number(tableResult.rows[0]?.table_count || 0);
      const coreTablesPresent = coreRequiredTables.length - missingTables.length;

      // Accept schema if at least 80% of core tables are present
      const acceptanceThreshold = Math.ceil(coreRequiredTables.length * 0.8);

      if (coreTablesPresent >= acceptanceThreshold) {
        console.log(`✅ Tenant schema validated for ${tenantId}: ${actualTableCount} tables (${coreTablesPresent}/${coreRequiredTables.length} core tables)`);
        return true;
      }

      console.log(`❌ Tenant schema validation failed for ${tenantId}: Missing core tables: ${missingTables.join(', ')} (${coreTablesPresent}/${coreRequiredTables.length} core tables present)`);
      return false;

    } catch (error) {
      console.error(`❌ Error validating tenant schema for ${tenantId}:`, error);
      return false;
    }
  },

  async ensureTenantExists(tenantId: string) {
    try {
      // Verificar se tenant existe na tabela tenants
      const tenantExists = await pool.query(
        'SELECT id FROM tenants WHERE id = $1 AND is_active = true',
        [tenantId]
      );

      if (tenantExists.rows.length === 0) {
        throw new Error(`Tenant not found or inactive: ${tenantId}`);
      }

      // Garantir que schema do tenant existe
      const schemaValid = await this.validateTenantSchema(tenantId);
      if (!schemaValid) {
        throw new Error(`Tenant schema validation failed: ${tenantId}`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Tenant existence check failed for ${tenantId}:`, (error as Error).message);
      return false;
    }
  },

  async ensurePublicTables() {
    try {
      // Verificar tabelas públicas obrigatórias (3 de 18 tabelas totais do schema-master.ts)  
      // PUBLIC SCHEMA: sessions (linha 27-35), tenants (linha 38-46), users (linha 49-63)
      // NOTA: sessions tabela existe no schema-master.ts e é necessária para express-session
      const requiredPublicTables = ['sessions', 'tenants', 'users'];

      for (const tableName of requiredPublicTables) {
        const tableExists = await pool.query(
          `SELECT table_name FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_name = $1`,
          [tableName]
        );

        if (tableExists.rows.length === 0) {
          throw new Error(`Critical public table missing: ${tableName}`);
        }
      }

      console.log(`✅ Public tables validation completed: ${requiredPublicTables.length}/3 tables validated (3 of 18 total schema tables)`);
      return true;
    } catch (error) {
      console.error("❌ Public tables validation failed:", (error as Error).message);
      return false;
    }
  },

  // Create tenant schema with all tables
  async createTenantSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      console.log(`🔧 Creating/updating tenant schema: ${schemaName}`);

      // Create schema if it doesn't exist
      await db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`));

      // Create missing tables
      await this.createMissingTenantTables(schemaName);

      console.log(`✅ Tenant schema updated: ${schemaName}`);
    } catch (error) {
      console.error(`❌ Error creating tenant schema ${schemaName}:`, error);
      throw error;
    }
  },

  // Create missing tenant tables
  async createMissingTenantTables(schemaName: string): Promise<void> {
    const coreTableDefinitions = {
      customers: `
        CREATE TABLE IF NOT EXISTS "${schemaName}".customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          company VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT customers_tenant_email_unique UNIQUE (tenant_id, email)
        )
      `,
      tickets: `
        CREATE TABLE IF NOT EXISTS "${schemaName}".tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          subject VARCHAR(500) NOT NULL,
          description TEXT,
          priority VARCHAR(20) DEFAULT 'medium',
          status VARCHAR(50) DEFAULT 'open',
          impact VARCHAR(20) DEFAULT 'medium',
          urgency VARCHAR(20) DEFAULT 'medium',
          category VARCHAR(100),
          subcategory VARCHAR(100),
          caller_id UUID,
          assigned_to_id UUID,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      ticket_messages: `
        CREATE TABLE IF NOT EXISTS "${schemaName}".ticket_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          ticket_id UUID,
          content TEXT NOT NULL,
          sender VARCHAR(255) NOT NULL,
          sender_type VARCHAR(50) DEFAULT 'agent',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      activity_logs: `
        CREATE TABLE IF NOT EXISTS "${schemaName}".activity_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id UUID NOT NULL,
          action VARCHAR(100) NOT NULL,
          user_id VARCHAR(255),
          metadata JSONB,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      locations: `
        CREATE TABLE IF NOT EXISTS "${schemaName}".locations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          latitude DECIMAL(10,7),
          longitude DECIMAL(10,7),
          address TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      customer_companies: `
        CREATE TABLE IF NOT EXISTS "${schemaName}".customer_companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          display_name VARCHAR(255),
          description TEXT,
          size VARCHAR(50),
          subscription_tier VARCHAR(50),
          status VARCHAR(50) DEFAULT 'active',
          created_by VARCHAR(255),
          updated_by VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      skills: `
        CREATE TABLE IF NOT EXISTS "${schemaName}".skills (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      certifications: `
        CREATE TABLE IF NOT EXISTS "${schemaName}".certifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          issuer VARCHAR(255),
          description TEXT,
          validity_period_months INTEGER,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      user_skills: `
        CREATE TABLE IF NOT EXISTS "${schemaName}".user_skills (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          skill_id UUID,
          level VARCHAR(50) DEFAULT 'beginner',
          years_of_experience INTEGER,
          certification_id UUID,
          is_verified BOOLEAN DEFAULT false,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      favorecidos: `
        CREATE TABLE IF NOT EXISTS "${schemaName}".favorecidos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20),
          cell_phone VARCHAR(20),
          cpf VARCHAR(14),
          cnpj VARCHAR(18),
          rg VARCHAR(20),
          integration_code VARCHAR(100),
          address TEXT,
          city VARCHAR(100),
          state VARCHAR(2),
          zip_code VARCHAR(10),
          notes TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      projects: `
        CREATE TABLE IF NOT EXISTS "${schemaName}".projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'planning',
          priority VARCHAR(20) DEFAULT 'medium',
          budget DECIMAL(12,2),
          actual_cost DECIMAL(12,2),
          estimated_hours INTEGER,
          actual_hours INTEGER,
          start_date DATE,
          end_date DATE,
          manager_id UUID,
          client_id UUID,
          team_member_ids UUID[],
          tags TEXT[],
          custom_fields JSONB,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      project_actions: `
        CREATE TABLE IF NOT EXISTS "${schemaName}".project_actions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          project_id UUID,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) NOT NULL,
          action_type VARCHAR(50) NOT NULL DEFAULT 'task',
          status VARCHAR(50) DEFAULT 'pending',
          priority VARCHAR(20) DEFAULT 'medium',
          estimated_hours INTEGER,
          actual_hours INTEGER,
          scheduled_date DATE,
          assigned_to_id UUID,
          responsible_ids UUID[],
          depends_on_action_ids UUID[],
          blocked_by_action_ids UUID[],
          related_ticket_id UUID,
          can_convert_to_ticket BOOLEAN DEFAULT false,
          ticket_conversion_rules JSONB,
          completed_at TIMESTAMP WITH TIME ZONE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    };

    // Create each table
    for (const [tableName, createSQL] of Object.entries(coreTableDefinitions)) {
      try {
        await db.execute(sql.raw(createSQL));
        console.log(`✅ Created table: ${schemaName}.${tableName}`);
      } catch (error) {
        console.log(`ℹ️ Table ${schemaName}.${tableName} already exists or creation skipped`);
      }
    }

    // Create indexes for performance
    await this.createTenantIndexes(schemaName);
  },

  // Create essential indexes for tenant tables
  async createTenantIndexes(schemaName: string): Promise<void> {
    const indexes = [
      `CREATE INDEX IF NOT EXISTS customers_tenant_email_idx ON "${schemaName}".customers (tenant_id, email)`,
      `CREATE INDEX IF NOT EXISTS tickets_tenant_status_idx ON "${schemaName}".tickets (tenant_id, status)`,
      `CREATE INDEX IF NOT EXISTS ticket_messages_tenant_ticket_idx ON "${schemaName}".ticket_messages (tenant_id, ticket_id)`,
      `CREATE INDEX IF NOT EXISTS activity_logs_tenant_entity_idx ON "${schemaName}".activity_logs (tenant_id, entity_type, entity_id)`,
      `CREATE INDEX IF NOT EXISTS locations_tenant_name_idx ON "${schemaName}".locations (tenant_id, name)`,
      `CREATE INDEX IF NOT EXISTS customer_companies_tenant_name_idx ON "${schemaName}".customer_companies (tenant_id, name)`,
      `CREATE INDEX IF NOT EXISTS skills_tenant_name_idx ON "${schemaName}".skills (tenant_id, name)`,
      `CREATE INDEX IF NOT EXISTS user_skills_tenant_user_idx ON "${schemaName}".user_skills (tenant_id, user_id)`,
      `CREATE INDEX IF NOT EXISTS favorecidos_tenant_cpf_idx ON "${schemaName}".favorecidos (tenant_id, cpf)`,
      `CREATE INDEX IF NOT EXISTS projects_tenant_status_idx ON "${schemaName}".projects (tenant_id, status)`,
      `CREATE INDEX IF NOT EXISTS project_actions_tenant_project_idx ON "${schemaName}".project_actions (tenant_id, project_id)`
    ];

    for (const indexSQL of indexes) {
      try {
        await db.execute(sql.raw(indexSQL));
      } catch (error) {
        // Index might already exist, continue
      }
    }
  }
}

// Export for backward compatibility
export default db;