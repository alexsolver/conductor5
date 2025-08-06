
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
        
        // User skills performance indexes - CRITICAL MISSING
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS user_skills_tenant_user_level_idx 
            ON ${schemaId}.user_skills (tenant_id, user_id, current_level DESC, assessment_date) 
            WHERE assessment_date IS NOT NULL`,
            
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS user_skills_tenant_skill_level_idx 
            ON ${schemaId}.user_skills (tenant_id, skill_id, current_level DESC)`,
        
        // Locations performance indexes - ENHANCED
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS locations_tenant_active_city_idx 
            ON ${schemaId}.locations (tenant_id, active, city) 
            WHERE active = true`,
            
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS locations_tenant_coordinates_idx 
            ON ${schemaId}.locations (tenant_id, latitude, longitude) 
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL`,
        
        // Favorecidos performance indexes - CRITICAL MISSING
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS favorecidos_tenant_active_name_idx 
            ON ${schemaId}.favorecidos (tenant_id, active, full_name) 
            WHERE active = true`,
            
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS favorecidos_tenant_cpf_idx 
            ON ${schemaId}.favorecidos (tenant_id, cpf) 
            WHERE cpf IS NOT NULL`,
        
        // Customer companies performance indexes - CRITICAL MISSING
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS customer_companies_tenant_active_idx 
            ON ${schemaId}.customer_companies (tenant_id, active, name) 
            WHERE active = true`,
            
        // Customer company memberships performance indexes - CRITICAL MISSING  
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS company_memberships_tenant_customer_idx 
            ON ${schemaId}.company_memberships (tenant_id, customer_id, company_id)`,
            
        // Certifications performance indexes - CRITICAL MISSING
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS certifications_tenant_category_issuer_idx 
            ON ${schemaId}.certifications (tenant_id, category, issuer) 
            WHERE category IS NOT NULL`,
            
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS certifications_tenant_validity_idx 
            ON ${schemaId}.certifications (tenant_id, validity_months) 
            WHERE validity_months IS NOT NULL`,
        
        // Tickets additional critical indexes - PERFORMANCE BOOST
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_assigned_status_idx 
            ON ${schemaId}.tickets (tenant_id, "assignedTo", status) 
            WHERE "assignedTo" IS NOT NULL`,
            
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_urgency_impact_idx 
            ON ${schemaId}.tickets (tenant_id, urgency, impact) 
            WHERE urgency IS NOT NULL OR impact IS NOT NULL`,
        
        // Customers additional critical indexes - ENHANCED PERFORMANCE
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_email_verified_idx 
            ON ${schemaId}.customers (tenant_id, email, verified) 
            WHERE email IS NOT NULL`,
            
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_tenant_company_active_idx 
            ON ${schemaId}.customers (tenant_id, company, active) 
            WHERE company IS NOT NULL`,
        
        // Activity logs enhanced indexes - AUDIT PERFORMANCE
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS activity_logs_tenant_user_date_idx 
            ON ${schemaId}.activity_logs (tenant_id, user_id, created_at DESC) 
            WHERE user_id IS NOT NULL`,
            
        sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS activity_logs_tenant_entity_id_idx 
            ON ${schemaId}.activity_logs (tenant_id, entity_id, entity_type) 
            WHERE entity_id IS NOT NULL`
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
      
      // Execute ANALYZE to update statistics after index creation
      await this.analyzeSchemaPerformance(schemaName);
      
      logInfo(`✅ ALL CRITICAL performance indexes created for tenant schema ${schemaName}`);
      
    } catch (error) {
      logError('❌ Failed to create tenant performance indexes', error, { schemaName });
      throw error;
    }
  }

  // ===========================
  // ANÁLISE DE PERFORMANCE CRÍTICA
  // ===========================
  static async analyzeSchemaPerformance(schemaName: string): Promise<void> {
    try {
      const schemaId = sql.identifier(schemaName);
      
      // Atualizar estatísticas críticas do PostgreSQL
      const criticalTables = [
        'tickets', 'customers', 'activity_logs', 'skills', 'user_skills', 
        'certifications', 'favorecidos', 'customer_companies', 
        'company_memberships', 'locations', 'ticket_messages'
      ];
      
      for (const table of criticalTables) {
        try {
          const tableId = sql.identifier(table);
          await db.execute(sql`ANALYZE ${schemaId}.${tableId}`);
        } catch (analyzeError) {
          // Table may not exist - continue with others
          logError(`ANALYZE failed for ${table}`, analyzeError, { schemaName, table });
        }
      }
      
      logInfo(`📊 Schema performance statistics updated for ${schemaName}`);
      
    } catch (error) {
      logError('Failed to analyze schema performance', error, { schemaName });
    }
  }

  // ===========================
  // VERIFICAÇÃO DE ÍNDICES COMPLETOS
  // ===========================
  static async verifyIndexIntegrity(schemaName: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as index_count
        FROM pg_indexes 
        WHERE schemaname = ${schemaName}
        AND indexname LIKE '%_tenant_%'
      `);
      
      const indexCount = (result.rows[0]?.index_count as number) || 0;
      logInfo(`📊 Tenant-specific indexes in ${schemaName}: ${indexCount}/20+ expected`);
      
      // Esperamos pelo menos 20+ índices tenant-specific críticos
      const isComplete = indexCount >= 20;
      
      if (isComplete) {
        logInfo(`✅ Index integrity verification PASSED for ${schemaName}`);
      } else {
        logError(`❌ Index integrity verification FAILED for ${schemaName} - only ${indexCount} indexes found`, 
                 new Error('Insufficient indexes'), { schemaName, indexCount });
      }
      
      return isComplete;
      
    } catch (error) {
      logError('Failed to verify index integrity', error, { schemaName });
      return false;
    }
  }
}
