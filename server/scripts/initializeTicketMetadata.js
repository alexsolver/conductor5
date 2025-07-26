import { Pool } from '@neondatabase/serverless';

const db = new Pool({ connectionString: process.env.DATABASE_URL });

async function initializeTicketMetadata() {
  console.log('🚀 Initializing ticket metadata configuration...');
  
  try {
    // Get a tenant to work with
    const tenantsResult = await db.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' 
      LIMIT 1
    `);
    
    if (tenantsResult.rows.length === 0) {
      console.log('❌ No tenant schemas found');
      return;
    }
    
    const tenantSchema = tenantsResult.rows[0].schema_name;
    const tenantId = tenantSchema.replace('tenant_', '').replace(/_/g, '-');
    
    console.log(`📍 Using tenant: ${tenantId} (schema: ${tenantSchema})`);
    
    // Initialize field configurations
    const fieldConfigs = [
      {
        fieldName: 'priority',
        label: 'Prioridade',
        fieldType: 'select',
        isRequired: true,
        isSystem: true,
        displayOrder: 1
      },
      {
        fieldName: 'urgency',
        label: 'Urgência',
        fieldType: 'select',
        isRequired: true,
        isSystem: true,
        displayOrder: 2
      },
      {
        fieldName: 'impact',
        label: 'Impacto',
        fieldType: 'select',
        isRequired: true,
        isSystem: true,
        displayOrder: 3
      },
      {
        fieldName: 'status',
        label: 'Status',
        fieldType: 'select',
        isRequired: true,
        isSystem: true,
        displayOrder: 4
      },
      {
        fieldName: 'environment',
        label: 'Ambiente',
        fieldType: 'select',
        isRequired: false,
        isSystem: false,
        displayOrder: 5
      },
      {
        fieldName: 'groupField',
        label: 'Grupo',
        fieldType: 'select',
        isRequired: false,
        isSystem: false,
        displayOrder: 6
      },
      {
        fieldName: 'publicationPriority',
        label: 'Prioridade da Publicação',
        fieldType: 'select',
        isRequired: false,
        isSystem: false,
        displayOrder: 7
      }
    ];
    
    // Clear existing configurations
    await db.query(`DELETE FROM ${tenantSchema}.ticket_field_configurations WHERE tenant_id = $1`, [tenantId]);
    await db.query(`DELETE FROM ${tenantSchema}.ticket_field_options WHERE tenant_id = $1`, [tenantId]);
    
    // Insert field configurations
    for (const config of fieldConfigs) {
      await db.query(`
        INSERT INTO ${tenantSchema}.ticket_field_configurations 
        (id, tenant_id, field_name, label, field_type, is_required, is_system, display_order, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
      `, [tenantId, config.fieldName, config.label, config.fieldType, config.isRequired, config.isSystem, config.displayOrder]);
    }
    
    // Define field options
    const fieldOptions = {
      priority: [
        { value: 'low', label: 'Baixa', bgColor: 'bg-green-100', textColor: 'text-green-800' },
        { value: 'medium', label: 'Média', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
        { value: 'high', label: 'Alta', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
        { value: 'critical', label: 'Crítica', bgColor: 'bg-red-100', textColor: 'text-red-800' }
      ],
      urgency: [
        { value: 'low', label: 'Baixa', bgColor: 'bg-green-100', textColor: 'text-green-800' },
        { value: 'medium', label: 'Média', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
        { value: 'high', label: 'Alta', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
        { value: 'critical', label: 'Crítica', bgColor: 'bg-red-100', textColor: 'text-red-800' }
      ],
      impact: [
        { value: 'low', label: 'Baixo', bgColor: 'bg-green-100', textColor: 'text-green-800' },
        { value: 'medium', label: 'Médio', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
        { value: 'high', label: 'Alto', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
        { value: 'critical', label: 'Crítico', bgColor: 'bg-red-100', textColor: 'text-red-800' }
      ],
      status: [
        { value: 'open', label: 'Aberto', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
        { value: 'in_progress', label: 'Em Progresso', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
        { value: 'pending', label: 'Pendente', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
        { value: 'resolved', label: 'Resolvido', bgColor: 'bg-green-100', textColor: 'text-green-800' },
        { value: 'closed', label: 'Fechado', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
      ],
      environment: [
        { value: 'lansolver', label: 'LANSOLVER', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
        { value: 'production', label: 'PRODUÇÃO', bgColor: 'bg-red-100', textColor: 'text-red-800' },
        { value: 'development', label: 'DESENVOLVIMENTO', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
        { value: 'staging', label: 'HOMOLOGAÇÃO', bgColor: 'bg-orange-100', textColor: 'text-orange-800' }
      ],
      groupField: [
        { value: 'infraestrutura', label: 'Infraestrutura', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
        { value: 'desenvolvimento', label: 'Desenvolvimento', bgColor: 'bg-green-100', textColor: 'text-green-800' },
        { value: 'suporte', label: 'Suporte', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
        { value: 'qualidade', label: 'Qualidade', bgColor: 'bg-purple-100', textColor: 'text-purple-800' }
      ],
      publicationPriority: [
        { value: '1-baixa', label: '1 - Baixa - até 7 dias', bgColor: 'bg-green-100', textColor: 'text-green-800' },
        { value: '2-normal', label: '2 - Normal - até 3 dias', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
        { value: '3-alta', label: '3 - Alta - até 1 dia', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
        { value: '4-critica', label: '4 - Crítico - até 30 minutos', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
        { value: '5-emergencial', label: '5 - Emergencial - imediato', bgColor: 'bg-red-100', textColor: 'text-red-800' }
      ]
    };
    
    // Insert field options
    for (const [fieldName, options] of Object.entries(fieldOptions)) {
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        await db.query(`
          INSERT INTO ${tenantSchema}.ticket_field_options 
          (id, tenant_id, field_name, option_value, option_label, bg_color, text_color, sort_order, is_active, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
        `, [tenantId, fieldName, option.value, option.label, option.bgColor, option.textColor, i + 1]);
      }
    }
    
    // Insert default configurations
    const defaultConfigs = [
      { fieldName: 'priority', defaultValue: 'medium' },
      { fieldName: 'urgency', defaultValue: 'medium' },
      { fieldName: 'impact', defaultValue: 'medium' },
      { fieldName: 'status', defaultValue: 'open' },
      { fieldName: 'environment', defaultValue: 'production' },
      { fieldName: 'groupField', defaultValue: 'suporte' },
      { fieldName: 'publicationPriority', defaultValue: '2-normal' }
    ];
    
    for (const config of defaultConfigs) {
      await db.query(`
        INSERT INTO ${tenantSchema}.ticket_default_configurations 
        (id, tenant_id, field_name, default_value, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW())
      `, [tenantId, config.fieldName, config.defaultValue]);
    }
    
    console.log('✅ Ticket metadata initialization completed successfully!');
    console.log(`📊 Initialized:
      - ${fieldConfigs.length} field configurations
      - ${Object.values(fieldOptions).flat().length} field options
      - ${defaultConfigs.length} default configurations`);
    
  } catch (error) {
    console.error('❌ Error initializing ticket metadata:', error);
  } finally {
    await db.end();
  }
}

// Run the initialization
initializeTicketMetadata();