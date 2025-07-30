
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

      // 3. Adicionar foreign key constraint APÓS criar ambas as tabelas
      await db.execute(`
        DO $$ 
        BEGIN
          -- Verificar se a constraint já existe
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_field_config' 
            AND table_schema = '${schemaName}' 
            AND table_name = 'ticket_field_options'
          ) THEN
            ALTER TABLE "${schemaName}".ticket_field_options 
            ADD CONSTRAINT fk_field_config 
            FOREIGN KEY (field_config_id) 
            REFERENCES "${schemaName}".ticket_field_configurations(id) 
            ON DELETE CASCADE;
          END IF;
        END $$;
      `);

      // 4. Criar índices para performance (somente APÓS as tabelas estarem completas)
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
