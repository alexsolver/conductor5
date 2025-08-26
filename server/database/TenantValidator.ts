import { sql } from 'drizzle-orm';
import { db } from '../db';
import { logError, logWarn } from '../utils/logger';

// ===========================
// ADVANCED TENANT VALIDATION & CROSS-TENANT PROTECTION
// Fixes: Cross-tenant data access vulnerabilities
// ===========================

export class TenantValidator {
  private static tenantCache = new Map<string, { exists: boolean, lastChecked: number }>();
  private static readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes - optimized for production

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
    
    // CRITICAL: Only allow exact UUID v4 format (rigoroso, sem legacy support)
    // PADRONIZADO: Usar o mesmo padrão UUID v4 rigoroso em todo o sistema
    const strictUuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!strictUuidPattern.test(sanitized)) {
      logWarn('Invalid tenant UUID v4 format attempted', { tenantId, sanitized });
      throw new Error(`Tenant ID must be valid UUID v4 format: ${tenantId}`);
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
      // CRITICAL FIX: Enhanced validation without subscription status (column doesn't exist)
      const result = await db.execute(sql`
        SELECT t.id, t.is_active, t.created_at
        FROM tenants t
        WHERE t.id = ${validatedId} 
        AND t.is_active = true
        LIMIT 1
      `);

      const exists = result.rows.length > 0;
      
      // CRITICAL FIX: Log tenant access attempts for security
      if (!exists) {
        logWarn('Access attempted to inactive/expired tenant', { 
          tenantId: validatedId,
          timestamp: new Date().toISOString(),
          reason: 'tenant_inactive_or_expired'
        });
      }
      
      // Update cache
      this.tenantCache.set(validatedId, {
        exists,
        lastChecked: Date.now()
      });

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
      // CRITICAL FIX: Validate schema name format - allow both hyphens and underscores
      const schemaNamePattern = /^tenant_[0-9a-fA-F]{8}[_-][0-9a-fA-F]{4}[_-]4[0-9a-fA-F]{3}[_-][89abAB][0-9a-fA-F]{3}[_-][0-9a-fA-F]{12}$/;
      if (!schemaNamePattern.test(schemaName)) {
        logError('Invalid schema name format', { tenantId: validatedId, schemaName });
        return false;
      }

      // CRITICAL: Use parameterized query with explicit tenant validation
      const result = await db.execute(sql`
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = ${schemaName}
        AND schema_name LIKE 'tenant_%'
        AND LENGTH(schema_name) >= 43 AND LENGTH(schema_name) <= 45
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
  // TENANT SCHEMA VALIDATION
  // Validates complete tenant schema structure
  // ===========================
  static async validateTenantSchema(tenantId: string): Promise<boolean> {
    try {
      const validatedId = this.validateTenantId(tenantId);
      
      // Check tenant exists and is active
      const tenantExists = await this.validateTenantExists(validatedId);
      if (!tenantExists) {
        console.log(`❌ Tenant ${validatedId} does not exist or is inactive`);
        return false;
      }

      // Check schema exists
      const schemaExists = await this.validateSchemaExists(validatedId);
      if (!schemaExists) {
        console.log(`❌ Schema for tenant ${validatedId} does not exist`);
        return false;
      }

      console.log(`✅ Tenant schema validation passed for: ${validatedId}`);
      return true;
    } catch (error) {
      console.error(`❌ Tenant schema validation failed for ${tenantId}:`, error);
      return false;
    }
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