
/**
 * Script para validar se a nova estrutura hierárquica de 5 categorias
 * foi aplicada corretamente nos tenants
 */

import { sql } from "drizzle-orm";

async function validateNewHierarchy(tenantId: string) {
  console.log(`🔍 [HIERARCHY-VALIDATION] Validating new hierarchy for tenant: ${tenantId}`);
  
  try {
    const { db } = await import("../db");
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // 1. Verificar categorias
    const categoriesResult = await db.execute(sql`
      SELECT name, color, icon, active FROM "${sql.raw(schemaName)}"."ticket_categories"
      WHERE tenant_id = ${tenantId} AND active = true
      ORDER BY sort_order
    `);

    const expectedCategories = [
      'Infraestrutura & Equipamentos',
      'Software & Aplicações',
      'Conectividade & Redes',
      'Segurança & Acesso',
      'Usuários & Suporte'
    ];

    console.log(`📊 [HIERARCHY-VALIDATION] Found ${categoriesResult.length} categories`);
    
    if (categoriesResult.length !== 5) {
      console.error(`❌ Expected 5 categories, found ${categoriesResult.length}`);
      return false;
    }

    // Verificar se todas as categorias esperadas estão presentes
    const foundCategories = categoriesResult.map((cat: any) => cat.name);
    const missingCategories = expectedCategories.filter(cat => !foundCategories.includes(cat));
    
    if (missingCategories.length > 0) {
      console.error(`❌ Missing categories: ${missingCategories.join(', ')}`);
      return false;
    }

    // 2. Verificar subcategorias
    const subcategoriesResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM "${sql.raw(schemaName)}"."ticket_subcategories"
      WHERE tenant_id = ${tenantId} AND active = true
    `);

    const subcategoriesCount = Number(subcategoriesResult[0]?.count || 0);
    console.log(`📊 [HIERARCHY-VALIDATION] Found ${subcategoriesCount} subcategories`);

    if (subcategoriesCount < 20) {
      console.warn(`⚠️ Expected at least 20 subcategories, found ${subcategoriesCount}`);
    }

    // 3. Verificar ações
    const actionsResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM "${sql.raw(schemaName)}"."ticket_actions"
      WHERE tenant_id = ${tenantId} AND active = true
    `);

    const actionsCount = Number(actionsResult[0]?.count || 0);
    console.log(`📊 [HIERARCHY-VALIDATION] Found ${actionsCount} actions`);

    console.log('✅ [HIERARCHY-VALIDATION] New hierarchy validation completed successfully!');
    console.log(`📋 Summary for tenant ${tenantId}:`);
    console.log(`   - Categories: ${categoriesResult.length}/5 ✓`);
    console.log(`   - Subcategories: ${subcategoriesCount}`);
    console.log(`   - Actions: ${actionsCount}`);

    return true;

  } catch (error) {
    console.error(`❌ [HIERARCHY-VALIDATION] Validation failed:`, error);
    return false;
  }
}

// Executar validação se chamado diretamente
if (require.main === module) {
  const tenantId = process.argv[2];
  
  if (!tenantId) {
    console.log('❌ Please provide a tenant ID');
    console.log('Usage: npm run exec validateNewHierarchy.ts <tenant-id>');
    process.exit(1);
  }
  
  validateNewHierarchy(tenantId)
    .then((success) => {
      if (success) {
        console.log('🎉 Validation completed successfully!');
        process.exit(0);
      } else {
        console.log('❌ Validation failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { validateNewHierarchy };
