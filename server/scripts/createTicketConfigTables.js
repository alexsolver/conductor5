
/**
 * Script para criar tabelas de configuração hierárquica de tickets
 * em todos os schemas de tenant existentes
 */

import { db } from '../db.js';
import fs from 'fs/promises';
import path from 'path';

async function createTicketConfigTables() {
  console.log('🚀 Criando tabelas de configuração de tickets...');
  
  try {
    // Ler o script SQL
    const sqlScript = await fs.readFile(path.join(process.cwd(), 'create_ticket_config_tables.sql'), 'utf8');
    
    // Obter lista de schemas de tenant
    const tenantsResult = await db.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
    `);
    
    if (tenantsResult.rows.length === 0) {
      console.log('❌ Nenhum schema de tenant encontrado');
      return;
    }
    
    console.log(`📍 Encontrados ${tenantsResult.rows.length} schemas de tenant`);
    
    // Executar script em cada tenant
    for (const tenant of tenantsResult.rows) {
      const schemaName = tenant.schema_name;
      const tenantId = schemaName.replace('tenant_', '').replace(/_/g, '-');
      
      console.log(`\n🔧 Processando tenant: ${tenantId} (schema: ${schemaName})`);
      
      try {
        // Modificar o script para usar o schema correto
        const schemaSpecificScript = sqlScript.replace(/CREATE TABLE IF NOT EXISTS /g, `CREATE TABLE IF NOT EXISTS "${schemaName}".`);
        const schemaSpecificScript2 = schemaSpecificScript.replace(/CREATE INDEX IF NOT EXISTS /g, `CREATE INDEX IF NOT EXISTS `);
        const finalScript = schemaSpecificScript2.replace(/COMMENT ON TABLE /g, `COMMENT ON TABLE "${schemaName}".`);
        
        // Executar o script
        await db.query(finalScript);
        
        console.log(`✅ Tabelas criadas com sucesso para tenant ${tenantId}`);
        
        // Verificar se as tabelas foram criadas
        const tablesResult = await db.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name LIKE 'ticket_%'
          ORDER BY table_name
        `, [schemaName]);
        
        console.log(`📊 Tabelas criadas: ${tablesResult.rows.map(t => t.table_name).join(', ')}`);
        
      } catch (error) {
        console.error(`❌ Erro ao processar tenant ${tenantId}:`, error.message);
        continue;
      }
    }
    
    console.log('\n✅ Processo de criação de tabelas concluído!');
    
    // Inserir dados de exemplo
    await insertSampleData();
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    process.exit(0);
  }
}

