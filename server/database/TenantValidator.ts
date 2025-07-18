import { sql } from 'drizzle-orm';
import { db } from '../db';
import { logError, logWarn } from '../utils/logger';

// ===========================
// ADVANCED TENANT VALIDATION & CROSS-TENANT PROTECTION
// Fixes: Cross-tenant data access vulnerabilities
// ===========================

export class TenantValidator {
  private static tenantCache = new Map<string, { exists: boolean, lastChecked: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // ===========================
  // SECURE TENANT ID VALIDATION - CRITICAL FIX
  // Prevents SQL injection in schema names
  // ===========================
  static validateTenantId(tenantId: string): string {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Tenant ID is required and must be a string');
    }

    // CRITICAL: Enforce strict UUID format only (36 characters)
    const sanitized = tenantId.trim();
    
    // CRITICAL: Only allow exact UUID format (no legacy support)
    const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
    if (!uuidPattern.test(sanitized)) {
      logWarn('Invalid tenant UUID format attempted', { tenantId, sanitized });
      throw new Error(`Tenant ID must be valid UUID format: ${tenantId}`);
    }

    // CRITICAL: Enforce exact UUID length
    if (sanitized.length !== 36) {
      throw new Error('Tenant ID must be exactly 36 characters (UUID format)');
    }

    return sanitized;
  }

  // ===========================
  // TENANT EXISTENCE VALIDATION
  // Prevents access to non-existent tenants
  // ===========================
  static async validateTenantExists(tenantId: string): Promise<boolean> {
    const validatedId = this.validateTenantId(tenantId);
    
    // Check cache first
    const cached = this.tenantCache.get(validatedId);
    if (cached && (Date.now() - cached.lastChecked) < this.CACHE_TTL) {
      return cached.exists;
    }

    try {
      // Secure query using parameterized query
      const result = await db.execute(sql`
        SELECT 1 FROM tenants 
        WHERE id = ${validatedId} AND is_active = true
        LIMIT 1
      `);

      const exists = result.rows.length > 0;
      
      // Update cache
      this.tenantCache.set(validatedId, {
        exists,
        lastChecked: Date.now()
      });

      if (!exists) {
        logWarn('Access attempted to non-existent tenant', { tenantId: validatedId });
      }

      return exists;
    } catch (error) {
      logError('Error validating tenant existence', error, { tenantId: validatedId });
      return false;
    }
  }

  // ===========================
  // SCHEMA EXISTENCE VALIDATION
  // Ensures tenant schema exists before operations
  // ===========================
  static async validateSchemaExists(tenantId: string): Promise<boolean> {
    const validatedId = this.validateTenantId(tenantId);
    const schemaName = `tenant_${validatedId.replace(/-/g, '_')}`;

    try {
      // CRITICAL: Validate schema name format to prevent injection
      const schemaNamePattern = /^tenant_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
      if (!schemaNamePattern.test(schemaName)) {
        logError('Invalid schema name format', { tenantId: validatedId, schemaName });
        return false;
      }

      // CRITICAL: Use parameterized query with explicit tenant validation
      const result = await db.execute(sql`
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = ${schemaName}
        AND schema_name LIKE 'tenant_%'
        AND LENGTH(schema_name) = 43
      `);

      return result.rows.length > 0;
    } catch (error) {
      logError('Error validating schema existence', error, { tenantId: validatedId, schemaName });
      return false;
    }
  }

  // ===========================
  // COMPREHENSIVE TENANT VALIDATION
  // Complete validation chain for all tenant operations
  // ===========================
  static async validateTenantAccess(tenantId: string): Promise<string> {
    const validatedId = this.validateTenantId(tenantId);

    // Check tenant exists and is active
    const tenantExists = await this.validateTenantExists(validatedId);
    if (!tenantExists) {
      throw new Error(`Tenant not found or inactive: ${validatedId}`);
    }

    // Check schema exists
    const schemaExists = await this.validateSchemaExists(validatedId);
    if (!schemaExists) {
      throw new Error(`Tenant schema not found: ${validatedId}`);
    }

    return validatedId;
  }

  // ===========================
  // CACHE MANAGEMENT
  // ===========================
  static clearCache(): void {
    this.tenantCache.clear();
  }

  static removeTenantFromCache(tenantId: string): void {
    this.tenantCache.delete(tenantId);
  }

  // ===========================
  // MONITORING METHODS
  // ===========================
  static getCacheStats() {
    return {
      cacheSize: this.tenantCache.size,
      cacheTTL: this.CACHE_TTL,
      tenants: Array.from(this.tenantCache.entries()).map(([id, data]) => ({
        tenantId: id,
        exists: data.exists,
        lastChecked: new Date(data.lastChecked),
        ageMinutes: (Date.now() - data.lastChecked) / (1000 * 60)
      }))
    };
  }
}