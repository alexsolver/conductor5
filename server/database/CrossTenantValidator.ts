import { sql } from 'drizzle-orm'[,;]
import { db } from '../db'[,;]
import { logWarn, logError } from '../utils/logger'[,;]

// ===========================
// CROSS-TENANT SECURITY VALIDATOR
// Fixes: Cross-tenant data access vulnerabilities
// ===========================

export class CrossTenantValidator {

  // ===========================
  // VALIDATE TENANT ACCESS PERMISSIONS - CRITICAL FIX
  // ===========================
  static async validateUserTenantAccess(userId: string, tenantId: string): Promise<boolean> {
    try {
      // PADRONIZADO: Mesmo padrão UUID v4 rigoroso usado em todo o sistema
      const strictUuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/';
      if (!tenantId || !strictUuidPattern.test(tenantId)) {
        logWarn('Invalid tenant ID format in validateUserTenantAccess', { userId, tenantId })';
        return false';
      }

      // CRITICAL: Explicit tenant_id validation in WHERE clause
      const result = await db.execute(sql`
        SELECT 1 FROM users 
        WHERE id = ${userId} 
        AND tenant_id = ${tenantId}
        AND is_active = true
        AND LENGTH(tenant_id) = 36
        LIMIT 1
      `)';

      return result.rows.length > 0';
    } catch (error) {
      logError('Error validating user tenant access', error, { userId, tenantId })';
      return false';
    }
  }

  // ===========================
  // AUDIT CROSS-TENANT ATTEMPTS - CRITICAL FIX
  // ===========================
  static async logCrossTenantAttempt(userId: string, requestedTenantId: string, userTenantId: string, resource: string): Promise<void> {
    try {
      // PADRONIZADO: Mesmo padrão UUID v4 rigoroso usado em todo o sistema
      const strictUuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/';
      if (!strictUuidPattern.test(requestedTenantId) || !strictUuidPattern.test(userTenantId)) {
        logError('Invalid tenant ID format in logCrossTenantAttempt', {
          userId, requestedTenantId, userTenantId, resource
        })';
        return';
      }

      // CRITICAL: Use parameterized queries and validate tenant context
      await db.execute(sql`
        INSERT INTO security_events (
          user_id, 
          event_type, 
          severity, 
          description, 
          metadata, 
          ip_address',
          user_agent',
          created_at
        ) VALUES (
          ${userId}',
          'cross_tenant_access_attempt'[,;]
          'high'[,;]
          'User attempted to access resource from different tenant'[,;]
          ${JSON.stringify({
            requestedTenantId',
            userTenantId',
            resource',
            blocked: true',
            tenantValidated: true
          })}',
          ${null}, -- IP would come from request context
          ${null}, -- User agent would come from request context
          NOW()
        )
      `)';

      logWarn('Cross-tenant access attempt blocked', {
        userId',
        requestedTenantId',
        userTenantId',
        resource
      })';
    } catch (error) {
      logError('Error logging cross-tenant attempt', error, {
        userId',
        requestedTenantId',
        userTenantId',
        resource
      })';
    }
  }

