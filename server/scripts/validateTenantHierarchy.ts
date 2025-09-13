
/**
 * Script para validar se um tenant está usando a nova estrutura hierárquica de 5 categorias
 */

import { sql } from "drizzle-orm";

interface HierarchyValidation {
  tenantId: string;
  hasCorrectStructure: boolean;
  categoriesCount: number;
  subcategoriesCount: number;
  actionsCount: number;
  missingElements: string[];
  details: string;
}

const EXPECTED_CATEGORIES = [
  'Infraestrutura & Equipamentos',
  'Software & Aplicações', 
  'Conectividade & Redes',
  'Segurança & Acesso',
  'Usuários & Suporte'
];

async function validateTenantHierarchy(tenantId: string): Promise<HierarchyValidation> {
  console.log(`🔍 [VALIDATION] Validating hierarchy for tenant: ${tenantId}`);
  
  const { db } = await import("../db");
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
  
  try {
    // Verificar categorias
    const categoriesResult = await db.execute(sql`
      SELECT name FROM "${sql.raw(schemaName)}"."ticket_categories" 
      WHERE tenant_id = ${tenantId} AND active = true
      ORDER BY sort_order
    `);

    const categories = categoriesResult.rows.map((row: any) => row.name);
    
    // Verificar subcategorias
    const subcategoriesResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM "${sql.raw(schemaName)}"."ticket_subcategories" 
      WHERE tenant_id = ${tenantId} AND active = true
    `);
    
    const subcategoriesCount = parseInt(subcategoriesResult.rows[0]?.count || '0');
    
    // Verificar ações
    const actionsResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM "${sql.raw(schemaName)}"."ticket_actions" 
      WHERE tenant_id = ${tenantId} AND active = true
    `);
    
    const actionsCount = parseInt(actionsResult.rows[0]?.count || '0');
    
    // Verificar se tem a estrutura correta
    const missingCategories = EXPECTED_CATEGORIES.filter(
      expected => !categories.includes(expected)
    );
    
    const hasCorrectStructure = 
      categories.length === 5 && 
      missingCategories.length === 0 &&
      subcategoriesCount >= 20 &&
      actionsCount >= 5;

    const validation: HierarchyValidation = {
      tenantId,
      hasCorrectStructure,
      categoriesCount: categories.length,
      subcategoriesCount,
      actionsCount,
      missingElements: missingCategories,
      details: `Categories: [${categories.join(', ')}]`
    };

    console.log(`${hasCorrectStructure ? '✅' : '❌'} [VALIDATION] Tenant ${tenantId}:`, {
      categories: categories.length,
      subcategories: subcategoriesCount,
      actions: actionsCount,
      correct: hasCorrectStructure
    });

    return validation;

  } catch (error) {
    console.error(`❌ [VALIDATION] Error validating tenant ${tenantId}:`, error);
    return {
      tenantId,
      hasCorrectStructure: false,
      categoriesCount: 0,
      subcategoriesCount: 0,
      actionsCount: 0,
      missingElements: EXPECTED_CATEGORIES,
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Executar validação para um tenant específico
async function main() {
  const tenantId = process.argv[2];
  
  if (!tenantId) {
    console.log('❌ [VALIDATION] Please provide a tenant ID');
    console.log('Usage: node -r esbuild-register validateTenantHierarchy.ts <tenant-id>');
    process.exit(1);
  }
  
  console.log('🚀 [VALIDATION] Starting tenant hierarchy validation...');
  
  const result = await validateTenantHierarchy(tenantId);
  
  console.log('\n📊 [VALIDATION] Results:');
  console.log(`   Tenant ID: ${result.tenantId}`);
  console.log(`   Correct Structure: ${result.hasCorrectStructure ? 'YES' : 'NO'}`);
  console.log(`   Categories: ${result.categoriesCount}/5`);
  console.log(`   Subcategories: ${result.subcategoriesCount}`);
  console.log(`   Actions: ${result.actionsCount}`);
  
  if (result.missingElements.length > 0) {
    console.log(`   Missing Categories: ${result.missingElements.join(', ')}`);
  }
  
  console.log(`   Details: ${result.details}`);
  
  if (result.hasCorrectStructure) {
    console.log('🎉 [VALIDATION] Tenant hierarchy is CORRECT!');
  } else {
    console.log('⚠️ [VALIDATION] Tenant hierarchy needs correction');
    console.log('   Run: node -r esbuild-register applyNewTicketStructure.ts');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { validateTenantHierarchy };
