
import { pool } from '../db';

async function fixTicketFieldOptions() {
  console.log('🔧 Corrigindo opções de campos de ticket...');

  try {
    // Buscar todos os tenants
    const tenantsResult = await pool.query('SELECT id FROM public.tenants');
    const tenants = tenantsResult.rows;

    console.log(`📋 Encontrados ${tenants.length} tenants para processar`);

    for (const tenant of tenants) {
      const tenantId = tenant.id;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      console.log(`\n🔧 Processando tenant: ${tenantId}`);
      
      // Verificar se a tabela ticket_field_options existe
      const tableExists = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'ticket_field_options'
      `, [schemaName]);

      if (tableExists.rows.length > 0) {
        // Adicionar coluna performed_by se não existir
        try {
          await pool.query(`
            ALTER TABLE "${schemaName}".ticket_actions 
            ADD COLUMN IF NOT EXISTS performed_by UUID REFERENCES public.users(id)
          `);
          console.log(`✅ Campo performed_by adicionado/verificado para ${tenantId}`);
        } catch (error) {
          console.log(`ℹ️  Campo performed_by já existe ou erro: ${error.message}`);
        }

        // Inserir opções básicas se não existirem
        await pool.query(`
          INSERT INTO "${schemaName}".ticket_field_options (tenant_id, company_id, field_name, value, display_label, color, is_default, active)
          VALUES 
            ($1, gen_random_uuid(), 'status', 'new', 'Novo', '#3b82f6', true, true),
            ($1, gen_random_uuid(), 'status', 'open', 'Aberto', '#3b82f6', false, true),
            ($1, gen_random_uuid(), 'status', 'in_progress', 'Em Progresso', '#f59e0b', false, true),
            ($1, gen_random_uuid(), 'status', 'resolved', 'Resolvido', '#10b981', false, true),
            ($1, gen_random_uuid(), 'status', 'closed', 'Fechado', '#6b7280', false, true),
            ($1, gen_random_uuid(), 'priority', 'low', 'Baixa', '#10b981', false, true),
            ($1, gen_random_uuid(), 'priority', 'medium', 'Média', '#f59e0b', true, true),
            ($1, gen_random_uuid(), 'priority', 'high', 'Alta', '#f97316', false, true),
            ($1, gen_random_uuid(), 'priority', 'critical', 'Crítica', '#ef4444', false, true)
          ON CONFLICT (tenant_id, field_name, value) DO NOTHING
        `, [tenantId]);

        console.log(`✅ Opções de campo inseridas/verificadas para ${tenantId}`);
      } else {
        console.log(`⚠️  Tabela ticket_field_options não existe para ${tenantId}`);
      }
    }

    console.log('\n🎉 Correção de opções de campos concluída!');

  } catch (error) {
    console.error('❌ Erro na correção de opções de campos:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  fixTicketFieldOptions()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error);
      process.exit(1);
    });
}

export { fixTicketFieldOptions };