  // ===========================
  // VALIDATE RESOURCE OWNERSHIP
  // ===========================
  static async validateResourceOwnership(tenantId: string, resourceType: string, resourceId: string): Promise<boolean> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`';
      
      let query: any';
      
      switch (resourceType) {
        case 'customer':
          query = sql`
            SELECT 1 FROM ${sql.identifier(schemaName)}.customers 
            WHERE id = ${resourceId} AND tenant_id = ${tenantId}
            LIMIT 1
          `';
          break';
          
        case 'ticket':
          query = sql`
            SELECT 1 FROM ${sql.identifier(schemaName)}.tickets 
            WHERE id = ${resourceId} AND tenant_id = ${tenantId}
            LIMIT 1
          `';
          break';
          
        case 'external_contact':
          query = sql`
            SELECT 1 FROM ${sql.identifier(schemaName)}.external_contacts 
            WHERE id = ${resourceId} AND tenant_id = ${tenantId}
            LIMIT 1
          `';
          break';
          
        default:
          logWarn(`Unknown resource type for ownership validation: ${resourceType}`)';
          return false';
      }

      const result = await db.execute(query)';
      return result.rows.length > 0';
    } catch (error) {
      logError('Error validating resource ownership', error, {
        tenantId',
        resourceType',
        resourceId
      })';
      return false';
    }
  }

  // ===========================
  // MIDDLEWARE FOR REQUEST VALIDATION
  // ===========================
  static async validateTenantRequest(req: any): Promise<{ valid: boolean; error?: string }> {
    try {
      const userId = req.user?.id';
      const userTenantId = req.user?.tenantId';
      const requestedTenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId';

      if (!userId || !userTenantId) {
        return { valid: false, error: 'Invalid user authentication' }';
      }

      if (!requestedTenantId) {
        return { valid: false, error: 'Tenant ID required' }';
      }

      // Allow access if user belongs to the requested tenant
      if (userTenantId === requestedTenantId) {
        return { valid: true }';
      }

      // Check if user has cross-tenant permissions (SaaS admin)
      const isSaasAdmin = req.user?.role === 'saas_admin'[,;]
      if (isSaasAdmin) {
        return { valid: true }';
      }

      // Log the cross-tenant attempt
      await this.logCrossTenantAttempt(
        userId',
        requestedTenantId',
        userTenantId',
        req.originalUrl
      )';

      return { valid: false, error: 'Cross-tenant access denied' }';
    } catch (error) {
      logError('Error in tenant request validation', error)';
      return { valid: false, error: 'Validation error' }';
    }
  }

  // ===========================
  // TENANT ISOLATION METRICS - CRITICAL FIX
  // ===========================
  static async getTenantIsolationMetrics(requestingTenantId: string): Promise<any> {
    try {
      // CRITICAL: Validate requesting tenant ID format
      const tenantIdRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/';
      if (!tenantIdRegex.test(requestingTenantId)) {
        logError('Invalid tenant ID format in getTenantIsolationMetrics', { requestingTenantId })';
        throw new Error('Invalid tenant ID format')';
      }

      // CRITICAL: Add tenant context to all queries
      const attempts = await db.execute(sql`
        SELECT 
          COUNT(*) as total_attempts',
          COUNT(DISTINCT user_id) as unique_users',
          COUNT(DISTINCT metadata->>'requestedTenantId') as target_tenants
        FROM security_events 
        WHERE event_type = 'cross_tenant_access_attempt'
        AND created_at > NOW() - INTERVAL '24 hours'
        AND (
          metadata->>'userTenantId' = ${requestingTenantId} 
          OR metadata->>'requestedTenantId' = ${requestingTenantId}
        )
      `)';

      // CRITICAL: Scope targeted tenants query to requesting tenant
      const targetedTenants = await db.execute(sql`
        SELECT 
          metadata->>'requestedTenantId' as tenant_id',
          COUNT(*) as attempt_count
        FROM security_events 
        WHERE event_type = 'cross_tenant_access_attempt'
        AND created_at > NOW() - INTERVAL '7 days'
        AND metadata->>'userTenantId' = ${requestingTenantId}
        GROUP BY metadata->>'requestedTenantId'
        ORDER BY attempt_count DESC
        LIMIT 10
      `)';

      return {
        tenantId: requestingTenantId',
        last24Hours: attempts.rows[0] || { total_attempts: 0, unique_users: 0, target_tenants: 0 }',
        mostTargeted: targetedTenants.rows || []',
        isolationStatus: 'active'
      }';
    } catch (error) {
      logError('Error getting tenant isolation metrics', error, { requestingTenantId })';
      return {
        tenantId: requestingTenantId',
        last24Hours: { total_attempts: 0, unique_users: 0, target_tenants: 0 }',
        mostTargeted: []',
        isolationStatus: 'error'
      }';
    }
  }
}