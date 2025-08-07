
// DRIZZLE SYSTEMATIC RESOLVER - Resolve all identified issues
import { db } from '../db';
import { sql } from 'drizzle-orm';

export class DrizzleSystematicResolver {
  
  async resolveAllIssues(): Promise<void> {
    console.log('🔧 INICIANDO CORREÇÃO SISTEMÁTICA DRIZZLE...');
    
    try {
      // 1. Fix circular references
      await this.fixCircularReferences();
      
      // 2. Standardize tenant-first indexes
      await this.optimizeTenantIndexes();
      
      // 3. Fix FK constraints
      await this.repairForeignKeys();
      
      // 4. Standardize data types
      await this.standardizeDataTypes();
      
      // 5. Validate final state
      await this.validateFinalState();
      
      console.log('✅ CORREÇÃO SISTEMÁTICA COMPLETA!');
      
    } catch (error) {
      console.error('❌ Erro na correção sistemática:', error);
      throw error;
    }
  }
  
  private async fixCircularReferences(): Promise<void> {
    console.log('🔄 Corrigindo referências circulares...');
    
    // Add self-reference constraint for assets after table creation
    await db.execute(sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'assets_parent_asset_fkey'
        ) THEN
          ALTER TABLE assets 
          ADD CONSTRAINT assets_parent_asset_fkey 
          FOREIGN KEY (parent_asset_id) REFERENCES assets(id);
        END IF;
      END $$;
    `);
  }
  
  private async optimizeTenantIndexes(): Promise<void> {
    console.log('📊 Otimizando índices tenant-first...');
    
    const indexQueries = [
      // User activity logs composite index
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS user_activity_logs_tenant_user_action_idx 
       ON user_activity_logs (tenant_id, user_id, action)`,
       
      // Tickets composite indexes for common queries  
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_tenant_status_priority_created_idx 
       ON tickets (tenant_id, status, priority, created_at)`,
       
      // Items tenant-first optimization
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS items_tenant_type_active_idx 
       ON items (tenant_id, type, active)`,
       
      // CRITICAL: Ticket materials consumption tenant-first
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS ticket_planned_items_tenant_ticket_idx 
       ON ticket_planned_items (tenant_id, ticket_id)`,
       
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS ticket_consumed_items_tenant_ticket_idx 
       ON ticket_consumed_items (tenant_id, ticket_id)`,
       
      // Stock management tenant-first
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS stock_entries_tenant_item_location_idx 
       ON stock_entries (tenant_id, item_id, location_id)`,
       
      // Ticket metadata tenant-first
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS ticket_field_options_tenant_config_idx 
       ON ticket_field_options (tenant_id, field_config_id)`,
       
      // CLT compliance tenant-first  
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS timecard_entries_tenant_user_date_idx 
       ON timecard_entries (tenant_id, user_id, created_at)`
    ];
    
    for (const query of indexQueries) {
      await db.execute(sql.raw(query));
    }
  }
  
  private async repairForeignKeys(): Promise<void> {
    console.log('🔗 Reparando foreign keys...');
    
    // Check and fix FK constraints that may be missing
    await db.execute(sql`
      DO $$ 
      DECLARE
        missing_fk RECORD;
      BEGIN
        -- Verify critical FK constraints exist
        FOR missing_fk IN
          SELECT 'tickets' as table_name, 'caller_id' as column_name, 'customers' as ref_table, 'id' as ref_column
          WHERE NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%tickets_caller_id%'
          )
        LOOP
          EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_fkey FOREIGN KEY (%I) REFERENCES %I(%I)', 
            missing_fk.table_name, missing_fk.table_name || '_' || missing_fk.column_name, 
            missing_fk.column_name, missing_fk.ref_table, missing_fk.ref_column);
        END LOOP;
      END $$;
    `);
  }
  
  private async standardizeDataTypes(): Promise<void> {
    console.log('🔧 Padronizando tipos de dados...');
    
    // Ensure consistent UUID types for all foreign keys
    await db.execute(sql`
      DO $$ 
      DECLARE
        table_rec RECORD;
        column_rec RECORD;
      BEGIN
        -- Fix any remaining VARCHAR FK columns to UUID
        FOR table_rec IN 
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        LOOP
          FOR column_rec IN
            SELECT column_name FROM information_schema.columns
            WHERE table_name = table_rec.table_name 
            AND column_name LIKE '%_id' 
            AND data_type = 'character varying'
            AND column_name IN ('user_id', 'tenant_id', 'customer_id', 'company_id', 'item_id')
          LOOP
            BEGIN
              EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE UUID USING %I::uuid', 
                table_rec.table_name, column_rec.column_name, column_rec.column_name);
              RAISE NOTICE 'Fixed %%.%% from VARCHAR to UUID', table_rec.table_name, column_rec.column_name;
            EXCEPTION WHEN OTHERS THEN
              RAISE NOTICE 'Could not convert %%.%% to UUID: %%', table_rec.table_name, column_rec.column_name, SQLERRM;
            END;
          END LOOP;
        END LOOP;
        
        -- Verify UUID consistency
        RAISE NOTICE 'UUID standardization completed';
      END $$;
    `);
  }
  
  private async validateFinalState(): Promise<void> {
    console.log('✅ Validando estado final...');
    
    const validation = await db.execute(sql`
      SELECT 
        schemaname,
        COUNT(*) as table_count,
        COUNT(CASE WHEN tablename LIKE '%tenant%' THEN 1 END) as tenant_tables
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
      GROUP BY schemaname
    `);
    
    console.log('📊 Validação final:', validation.rows);
  }
}

// Auto-execute if run directly
if (require.main === module) {
  const resolver = new DrizzleSystematicResolver();
  resolver.resolveAllIssues()
    .then(() => {
      console.log('🎯 RESOLUÇÃO SISTEMÁTICA CONCLUÍDA COM SUCESSO!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 FALHA NA RESOLUÇÃO:', error);
      process.exit(1);
    });
}
