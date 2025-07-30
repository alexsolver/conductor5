
// INICIALIZAÇÃO DE CONFIGURAÇÕES DE METADATA DE TICKETS
// Corrige o problema de dropdowns vazios (priority, status, etc.)

import { db } from '../db.js';

async function initializeTicketMetadata() {
  console.log('🚀 INICIANDO CONFIGURAÇÃO DE METADATA DE TICKETS');

  try {
    // Buscar todos os tenants ativos
    const tenants = await db.execute(`
      SELECT id, name FROM public.tenants WHERE is_active = true
    `);

    console.log(`📊 Encontrados ${tenants.rows.length} tenants ativos`);

    for (const tenant of tenants.rows) {
      const tenantId = tenant.id;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      console.log(`🔧 Configurando metadata para tenant: ${tenant.name} (${tenantId})`);

      // 1. CONFIGURAÇÕES DE CAMPO - PRIORITY
      await db.execute(`
        INSERT INTO "${schemaName}".ticket_field_configurations 
        (id, tenant_id, customer_id, field_name, display_name, field_type, is_required, is_system_field, sort_order, is_active)
        VALUES 
        (gen_random_uuid(), $1, NULL, 'priority', 'Prioridade', 'select', true, true, 1, true)
        ON CONFLICT (tenant_id, customer_id, field_name) DO NOTHING
      `, [tenantId]);

      // 2. OPÇÕES DE PRIORIDADE
      const priorityOptions = [
        { value: 'low', label: 'Baixa', color: '#10b981', order: 1 },
        { value: 'medium', label: 'Média', color: '#f59e0b', order: 2 },
        { value: 'high', label: 'Alta', color: '#ef4444', order: 3 },
        { value: 'urgent', label: 'Urgente', color: '#dc2626', order: 4 },
        { value: 'critical', label: 'Crítica', color: '#991b1b', order: 5 }
      ];

      for (const option of priorityOptions) {
        await db.execute(`
          INSERT INTO "${schemaName}".ticket_field_options 
          (id, tenant_id, customer_id, field_config_id, option_value, display_label, color_hex, sort_order, is_default, is_active)
          SELECT 
            gen_random_uuid(), 
            $1, 
            NULL, 
            tfc.id, 
            $2, 
            $3, 
            $4, 
            $5, 
            $6, 
            true
          FROM "${schemaName}".ticket_field_configurations tfc 
          WHERE tfc.field_name = 'priority' AND tfc.customer_id IS NULL
          ON CONFLICT (tenant_id, customer_id, field_config_id, option_value) DO NOTHING
        `, [tenantId, option.value, option.label, option.color, option.order, option.value === 'medium']);
      }

      // 3. CONFIGURAÇÕES DE CAMPO - STATUS  
      await db.execute(`
        INSERT INTO "${schemaName}".ticket_field_configurations 
        (id, tenant_id, customer_id, field_name, display_name, field_type, is_required, is_system_field, sort_order, is_active)
        VALUES 
        (gen_random_uuid(), $1, NULL, 'status', 'Status', 'select', true, true, 2, true)
        ON CONFLICT (tenant_id, customer_id, field_name) DO NOTHING
      `, [tenantId]);

      // 4. OPÇÕES DE STATUS
      const statusOptions = [
        { value: 'new', label: 'Novo', color: '#3b82f6', order: 1 },
        { value: 'open', label: 'Aberto', color: '#10b981', order: 2 },
        { value: 'in_progress', label: 'Em Andamento', color: '#f59e0b', order: 3 },
        { value: 'pending', label: 'Pendente', color: '#8b5cf6', order: 4 },
        { value: 'resolved', label: 'Resolvido', color: '#059669', order: 5 },
        { value: 'closed', label: 'Fechado', color: '#6b7280', order: 6 }
      ];

      for (const option of statusOptions) {
        await db.execute(`
          INSERT INTO "${schemaName}".ticket_field_options 
          (id, tenant_id, customer_id, field_config_id, option_value, display_label, color_hex, sort_order, is_default, is_active)
          SELECT 
            gen_random_uuid(), 
            $1, 
            NULL, 
            tfc.id, 
            $2, 
            $3, 
            $4, 
            $5, 
            $6, 
            true
          FROM "${schemaName}".ticket_field_configurations tfc 
          WHERE tfc.field_name = 'status' AND tfc.customer_id IS NULL
          ON CONFLICT (tenant_id, customer_id, field_config_id, option_value) DO NOTHING
        `, [tenantId, option.value, option.label, option.color, option.order, option.value === 'new']);
      }

      console.log(`✅ Metadata configurada para tenant ${tenant.name}`);
    }

    console.log('🎉 CONFIGURAÇÃO DE METADATA CONCLUÍDA COM SUCESSO!');
    console.log('✅ Todas as opções de priority e status foram criadas');
    console.log('✅ Dropdowns agora devem funcionar corretamente');

  } catch (error) {
    console.error('❌ ERRO ao configurar metadata:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeTicketMetadata()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error);
      process.exit(1);
    });
}

export { initializeTicketMetadata };
