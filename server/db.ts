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

  static getInstance(): SchemaManager {
    if (!SchemaManager.instance) {
      SchemaManager.instance = new SchemaManager();
    }
    return SchemaManager.instance;
  }

  // Create a new schema for a tenant
  async createTenantSchema(tenantId: string): Promise<void> {
    const schemaName = this.getSchemaName(tenantId);
    
    try {
      // Create the schema using parameterized query
      await db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(schemaName)}`);
      
      // Create tenant-specific tables in the new schema
      await this.createTenantTables(schemaName);
      
      // Schema criado com sucesso - usar sistema de logging adequado em produção
    } catch (error) {
      const { logError } = await import('./utils/logger');
      logError(`Failed to create schema for tenant ${tenantId}`, error, { tenantId, schemaName });
      throw error;
    }
  }

  // Get database connection for a specific tenant
  getTenantDb(tenantId: string): { db: ReturnType<typeof drizzle>; schema: any } {
    const schemaName = this.getSchemaName(tenantId);
    
    if (!this.tenantConnections.has(tenantId)) {
      // Create a new connection with the tenant's schema as default - safe from SQL injection
      const baseConnectionString = process.env.DATABASE_URL;
      if (!baseConnectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
      }
      
      // Safely append search_path parameter using URL constructor
      const connectionUrl = new URL(baseConnectionString);
      connectionUrl.searchParams.set('search_path', `${schemaName},public`);
      
      const tenantPool = new Pool({ 
        connectionString: connectionUrl.toString()
      });
      
      // Use simplified schema approach to avoid ExtraConfigBuilder error
      const tenantDb = drizzle({ 
        client: tenantPool
      });
      
      this.tenantConnections.set(tenantId, { db: tenantDb, schema: {} });
    }
    
    return this.tenantConnections.get(tenantId)!;
  }

  // Drop a tenant schema (for cleanup)
  async dropTenantSchema(tenantId: string): Promise<void> {
    const schemaName = this.getSchemaName(tenantId);
    
    try {
      await db.execute(sql`DROP SCHEMA IF EXISTS ${sql.identifier(schemaName)} CASCADE`);
      this.tenantConnections.delete(tenantId);
      // Schema removido com sucesso - usar sistema de logging adequado em produção
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

  // Create all tenant-specific tables in the schema
  private async createTenantTables(schemaName: string): Promise<void> {
    // Use Drizzle's sql.identifier to safely handle schema names
    const schemaId = sql.identifier(schemaName);
    
    // Create Customers table with parameterized query
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create Tickets table with parameterized query
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${schemaId}.tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL,
        assigned_to_id VARCHAR,
        subject VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'open',
        priority VARCHAR(50) DEFAULT 'medium',
        tags JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create Ticket Messages table with parameterized query
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${schemaId}.ticket_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL,
        author_id VARCHAR,
        customer_id UUID,
        content TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT false,
        attachments JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create Activity Logs table with parameterized query
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${schemaId}.activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR,
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100),
        entity_id UUID,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Add foreign key constraints after table creation to avoid circular dependencies
    await db.execute(sql`
      ALTER TABLE ${schemaId}.tickets 
      ADD CONSTRAINT fk_tickets_customer 
      FOREIGN KEY (customer_id) REFERENCES ${schemaId}.customers(id) ON DELETE CASCADE
    `);
    
    await db.execute(sql`
      ALTER TABLE ${schemaId}.tickets 
      ADD CONSTRAINT fk_tickets_assigned_user 
      FOREIGN KEY (assigned_to_id) REFERENCES public.users(id) ON DELETE SET NULL
    `);
    
    await db.execute(sql`
      ALTER TABLE ${schemaId}.ticket_messages 
      ADD CONSTRAINT fk_messages_ticket 
      FOREIGN KEY (ticket_id) REFERENCES ${schemaId}.tickets(id) ON DELETE CASCADE
    `);
    
    await db.execute(sql`
      ALTER TABLE ${schemaId}.ticket_messages 
      ADD CONSTRAINT fk_messages_author 
      FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL
    `);
    
    await db.execute(sql`
      ALTER TABLE ${schemaId}.ticket_messages 
      ADD CONSTRAINT fk_messages_customer 
      FOREIGN KEY (customer_id) REFERENCES ${schemaId}.customers(id) ON DELETE SET NULL
    `);
    
    await db.execute(sql`
      ALTER TABLE ${schemaId}.activity_logs 
      ADD CONSTRAINT fk_activity_user 
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
    `);
  }

  // List all tenant schemas
  async listTenantSchemas(): Promise<string[]> {
    const result = await db.execute(sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
    `);
    
    return result.rows.map(row => row.schema_name as string);
  }
}

export const schemaManager = SchemaManager.getInstance();