
import { sql } from 'drizzle-orm';
import { databaseManager } from '../database/DatabaseManager';
import { TenantValidator } from '../database/TenantValidator';
import { logInfo, logError, logWarn } from './logger';

// ===========================
// PRODUCTION INITIALIZATION SYSTEM
// Ensures all systems are ready before starting the application
// ===========================

export class ProductionInitializer {
  private static instance: ProductionInitializer;

  static getInstance(): ProductionInitializer {
    if (!ProductionInitializer.instance) {
      ProductionInitializer.instance = new ProductionInitializer();
    }
    return ProductionInitializer.instance;
  }

  // ===========================
  // MAIN INITIALIZATION
  // ===========================
  async initialize(): Promise<void> {
    try {
      logInfo('Starting production initialization...');

      // 1. Validate environment
      await this.validateEnvironment();

      // 2. Initialize database connections
      await this.initializeDatabase();

      // 3. Validate tenant schemas
      await this.validateTenantSchemas();

      // 4. Run health checks
      await this.runHealthChecks();

      logInfo('Production initialization completed successfully');
    } catch (error) {
      logError('Production initialization failed', error);
      throw error;
    }
  }

  // ===========================
  // ENVIRONMENT VALIDATION
  // ===========================
  private async validateEnvironment(): Promise<void> {
    const requiredEnvVars = ['DATABASE_URL', 'NODE_ENV'];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Validate DATABASE_URL format
    if (!process.env.DATABASE_URL.startsWith('postgres://') && !process.env.DATABASE_URL.startsWith('postgresql://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
    }

    logInfo('Environment validation passed');
  }

  // ===========================
  // DATABASE INITIALIZATION
  // ===========================
  private async initializeDatabase(): Promise<void> {
    try {
      // Initialize main database connection
      const mainDb = databaseManager.getMainDb();
      await mainDb.execute(sql`SELECT 1`);

      // Ensure public schema tables exist
      await this.ensurePublicTables();

      logInfo('Database initialization completed');
    } catch (error) {
      logError('Database initialization failed', error);
      throw error;
    }
  }

  private async ensurePublicTables(): Promise<void> {
    const mainDb = databaseManager.getMainDb();

    // Create tenants table if it doesn't exist
    await mainDb.execute(sql`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create users table if it doesn't exist
    await mainDb.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'agent',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    logInfo('Public tables ensured');
  }

  // ===========================
  // TENANT SCHEMA VALIDATION
  // ===========================
  private async validateTenantSchemas(): Promise<void> {
    try {
      const mainDb = databaseManager.getMainDb();
      
      // Get all active tenants
      const result = await mainDb.execute(sql`
        SELECT id, name FROM tenants WHERE is_active = true
      `);

      const tenants = result.rows;
      logInfo(`Validating ${tenants.length} tenant schemas`);

      // Validate each tenant schema
      for (const tenant of tenants) {
        try {
          const tenantId = tenant.id as string;
          await databaseManager.ensureTenantSchema(tenantId);
          logInfo(`Schema validated for tenant: ${tenantId}`);
        } catch (error) {
          logWarn(`Schema validation failed for tenant ${tenant.id}:`, error);
          // Continue with other tenants
        }
      }

      logInfo('Tenant schema validation completed');
    } catch (error) {
      logError('Tenant schema validation failed', error);
      throw error;
    }
  }

  // ===========================
  // HEALTH CHECKS
  // ===========================
  private async runHealthChecks(): Promise<void> {
    try {
      // Database health check
      const dbHealth = await databaseManager.healthCheck();
      if (!dbHealth.healthy) {
        throw new Error(`Database health check failed: ${JSON.stringify(dbHealth.details)}`);
      }

      // Tenant validator health check
      const validatorHealth = await this.validateTenantValidatorHealth();
      if (!validatorHealth) {
        throw new Error('Tenant validator health check failed');
      }

      logInfo('All health checks passed');
    } catch (error) {
      logError('Health checks failed', error);
      throw error;
    }
  }

  private async validateTenantValidatorHealth(): Promise<boolean> {
    try {
      // Test with a valid UUID format
      const testId = '123e4567-e89b-12d3-a456-426614174000';
      TenantValidator.validateTenantId(testId);
      return true;
    } catch {
      return false;
    }
  }

  // ===========================
  // GRACEFUL SHUTDOWN
  // ===========================
  async shutdown(): Promise<void> {
    try {
      logInfo('Starting graceful shutdown...');
      
      // Shutdown database manager
      await databaseManager.shutdown();
      
      logInfo('Graceful shutdown completed');
    } catch (error) {
      logError('Graceful shutdown failed', error);
      throw error;
    }
  }
}

// Export singleton instance
export const productionInitializer = ProductionInitializer.getInstance();
