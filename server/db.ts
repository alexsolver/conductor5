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
  private tenantConnections = new Map<string, { db: ReturnType<typeof drizzle>; schema: ReturnType<typeof schema.getTenantSpecificSchema> }>();

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
      // Create the schema
      await db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`));
      
      // Create tenant-specific tables in the new schema
      await this.createTenantTables(schemaName);
      
      console.log(`Created schema ${schemaName} for tenant ${tenantId}`);
    } catch (error) {
      console.error(`Failed to create schema for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  // Get database connection for a specific tenant
  getTenantDb(tenantId: string): { db: ReturnType<typeof drizzle>; schema: ReturnType<typeof schema.getTenantSpecificSchema> } {
    const schemaName = this.getSchemaName(tenantId);
    
    if (!this.tenantConnections.has(tenantId)) {
      // Create a new connection with the tenant's schema as default
      const tenantPool = new Pool({ 
        connectionString: process.env.DATABASE_URL + `?search_path=${schemaName},public`
      });
      
      const tenantSchema = schema.getTenantSpecificSchema(schemaName);
      const tenantDb = drizzle({ 
        client: tenantPool, 
        schema: tenantSchema
      });
      
      this.tenantConnections.set(tenantId, { db: tenantDb, schema: tenantSchema });
    }
    
    return this.tenantConnections.get(tenantId)!;
  }

  // Drop a tenant schema (for cleanup)
  async dropTenantSchema(tenantId: string): Promise<void> {
    const schemaName = this.getSchemaName(tenantId);
    
    try {
      await db.execute(sql.raw(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`));
      this.tenantConnections.delete(tenantId);
      console.log(`Dropped schema ${schemaName} for tenant ${tenantId}`);
    } catch (error) {
      console.error(`Failed to drop schema for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  // Get schema name for tenant
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  // Create all tenant-specific tables in the schema
  private async createTenantTables(schemaName: string): Promise<void> {
    const createQueries = [
      // Customers table
      `CREATE TABLE IF NOT EXISTS "${schemaName}".customers (
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
      )`,
      
      // Tickets table
      `CREATE TABLE IF NOT EXISTS "${schemaName}".tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES "${schemaName}".customers(id),
        assigned_to_id VARCHAR REFERENCES public.users(id),
        subject VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'open',
        priority VARCHAR(50) DEFAULT 'medium',
        tags JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Ticket Messages table
      `CREATE TABLE IF NOT EXISTS "${schemaName}".ticket_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES "${schemaName}".tickets(id),
        author_id VARCHAR REFERENCES public.users(id),
        customer_id UUID REFERENCES "${schemaName}".customers(id),
        content TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT false,
        attachments JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Activity Logs table
      `CREATE TABLE IF NOT EXISTS "${schemaName}".activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES public.users(id),
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100),
        entity_id UUID,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )`
    ];

    for (const query of createQueries) {
      await db.execute(sql.raw(query));
    }
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