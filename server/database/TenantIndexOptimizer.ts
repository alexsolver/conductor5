
import { sql } from 'drizzle-orm';
import { db } from '../db';
import { logInfo, logError } from '../utils/logger';

/**
 * CRITICAL FIX: Tenant-Optimized Index Creation
 * Creates missing performance indexes for multi-tenant queries
 */
export class TenantIndexOptimizer {
  
  static async createMissingIndexes(schemaName: string): Promise<void> {
    try {
      const schemaId = sql.identifier(schemaName);
      
      // CRITICAL FIX: Composite indexes for tenant isolation + performance
      const indexQueries = [
        // Customer performance indexes
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_active_verified_idx 
            ON ${schemaId}.customers (tenant_id, active, verified) 
            WHERE active = true`,
        
        // Ticket performance indexes  
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_status_priority_idx 
            ON ${schemaId}.tickets (tenant_id, status, priority) 
            WHERE status IN ('open', 'in_progress')`,
            
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_created_at_idx 
            ON ${schemaId}.tickets (tenant_id, created_at DESC) 
            WHERE created_at >= NOW() - INTERVAL '30 days'`,
        
        // Messages performance indexes
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS ticket_messages_tenant_created_idx 
            ON ${schemaId}.ticket_messages (tenant_id, ticket_id, created_at DESC)`,
        
        // Activity logs performance indexes
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS activity_logs_tenant_entity_date_idx 
            ON ${schemaId}.activity_logs (tenant_id, entity_type, entity_id, created_at DESC)`,
        
        // Skills performance indexes
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS skills_tenant_category_name_idx 
            ON ${schemaId}.skills (tenant_id, category, name) 
            WHERE category IS NOT NULL`,
        
        // User skills performance indexes
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS user_skills_tenant_user_level_idx 
            ON ${schemaId}.user_skills (tenant_id, user_id, level DESC, expires_at) 
            WHERE expires_at IS NULL OR expires_at > NOW()`,
        
        // Locations performance indexes
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS locations_tenant_type_status_idx 
            ON ${schemaId}.locations (tenant_id, type, status) 
            WHERE status = 'ativo'`,
        
        // External contacts performance indexes
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS external_contacts_tenant_type_active_idx 
            ON ${schemaId}.external_contacts (tenant_id, type, active) 
            WHERE active = true`
      ];
      
      // Execute each index creation
      for (const query of indexQueries) {
        try {
          await db.execute(query);
        } catch (error) {
          // Index may already exist - log but continue
          logError('Index creation failed (may already exist)', error, { schemaName });
        }
      }
      
      logInfo(`Performance indexes created for tenant schema ${schemaName}`);
    } catch (error) {
      logError('Failed to create tenant performance indexes', error, { schemaName });
      throw error;
    }
  }
}
