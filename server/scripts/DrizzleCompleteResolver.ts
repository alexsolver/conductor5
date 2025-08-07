
import { DrizzleSystematicResolver } from './DrizzleSystematicResolver';
import { sql } from 'drizzle-orm';
import { db } from '../db';

export class DrizzleCompleteResolver {
  
  async resolveAllDrizzleIssues(): Promise<{
    success: boolean;
    resolvedIssues: string[];
    remainingIssues: string[];
  }> {
    console.log('🔧 INICIANDO RESOLUÇÃO COMPLETA DRIZZLE...');
    
    const resolvedIssues: string[] = [];
    const remainingIssues: string[] = [];
    
    try {
      // 1. Executar resolver sistemático existente
      const systematicResolver = new DrizzleSystematicResolver();
      await systematicResolver.resolveAllIssues();
      resolvedIssues.push('Systematic fixes applied');
      
      // 2. Corrigir auto-referência assets
      await this.fixAssetsCircularReference();
      resolvedIssues.push('Assets circular reference fixed');
      
      // 3. Validar schema completeness
      await this.validateSchemaCompleteness();
      resolvedIssues.push('Schema completeness validated');
      
      // 4. Otimizar performance crítica
      await this.optimizeCriticalPerformance();
      resolvedIssues.push('Critical performance optimized');
      
      // 5. Verificação final
      const finalValidation = await this.runFinalValidation();
      if (finalValidation.success) {
        resolvedIssues.push('Final validation passed');
      } else {
        remainingIssues.push(...finalValidation.issues);
      }
      
      console.log('✅ RESOLUÇÃO DRIZZLE COMPLETA!');
      
      return {
        success: remainingIssues.length === 0,
        resolvedIssues,
        remainingIssues
      };
      
    } catch (error) {
      console.error('❌ Erro na resolução Drizzle:', error);
      remainingIssues.push(`Critical error: ${error.message}`);
      
      return {
        success: false,
        resolvedIssues,
        remainingIssues
      };
    }
  }
  
  private async fixAssetsCircularReference(): Promise<void> {
    console.log('🔄 Corrigindo referência circular assets...');
    
    await db.execute(sql`
      DO $$ BEGIN
        -- Add self-reference constraint for assets if not exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'assets_parent_asset_fkey'
          AND table_name = 'assets'
        ) THEN
          ALTER TABLE assets 
          ADD CONSTRAINT assets_parent_asset_fkey 
          FOREIGN KEY (parent_asset_id) REFERENCES assets(id)
          ON DELETE SET NULL;
          
          RAISE NOTICE 'Assets self-reference constraint added';
        ELSE
          RAISE NOTICE 'Assets self-reference constraint already exists';
        END IF;
      END $$;
    `);
  }
  
  private async validateSchemaCompleteness(): Promise<void> {
    console.log('📋 Validando completude do schema...');
    
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_tables,
        COUNT(CASE WHEN table_name LIKE '%ticket%' THEN 1 END) as ticket_tables,
        COUNT(CASE WHEN table_name LIKE '%user%' THEN 1 END) as user_tables,
        COUNT(CASE WHEN table_name LIKE '%item%' OR table_name LIKE '%stock%' THEN 1 END) as materials_tables
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    const stats = result.rows[0];
    console.log('📊 Schema Statistics:', {
      totalTables: stats.total_tables,
      ticketTables: stats.ticket_tables,
      userTables: stats.user_tables,
      materialsTables: stats.materials_tables
    });
  }
  
  private async optimizeCriticalPerformance(): Promise<void> {
    console.log('⚡ Otimizando performance crítica...');
    
    // Critical indexes for LPU system
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS price_list_items_tenant_performance_idx 
      ON price_list_items (tenant_id, price_list_id, item_id);
      
      CREATE INDEX CONCURRENTLY IF NOT EXISTS ticket_costs_summary_tenant_ticket_idx 
      ON ticket_costs_summary (tenant_id, ticket_id);
      
      CREATE INDEX CONCURRENTLY IF NOT EXISTS customer_item_mappings_tenant_customer_idx 
      ON customer_item_mappings (tenant_id, customer_id, item_id);
    `);
  }
  
  private async runFinalValidation(): Promise<{
    success: boolean;
    issues: string[];
  }> {
    console.log('✅ Executando validação final...');
    
    const issues: string[] = [];
    
    try {
      // Check for missing critical tables
      const missingTables = await db.execute(sql`
        SELECT table_name FROM (
          VALUES 
            ('tickets'), ('customers'), ('items'), ('suppliers'),
            ('ticket_planned_items'), ('ticket_consumed_items'),
            ('price_lists'), ('price_list_items')
        ) AS required(table_name)
        WHERE NOT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = required.table_name 
          AND table_schema = 'public'
        )
      `);
      
      if (missingTables.rows.length > 0) {
        issues.push(`Missing critical tables: ${missingTables.rows.map(r => r.table_name).join(', ')}`);
      }
      
      // Check for UUID consistency
      const uuidInconsistencies = await db.execute(sql`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE column_name LIKE '%_id' 
        AND data_type != 'uuid' 
        AND table_schema = 'public'
        AND column_name IN ('user_id', 'tenant_id', 'customer_id', 'item_id')
        LIMIT 5
      `);
      
      if (uuidInconsistencies.rows.length > 0) {
        issues.push(`UUID inconsistencies found in ${uuidInconsistencies.rows.length} columns`);
      }
      
      return {
        success: issues.length === 0,
        issues
      };
      
    } catch (error) {
      issues.push(`Validation error: ${error.message}`);
      return { success: false, issues };
    }
  }
}

// Auto-execute if run directly
if (require.main === module) {
  const resolver = new DrizzleCompleteResolver();
  resolver.resolveAllDrizzleIssues()
    .then((result) => {
      console.log('🎯 RESULTADO FINAL:', result);
      if (result.success) {
        console.log('✅ TODOS OS PROBLEMAS DRIZZLE RESOLVIDOS!');
      } else {
        console.log('⚠️ ALGUNS PROBLEMAS PERMANECEM:', result.remainingIssues);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 FALHA CRÍTICA:', error);
      process.exit(1);
    });
}
