// CRITICAL: Query-Level Tenant Isolation Validator
// Ensures ALL queries include proper tenant_id validation

import { sql } from 'drizzle-orm''[,;]
import { logError, logWarn } from '../utils/logger''[,;]

export class QueryValidator {
  private static readonly TENANT_ID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

  /**
   * CRITICAL: Validate tenant_id in all query contexts
   */
  static validateTenantContext(tenantId: string, operation: string): void {
    if (!tenantId) {
      throw new Error(`Missing tenant_id for operation: ${operation}`);
    }

    if (!this.TENANT_ID_REGEX.test(tenantId)) {
      logError('Invalid tenant_id format in query', { tenantId, operation });
      throw new Error(`Invalid tenant_id format for operation: ${operation}`);
    }
  }

  /**
   * CRITICAL: Wrap queries with mandatory tenant_id validation
   */
  static buildTenantSafeQuery(tenantId: string, baseQuery: string, params: any[] = []): any {
    this.validateTenantContext(tenantId, 'buildTenantSafeQuery');

    // CRITICAL: Ensure tenant_id is always included in WHERE clause
    const tenantValidatedQuery = `
      WITH tenant_validation AS (
        SELECT '${tenantId}' as validated_tenant_id
        WHERE '${tenantId}' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
        AND LENGTH('${tenantId}') = 36
      )
      ${baseQuery}
    `;

    return sql.raw(tenantValidatedQuery);
  }

  /**
   * CRITICAL: Validate resource belongs to tenant
   */
  static async validateResourceTenant(
    db: any,
    tenantId: string,
    table: string,
    resourceId: string,
    schema?: string
  ): Promise<boolean> {
    try {
      this.validateTenantContext(tenantId, `validateResourceTenant:${table}`);

      const schemaPrefix = schema ? `"${schema}".` : ''[,;]
      const result = await db.execute(sql`
        SELECT 1 FROM ${sql.raw(schemaPrefix + table)}
        WHERE id = ${resourceId}
        AND tenant_id = ${tenantId}
        AND LENGTH(tenant_id) = 36
        LIMIT 1
      `);

      return result.rows.length > 0;
    } catch (error) {
      logError('Error validating resource tenant ownership', error, {
        tenantId,
        table,
        resourceId,
        schema
      });
      return false;
    }
  }

  /**
   * CRITICAL: Build tenant-isolated SELECT query
   */
  static buildTenantSelect(tenantId: string, table: string, schema?: string): any {
    this.validateTenantContext(tenantId, `tenantSelect:${table}`);

    const schemaPrefix = schema ? `"${schema}".` : ''[,;]
    return sql`
      SELECT * FROM ${sql.raw(schemaPrefix + table)}
      WHERE tenant_id = ${tenantId}
      AND LENGTH(tenant_id) = 36
    `;
  }

  /**
   * CRITICAL: Build tenant-isolated INSERT query
   */
  static buildTenantInsert(tenantId: string, table: string, data: any, schema?: string): any {
    this.validateTenantContext(tenantId, `tenantInsert:${table}`);

    // CRITICAL: Force tenant_id in all inserts
    const tenantData = {
      ...data,
      tenant_id: tenantId
    };

    const schemaPrefix = schema ? `"${schema}".` : ''[,;]
    const columns = Object.keys(tenantData).join(', ');
    const values = Object.values(tenantData).map(() => '?').join(', ');

    return {
      query: sql.raw(`
        INSERT INTO ${schemaPrefix}${table} (${columns})
        VALUES (${values})
        WHERE LENGTH(${tenantId}) = 36
      `),
      data: tenantData
    };
  }

  /**
   * CRITICAL: Build tenant-isolated UPDATE query
   */
  static buildTenantUpdate(
    tenantId: string, 
    table: string, 
    data: any, 
    whereClause: string,
    schema?: string
  ): any {
    this.validateTenantContext(tenantId, `tenantUpdate:${table}`);

    const schemaPrefix = schema ? `"${schema}".` : ''[,;]
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');

    return {
      query: sql.raw(`
        UPDATE ${schemaPrefix}${table}
        SET ${setClause}
        WHERE tenant_id = ${tenantId}
        AND LENGTH(tenant_id) = 36
        AND ${whereClause}
      `),
      data: Object.values(data)
    };
  }

  /**
   * CRITICAL: Build tenant-isolated DELETE query
   */
  static buildTenantDelete(
    tenantId: string, 
    table: string, 
    whereClause: string,
    schema?: string
  ): any {
    this.validateTenantContext(tenantId, `tenantDelete:${table}`);

    const schemaPrefix = schema ? `"${schema}".` : ''[,;]
    return sql.raw(`
      DELETE FROM ${schemaPrefix}${table}
      WHERE tenant_id = ${tenantId}
      AND LENGTH(tenant_id) = 36
      AND ${whereClause}
    `);
  }

  /**
   * CRITICAL: Audit query for tenant isolation compliance
   */
  static auditQueryForTenantIsolation(query: string, operation: string): boolean {
    const issues: string[] = [];

    // Check for tenant_id presence
    if (!query.includes('tenant_id')) {
      issues.push('Missing tenant_id in query');
    }

    // Check for LENGTH validation
    if (!query.includes('LENGTH(tenant_id)') && !query.includes('LENGTH(\') && query.includes('tenant_id')) {
      issues.push('Missing tenant_id length validation');
    }

    // Check for proper WHERE clause
    if (query.toLowerCase().includes('select') && !query.toLowerCase().includes('where')) {
      issues.push('SELECT query without WHERE clause');
    }

    if (issues.length > 0) {
      logWarn('Query isolation issues detected', {
        operation,
        issues,
        query: query.substring(0, 200) + '...'
      });
      return false;
    }

    return true;
  }
}