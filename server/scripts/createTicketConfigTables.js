
import { pool } from '../db.ts';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createTicketConfigTables() {
  console.log('🚀 Iniciando criação das tabelas de configuração de tickets...');

  try {
    // Ler o script SQL
    const sqlScript = readFileSync(join(__dirname, '../../create_ticket_config_tables.sql'), 'utf8');

    // Buscar todos os tenants
    const tenantsResult = await pool.query('SELECT id FROM public.tenants');
    const tenants = tenantsResult.rows;

    console.log(`📋 Encontrados ${tenants.length} tenants para processar`);

    for (const tenant of tenants) {
      const tenantId = tenant.id;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      console.log(`\n🔧 Processando tenant: ${tenantId}`);
      console.log(`📁 Schema: ${schemaName}`);

      try {
        // Verificar se o schema existe
        const schemaCheck = await pool.query(
          `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
          [schemaName]
        );

        if (schemaCheck.rows.length === 0) {
          console.log(`⚠️  Schema ${schemaName} não existe, pulando...`);
          continue;
        }

        // Definir o search_path para o schema do tenant
        await pool.query(`SET search_path TO "${schemaName}", public`);

        // Executar o script SQL
        await pool.query(sqlScript);

        console.log(`✅ Tabelas criadas com sucesso para o tenant ${tenantId}`);

        // Verificar quais tabelas foram criadas
        const tablesResult = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name LIKE 'ticket_%'
          ORDER BY table_name
        `, [schemaName]);

        console.log(`📊 Tabelas criadas: ${tablesResult.rows.map(r => r.table_name).join(', ')}`);

      } catch (tenantError) {
        console.error(`❌ Erro ao processar tenant ${tenantId}:`, tenantError.message);
      }
    }

    // Resetar search_path
    await pool.query('SET search_path TO public');

    console.log('\n🎉 Criação das tabelas de configuração de tickets concluída!');

  } catch (error) {
    console.error('💥 Erro geral na criação das tabelas:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createTicketConfigTables()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução do script:', error);
      process.exit(1);
    });
}

export { createTicketConfigTables };
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

      // 2. Criar tabela ticket_field_options
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
          CONSTRAINT fk_field_config FOREIGN KEY (field_config_id) REFERENCES "${schemaName}".ticket_field_configurations(id) ON DELETE CASCADE,
          CONSTRAINT unique_option_per_field UNIQUE(tenant_id, customer_id, field_config_id, option_value)
        )
      `);

      // 3. Criar índices para performance
      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_ticket_field_configs_tenant_customer 
        ON "${schemaName}".ticket_field_configurations(tenant_id, customer_id)
      `);

      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_ticket_field_options_config_id 
        ON "${schemaName}".ticket_field_options(field_config_id)
      `);

      console.log(`✅ Tabelas criadas para tenant ${tenant.name}`);
    }

    console.log('🎉 TODAS AS TABELAS DE CONFIGURAÇÃO FORAM CRIADAS!');
    console.log('✅ Agora você pode executar initializeTicketMetadata.js');

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
