import { sql } from 'drizzle-orm';
import { db } from '../db';
import { logInfo, logError } from '../utils/logger';

// ===========================
// OPTIMIZED INDEXES FOR MULTI-TENANT PERFORMANCE
// Fixes: Missing indexes, poor query performance
// ===========================

export class OptimizedIndexes {
  
  // ===========================
  // CREATE PERFORMANCE INDEXES
  // ===========================
  static async createTenantIndexes(schemaName: string): Promise<void> {
    try {
      const schemaId = sql.identifier(schemaName);
      
      // CUSTOMERS TABLE INDEXES
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_customers_tenant_email 
        ON ${schemaId}.customers (tenant_id, email)
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_customers_tenant_name 
        ON ${schemaId}.customers (tenant_id, first_name, last_name)
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_customers_tenant_created 
        ON ${schemaId}.customers (tenant_id, created_at DESC)
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_customers_search 
        ON ${schemaId}.customers USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || email))
      `);

      // TICKETS TABLE INDEXES
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_tickets_tenant_status 
        ON ${schemaId}.tickets (tenant_id, status)
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_tickets_tenant_customer 
        ON ${schemaId}.tickets (tenant_id, customer_id)
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_tickets_tenant_created 
        ON ${schemaId}.tickets (tenant_id, created_at DESC)
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_tickets_priority_status 
        ON ${schemaId}.tickets (tenant_id, priority, status)
      `);

      // ACTIVITY LOGS INDEXES (if exists)
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_activity_tenant_created 
        ON ${schemaId}.activity_logs (tenant_id, created_at DESC)
      `);

      // FOREIGN KEY CONSTRAINTS FOR DATA INTEGRITY
      await db.execute(sql`
        ALTER TABLE ${schemaId}.tickets 
        ADD CONSTRAINT fk_tickets_customer 
        FOREIGN KEY (customer_id) REFERENCES ${schemaId}.customers(id) 
        ON DELETE CASCADE
      `);

      logInfo(`Performance indexes created for schema: ${schemaName}`);
    } catch (error) {
      logError('Error creating tenant indexes', error, { schemaName });
      throw error;
    }
  }

  // ===========================
  // GLOBAL PERFORMANCE INDEXES
  // ===========================
  static async createGlobalIndexes(): Promise<void> {
    try {
      // USERS TABLE INDEXES
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_users_tenant_email 
        ON users (tenant_id, email)
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_users_tenant_role 
        ON users (tenant_id, role)
      `);

      // TENANTS TABLE INDEXES
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_tenants_subdomain 
        ON tenants (subdomain, is_active)
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_tenants_active 
        ON tenants (is_active, created_at DESC)
      `);

      logInfo('Global performance indexes created');
    } catch (error) {
      logError('Error creating global indexes', error);
      throw error;
    }
  }

  // ===========================
  // INDEX MONITORING & STATISTICS
  // ===========================
  static async getIndexUsageStats(schemaName: string): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          idx_scan,
          CASE 
            WHEN idx_scan = 0 THEN 'UNUSED'
            WHEN idx_scan < 100 THEN 'LOW_USAGE'
            ELSE 'ACTIVE'
          END as usage_status
        FROM pg_stat_user_indexes 
        WHERE schemaname = ${schemaName}
        ORDER BY idx_scan DESC
      `);

      return result.rows || [];
    } catch (error) {
      logError('Error fetching index statistics', error, { schemaName });
      return [];
    }
  }

  // ===========================
  // QUERY PERFORMANCE ANALYSIS
  // ===========================
  static async analyzeQueryPerformance(schemaName: string): Promise<any> {
    try {
      // Slow queries analysis
      const slowQueries = await db.execute(sql`
        SELECT 
          query,
          mean_time,
          calls,
          total_time,
          stddev_time
        FROM pg_stat_statements 
        WHERE query LIKE ${`%${schemaName}%`}
        ORDER BY mean_time DESC 
        LIMIT 10
      `);

      // Table scan analysis
      const tableScans = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch,
          CASE 
            WHEN seq_scan > idx_scan THEN 'TABLE_SCAN_HEAVY'
            ELSE 'INDEX_OPTIMIZED'
          END as scan_type
        FROM pg_stat_user_tables 
        WHERE schemaname = ${schemaName}
        ORDER BY seq_scan DESC
      `);

      return {
        slowQueries: slowQueries.rows || [],
        tableScans: tableScans.rows || [],
        recommendations: this.generateRecommendations(tableScans.rows || [])
      };
    } catch (error) {
      logError('Error analyzing query performance', error, { schemaName });
      return { slowQueries: [], tableScans: [], recommendations: [] };
    }
  }

  // ===========================
  // PERFORMANCE RECOMMENDATIONS
  // ===========================
  private static generateRecommendations(tableStats: any[]): string[] {
    const recommendations: string[] = [];

    for (const table of tableStats) {
      if (table.seq_scan > table.idx_scan * 2) {
        recommendations.push(
          `Consider adding indexes to ${table.tablename} - high sequential scan ratio`
        );
      }
      
      if (table.seq_tup_read > 100000 && table.idx_tup_fetch < table.seq_tup_read * 0.1) {
        recommendations.push(
          `${table.tablename} may benefit from composite indexes for common query patterns`
        );
      }
    }

    return recommendations;
  }
}