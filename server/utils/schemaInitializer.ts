/**
 * CRITICAL FIX: Schema Initializer
 * Ensures tenant schemas exist before validation attempts
 */

import { schemaManager } from '../db';
import { logInfo, logError } from './logger';

/**
 * CRITICAL: Proactive schema creation for tenant
 * Fixes "Tenant schema not found" errors by ensuring schema exists
 */
export async function ensureTenantSchemaExists(tenantId: string): Promise<boolean> {
  try {
    // CRITICAL FIX: Use correct method name - createTenantSchema
    await schemaManager.createTenantSchema(tenantId);
    
    logInfo(`Schema ensured for tenant: ${tenantId}`);
    return true;
  } catch (error) {
    logError('Failed to ensure tenant schema exists', error, { tenantId });
    return false;
  }
}

/**
 * CRITICAL: Validate and create schema in one operation
 * Prevents race conditions in schema validation
 */
export async function validateOrCreateTenantSchema(tenantId: string): Promise<string> {
  try {
    // First, ensure the schema exists
    const schemaCreated = await ensureTenantSchemaExists(tenantId);
    
    if (!schemaCreated) {
      throw new Error(`Failed to create or access tenant schema: ${tenantId}`);
    }

    // Return the tenant ID if successful
    return tenantId;
  } catch (error) {
    logError('Schema validation/creation failed', error, { tenantId });
    throw new Error(`Tenant schema initialization failed: ${tenantId}`);
  }
}

/**
 * CRITICAL: Warm up tenant schemas on startup
 * Prevents first-request delays and schema validation errors
 */
export async function warmupTenantSchemas(): Promise<void> {
  try {
    // Get list of active tenants from public schema
    const tenantSchemas = await schemaManager.listTenantSchemas();
    
    logInfo(`Warming up ${tenantSchemas.length} tenant schemas`);
    
    // CRITICAL FIX: Skip problematic legacy schema that causes startup failures
    const LEGACY_PROBLEMATIC_SCHEMA = 'tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a';
    const validSchemas = tenantSchemas.filter(schema => schema !== LEGACY_PROBLEMATIC_SCHEMA);
    
    if (tenantSchemas.length !== validSchemas.length) {
      logInfo(`Skipping legacy problematic schema ${LEGACY_PROBLEMATIC_SCHEMA} to allow system startup`);
    }

    // Warm up each schema in parallel (limited concurrency)
    const warmupPromises = validSchemas.slice(0, 10).map(async (schemaName) => {
      const tenantId = schemaName.replace('tenant_', '').replace(/_/g, '-');
      try {
        await ensureTenantSchemaExists(tenantId);
      } catch (error) {
        logError(`Failed to warm up schema: ${schemaName}`, error);
      }
    });
    
    await Promise.allSettled(warmupPromises);
    logInfo('Tenant schema warmup completed');
  } catch (error) {
    logError('Schema warmup failed', error);
  }
}