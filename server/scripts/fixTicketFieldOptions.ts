
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

        // Primeiro, verificar se a coluna field_name existe, se não, criar a estrutura correta
        try {
          const columnExists = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = $1 AND table_name = 'ticket_field_options' AND column_name = 'field_name'
          `, [schemaName]);

          if (columnExists.rows.length === 0) {
            console.log(`  ⚠️ Coluna field_name não existe em ${tenantId}, criando estrutura correta...`);
            
            // Dropar e recriar a tabela com estrutura correta
            await pool.query(`DROP TABLE IF EXISTS "${schemaName}".ticket_field_options CASCADE`);
            
            await pool.query(`
              CREATE TABLE "${schemaName}".ticket_field_options (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                company_id UUID,
                field_name VARCHAR(50) NOT NULL,
                option_value VARCHAR(50) NOT NULL,
                display_label VARCHAR(100) NOT NULL,
                description TEXT,
                color_hex VARCHAR(7),
                icon_name VARCHAR(50),
                sort_order INTEGER DEFAULT 0,
                is_default BOOLEAN DEFAULT false,
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(tenant_id, company_id, field_name, option_value)
              )
            `);
            
            console.log(`  ✅ Tabela ticket_field_options recriada com estrutura correta para ${tenantId}`);
          }

          // Inserir opções básicas se não existirem
          await pool.query(`
            INSERT INTO "${schemaName}".ticket_field_options (tenant_id, company_id, field_name, option_value, display_label, color_hex, is_default, active)
            VALUES 
              ($1, NULL, 'status', 'new', 'Novo', '#3b82f6', true, true),
              ($1, NULL, 'status', 'open', 'Aberto', '#3b82f6', false, true),
              ($1, NULL, 'status', 'in_progress', 'Em Progresso', '#f59e0b', false, true),
              ($1, NULL, 'status', 'resolved', 'Resolvido', '#10b981', false, true),
              ($1, NULL, 'status', 'closed', 'Fechado', '#6b7280', false, true),
              ($1, NULL, 'priority', 'low', 'Baixa', '#10b981', false, true),
              ($1, NULL, 'priority', 'medium', 'Média', '#f59e0b', true, true),
              ($1, NULL, 'priority', 'high', 'Alta', '#f97316', false, true),
              ($1, NULL, 'priority', 'critical', 'Crítica', '#ef4444', false, true)
            ON CONFLICT (tenant_id, company_id, field_name, option_value) DO NOTHING
          `, [tenantId]);

        } catch (error) {
          console.log(`  ❌ Erro específico ao processar ${tenantId}: ${error.Message}`);
          continue;
        }

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
