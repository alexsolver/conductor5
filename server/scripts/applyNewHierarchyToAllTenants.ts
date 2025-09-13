
/**
 * Script para aplicar a nova estrutura hierárquica a todos os tenants existentes
 * Remove estrutura antiga e aplica a nova de 5 categorias modernas
 */

import { TenantTemplateService } from '../services/TenantTemplateService';

async function applyNewHierarchyToAllTenants() {
  console.log('🔄 [HIERARCHY-UPDATE] Starting update for all existing tenants...');
  
  const { db } = await import("../db");
  const { sql } = await import("drizzle-orm");
  
  try {
    // Buscar todos os tenants
    const tenantsResult = await db.execute(sql`
      SELECT id, name, subdomain, created_at 
      FROM public.tenants 
      ORDER BY created_at
    `);
    
    if (tenantsResult.length === 0) {
      console.log('📭 [HIERARCHY-UPDATE] No tenants found');
      return;
    }
    
    console.log(`🔍 [HIERARCHY-UPDATE] Found ${tenantsResult.length} tenants to update`);
    
    for (const tenant of tenantsResult) {
      console.log(`\n🏢 [HIERARCHY-UPDATE] Processing tenant: ${tenant.name} (${tenant.id})`);
      
      const schemaName = `tenant_${tenant.id.replace(/-/g, '_')}`;
      
      try {
        // Verificar se o tenant tem a estrutura antiga
        const oldCategoriesCheck = await db.execute(sql`
          SELECT COUNT(*) as count, STRING_AGG(name, ', ') as categories
          FROM "${sql.raw(schemaName)}".ticket_categories
          WHERE name IN ('Suporte Técnico', 'Atendimento ao Cliente', 'Financeiro', 'Administrativo')
        `);
        
        const oldCategoriesCount = parseInt(oldCategoriesCheck[0]?.count || '0');
        
        if (oldCategoriesCount > 0) {
          console.log(`⚠️ [HIERARCHY-UPDATE] Tenant ${tenant.name} has old structure (${oldCategoriesCount} old categories)`);
          
          // Aplicar nova estrutura
          const templateService = new TenantTemplateService();
          await templateService.applyDefaultTemplate(tenant.id, tenant.id);
          
          console.log(`✅ [HIERARCHY-UPDATE] Successfully updated tenant ${tenant.name}`);
        } else {
          // Verificar se tem a nova estrutura
          const newCategoriesCheck = await db.execute(sql`
            SELECT COUNT(*) as count, STRING_AGG(name, ', ') as categories
            FROM "${sql.raw(schemaName)}".ticket_categories
            WHERE name IN (
              'Infraestrutura & Equipamentos', 
              'Software & Aplicações', 
              'Conectividade & Redes', 
              'Segurança & Acesso', 
              'Usuários & Suporte'
            )
          `);
          
          const newCategoriesCount = parseInt(newCategoriesCheck[0]?.count || '0');
          
          if (newCategoriesCount >= 5) {
            console.log(`✅ [HIERARCHY-UPDATE] Tenant ${tenant.name} already has new structure (${newCategoriesCount}/5 categories)`);
          } else {
            console.log(`🔧 [HIERARCHY-UPDATE] Tenant ${tenant.name} needs new structure (${newCategoriesCount}/5 categories)`);
            
            // Aplicar nova estrutura
            const templateService = new TenantTemplateService();
            await templateService.applyDefaultTemplate(tenant.id, tenant.id);
            
            console.log(`✅ [HIERARCHY-UPDATE] Successfully applied new structure to tenant ${tenant.name}`);
          }
        }
        
      } catch (tenantError) {
        console.error(`❌ [HIERARCHY-UPDATE] Error updating tenant ${tenant.name}:`, tenantError.message);
        continue;
      }
    }
    
    console.log('\n🎉 [HIERARCHY-UPDATE] All tenants processed successfully!');
    
    // Validação final
    console.log('\n🔍 [HIERARCHY-UPDATE] Running final validation...');
    const { validateNewHierarchyTemplate } = await import('./validateNewHierarchyTemplate');
    
    for (const tenant of tenantsResult) {
      try {
        const isValid = await validateNewHierarchyTemplate(tenant.id);
        console.log(`${isValid ? '✅' : '❌'} [VALIDATION] Tenant ${tenant.name}: ${isValid ? 'VALID' : 'INVALID'}`);
      } catch (error) {
        console.error(`❌ [VALIDATION] Error validating tenant ${tenant.name}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ [HIERARCHY-UPDATE] Fatal error:', error);
    throw error;
  }
}

// Execute se chamado diretamente
if (require.main === module) {
  applyNewHierarchyToAllTenants()
    .then(() => {
      console.log('🎉 [HIERARCHY-UPDATE] Script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 [HIERARCHY-UPDATE] Script failed:', error);
      process.exit(1);
    });
}

export { applyNewHierarchyToAllTenants };
