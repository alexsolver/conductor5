
/**
 * Script para aplicar nova estrutura hierárquica de 5 categorias
 * para tenants existentes que ainda usam a estrutura antiga
 */

import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";

async function applyNewTicketStructure(tenantId: string, companyId: string) {
  console.log(`🚀 [APPLY-NEW-STRUCTURE] Iniciando para tenant: ${tenantId}`);
  
  const { db } = await import("../db");
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

  try {
    // 1. Limpar estrutura antiga
    console.log('🧹 Removendo estrutura antiga...');
    await db.execute(sql`DELETE FROM "${sql.raw(schemaName)}"."ticket_actions" WHERE tenant_id = ${tenantId}`);
    await db.execute(sql`DELETE FROM "${sql.raw(schemaName)}"."ticket_subcategories" WHERE tenant_id = ${tenantId}`);
    await db.execute(sql`DELETE FROM "${sql.raw(schemaName)}"."ticket_categories" WHERE tenant_id = ${tenantId}`);

    // 2. Aplicar nova estrutura de 5 categorias
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

    // Criar categorias
    for (const [index, category] of categories.entries()) {
      const categoryId = randomUUID();
      categoryIds[category.name] = categoryId;

      await db.execute(sql`
        INSERT INTO "${sql.raw(schemaName)}"."ticket_categories"
        (id, tenant_id, company_id, name, description, color, icon, active, sort_order, created_at, updated_at)
        VALUES (
          ${categoryId}, ${tenantId}, ${companyId}, ${category.name}, ${category.description},
          ${category.color}, ${category.icon}, true, ${index + 1}, NOW(), NOW()
        )
      `);

      console.log(`✅ Categoria criada: ${category.name}`);
    }

    // Subcategorias
    const subcategories = [
      // Infraestrutura & Equipamentos
      { name: 'Computadores Desktop', categoryName: 'Infraestrutura & Equipamentos', color: '#6366f1', description: 'Problemas com PCs fixos' },
      { name: 'Notebooks e Móveis', categoryName: 'Infraestrutura & Equipamentos', color: '#6366f1', description: 'Laptops, tablets, dispositivos móveis' },
      { name: 'Servidores', categoryName: 'Infraestrutura & Equipamentos', color: '#6366f1', description: 'Infraestrutura de servidores' },
      { name: 'Periféricos', categoryName: 'Infraestrutura & Equipamentos', color: '#6366f1', description: 'Impressoras, monitores, teclados, mouse' },

      // Software & Aplicações
      { name: 'Sistema Operacional', categoryName: 'Software & Aplicações', color: '#10b981', description: 'Windows, Linux, macOS' },
      { name: 'Aplicações Corporativas', categoryName: 'Software & Aplicações', color: '#10b981', description: 'ERP, CRM, sistemas internos' },
      { name: 'Software de Produtividade', categoryName: 'Software & Aplicações', color: '#10b981', description: 'Office, navegadores, ferramentas' },
      { name: 'Licenciamento', categoryName: 'Software & Aplicações', color: '#10b981', description: 'Renovações, ativações, compliance' },

      // Conectividade & Redes
      { name: 'Wi-Fi e Internet', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'Problemas de conexão sem fio e internet' },
      { name: 'Redes Corporativas', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'VPNs, domínios, servidores de rede' },
      { name: 'Telefonia', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'Ramais, VOIP, sistemas telefônicos' },
      { name: 'Comunicação Digital', categoryName: 'Conectividade & Redes', color: '#8b5cf6', description: 'E-mail, Teams, videoconferência' },

      // Segurança & Acesso
      { name: 'Controle de Acesso', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Senhas, bloqueios, permissões' },
      { name: 'Antivírus e Proteção', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Malware, vírus, firewall' },
      { name: 'Backup e Recuperação', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Backups, restauração de dados' },
      { name: 'Certificados Digitais', categoryName: 'Segurança & Acesso', color: '#dc2626', description: 'Certificados, assinaturas digitais' },

      // Usuários & Suporte
      { name: 'Treinamento', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Capacitação, tutoriais, dúvidas' },
      { name: 'Solicitações Gerais', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Pedidos diversos dos usuários' },
      { name: 'Suporte Remoto', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Assistência técnica à distância' },
      { name: 'Consultoria', categoryName: 'Usuários & Suporte', color: '#f59e0b', description: 'Orientações técnicas especializadas' }
    ];

    const subcategoryIds: Record<string, string> = {};

    // Criar subcategorias
    for (const [index, subcategory] of subcategories.entries()) {
      const subcategoryId = randomUUID();
      const categoryId = categoryIds[subcategory.categoryName];

      if (!categoryId) {
        console.warn(`[APPLY-NEW-STRUCTURE] Category not found: ${subcategory.categoryName}`);
        continue;
      }

      subcategoryIds[subcategory.name] = subcategoryId;

      await db.execute(sql`
        INSERT INTO "${sql.raw(schemaName)}"."ticket_subcategories"
        (id, tenant_id, company_id, category_id, name, description, color, icon, active, sort_order, created_at, updated_at)
        VALUES (
          ${subcategoryId}, ${tenantId}, ${companyId}, ${categoryId}, ${subcategory.name}, ${subcategory.description},
          ${subcategory.color}, 'folder', true, ${index + 1}, NOW(), NOW()
        )
      `);

      console.log(`✅ Subcategoria criada: ${subcategory.name}`);
    }

    // Ações básicas (amostra)
    const basicActions = [
      { name: 'Verificar Conexões', subcategoryName: 'Computadores Desktop', color: '#6366f1', description: 'Verificar cabos e conexões físicas' },
      { name: 'Reinstalar Sistema', subcategoryName: 'Sistema Operacional', color: '#10b981', description: 'Formatação e reinstalação completa' },
      { name: 'Resetar Conexão', subcategoryName: 'Wi-Fi e Internet', color: '#8b5cf6', description: 'Reinicializar configurações de rede' },
      { name: 'Resetar Senha', subcategoryName: 'Controle de Acesso', color: '#dc2626', description: 'Redefinição de credenciais de acesso' },
      { name: 'Agendar Treinamento', subcategoryName: 'Treinamento', color: '#f59e0b', description: 'Agendamento de sessão de capacitação' }
    ];

    // Criar ações básicas
    for (const [index, action] of basicActions.entries()) {
      const actionId = randomUUID();
      const subcategoryId = subcategoryIds[action.subcategoryName];

      if (!subcategoryId) {
        console.warn(`[APPLY-NEW-STRUCTURE] Subcategory not found: ${action.subcategoryName}`);
        continue;
      }

      await db.execute(sql`
        INSERT INTO "${sql.raw(schemaName)}"."ticket_actions"
        (id, tenant_id, company_id, subcategory_id, name, description, color, active, sort_order, created_at, updated_at)
        VALUES (
          ${actionId}, ${tenantId}, ${companyId}, ${subcategoryId}, ${action.name}, ${action.description},
          ${action.color}, true, ${index + 1}, NOW(), NOW()
        )
      `);

      console.log(`✅ Ação criada: ${action.name}`);
    }

    console.log('🎉 [APPLY-NEW-STRUCTURE] Nova estrutura aplicada com sucesso!');
    console.log('📊 [APPLY-NEW-STRUCTURE] Resumo:');
    console.log(`   - ${categories.length} categorias principais`);
    console.log(`   - ${subcategories.length} subcategorias`);
    console.log(`   - ${basicActions.length} ações básicas`);

    return { success: true, message: 'Nova estrutura aplicada com sucesso!' };

  } catch (error) {
    console.error(`❌ [APPLY-NEW-STRUCTURE] Erro ao aplicar nova estrutura:`, error);
    return { success: false, message: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Executar para o tenant atual (usando ID do tenant da imagem)
async function main() {
  const tenantId = '6d2d69f9-02d2-49b0-8a23-846e9b43cfa7'; // ID do tenant visível nos logs
  const companyId = '00000000-0000-0000-0000-000000000001'; // ID da company padrão
  
  console.log('🚀 [SCRIPT] Iniciando aplicação da nova estrutura hierárquica...');
  
  const result = await applyNewTicketStructure(tenantId, companyId);
  
  if (result.success) {
    console.log('✅ [SCRIPT] Script executado com sucesso!');
    console.log('🔄 [SCRIPT] Recarregue a página /ticket-configuration para ver as mudanças');
  } else {
    console.log('❌ [SCRIPT] Falha na execução do script:', result.message);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { applyNewTicketStructure };
