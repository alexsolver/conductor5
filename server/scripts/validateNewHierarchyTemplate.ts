
/**
 * Script para validar se a nova estrutura hierárquica está sendo aplicada corretamente
 * Usado para verificar tenants criados após a atualização do template
 */

import { v4 as uuidv4 } from 'uuid';

async function validateNewHierarchyTemplate(tenantId?: string) {
  console.log('🔍 [HIERARCHY-VALIDATION] Starting new hierarchy template validation...');
  
  const { db } = await import("../db");
  const { sql } = await import("drizzle-orm");
  
  try {
    // Se não informado tenant específico, busca o mais recente
    if (!tenantId) {
      console.log('🔍 [HIERARCHY-VALIDATION] No tenant specified, finding most recent...');
      const tenantsResult = await db.execute(sql`
        SELECT id, name, subdomain, created_at 
        FROM public.tenants 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      if (tenantsResult.length === 0) {
        console.error('❌ [HIERARCHY-VALIDATION] No tenants found');
        return false;
      }
      
      tenantId = tenantsResult[0].id;
      console.log(`🔍 [HIERARCHY-VALIDATION] Using most recent tenant: ${tenantId} (${tenantsResult[0].name})`);
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    console.log(`🔍 [HIERARCHY-VALIDATION] Validating schema: ${schemaName}`);

    // 1. Verificar se as 5 categorias modernas existem
    const expectedCategories = [
      'Infraestrutura & Equipamentos',
      'Software & Aplicações', 
      'Conectividade & Redes',
      'Segurança & Acesso',
      'Usuários & Suporte'
    ];

    console.log('🔍 [HIERARCHY-VALIDATION] Checking modern categories...');
    const categoriesResult = await db.execute(sql`
      SELECT name, description, color, active, sort_order
      FROM "${sql.raw(schemaName)}".ticket_categories 
      ORDER BY sort_order
    `);

    const foundCategories = categoriesResult.map(cat => cat.name);
    console.log('📋 [HIERARCHY-VALIDATION] Found categories:', foundCategories);

    const missingCategories = expectedCategories.filter(cat => !foundCategories.includes(cat));
    const extraCategories = foundCategories.filter(cat => !expectedCategories.includes(cat));

    if (missingCategories.length > 0) {
      console.error(`❌ [HIERARCHY-VALIDATION] Missing modern categories: ${missingCategories.join(', ')}`);
      return false;
    }

    if (extraCategories.length > 0) {
      console.warn(`⚠️ [HIERARCHY-VALIDATION] Found old categories (should be removed): ${extraCategories.join(', ')}`);
    }

    // 2. Verificar subcategorias modernas
    console.log('🔍 [HIERARCHY-VALIDATION] Checking modern subcategories...');
    const subcategoriesResult = await db.execute(sql`
      SELECT 
        ts.name as subcategory_name,
        tc.name as category_name,
        ts.active,
        ts.sort_order
      FROM "${sql.raw(schemaName)}".ticket_subcategories ts
      JOIN "${sql.raw(schemaName)}".ticket_categories tc ON ts.category_id = tc.id
      ORDER BY tc.sort_order, ts.sort_order
    `);

    const expectedSubcategories = [
      // Infraestrutura & Equipamentos
      'Desktop', 'Notebook', 'Servidor', 'Impressora',
      // Software & Aplicações  
      'Sistema Operacional', 'Aplicações Corporativas', 'Office & Produtividade', 'Licenças',
      // Conectividade & Redes
      'Internet', 'Rede Local', 'Wi-Fi', 'VPN',
      // Segurança & Acesso
      'Antivírus', 'Firewall', 'Controle de Acesso', 'Backup',
      // Usuários & Suporte
      'Treinamento', 'Suporte Geral', 'Consultoria', 'Manutenção Preventiva'
    ];

    const foundSubcategories = subcategoriesResult.map(sub => sub.subcategory_name);
    console.log('📋 [HIERARCHY-VALIDATION] Found subcategories:', foundSubcategories.length, 'items');

    const missingSubcategories = expectedSubcategories.filter(sub => !foundSubcategories.includes(sub));
    if (missingSubcategories.length > 0) {
      console.error(`❌ [HIERARCHY-VALIDATION] Missing modern subcategories: ${missingSubcategories.join(', ')}`);
      return false;
    }

    // 3. Verificar ações
    console.log('🔍 [HIERARCHY-VALIDATION] Checking actions...');
    const actionsResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM "${sql.raw(schemaName)}".ticket_actions
    `);
    
    const actionsCount = parseInt(actionsResult[0]?.count || '0');
    console.log(`📋 [HIERARCHY-VALIDATION] Found ${actionsCount} actions`);

    if (actionsCount < 20) {
      console.error(`❌ [HIERARCHY-VALIDATION] Insufficient actions found: ${actionsCount} (expected at least 20)`);
      return false;
    }

    // 4. Verificar se não existem categorias antigas
    const oldCategories = ['Suporte Técnico', 'Atendimento ao Cliente', 'Financeiro', 'Administrativo'];
    const oldCategoriesFound = foundCategories.filter(cat => oldCategories.includes(cat));
    
    if (oldCategoriesFound.length > 0) {
      console.error(`❌ [HIERARCHY-VALIDATION] Found old categories that should be removed: ${oldCategoriesFound.join(', ')}`);
      return false;
    }

    console.log('✅ [HIERARCHY-VALIDATION] New hierarchy template validation successful!');
    console.log('📊 [HIERARCHY-VALIDATION] Summary:');
    console.log(`   - Categories: ${categoriesResult.length}/5 ✅`);
    console.log(`   - Subcategories: ${subcategoriesResult.length}/20 ✅`);  
    console.log(`   - Actions: ${actionsCount} ✅`);
    console.log(`   - No old structure found ✅`);

    return true;

  } catch (error) {
    console.error('❌ [HIERARCHY-VALIDATION] Error during validation:', error);
    return false;
  }
}

// Execute se chamado diretamente
if (require.main === module) {
  const tenantId = process.argv[2];
  validateNewHierarchyTemplate(tenantId)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { validateNewHierarchyTemplate };
