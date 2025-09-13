
/**
 * Script para aplicar a nova estrutura hierárquica de 5 categorias
 * ao tenant existente que ainda tem a estrutura antiga
 */

import { sql } from "drizzle-orm";

async function applyNewHierarchyToTenant(tenantId: string) {
  console.log(`🚀 [HIERARCHY-UPDATE] Aplicando nova estrutura para tenant: ${tenantId}`);
  
  try {
    const { db } = await import("../db");
    const { randomUUID } = await import("crypto");
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // 1. LIMPAR ESTRUTURA ANTIGA
    console.log('🧹 Limpando estrutura antiga...');
    
    // Desativar ações existentes
    await db.execute(sql`
      UPDATE "${sql.raw(schemaName)}"."ticket_actions" 
      SET active = false, updated_at = NOW()
      WHERE tenant_id = ${tenantId}
    `);

    // Desativar subcategorias existentes
    await db.execute(sql`
      UPDATE "${sql.raw(schemaName)}"."ticket_subcategories" 
      SET active = false, updated_at = NOW()
      WHERE tenant_id = ${tenantId}
    `);

    // Desativar categorias existentes
    await db.execute(sql`
      UPDATE "${sql.raw(schemaName)}"."ticket_categories" 
      SET active = false, updated_at = NOW()
      WHERE tenant_id = ${tenantId}
    `);

    // 2. CRIAR NOVA ESTRUTURA DE 5 CATEGORIAS
    console.log('🎯 Criando nova estrutura hierárquica de 5 categorias...');

    const categories = [
      {
        name: 'Infraestrutura & Equipamentos',
        color: '#6366f1',
        description: 'Problemas relacionados a hardware, equipamentos e infraestrutura física',
        icon: 'server'
      },
      {
        name: 'Software & Aplicações',
        color: '#10b981',
        description: 'Questões relacionadas a softwares, aplicativos e sistemas',
        icon: 'code'
      },
      {
        name: 'Conectividade & Redes',
        color: '#8b5cf6',
        description: 'Problemas de rede, conectividade e comunicação',
        icon: 'wifi'
      },
      {
        name: 'Segurança & Acesso',
        color: '#dc2626',
        description: 'Questões de segurança, acessos e permissões',
        icon: 'shield'
      },
      {
        name: 'Usuários & Suporte',
        color: '#f59e0b',
        description: 'Solicitações de usuários, treinamentos e suporte geral',
        icon: 'users'
      }
    ];

    const categoryIds: Record<string, string> = {};

    for (const [index, category] of categories.entries()) {
      const categoryId = randomUUID();
      categoryIds[category.name] = categoryId;

      await db.execute(sql`
        INSERT INTO "${sql.raw(schemaName)}"."ticket_categories"
        (id, tenant_id, company_id, name, description, color, icon, active, sort_order, created_at, updated_at)
        VALUES (
          ${categoryId}, ${tenantId}, ${tenantId}, ${category.name}, ${category.description},
          ${category.color}, ${category.icon}, true, ${index + 1}, NOW(), NOW()
        )
      `);

      console.log(`✅ Categoria criada: ${category.name}`);
    }

    // 3. CRIAR SUBCATEGORIAS
    const subcategories = [
      // Infraestrutura & Equipamentos
      { name: 'Computadores Desktop', categoryName: 'Infraestrutura & Equipamentos', color: '#6366f1', description: 'Problemas com PCs fixos' },
      { name: 'Notebooks e Móveis', categoryName: 'Infraestrutura & Equipamentos', color: '#6366f1', description: 'Laptops, tablets, dispositivos móveis' },
      { name: 'Servidores', categoryName: 'Infraestrutura & Equipamentos', color: '#6366f1', description: 'Infraestrutura de servidores' },
      { name: 'Periféricos', categoryName: 'Infraestrutura & Equipamentos', color: '#6366f1', description: 'Impressoras, monitores, teclados, mouse' },
      { name: 'Telefonia', categoryName: 'Infraestrutura & Equipamentos', color: '#6366f1', description: 'Telefones IP, centrais telefônicas' },

      // Software & Aplicações
      { name: 'Sistema Operacional', categoryName: 'Software & Aplicações', color: '#10b981', description: 'Windows, Linux, macOS' },
      { name: 'Aplicações Corporativas', categoryName: 'Software & Aplicações', color: '#10b981', description: 'ERP, CRM, sistemas internos' },
      { name: 'Software de Produtividade', categoryName: 'Software & Aplicações', color: '#10b981', description: 'Office, navegadores, ferramentas' },
      { name: 'Licenciamento', categoryName: 'Software & Aplicações', color: '#10b981', description: 'Renovações, ativações, compliance' },
      { name: 'Atualizações', categoryName: 'Software & Aplicações', color: '#10b981', description: 'Patches, versões, upgrades' },

      // Conectividade & Redes
      { name: 'Rede Local (LAN)', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'Switches, cabos, conectividade interna' },
      { name: 'Internet e WAN', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'Conexões externas, provedores' },
      { name: 'Wi-Fi e Wireless', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'Redes sem fio, access points' },
      { name: 'VPN e Acesso Remoto', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'Conexões seguras, trabalho remoto' },
      { name: 'Telefonia e VoIP', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'Comunicação por voz sobre IP' },

      // Segurança & Acesso
      { name: 'Controle de Acesso', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Permissões, usuários, grupos' },
      { name: 'Antivírus e Proteção', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Malware, ameaças, quarentena' },
      { name: 'Firewall e Políticas', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Bloqueios, regras de segurança' },
      { name: 'Backup e Recovery', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Backups, restaurações, disaster recovery' },

      // Usuários & Suporte
      { name: 'Contas e Perfis', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Criação, alteração, desativação de usuários' },
      { name: 'Treinamento', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Capacitação, manuais, orientações' },
      { name: 'Solicitações Gerais', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Pedidos diversos, informações' },
      { name: 'Procedimentos', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Processos, fluxos, documentação' }
    ];

    const subcategoryIds: Record<string, string> = {};

    for (const [index, subcategory] of subcategories.entries()) {
      const subcategoryId = randomUUID();
      subcategoryIds[subcategory.name] = subcategoryId;
      const categoryId = categoryIds[subcategory.categoryName];

      await db.execute(sql`
        INSERT INTO "${sql.raw(schemaName)}"."ticket_subcategories"
        (id, tenant_id, company_id, category_id, name, description, color, active, sort_order, created_at, updated_at)
        VALUES (
          ${subcategoryId}, ${tenantId}, ${tenantId}, ${categoryId}, ${subcategory.name}, 
          ${subcategory.description}, ${subcategory.color}, true, ${index + 1}, NOW(), NOW()
        )
      `);

      console.log(`✅ Subcategoria criada: ${subcategory.name}`);
    }

    // 4. CRIAR AÇÕES BÁSICAS
    const actions = [
      { name: 'Substituição de Componente', subcategoryName: 'Computadores Desktop', description: 'Substituir componente defeituoso' },
      { name: 'Instalação de Software', subcategoryName: 'Sistema Operacional', description: 'Instalar novo software' },
      { name: 'Configuração de Rede', subcategoryName: 'Rede Local (LAN)', description: 'Configurar parâmetros de rede' },
      { name: 'Reset de Senha', subcategoryName: 'Controle de Acesso', description: 'Redefinir senha de usuário' },
      { name: 'Treinamento Básico', subcategoryName: 'Treinamento', description: 'Fornecer treinamento básico' }
    ];

    for (const [index, action] of actions.entries()) {
      const actionId = randomUUID();
      const subcategoryId = subcategoryIds[action.subcategoryName];

      await db.execute(sql`
        INSERT INTO "${sql.raw(schemaName)}"."ticket_actions"
        (id, tenant_id, company_id, subcategory_id, name, description, color, active, sort_order, created_at, updated_at)
        VALUES (
          ${actionId}, ${tenantId}, ${tenantId}, ${subcategoryId}, ${action.name}, 
          ${action.description}, '#64748b', true, ${index + 1}, NOW(), NOW()
        )
      `);

      console.log(`✅ Ação criada: ${action.name}`);
    }

    console.log('🎉 Nova estrutura hierárquica aplicada com sucesso!');
    console.log('📊 Resumo:');
    console.log(`   - 5 Categorias criadas`);
    console.log(`   - ${subcategories.length} Subcategorias criadas`);
    console.log(`   - ${actions.length} Ações criadas`);

  } catch (error) {
    console.error(`❌ Erro ao aplicar nova estrutura:`, error);
    throw error;
  }
}

// Executar para o tenant específico
const TENANT_ID = 'e831b965-1ce2-4f8e-9e12-8fd2c5b5795f';

async function main() {
  try {
    await applyNewHierarchyToTenant(TENANT_ID);
    console.log('✅ Script executado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script falhou:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
