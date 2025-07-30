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

      // 2. Dropar tabela existente se houver inconsistência
      await db.execute(`DROP TABLE IF EXISTS "${schemaName}".ticket_field_options CASCADE`);

      // 3. Criar tabela ticket_field_options COM estrutura correta
      await db.execute(`
        CREATE TABLE "${schemaName}".ticket_field_options (
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

      // 4. Adicionar foreign key constraints
      await db.execute(`
        ALTER TABLE "${schemaName}".ticket_field_options 
        ADD CONSTRAINT fk_field_options_config 
        FOREIGN KEY (field_config_id) 
        REFERENCES "${schemaName}".ticket_field_configurations(id) 
        ON DELETE CASCADE
      `);

      // 5. Verificar estrutura completa das tabelas
      const completeCheck = await db.execute(`
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_schema = '${schemaName}' 
        AND table_name IN ('ticket_field_configurations', 'ticket_field_options')
        ORDER BY table_name, ordinal_position
      `);

      console.log(`📋 Estrutura verificada: ${completeCheck.rows.length} colunas nas tabelas de configuração`);

      // 6. Verificar especificamente a coluna field_config_id
      const fieldConfigIdCheck = completeCheck.rows.find(
        row => row.table_name === 'ticket_field_options' && row.column_name === 'field_config_id'
      );

      if (!fieldConfigIdCheck) {
        throw new Error(`CRITICAL: Coluna field_config_id não encontrada na tabela ticket_field_options do schema ${schemaName}`);
      }

      console.log(`✅ Coluna field_config_id verificada: ${fieldConfigIdCheck.data_type} (${fieldConfigIdCheck.is_nullable})`);

      // 7. Adicionar dados de exemplo básicos
      console.log(`🎯 Inserindo configurações básicas para tenant ${tenant.name}...`);

      // Inserir configuração de prioridade
      const priorityConfigResult = await db.execute(`
        INSERT INTO "${schemaName}".ticket_field_configurations 
        (tenant_id, customer_id, field_name, display_name, field_type, is_required, is_system_field, sort_order)
        VALUES ('${tenant.id}', NULL, 'priority', 'Prioridade', 'select', true, true, 1)
        ON CONFLICT (tenant_id, customer_id, field_name) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `);

      if (priorityConfigResult.rows.length > 0) {
        const configId = priorityConfigResult.rows[0].id;

        // Inserir opções de prioridade
        await db.execute(`
          INSERT INTO "${schemaName}".ticket_field_options 
          (tenant_id, customer_id, field_config_id, option_value, display_label, color_hex, sort_order, is_default)
          VALUES 
          ('${tenant.id}', NULL, '${configId}', 'low', 'Baixa', '#10B981', 1, false),
          ('${tenant.id}', NULL, '${configId}', 'medium', 'Média', '#F59E0B', 2, true),
          ('${tenant.id}', NULL, '${configId}', 'high', 'Alta', '#F97316', 3, false),
          ('${tenant.id}', NULL, '${configId}', 'critical', 'Crítica', '#EF4444', 4, false)
          ON CONFLICT (tenant_id, customer_id, field_config_id, option_value) DO NOTHING
        `);

        console.log(`✅ Configurações de prioridade criadas para tenant ${tenant.name}`);
      }

      // 8. Criar índices otimizados para performance
      const indexQueries = [
        {
          name: 'idx_ticket_field_configs_tenant_customer',
          sql: `CREATE INDEX IF NOT EXISTS idx_ticket_field_configs_tenant_customer ON "${schemaName}".ticket_field_configurations(tenant_id, customer_id)`
        },
        {
          name: 'idx_ticket_field_configs_field_name',
          sql: `CREATE INDEX IF NOT EXISTS idx_ticket_field_configs_field_name ON "${schemaName}".ticket_field_configurations(tenant_id, field_name)`
        },
        {
          name: 'idx_ticket_field_options_config_id',
          sql: `CREATE INDEX IF NOT EXISTS idx_ticket_field_options_config_id ON "${schemaName}".ticket_field_options(field_config_id)`
        },
        {
          name: 'idx_ticket_field_options_tenant_customer',
          sql: `CREATE INDEX IF NOT EXISTS idx_ticket_field_options_tenant_customer ON "${schemaName}".ticket_field_options(tenant_id, customer_id)`
        },
        {
          name: 'idx_ticket_field_options_value',
          sql: `CREATE INDEX IF NOT EXISTS idx_ticket_field_options_value ON "${schemaName}".ticket_field_options(tenant_id, option_value)`
        }
      ];

      for (const index of indexQueries) {
        try {
          await db.execute(index.sql);
          console.log(`✅ Índice criado: ${index.name}`);
        } catch (indexError) {
          console.error(`⚠️ Erro ao criar índice ${index.name}:`, indexError.message);
        }
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

// CREATING TICKET METADATA CONFIGURATION TABLES
console.log('🔧 CREATING TICKET METADATA CONFIGURATION TABLES...');

import { db } from '../db.js';
import { ticketFieldConfigurations, ticketFieldOptions } from '../../shared/schema.js';

async function createTicketMetadataConfigTables() {
  console.log('🔧 Creating ticket metadata configuration tables...');

  try {
    // Seed initial configurations with REAL data
    await seedInitialTicketMetadata();

    console.log('✅ Ticket metadata configuration completed');
  } catch (error) {
    console.error('❌ Error creating ticket metadata config:', error);
    throw error;
  }
}

async function seedInitialTicketMetadata() {
  console.log('📦 Seeding ticket metadata with real field options...');

  const tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';

  try {
    // 1. Create Status Field Configuration
    const statusFieldResult = await db.insert(ticketFieldConfigurations).values({
      tenantId,
      customerId: null, // Global configuration
      fieldName: 'status',
      displayName: 'Status',
      description: 'Status do ticket',
      fieldType: 'select',
      isRequired: true,
      isSystemField: true,
      sortOrder: 1,
      isActive: true
    }).returning({ id: ticketFieldConfigurations.id }).onConflictDoNothing();

    if (statusFieldResult.length > 0) {
      const statusFieldId = statusFieldResult[0].id;

      // Status options
      const statusOptions = [
        { value: 'new', label: 'Novo', color: '#3b82f6', sortOrder: 1, isDefault: true },
        { value: 'open', label: 'Aberto', color: '#10b981', sortOrder: 2 },
        { value: 'in_progress', label: 'Em Andamento', color: '#f59e0b', sortOrder: 3 },
        { value: 'pending', label: 'Pendente', color: '#8b5cf6', sortOrder: 4 },
        { value: 'resolved', label: 'Resolvido', color: '#06b6d4', sortOrder: 5 },
        { value: 'closed', label: 'Fechado', color: '#6b7280', sortOrder: 6 }
      ];

      for (const option of statusOptions) {
        await db.insert(ticketFieldOptions).values({
          tenantId,
          customerId: null,
          fieldConfigId: statusFieldId,
          optionValue: option.value,
          displayLabel: option.label,
          colorHex: option.color,
          sortOrder: option.sortOrder,
          isDefault: option.isDefault || false,
          isActive: true
        }).onConflictDoNothing();
      }

      console.log('✅ Status field options seeded successfully');
    }

    // 2. Create Priority Field Configuration
    const priorityFieldResult = await db.insert(ticketFieldConfigurations).values({
      tenantId,
      customerId: null,
      fieldName: 'priority',
      displayName: 'Prioridade',
      description: 'Prioridade do ticket',
      fieldType: 'select',
      isRequired: true,
      isSystemField: true,
      sortOrder: 2,
      isActive: true
    }).returning({ id: ticketFieldConfigurations.id }).onConflictDoNothing();

    if (priorityFieldResult.length > 0) {
      const priorityFieldId = priorityFieldResult[0].id;

      // Priority options
      const priorityOptions = [
        { value: 'low', label: 'Baixa', color: '#10b981', sortOrder: 1 },
        { value: 'medium', label: 'Média', color: '#f59e0b', sortOrder: 2, isDefault: true },
        { value: 'high', label: 'Alta', color: '#ef4444', sortOrder: 3 },
        { value: 'urgent', label: 'Urgente', color: '#dc2626', sortOrder: 4 },
        { value: 'critical', label: 'Crítica', color: '#991b1b', sortOrder: 5 }
      ];

      for (const option of priorityOptions) {
        await db.insert(ticketFieldOptions).values({
          tenantId,
          customerId: null,
          fieldConfigId: priorityFieldId,
          optionValue: option.value,
          displayLabel: option.label,
          colorHex: option.color,
          sortOrder: option.sortOrder,
          isDefault: option.isDefault || false,
          isActive: true
        }).onConflictDoNothing();
      }

      console.log('✅ Priority field options seeded successfully');
    }

    // 3. Create Category Field Configuration
    const categoryFieldResult = await db.insert(ticketFieldConfigurations).values({
      tenantId,
      customerId: null,
      fieldName: 'category',
      displayName: 'Categoria',
      description: 'Categoria do ticket',
      fieldType: 'select',
      isRequired: false,
      isSystemField: true,
      sortOrder: 3,
      isActive: true
    }).returning({ id: ticketFieldConfigurations.id }).onConflictDoNothing();

    if (categoryFieldResult.length > 0) {
      const categoryFieldId = categoryFieldResult[0].id;

      // Category options
      const categoryOptions = [
        { value: 'hardware', label: 'Hardware', color: '#6b7280', sortOrder: 1 },
        { value: 'software', label: 'Software', color: '#3b82f6', sortOrder: 2 },
        { value: 'network', label: 'Rede', color: '#8b5cf6', sortOrder: 3 },
        { value: 'security', label: 'Segurança', color: '#dc2626', sortOrder: 4 },
        { value: 'access', label: 'Acesso', color: '#f59e0b', sortOrder: 5 },
        { value: 'maintenance', label: 'Manutenção', color: '#10b981', sortOrder: 6 },
        { value: 'support', label: 'Suporte', color: '#06b6d4', sortOrder: 7 },
        { value: 'other', label: 'Outros', color: '#9ca3af', sortOrder: 8 }
      ];

      for (const option of categoryOptions) {
        await db.insert(ticketFieldOptions).values({
          tenantId,
          customerId: null,
          fieldConfigId: categoryFieldId,
          optionValue: option.value,
          displayLabel: option.label,
          colorHex: option.color,
          sortOrder: option.sortOrder,
          isDefault: false,
          isActive: true
        }).onConflictDoNothing();
      }

      console.log('✅ Category field options seeded successfully');
    }

    console.log('🎉 All ticket metadata seeded successfully!');
    console.log(`📊 Created configurations for tenant: ${tenantId}`);

  } catch (error) {
    console.error('❌ Error seeding ticket metadata:', error);
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