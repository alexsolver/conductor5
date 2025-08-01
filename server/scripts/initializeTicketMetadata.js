// INICIALIZAÇÃO DE CONFIGURAÇÕES DE METADATA DE TICKETS
// Corrige o problema de dropdowns vazios (priority, status, etc.)

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

// Executar usando tsx para processar TypeScript
const tsxScript = `
import { db } from '../db.ts';

async function initializeTicketMetadata() {
  console.log('🚀 INICIANDO CONFIGURAÇÃO DE METADATA DE TICKETS');

  try {
    // Buscar todos os tenants ativos
    const tenants = await db.execute(
        'SELECT id, name FROM public.tenants WHERE is_active = true'
      );

    console.log(\`📊 Encontrados \${tenants.rows.length} tenants ativos\`);

    for (const tenant of tenants.rows) {
      const tenantId = tenant.id;
      const schemaName = \`tenant_\${tenantId.replace(/-/g, '_')}\`;

      console.log(\`🔧 Configurando metadata para tenant: \${tenant.name} (\${tenantId})\`);

      // Verificar se as tabelas de configuração existem
      const configTableExists = await db.execute(\`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '\${schemaName}' 
        AND table_name = 'ticket_field_configurations'
      \`);

      if (configTableExists.rows.length === 0) {
        console.log(\`⚠️ Tabelas de configuração não encontradas para \${schemaName}\`);
        console.log(\`ℹ️ Execute primeiro o script createTicketConfigTables.js\`);
        continue;
      }

      // 1. CONFIGURAÇÕES DE CAMPO - PRIORITY
      await db.execute(\`
        INSERT INTO "\${schemaName}".ticket_field_configurations 
        (id, tenant_id, customer_id, field_name, display_name, field_type, is_required, is_system_field, sort_order, is_active)
        VALUES 
        (gen_random_uuid(), '\${tenantId}', NULL, 'priority', 'Prioridade', 'select', true, true, 1, true)
        ON CONFLICT (tenant_id, customer_id, field_name) DO NOTHING
      \`);

      // 2. OPÇÕES DE PRIORIDADE
      const priorityOptions = [
        { value: 'low', label: 'Baixa', color: '#10b981', order: 1 },
        { value: 'medium', label: 'Média', color: '#f59e0b', order: 2 },
        { value: 'high', label: 'Alta', color: '#ef4444', order: 3 },
        { value: 'urgent', label: 'Urgente', color: '#dc2626', order: 4 },
        { value: 'critical', label: 'Crítica', color: '#991b1b', order: 5 }
      ];

      for (const option of priorityOptions) {
        await db.execute(\`
          INSERT INTO "\${schemaName}".ticket_field_options 
          (id, tenant_id, customer_id, field_config_id, option_value, display_label, color_hex, sort_order, is_default, is_active)
          SELECT 
            gen_random_uuid(), 
            '\${tenantId}', 
            NULL, 
            tfc.id, 
            '\${option.value}', 
            '\${option.label}', 
            '\${option.color}', 
            \${option.order}, 
            \${option.value === 'medium'}, 
            true
          FROM "\${schemaName}".ticket_field_configurations tfc 
          WHERE tfc.field_name = 'priority' AND tfc.customer_id IS NULL
          ON CONFLICT (tenant_id, customer_id, field_config_id, option_value) DO NOTHING
        \`);
      }

      // 3. CONFIGURAÇÕES DE CAMPO - STATUS  
      await db.execute(\`
        INSERT INTO "\${schemaName}".ticket_field_configurations 
        (id, tenant_id, customer_id, field_name, display_name, field_type, is_required, is_system_field, sort_order, is_active)
        VALUES 
        (gen_random_uuid(), '\${tenantId}', NULL, 'status', 'Status', 'select', true, true, 2, true)
        ON CONFLICT (tenant_id, customer_id, field_name) DO NOTHING
      \`);

      // 4. OPÇÕES DE STATUS
      const statusOptions = [
        { value: 'new', label: 'Novo', color: '#3b82f6', order: 1 },
        { value: 'open', label: 'Aberto', color: '#10b981', order: 2 },
        { value: 'in_progress', label: 'Em Andamento', color: '#f59e0b', order: 3 },
        { value: 'pending', label: 'Pendente', color: '#8b5cf6', order: 4 },
        { value: 'resolved', label: 'Resolvido', color: '#059669', order: 5 },
        { value: 'closed', label: 'Fechado', color: '#6b7280', order: 6 }
      ];

      for (const option of statusOptions) {
        await db.execute(\`
          INSERT INTO "\${schemaName}".ticket_field_options 
          (id, tenant_id, customer_id, field_config_id, option_value, display_label, color_hex, sort_order, is_default, is_active)
          SELECT 
            gen_random_uuid(), 
            '\${tenantId}', 
            NULL, 
            tfc.id, 
            '\${option.value}', 
            '\${option.label}', 
            '\${option.color}', 
            \${option.order}, 
            \${option.value === 'new'}, 
            true
          FROM "\${schemaName}".ticket_field_configurations tfc 
          WHERE tfc.field_name = 'status' AND tfc.customer_id IS NULL
          ON CONFLICT (tenant_id, customer_id, field_config_id, option_value) DO NOTHING
        \`);
      }

      console.log(\`✅ Metadata configurada para tenant \${tenant.name}\`);
    }

    console.log('🎉 CONFIGURAÇÃO DE METADATA CONCLUÍDA COM SUCESSO!');
    console.log('✅ Todas as opções de priority e status foram criadas');
    console.log('✅ Dropdowns agora devem funcionar corretamente');

  } catch (error) {
    console.error('❌ ERRO ao configurar metadata:', error);
    throw error;
  }
}

// Executar se chamado diretamente
initializeTicketMetadata()
  .then(() => {
    console.log('✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na execução:', error);
    process.exit(1);
  });
`;

