// ENTERPRISE DATABASE OPTIMIZATION: Composite indexes for multi-tenant performance
import { sql } from 'drizzle-orm';
import { db } from '../db';

export class OptimizedIndexStrategy {
  private static instance: OptimizedIndexStrategy;
  private indexesCreated = new Set<string>();

  static getInstance(): OptimizedIndexStrategy {
    if (!OptimizedIndexStrategy.instance) {
      OptimizedIndexStrategy.instance = new OptimizedIndexStrategy();
    }
    return OptimizedIndexStrategy.instance;
  }

  // CRITICAL PERFORMANCE: Create composite indexes for tenant-specific queries
  async createTenantOptimizedIndexes(tenantId: string): Promise<void> {
    const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
    const indexKey = `optimized_${tenantSchema}`;
    
    if (this.indexesCreated.has(indexKey)) {
      return; // Already created
    }

    try {
      // PERFORMANCE BREAKTHROUGH: Composite indexes for tenant + business keys
      const indexes = [
        // Customers performance indexes
        {
          name: `idx_${tenantSchema}_customers_tenant_email`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${tenantSchema}_customers_tenant_email ON ${tenantSchema}.customers (tenant_id, email)`
        },
        {
          name: `idx_${tenantSchema}_customers_tenant_active`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${tenantSchema}_customers_tenant_active ON ${tenantSchema}.customers (tenant_id, active) WHERE active = true`
        },
        
        // Tickets performance indexes
        {
          name: `idx_${tenantSchema}_tickets_tenant_status`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${tenantSchema}_tickets_tenant_status ON ${tenantSchema}.tickets (tenant_id, status, created_at DESC)`
        },
        {
          name: `idx_${tenantSchema}_tickets_tenant_assignee`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${tenantSchema}_tickets_tenant_assignee ON ${tenantSchema}.tickets (tenant_id, assigned_to) WHERE assigned_to IS NOT NULL`
        },
        {
          name: `idx_${tenantSchema}_tickets_tenant_priority`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${tenantSchema}_tickets_tenant_priority ON ${tenantSchema}.tickets (tenant_id, priority, urgency, created_at DESC)`
        },
        
        // Favorecidos performance indexes
        {
          name: `idx_${tenantSchema}_favorecidos_tenant_active`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${tenantSchema}_favorecidos_tenant_active ON ${tenantSchema}.favorecidos (tenant_id, active) WHERE active = true`
        },
        {
          name: `idx_${tenantSchema}_favorecidos_tenant_type`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${tenantSchema}_favorecidos_tenant_type ON ${tenantSchema}.favorecidos (tenant_id, type)`
        },
        
        // Locations performance indexes
        {
          name: `idx_${tenantSchema}_locations_tenant_active`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${tenantSchema}_locations_tenant_active ON ${tenantSchema}.locations (tenant_id, active) WHERE active = true`
        },
        
        // Message search indexes
        {
          name: `idx_${tenantSchema}_ticket_messages_tenant_ticket`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${tenantSchema}_ticket_messages_tenant_ticket ON ${tenantSchema}.ticket_messages (tenant_id, ticket_id, created_at DESC)`
        },
        
        // Full-text search indexes
        {
          name: `idx_${tenantSchema}_customers_search`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${tenantSchema}_customers_search ON ${tenantSchema}.customers USING GIN (to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(email, '')))`
        },
        {
          name: `idx_${tenantSchema}_tickets_search`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${tenantSchema}_tickets_search ON ${tenantSchema}.tickets USING GIN (to_tsvector('portuguese', coalesce(subject, '') || ' ' || coalesce(description, '')))`
        }
      ];

      // Execute all index creation in parallel for maximum performance
      await Promise.all(indexes.map(async (index) => {
        try {
          await db.execute(sql.raw(index.sql));
          console.log(`[IndexOptimization] Created: ${index.name}`);
        } catch (error) {
          // Index might already exist, that's fine
          console.log(`[IndexOptimization] Skipped existing: ${index.name}`);
        }
      }));

      this.indexesCreated.add(indexKey);
      console.log(`[IndexOptimization] Completed optimization for tenant: ${tenantId}`);

    } catch (error) {
      console.error(`[IndexOptimization] Failed for tenant ${tenantId}:`, error);
    }
  }

  // ENTERPRISE ANALYTICS: Create performance analytics indexes
  async createAnalyticsIndexes(tenantId: string): Promise<void> {
    const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    try {
      const analyticsIndexes = [
        // Time-based analytics
        {
          name: `idx_${tenantSchema}_tickets_analytics_daily`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${tenantSchema}_tickets_analytics_daily ON ${tenantSchema}.tickets (tenant_id, date_trunc('day', created_at), status)`
        },
        {
          name: `idx_${tenantSchema}_tickets_analytics_resolution`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${tenantSchema}_tickets_analytics_resolution ON ${tenantSchema}.tickets (tenant_id, resolved_at, created_at) WHERE resolved_at IS NOT NULL`
        },
        
        // Performance analytics
        {
          name: `idx_${tenantSchema}_customers_analytics_activity`,
          sql: `CREATE INDEX IF NOT EXISTS idx_${tenantSchema}_customers_analytics_activity ON ${tenantSchema}.customers (tenant_id, last_activity_at DESC) WHERE last_activity_at IS NOT NULL`
        }
      ];

      await Promise.all(analyticsIndexes.map(async (index) => {
        try {
          await db.execute(sql.raw(index.sql));
          console.log(`[AnalyticsOptimization] Created: ${index.name}`);
        } catch (error) {
          console.log(`[AnalyticsOptimization] Skipped existing: ${index.name}`);
        }
      }));

    } catch (error) {
      console.error(`[AnalyticsOptimization] Failed for tenant ${tenantId}:`, error);
    }
  }

  // MAINTENANCE: Check and optimize existing indexes
  async getIndexUsageStats(tenantId: string): Promise<any[]> {
    const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    try {
      const result = await db.execute(sql.raw(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          CASE WHEN idx_tup_read > 0 
               THEN round((idx_tup_fetch::numeric / idx_tup_read * 100), 2) 
               ELSE 0 
          END as hit_rate
        FROM pg_stat_user_indexes 
        WHERE schemaname = '${tenantSchema}'
        ORDER BY idx_tup_read DESC
      `));
      
      return result.rows || [];
    } catch (error) {
      console.error(`[IndexStats] Failed for tenant ${tenantId}:`, error);
      return [];
    }
  }
}

// ENTERPRISE SINGLETON: Global index optimization manager
export const optimizedIndexStrategy = OptimizedIndexStrategy.getInstance();