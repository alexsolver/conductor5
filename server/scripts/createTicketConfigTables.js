const { pool } = require('../db');
const fs = require('fs');
const path = require('path');

async function createTicketConfigTables() {
  console.log('🚀 Iniciando criação das tabelas de configuração de tickets...');

  try {
    // Ler o script SQL
    const sqlScript = fs.readFileSync(path.join(__dirname, '../../create_ticket_config_tables.sql'), 'utf8');

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
if (require.main === module) {
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

module.exports = { createTicketConfigTables };