import { sql } from 'drizzle-orm';
const { db, schemaManager } = require("../../../../db");

// ===========================
// ENTERPRISE INDEX MANAGEMENT SYSTEM
// Resolver problemas de performance e implementar indexes otimizados
// ===========================

export class EnterpriseIndexManager {
  private static instance: EnterpriseIndexManager;

  static getInstance(): EnterpriseIndexManager {
    if (!EnterpriseIndexManager.instance) {
      EnterpriseIndexManager.instance = new EnterpriseIndexManager();
    }
    return EnterpriseIndexManager.instance;
  }

  // ENTERPRISE COMPOSITE INDEXES: Criar indexes tenant-first para performance máxima
  async createTenantOptimizedIndexes(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      console.log(`[IndexManager] Creating enterprise indexes for ${schemaName}...`);

      // CUSTOMERS - Indexes compostos críticos
      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_email_idx 
        ON ${sql.identifier(schemaName)}.customers (tenant_id, email)
      `);

      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_active_idx 
        ON ${sql.identifier(schemaName)}.customers (tenant_id, active) 
        WHERE active = true
      `);

      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_created_idx 
        ON ${sql.identifier(schemaName)}.customers (tenant_id, created_at DESC)
      `);

      // TICKETS - Performance crítica para dashboard
      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_status_priority_idx 
        ON ${sql.identifier(schemaName)}.tickets (tenant_id, status, priority)
      `);

      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_assigned_idx 
        ON ${sql.identifier(schemaName)}.tickets (tenant_id, assigned_to_id, status)
      `);

      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_created_idx 
        ON ${sql.identifier(schemaName)}.tickets (tenant_id, created_at DESC)
      `);

      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_customer_idx 
        ON ${sql.identifier(schemaName)}.tickets (tenant_id, customer_id, status)
      `);

      // TICKET MESSAGES - Performance para conversas
      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS ticket_messages_tenant_ticket_idx 
        ON ${sql.identifier(schemaName)}.ticket_messages (tenant_id, ticket_id, created_at)
      `);

      // ACTIVITY LOGS - Performance para auditoria
      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS activity_logs_tenant_entity_time_idx 
        ON ${sql.identifier(schemaName)}.activity_logs (tenant_id, entity_type, entity_id, created_at DESC)
      `);

      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS activity_logs_tenant_performer_idx 
        ON ${sql.identifier(schemaName)}.activity_logs (tenant_id, performed_by_id, created_at DESC)
      `);

      // LOCATIONS - Performance para gestão geográfica
      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS locations_tenant_type_status_idx 
        ON ${sql.identifier(schemaName)}.locations (tenant_id, type, status)
      `);

      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS locations_tenant_city_idx 
        ON ${sql.identifier(schemaName)}.locations (tenant_id, city, state)
      `);

      // CUSTOMER COMPANIES - Performance empresarial
      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS companies_tenant_status_idx 
        ON ${sql.identifier(schemaName)}.customer_companies (tenant_id, status, is_active)
      `);

      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS companies_tenant_name_idx 
        ON ${sql.identifier(schemaName)}.customer_companies (tenant_id, name)
      `);

      // SKILLS & CERTIFICATIONS - Performance para RH
      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS skills_tenant_category_idx 
        ON ${sql.identifier(schemaName)}.skills (tenant_id, category, name)
      `);

      await this.createIndexConcurrently(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS certifications_tenant_issuer_idx 
        ON ${sql.identifier(schemaName)}.certifications (tenant_id, issuer, name)
      `);

      console.log(`[IndexManager] ✅ Enterprise indexes created for ${schemaName}`);
    } catch (error) {
      console.error(`[IndexManager] ❌ Failed to create indexes for ${schemaName}:`, error);
      throw error;
    }
  }

  // SAFE INDEX CREATION: Usar CONCURRENTLY para não bloquear operações
  private async createIndexConcurrently(indexQuery: any): Promise<void> {
    try {
      await db.execute(indexQuery);
    } catch (error: any) {
      // Ignore "already exists" errors
      if (!error.message?.includes('already exists')) {
        console.error('[IndexManager] Index creation failed:', error.message);
        throw error;
      }
    }
  }

  // ANALYZE TABLES: Atualizar estatísticas para query planner
  async analyzeAllTables(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      const tables = [
        'customers', 'tickets', 'ticket_messages', 'activity_logs',
        'locations', 'customer_companies', 'skills', 'certifications'
      ];

      for (const table of tables) {
        await db.execute(sql`ANALYZE ${sql.identifier(schemaName)}.${sql.identifier(table)}`);
      }

      console.log(`[IndexManager] ✅ Statistics updated for ${schemaName}`);
    } catch (error) {
      console.error(`[IndexManager] Failed to analyze tables for ${schemaName}:`, error);
    }
  }

  // INDEX HEALTH CHECK: Verificar se indexes estão sendo usados
  async checkIndexUsage(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      const result = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE schemaname = ${schemaName}
        ORDER BY idx_scan DESC
      `);

      const unusedIndexes = result.rows.filter(row => (row.idx_scan as number) === 0);
      
      if (unusedIndexes.length > 0) {
        console.warn(`[IndexManager] Unused indexes in ${schemaName}:`, 
          unusedIndexes.map(idx => idx.indexname).join(', '));
      }

      console.log(`[IndexManager] Index usage check completed for ${schemaName}`);
    } catch (error) {
      console.error(`[IndexManager] Failed to check index usage for ${schemaName}:`, error);
    }
  }
}

export const enterpriseIndexManager = EnterpriseIndexManager.getInstance();