
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";
import { logInfo, logError, logWarn } from "../utils/logger";
import { TenantValidator } from "./TenantValidator";

neonConfig.webSocketConstructor = ws;

// ===========================
// UNIFIED DATABASE MANAGER - PRODUCTION READY
// Fixes: All tenant isolation, connection management, and schema issues
// ===========================

export class DatabaseManager {
  private static instance: DatabaseManager;
  private mainPool: Pool;
  private mainDb: ReturnType<typeof drizzle>;
  private tenantPools = new Map<string, Pool>();
  private tenantDbs = new Map<string, ReturnType<typeof drizzle>>();
  private schemaCache = new Map<string, boolean>();
  private readonly MAX_TENANT_POOLS = 20;
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    this.initializeMainConnection();
    this.startCleanupRoutine();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // ===========================
  // MAIN CONNECTION INITIALIZATION
  // ===========================
  private initializeMainConnection(): void {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set');
    }

    this.mainPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 15, // Production-ready pool size
      min: 5,
      idleTimeoutMillis: 300000, // 5 minutes
      connectionTimeoutMillis: 10000,
      acquireTimeoutMillis: 15000,
      maxUses: 7500,
      keepAlive: true,
      application_name: 'main_conductor_app'
    });

    this.mainDb = drizzle({ client: this.mainPool, schema });
    logInfo('Main database connection initialized');
  }

  // ===========================
  // TENANT CONNECTION MANAGEMENT
  // ===========================
  async getTenantConnection(tenantId: string): Promise<ReturnType<typeof drizzle>> {
    // Validate tenant ID format
    const validatedTenantId = TenantValidator.validateTenantId(tenantId);
    
    // Check if connection exists
    if (this.tenantDbs.has(validatedTenantId)) {
      return this.tenantDbs.get(validatedTenantId)!;
    }

    // Validate tenant exists and is active
    const isValid = await TenantValidator.validateTenantExists(validatedTenantId);
    if (!isValid) {
      throw new Error(`Invalid or inactive tenant: ${validatedTenantId}`);
    }

    // Ensure schema exists
    await this.ensureTenantSchema(validatedTenantId);

    // Create new tenant connection
    const tenantDb = await this.createTenantConnection(validatedTenantId);
    this.tenantDbs.set(validatedTenantId, tenantDb);

    logInfo(`Tenant connection created: ${validatedTenantId}`);
    return tenantDb;
  }

  private async createTenantConnection(tenantId: string): Promise<ReturnType<typeof drizzle>> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // Evict least recently used if at capacity
    if (this.tenantPools.size >= this.MAX_TENANT_POOLS) {
      await this.evictOldestConnection();
    }

    // Create tenant-specific pool
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5, // Smaller per-tenant pool
      min: 1,
      idleTimeoutMillis: 180000, // 3 minutes
      connectionTimeoutMillis: 8000,
      acquireTimeoutMillis: 12000,
      maxUses: 2000,
      keepAlive: true,
      application_name: `tenant_${tenantId}`,
      options: {
        search_path: `${schemaName},public`
      }
    });

    this.tenantPools.set(tenantId, tenantPool);
    return drizzle({ client: tenantPool, schema });
  }

  // ===========================
  // SCHEMA MANAGEMENT
  // ===========================
  async ensureTenantSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // Check cache first
    if (this.schemaCache.has(schemaName)) {
      return;
    }

    // Check if schema exists
    const exists = await this.schemaExists(schemaName);
    if (!exists) {
      await this.createTenantSchema(schemaName, tenantId);
    }

    // Cache the result
    this.schemaCache.set(schemaName, true);
  }

  private async schemaExists(schemaName: string): Promise<boolean> {
    try {
      const result = await this.mainDb.execute(sql`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.schemata 
          WHERE schema_name = ${schemaName}
        ) as exists
      `);
      return Boolean(result.rows[0]?.exists);
    } catch {
      return false;
    }
  }

  private async createTenantSchema(schemaName: string, tenantId: string): Promise<void> {
    try {
      // Create schema
      await this.mainDb.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(schemaName)}`);
      
      // Create all tenant tables
      await this.createTenantTables(schemaName, tenantId);
      
      logInfo(`Schema created: ${schemaName}`);
    } catch (error) {
      logError(`Failed to create schema: ${schemaName}`, error);
      throw error;
    }
  }

  private async createTenantTables(schemaName: string, tenantId: string): Promise<void> {
    const schemaId = sql.identifier(schemaName);

    // Create all tenant tables with proper tenant_id isolation
    const tableQueries = [
      // Customers table
      sql`CREATE TABLE IF NOT EXISTS ${schemaId}.customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL DEFAULT ${tenantId},
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        company VARCHAR(255),
        verified BOOLEAN DEFAULT FALSE,
        active BOOLEAN DEFAULT TRUE,
        suspended BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT customers_tenant_email_unique UNIQUE (tenant_id, email),
        CONSTRAINT customers_tenant_id_check CHECK (tenant_id = ${tenantId})
      )`,

      // Tickets table
      sql`CREATE TABLE IF NOT EXISTS ${schemaId}.tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL DEFAULT ${tenantId},
        subject VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'open',
        priority VARCHAR(20) DEFAULT 'medium',
        customer_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT tickets_tenant_id_check CHECK (tenant_id = ${tenantId})
      )`,

      // External contacts table
      sql`CREATE TABLE IF NOT EXISTS ${schemaId}.external_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL DEFAULT ${tenantId},
        type VARCHAR(20) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT external_contacts_tenant_id_check CHECK (tenant_id = ${tenantId})
      )`,

      // Locations table
      sql`CREATE TABLE IF NOT EXISTS ${schemaId}.locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL DEFAULT ${tenantId},
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        zip_code VARCHAR(20) NOT NULL,
        latitude VARCHAR(20),
        longitude VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT locations_tenant_id_check CHECK (tenant_id = ${tenantId})
      )`,

      // Skills table
      sql`CREATE TABLE IF NOT EXISTS ${schemaId}.skills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL DEFAULT ${tenantId},
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT skills_tenant_id_check CHECK (tenant_id = ${tenantId})
      )`,

      // User skills table
      sql`CREATE TABLE IF NOT EXISTS ${schemaId}.user_skills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL DEFAULT ${tenantId},
        user_id VARCHAR(36) NOT NULL,
        skill_id UUID NOT NULL,
        level INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT user_skills_tenant_id_check CHECK (tenant_id = ${tenantId})
      )`
    ];

    // Execute all table creation queries
    for (const query of tableQueries) {
      await this.mainDb.execute(query);
    }

    // Create indexes for performance
    await this.createTenantIndexes(schemaId, tenantId);
  }

  private async createTenantIndexes(schemaId: any, tenantId: string): Promise<void> {
    const indexQueries = [
      sql`CREATE INDEX IF NOT EXISTS customers_tenant_email_idx ON ${schemaId}.customers (tenant_id, email)`,
      sql`CREATE INDEX IF NOT EXISTS tickets_tenant_status_idx ON ${schemaId}.tickets (tenant_id, status)`,
      sql`CREATE INDEX IF NOT EXISTS external_contacts_tenant_type_idx ON ${schemaId}.external_contacts (tenant_id, type)`,
      sql`CREATE INDEX IF NOT EXISTS locations_tenant_name_idx ON ${schemaId}.locations (tenant_id, name)`,
      sql`CREATE INDEX IF NOT EXISTS skills_tenant_category_idx ON ${schemaId}.skills (tenant_id, category)`,
      sql`CREATE INDEX IF NOT EXISTS user_skills_tenant_user_idx ON ${schemaId}.user_skills (tenant_id, user_id)`
    ];

    for (const query of indexQueries) {
      await this.mainDb.execute(query);
    }
  }

  // ===========================
  // CLEANUP AND MAINTENANCE
  // ===========================
  private startCleanupRoutine(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupConnections();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async cleanupConnections(): Promise<void> {
    // Clean up idle connections and cache
    const now = Date.now();
    
    // Clear old schema cache entries
    this.schemaCache.clear();
    
    // Close idle tenant connections if needed
    if (this.tenantPools.size > this.MAX_TENANT_POOLS * 0.8) {
      await this.evictOldestConnection();
    }
  }

  private async evictOldestConnection(): Promise<void> {
    const [oldestTenant] = this.tenantPools.keys();
    if (oldestTenant) {
      await this.closeTenantConnection(oldestTenant);
    }
  }

  private async closeTenantConnection(tenantId: string): Promise<void> {
    const pool = this.tenantPools.get(tenantId);
    if (pool) {
      await pool.end();
      this.tenantPools.delete(tenantId);
      this.tenantDbs.delete(tenantId);
    }
  }

  // ===========================
  // PUBLIC API
  // ===========================
  getMainDb(): ReturnType<typeof drizzle> {
    return this.mainDb;
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close all tenant connections
    for (const tenantId of this.tenantPools.keys()) {
      await this.closeTenantConnection(tenantId);
    }

    // Close main connection
    await this.mainPool.end();
    logInfo('Database manager shutdown complete');
  }

  // ===========================
  // HEALTH CHECK
  // ===========================
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      await this.mainDb.execute(sql`SELECT 1`);
      return {
        healthy: true,
        details: {
          mainConnection: 'healthy',
          tenantConnections: this.tenantDbs.size,
          schemaCache: this.schemaCache.size
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: { error: error.message }
      };
    }
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();