// Criar arquivo temporário e executar com tsx
import { writeFileSync, unlinkSync } from 'fs';
const tempFile = join(__dirname, 'temp-initialize-metadata.ts');

try {
  writeFileSync(tempFile, tsxScript);
  execSync(`npx tsx ${tempFile}`, { 
    stdio: 'inherit', 
    cwd: projectRoot 
  });
} finally {
  try {
    unlinkSync(tempFile);
  } catch (e) {
    // Ignore cleanup errors
  }
}
// Adicionar configurações para novos campos
const additionalFieldConfigurations = [
  {
    tenant_id: tenantId,
    customer_id: '00000000-0000-0000-0000-000000000001',
    field_name: 'environment',
    display_name: 'Ambiente',
    description: 'Ambiente onde o problema ocorreu',
    field_type: 'select',
    is_required: false,
    is_system_field: false,
    sort_order: 15,
    is_active: true
  },
  {
    tenant_id: tenantId,
    customer_id: '00000000-0000-0000-0000-000000000001',
    field_name: 'linkType',
    display_name: 'Tipo de Relacionamento',
    description: 'Tipo de relacionamento entre tickets',
    field_type: 'select',
    is_required: false,
    is_system_field: false,
    sort_order: 16,
    is_active: true
  }
];

// Opções para environment
const environmentOptions = [
  { value: 'production', label: 'Produção', color: '#dc2626', sort_order: 1 },
  { value: 'staging', label: 'Homologação', color: '#f59e0b', sort_order: 2 },
  { value: 'development', label: 'Desenvolvimento', color: '#10b981', sort_order: 3 },
  { value: 'testing', label: 'Teste', color: '#3b82f6', sort_order: 4 }
];

// Opções para linkType
const linkTypeOptions = [
  { value: 'relates_to', label: 'Relaciona-se com', color: '#6b7280', sort_order: 1 },
  { value: 'blocks', label: 'Bloqueia', color: '#dc2626', sort_order: 2 },
  { value: 'blocked_by', label: 'Bloqueado por', color: '#f59e0b', sort_order: 3 },
  { value: 'duplicates', label: 'Duplica', color: '#9333ea', sort_order: 4 },
  { value: 'caused_by', label: 'Causado por', color: '#ef4444', sort_order: 5 }
];
