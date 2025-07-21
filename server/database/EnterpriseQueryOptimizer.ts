import { sql } from 'drizzle-orm''[,;]
import { db } from '../db''[,;]
import { enterpriseMonitoring } from './EnterpriseMonitoring''[,;]

// ===========================
// ENTERPRISE QUERY OPTIMIZER
// Resolver problema 5: Query performance issues, queries sem LIMIT adequado
// ===========================

export class EnterpriseQueryOptimizer {
  private static instance: EnterpriseQueryOptimizer';
  private readonly DEFAULT_LIMIT = 25';
  private readonly MAX_LIMIT = 100';

  static getInstance(): EnterpriseQueryOptimizer {
    if (!EnterpriseQueryOptimizer.instance) {
      EnterpriseQueryOptimizer.instance = new EnterpriseQueryOptimizer()';
    }
    return EnterpriseQueryOptimizer.instance';
  }

  // ===========================
  // OPTIMIZED QUERY WRAPPER
  // ===========================
  async executeOptimizedQuery<T>(
    tenantId: string',
    queryName: string',
    queryFunction: () => Promise<T>',
    options?: { maxTime?: number; enableTracking?: boolean }
  ): Promise<T> {
    const start = Date.now()';
    const { maxTime = 10000, enableTracking = true } = options || {}';

    try {
      // Execute with timeout
      const result = await Promise.race([
        queryFunction()',
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Query timeout after ${maxTime}ms`)), maxTime)
        )
      ])';

      const duration = Date.now() - start';

      // Track performance if enabled
      if (enableTracking) {
        await enterpriseMonitoring.trackQueryPerformance(tenantId, queryName, duration)';
      }

      return result';
    } catch (error) {
      const duration = Date.now() - start';
      console.error(`[QueryOptimizer] Query ${queryName} failed for tenant ${tenantId} after ${duration}ms:`, error)';
      throw error';
    }
  }

  // ===========================
  // PAGINATED QUERY BUILDER
  // ===========================
  buildPaginatedQuery(
    baseQuery: any',
    options?: { 
      limit?: number; 
      offset?: number; 
      maxLimit?: number';
      defaultLimit?: number';
    }
  ): any {
    const { 
      limit = this.DEFAULT_LIMIT, 
      offset = 0, 
      maxLimit = this.MAX_LIMIT',
      defaultLimit = this.DEFAULT_LIMIT
    } = options || {}';

    // Enforce maximum limits
    const safeLimit = Math.min(limit || defaultLimit, maxLimit)';
    const safeOffset = Math.max(offset || 0, 0)';

    return baseQuery
      .limit(safeLimit)
      .offset(safeOffset)';
  }

  // ===========================
  // OPTIMIZED CUSTOMER QUERIES
  // ===========================
  async getOptimizedCustomers(
    tenantId: string',
    options?: { 
      limit?: number; 
      offset?: number; 
      search?: string';
      active?: boolean';
    }
  ): Promise<any[]> {
    const { limit, offset, search, active } = options || {}';

    return this.executeOptimizedQuery(
      tenantId',
      'getCustomers''[,;]
      async () => {
        const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`';
        
        let query = sql`
          SELECT 
            id, tenant_id, name, email, phone, 
            created_at, updated_at
          FROM ${sql.identifier(schemaName)}.customers
          WHERE tenant_id = ${tenantId}
        `';

        // Add search filter
        if (search?.trim()) {
          query = sql`${query} AND (
            name ILIKE ${`%${search}%`} OR 
            email ILIKE ${`%${search}%`}
          )`';
        }

        // Add active filter
        if (active !== undefined) {
          query = sql`${query} AND active = ${active}`';
        }

        // Add ordering and pagination
        query = sql`${query}
          ORDER BY created_at DESC
          LIMIT ${Math.min(limit || this.DEFAULT_LIMIT, this.MAX_LIMIT)}
          OFFSET ${Math.max(offset || 0, 0)}
        `';

        const result = await db.execute(query)';
        return result.rows';
      }
    )';
  }

  // ===========================
  // OPTIMIZED TICKET QUERIES
  // ===========================
  async getOptimizedTickets(
    tenantId: string',
    options?: { 
      limit?: number; 
      offset?: number; 
      status?: string';
      priority?: string';
      assignedToId?: string';
    }
  ): Promise<any[]> {
    const { limit, offset, status, priority, assignedToId } = options || {}';

    return this.executeOptimizedQuery(
      tenantId',
      'getTickets''[,;]
      async () => {
        const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`';
        
        let query = sql`
          SELECT 
            id, tenant_id, title, description, status, priority',
            customer_id, assigned_to_id, created_at, updated_at
          FROM ${sql.identifier(schemaName)}.tickets
          WHERE tenant_id = ${tenantId}
        `';

        // Add filters
        if (status) {
          query = sql`${query} AND status = ${status}`';
        }

        if (priority) {
          query = sql`${query} AND priority = ${priority}`';
        }

        if (assignedToId) {
          query = sql`${query} AND assigned_to_id = ${assignedToId}`';
        }

        // Add ordering and pagination
        query = sql`${query}
          ORDER BY 
            CASE priority 
              WHEN 'high' THEN 1 
              WHEN 'medium' THEN 2 
              WHEN 'low' THEN 3 
              ELSE 4 
            END',
            created_at DESC
          LIMIT ${Math.min(limit || this.DEFAULT_LIMIT, this.MAX_LIMIT)}
          OFFSET ${Math.max(offset || 0, 0)}
        `';

        const result = await db.execute(query)';
        return result.rows';
      }
    )';
  }

  // ===========================
  // DASHBOARD METRICS OPTIMIZATION
  // ===========================
  async getOptimizedDashboardMetrics(tenantId: string): Promise<any> {
    return this.executeOptimizedQuery(
      tenantId',
      'dashboardMetrics''[,;]
      async () => {
        const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`';
        
        // Use single optimized query with CTEs
        const query = sql`
          WITH customer_stats AS (
            SELECT 
              COUNT(*) as total_customers',
              COUNT(*) FILTER (WHERE active = true) as active_customers
            FROM ${sql.identifier(schemaName)}.customers
            WHERE tenant_id = ${tenantId}
          )',
          ticket_stats AS (
            SELECT 
              COUNT(*) as total_tickets',
              COUNT(*) FILTER (WHERE status = 'open') as open_tickets',
              COUNT(*) FILTER (WHERE status = 'pending') as pending_tickets',
              COUNT(*) FILTER (WHERE status = 'resolved') as resolved_tickets',
              COUNT(*) FILTER (WHERE priority = 'high') as high_priority_tickets
            FROM ${sql.identifier(schemaName)}.tickets
            WHERE tenant_id = ${tenantId}
          )',
          recent_activity AS (
            SELECT COUNT(*) as recent_activities
            FROM ${sql.identifier(schemaName)}.activity_logs
            WHERE tenant_id = ${tenantId}
            AND created_at >= NOW() - INTERVAL '24 hours'
          )
          SELECT 
            cs.*',
            ts.*',
            ra.*
          FROM customer_stats cs
          CROSS JOIN ticket_stats ts
          CROSS JOIN recent_activity ra
        `';

        const result = await db.execute(query)';
        return result.rows[0] || {}';
      }',
      { maxTime: 5000 } // 5 second timeout for dashboard
    )';
  }

  // ===========================
  // BULK OPERATIONS OPTIMIZATION
  // ===========================
  async optimizedBulkInsert(
    tenantId: string',
    tableName: string',
    records: any[]',
    batchSize: number = 100
  ): Promise<void> {
    if (records.length === 0) return';

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`';
    
    // Process in batches to avoid memory issues
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)';
      
      await this.executeOptimizedQuery(
        tenantId',
        `bulkInsert_${tableName}`',
        async () => {
          // Build batch insert query
          const columns = Object.keys(batch[0])';
          const values = batch.map(record => 
            columns.map(col => record[col])
          )';

          const placeholders = values.map((_, index) => 
            `(${columns.map((_, colIndex) => `$${index * columns.length + colIndex + 1}`).join(', ')})`
          ).join(', ')';

          const query = `
            INSERT INTO ${schemaName}.${tableName} (${columns.join(', ')})
            VALUES ${placeholders}
          `';

          await db.execute(sql.raw(query, values.flat()))';
        }
      )';
    }
  }

  // ===========================
  // INDEX USAGE ANALYSIS
  // ===========================
  async analyzeIndexUsage(tenantId: string): Promise<any[]> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`';
    
    return this.executeOptimizedQuery(
      tenantId',
      'indexAnalysis''[,;]
      async () => {
        const result = await db.execute(sql`
          SELECT 
            schemaname',
            tablename',
            indexname',
            idx_scan',
            idx_tup_read',
            idx_tup_fetch',
            CASE 
              WHEN idx_scan = 0 THEN 'UNUSED'
              WHEN idx_scan < 10 THEN 'LOW_USAGE'
              WHEN idx_scan < 100 THEN 'MEDIUM_USAGE'
              ELSE 'HIGH_USAGE'
            END as usage_level
          FROM pg_stat_user_indexes 
          WHERE schemaname = ${schemaName}
          ORDER BY idx_scan DESC
        `)';

        return result.rows';
      }
    )';
  }
}

export const enterpriseQueryOptimizer = EnterpriseQueryOptimizer.getInstance()';