
import { pool } from '../db.ts';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrateTicketConfigTables() {
  console.log('🚀 Iniciando migração das tabelas de configuração de tickets...');

  try {
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

        // Adicionar coluna company_id às tabelas existentes se necessário
        console.log(`📝 Adicionando coluna company_id às tabelas existentes...`);

        // Lista de tabelas que precisam da coluna company_id
        const tables = [
          'ticket_categories',
          'ticket_subcategories', 
          'ticket_actions',
          'ticket_field_options',
          'ticket_numbering_config'
        ];

        for (const tableName of tables) {
          // Verificar se a tabela existe
          const tableExists = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = $2
          `, [schemaName, tableName]);

          if (tableExists.rows.length > 0) {
            // Verificar se a coluna company_id já existe
            const columnExists = await pool.query(`
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_schema = $1 AND table_name = $2 AND column_name = 'company_id'
            `, [schemaName, tableName]);

            if (columnExists.rows.length === 0) {
              // Adicionar a coluna company_id
              await pool.query(`ALTER TABLE "${schemaName}".${tableName} ADD COLUMN company_id UUID NOT NULL DEFAULT gen_random_uuid()`);
              console.log(`✅ Coluna company_id adicionada à tabela ${tableName}`);
            } else {
              console.log(`ℹ️  Coluna company_id já existe na tabela ${tableName}`);
            }
          }
        }

        // Agora executar o script de criação das tabelas (que criará apenas as que não existem)
        const sqlScript = readFileSync(join(__dirname, '../../create_ticket_config_tables.sql'), 'utf8');
        await pool.query(sqlScript);

        console.log(`✅ Migração concluída para o tenant ${tenantId}`);

        // Verificar quais tabelas foram processadas
        const tablesResult = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name LIKE 'ticket_%'
          ORDER BY table_name
        `, [schemaName]);

        console.log(`📊 Tabelas processadas: ${tablesResult.rows.map(r => r.table_name).join(', ')}`);

      } catch (tenantError) {
        console.error(`❌ Erro ao processar tenant ${tenantId}:`, tenantError.message);
      }
    }

    // Resetar search_path
    await pool.query('SET search_path TO public');

    console.log('\n🎉 Migração das tabelas de configuração de tickets concluída!');

  } catch (error) {
    console.error('💥 Erro geral na migração das tabelas:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateTicketConfigTables()
    .then(() => {
      console.log('✅ Script de migração executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução do script de migração:', error);
      process.exit(1);
    });
}

export { migrateTicketConfigTables };
