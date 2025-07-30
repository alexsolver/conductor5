import { db } from '../db.ts';

async function createTicketConfigTables() {
  console.log('🚀 CRIANDO TABELAS DE CONFIGURAÇÃO DE TICKETS');

  try {
    // Buscar todos os tenants ativos
    const tenants = await db.execute(
      'SELECT id, name FROM public.tenants WHERE is_active = true'
    );

    console.log(`📊 Encontrados ${tenants.rows.length} tenants ativos`);

    for (const tenant of tenants.rows) {
      const tenantId = tenant.id;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      console.log(`🔧 Criando tabelas para tenant: ${tenant.name} (${tenantId})`);

      // 1. Criar tabela ticket_field_configurations
      await db.execute(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".ticket_field_configurations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          customer_id UUID NULL,
          field_name VARCHAR(100) NOT NULL,
          display_name VARCHAR(200) NOT NULL,  
          field_type VARCHAR(50) NOT NULL,
          is_required BOOLEAN DEFAULT false,
          is_system_field BOOLEAN DEFAULT false,
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          field_config JSONB NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_field_per_tenant_customer UNIQUE(tenant_id, customer_id, field_name)
        )
      `);

      // 2. Criar tabela ticket_field_options COM a coluna field_config_id
      await db.execute(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".ticket_field_options (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          customer_id UUID NULL,
          field_config_id UUID NOT NULL,
          option_value VARCHAR(100) NOT NULL,
          display_label VARCHAR(200) NOT NULL,
          color_hex VARCHAR(7) NULL,
          sort_order INTEGER DEFAULT 0,
          is_default BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          option_config JSONB NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_option_per_field UNIQUE(tenant_id, customer_id, field_config_id, option_value)
        )
      `);

      // 3. Verificar se as tabelas foram criadas corretamente
      console.log(`📋 Verificando estrutura das tabelas para tenant ${tenant.name}...`);

      const tableCheck = await db.execute(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = '${schemaName}' 
        AND table_name IN ('ticket_field_configurations', 'ticket_field_options')
        ORDER BY table_name, ordinal_position
      `);

      console.log(`📊 Tabelas criadas: ${tableCheck.rows.length} colunas encontradas`);

      // 4. Verificar se as colunas necessárias existem antes de criar índices
      const columnCheck = await db.execute(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = '${schemaName}' 
        AND table_name = 'ticket_field_options' 
        AND column_name = 'field_config_id'
      `);

      if (columnCheck.rows.length === 0) {
        throw new Error(`Coluna field_config_id não encontrada na tabela ticket_field_options do schema ${schemaName}`);
      }

      console.log(`✅ Coluna field_config_id verificada para tenant ${tenant.name}`);

      // 5. Criar índices para performance (somente APÓS verificar que as colunas existem)
      try {
        await db.execute(`
          CREATE INDEX IF NOT EXISTS idx_ticket_field_configs_tenant_customer 
          ON "${schemaName}".ticket_field_configurations(tenant_id, customer_id)
        `);

        await db.execute(`
          CREATE INDEX IF NOT EXISTS idx_ticket_field_options_config_id 
          ON "${schemaName}".ticket_field_options(field_config_id)
        `);

        await db.execute(`
          CREATE INDEX IF NOT EXISTS idx_ticket_field_options_tenant_customer 
          ON "${schemaName}".ticket_field_options(tenant_id, customer_id)
        `);

        console.log(`✅ Índices criados para tenant ${tenant.name}`);
      } catch (indexError) {
        console.error(`⚠️ Erro ao criar índices para tenant ${tenant.name}:`, indexError.message);
        // Continuar com o próximo tenant mesmo se houver erro nos índices
      }

      console.log(`✅ Tabelas criadas para tenant ${tenant.name}`);
    }

    console.log('🎉 TODAS AS TABELAS DE CONFIGURAÇÃO FORAM CRIADAS!');
    console.log('✅ Agora você pode executar initializeTicketMetadata.ts');

  } catch (error) {
    console.error('❌ ERRO ao criar tabelas:', error);
    throw error;
  }
}

// Executar se chamado diretamente
createTicketConfigTables()
  .then(() => {
    console.log('✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na execução:', error);
    process.exit(1);
  });