
import { pool } from '../db.ts';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function smartMigrateTicketConfigTables() {
  console.log('🚀 Iniciando migração inteligente das tabelas de configuração de tickets...');

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

        // 1. Primeiro, vamos dropar todas as tabelas de configuração existentes que podem estar incompletas
        console.log(`🗑️ Removendo tabelas de configuração antigas...`);
        
        const tablesToDrop = [
          'ticket_categories',
          'ticket_subcategories', 
          'ticket_actions',
          'ticket_field_options',
          'ticket_numbering_config',
          'ticket_validation_rules'
        ];

        for (const tableName of tablesToDrop) {
          try {
            await pool.query(`DROP TABLE IF EXISTS "${schemaName}".${tableName} CASCADE`);
            console.log(`✅ Tabela ${tableName} removida`);
          } catch (dropError) {
            console.log(`ℹ️  Tabela ${tableName} não existia ou já foi removida`);
          }
        }

        // 2. Agora executar o script de criação limpo
        console.log(`📝 Criando tabelas de configuração atualizadas...`);
        
        // Ler e executar o script SQL de criação
        const sqlScript = readFileSync(join(__dirname, '../../create_ticket_config_tables.sql'), 'utf8');
        await pool.query(sqlScript);

        console.log(`✅ Migração concluída para o tenant ${tenantId}`);

        // Verificar quais tabelas foram criadas
        const tablesResult = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name LIKE 'ticket_%'
          ORDER BY table_name
        `, [schemaName]);

        console.log(`📊 Tabelas criadas: ${tablesResult.rows.map(r => r.table_name).join(', ')}`);

        // 3. Inserir dados padrão básicos para o tenant
        console.log(`🎯 Inserindo configurações padrão...`);
        
        // Inserir categorias padrão
        await pool.query(`
          INSERT INTO "${schemaName}".ticket_categories (tenant_id, company_id, name, description, color, active)
          VALUES 
            ($1, gen_random_uuid(), 'Suporte Técnico', 'Problemas técnicos e suporte', '#3b82f6', true),
            ($1, gen_random_uuid(), 'Solicitações', 'Solicitações de serviços', '#10b981', true),
            ($1, gen_random_uuid(), 'Incidentes', 'Incidentes e problemas críticos', '#ef4444', true)
          ON CONFLICT DO NOTHING
        `, [tenantId]);

        // Inserir opções de campo padrão
        await pool.query(`
          INSERT INTO "${schemaName}".ticket_field_options (tenant_id, company_id, field_name, value, display_label, color, is_default, active)
          VALUES 
            ($1, gen_random_uuid(), 'priority', 'low', 'Baixa', '#10b981', false, true),
            ($1, gen_random_uuid(), 'priority', 'medium', 'Média', '#f59e0b', true, true),
            ($1, gen_random_uuid(), 'priority', 'high', 'Alta', '#f97316', false, true),
            ($1, gen_random_uuid(), 'priority', 'critical', 'Crítica', '#ef4444', false, true),
            ($1, gen_random_uuid(), 'status', 'new', 'Novo', '#3b82f6', true, true),
            ($1, gen_random_uuid(), 'status', 'open', 'Aberto', '#3b82f6', false, true),
            ($1, gen_random_uuid(), 'status', 'in_progress', 'Em Progresso', '#f59e0b', false, true),
            ($1, gen_random_uuid(), 'status', 'resolved', 'Resolvido', '#10b981', false, true),
            ($1, gen_random_uuid(), 'status', 'closed', 'Fechado', '#6b7280', false, true),
            ($1, gen_random_uuid(), 'impact', 'low', 'Baixo', '#10b981', true, true),
            ($1, gen_random_uuid(), 'impact', 'medium', 'Médio', '#f59e0b', false, true),
            ($1, gen_random_uuid(), 'impact', 'high', 'Alto', '#ef4444', false, true),
            ($1, gen_random_uuid(), 'urgency', 'low', 'Baixa', '#10b981', true, true),
            ($1, gen_random_uuid(), 'urgency', 'medium', 'Média', '#f59e0b', false, true),
            ($1, gen_random_uuid(), 'urgency', 'high', 'Alta', '#ef4444', false, true)
          ON CONFLICT DO NOTHING
        `, [tenantId]);

        // Inserir configuração de numeração padrão
        await pool.query(`
          INSERT INTO "${schemaName}".ticket_numbering_config (tenant_id, company_id, prefix, year_format, sequential_digits, separator, reset_yearly)
          VALUES ($1, gen_random_uuid(), 'TK', '4', 6, '-', true)
          ON CONFLICT DO NOTHING
        `, [tenantId]);

        console.log(`🎉 Configurações padrão inseridas para o tenant ${tenantId}`);

      } catch (tenantError) {
        console.error(`❌ Erro ao processar tenant ${tenantId}:`, tenantError.message);
        console.error(`💡 Stack trace:`, tenantError.stack);
      }
    }

    // Resetar search_path
    await pool.query('SET search_path TO public');

    console.log('\n🎉 Migração inteligente das tabelas de configuração de tickets concluída!');
    console.log('✅ Todas as tabelas foram recriadas com estrutura consistente');
    console.log('🎯 Dados padrão foram inseridos em todos os tenants');

  } catch (error) {
    console.error('💥 Erro geral na migração inteligente das tabelas:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  smartMigrateTicketConfigTables()
    .then(() => {
      console.log('✅ Script de migração inteligente executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução do script de migração inteligente:', error);
      process.exit(1);
    });
}

export { smartMigrateTicketConfigTables };
