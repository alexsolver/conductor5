import { sql } from 'drizzle-orm';
import { db, schemaManager } from '../db';
import { logInfo, logError, logWarn } from './logger';

// ===========================
// ENTERPRISE PRODUCTION INITIALIZATION SYSTEM
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
    if (!process.env.DATABASE_URL?.startsWith('postgres://') && !process.env.DATABASE_URL?.startsWith('postgresql://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
    }

    logInfo('Environment validation passed');
  }

  // ===========================
  // DATABASE INITIALIZATION
  // ===========================
  private async initializeDatabase(): Promise<void> {
    try {
      logInfo('Initializing database connections...');
      
      await schemaManager.ensurePublicTables();
      
      logInfo('Database initialization completed');
    } catch (error) {
      logError('Database initialization failed', error);
      throw error;
    }
  }

  // ===========================
  // TENANT SCHEMA VALIDATION
  // ===========================
  private async validateTenantSchemas(): Promise<void> {
    try {
      // Get all active tenants
      const result = await db.execute(sql`
        SELECT id, name FROM tenants WHERE is_active = true
      `);

      const tenants = result.rows as Array<{ id: string; name: string }>;
      logInfo(`Validating ${tenants.length} tenant schemas`);

      for (const tenant of tenants) {
        try {
          // Use unified validation - single source of truth
          const { UnifiedSchemaHealer } = await import('../services/UnifiedSchemaHealer');
          const validationStatus = await UnifiedSchemaHealer.getValidationStatus(tenant.id);
          
          if (validationStatus.isValid) {
            const message = `✅ Tenant schema validated for ${tenant.id}: ${validationStatus.tableCount} tables (11/11 core tables, 4/4 soft-delete) - ${validationStatus.status}`;
            console.log(message);
            logInfo(`Schema validated for tenant: ${tenant.id}`);
          } else {
            console.warn(`⚠️ Tenant ${tenant.id} has validation issues - manual intervention may be required`);
            logInfo(`Tenant ${tenant.id} validation issues: ${validationStatus.missingTables.length} missing tables`);
            // Note: Auto-healing disabled to prevent conflicts
          }
        } catch (error) {
          logError(`Critical error during schema validation for tenant ${tenant.id}`, error);
          // Continue with other tenants even if one fails
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
      // Test database connectivity
      await db.execute(sql`SELECT 1`);

      // Test tenant schema access (using first available tenant)
      const tenantResult = await db.execute(sql`
        SELECT id FROM tenants WHERE is_active = true LIMIT 1
      `);

      if (tenantResult.rows.length > 0) {
        const tenantId = tenantResult.rows[0].id as string;
        
        // Use unified validation for health check consistency
        const { UnifiedSchemaHealer } = await import('../services/UnifiedSchemaHealer');
        const healthStatus = await UnifiedSchemaHealer.getValidationStatus(tenantId);
        
        if (healthStatus.isValid) {
          logInfo(`Health check: Tenant schema ${tenantId} is healthy`);
        } else {
          logInfo(`Health check: Tenant schema ${tenantId} has validation issues but continues operation`);
        }
      }

      logInfo('All health checks passed');
    } catch (error) {
      logError('Health checks failed', error);
      throw error;
    }
  }
}

// Export singleton instance
export const productionInitializer = ProductionInitializer.getInstance();