async function insertSampleData() {
  console.log('\n🎯 Inserindo dados de exemplo...');
  
  try {
    // Obter primeiro tenant e primeira empresa para dados de exemplo
    const tenantResult = await db.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      LIMIT 1
    `);
    
    if (tenantResult.rows.length === 0) return;
    
    const schemaName = tenantResult.rows[0].schema_name;
    const tenantId = schemaName.replace('tenant_', '').replace(/_/g, '-');
    
    // Obter primeira empresa cliente
    const companyResult = await db.query(`
      SELECT id FROM "${schemaName}".customer_companies 
      LIMIT 1
    `);
    
    if (companyResult.rows.length === 0) {
      console.log('⚠️ Nenhuma empresa cliente encontrada para dados de exemplo');
      return;
    }
    
    const companyId = companyResult.rows[0].id;
    console.log(`📍 Usando empresa: ${companyId}`);
    
    // Inserir categorias de exemplo
    const categories = [
      { id: 'cat1', name: 'Incidente', description: 'Problemas que afetam o funcionamento', color: '#ef4444' },
      { id: 'cat2', name: 'Requisição', description: 'Solicitações de serviços', color: '#3b82f6' },
      { id: 'cat3', name: 'Mudança', description: 'Alterações no ambiente', color: '#f59e0b' }
    ];
    
    for (const cat of categories) {
      await db.query(`
        INSERT INTO "${schemaName}".ticket_categories 
        (id, tenant_id, company_id, name, description, color, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [cat.id, tenantId, companyId, cat.name, cat.description, cat.color, categories.indexOf(cat) + 1]);
    }
    
    // Inserir subcategorias de exemplo
    const subcategories = [
      { id: 'sub1', categoryId: 'cat1', name: 'Sistema Indisponível', color: '#dc2626' },
      { id: 'sub2', categoryId: 'cat1', name: 'Lentidão', color: '#ef4444' },
      { id: 'sub3', categoryId: 'cat2', name: 'Acesso', color: '#2563eb' },
      { id: 'sub4', categoryId: 'cat2', name: 'Instalação', color: '#3b82f6' }
    ];
    
    for (const sub of subcategories) {
      await db.query(`
        INSERT INTO "${schemaName}".ticket_subcategories 
        (id, tenant_id, category_id, name, color, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [sub.id, tenantId, sub.categoryId, sub.name, sub.color, subcategories.indexOf(sub) + 1]);
    }
    
    // Inserir ações de exemplo
    const actions = [
      { subcategoryId: 'sub1', name: 'Reiniciar Serviço', time: 15 },
      { subcategoryId: 'sub1', name: 'Verificar Logs', time: 30 },
      { subcategoryId: 'sub3', name: 'Criar Usuário', time: 10 },
      { subcategoryId: 'sub3', name: 'Resetar Senha', time: 5 }
    ];
    
    for (const action of actions) {
      const actionId = `act${actions.indexOf(action) + 1}`;
      await db.query(`
        INSERT INTO "${schemaName}".ticket_actions 
        (id, tenant_id, subcategory_id, name, estimated_time_minutes, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [actionId, tenantId, action.subcategoryId, action.name, action.time, actions.indexOf(action) + 1]);
    }
    
    // Inserir opções de campo de exemplo
    const fieldOptions = [
      // Status
      { field: 'status', value: 'new', label: 'Novo', color: '#6b7280', default: true },
      { field: 'status', value: 'open', label: 'Aberto', color: '#3b82f6' },
      { field: 'status', value: 'in_progress', label: 'Em Andamento', color: '#f59e0b' },
      { field: 'status', value: 'resolved', label: 'Resolvido', color: '#10b981' },
      { field: 'status', value: 'closed', label: 'Fechado', color: '#6b7280' },
      
      // Priority
      { field: 'priority', value: 'low', label: 'Baixa', color: '#10b981' },
      { field: 'priority', value: 'medium', label: 'Média', color: '#f59e0b', default: true },
      { field: 'priority', value: 'high', label: 'Alta', color: '#ef4444' },
      { field: 'priority', value: 'critical', label: 'Crítica', color: '#dc2626' },
      
      // Impact
      { field: 'impact', value: 'low', label: 'Baixo', color: '#10b981', default: true },
      { field: 'impact', value: 'medium', label: 'Médio', color: '#f59e0b' },
      { field: 'impact', value: 'high', label: 'Alto', color: '#ef4444' },
      
      // Urgency
      { field: 'urgency', value: 'low', label: 'Baixa', color: '#10b981', default: true },
      { field: 'urgency', value: 'medium', label: 'Média', color: '#f59e0b' },
      { field: 'urgency', value: 'high', label: 'Alta', color: '#ef4444' }
    ];
    
    for (const option of fieldOptions) {
      const optionId = `opt_${option.field}_${option.value}`;
      await db.query(`
        INSERT INTO "${schemaName}".ticket_field_options 
        (id, tenant_id, company_id, field_name, value, display_label, color, is_default, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (tenant_id, company_id, field_name, value) DO NOTHING
      `, [
        optionId, tenantId, companyId, option.field, option.value, 
        option.label, option.color, option.default || false, fieldOptions.indexOf(option) + 1
      ]);
    }
    
    // Inserir configuração de numeração de exemplo
    await db.query(`
      INSERT INTO "${schemaName}".ticket_numbering_config 
      (tenant_id, company_id, prefix, year_format, sequential_digits, separator, reset_yearly)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (tenant_id, company_id) DO NOTHING
    `, [tenantId, companyId, 'T', '4', 6, '-', true]);
    
    // Inserir regras de validação de exemplo
    const validationRules = [
      { field: 'subject', required: true, message: 'Assunto é obrigatório' },
      { field: 'description', required: true, message: 'Descrição é obrigatória' },
      { field: 'priority', required: true, default: 'medium' },
      { field: 'impact', required: true, default: 'low' }
    ];
    
    for (const rule of validationRules) {
      const ruleId = `rule_${rule.field}`;
      await db.query(`
        INSERT INTO "${schemaName}".ticket_validation_rules 
        (id, tenant_id, company_id, field_name, is_required, error_message, default_value)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (tenant_id, company_id, field_name) DO NOTHING
      `, [ruleId, tenantId, companyId, rule.field, rule.required, rule.message, rule.default]);
    }
    
    console.log('✅ Dados de exemplo inseridos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inserir dados de exemplo:', error);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createTicketConfigTables();
}

export { createTicketConfigTables };
