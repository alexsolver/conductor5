
import { sql } from 'drizzle-orm';
import { schemaManager } from '../db';

const createCustomFieldsTables = async () => {
  console.log('🔨 Creating custom fields tables...');
  
  const tenants = [
    '715c510a-3db5-4510-880a-9a1a5c320100',
    '78a4c88e-0e85-4f7c-ad92-f472dad50d7a', 
    'cb9056df-d964-43d7-8fd8-b0cc00a72056',
    '3f99462f-3621-4b1b-bea8-782acc50d62e'
  ];

  for (const tenantId of tenants) {
    console.log(`\n🏢 Creating tables for tenant: ${tenantId}`);
    
    try {
      const db = await schemaManager.getConnection(tenantId);
      
      // Create custom_fields_metadata table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS custom_fields_metadata (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          module_type VARCHAR(50) NOT NULL,
          field_name VARCHAR(100) NOT NULL,
          field_type VARCHAR(50) NOT NULL,
          field_label VARCHAR(255) NOT NULL,
          is_required BOOLEAN DEFAULT false,
          validation_rules JSONB DEFAULT '{}',
          field_options JSONB DEFAULT '{}',
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_by UUID,
          updated_by UUID,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, module_type, field_name)
        )
      `);

      // Create custom_fields_values table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS custom_fields_values (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          field_id UUID NOT NULL REFERENCES custom_fields_metadata(id) ON DELETE CASCADE,
          entity_type VARCHAR(50) NOT NULL,
          entity_id UUID NOT NULL,
          field_value JSONB,
          created_by UUID,
          updated_by UUID,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, field_id, entity_type, entity_id)
        )
      `);

      // Create tenant_module_access table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tenant_module_access (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          module_type VARCHAR(50) NOT NULL,
          has_access BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, module_type)
        )
      `);

      // Create indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_custom_fields_metadata_tenant_module 
        ON custom_fields_metadata(tenant_id, module_type)
      `);

      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_custom_fields_values_entity 
        ON custom_fields_values(tenant_id, entity_type, entity_id)
      `);

      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_custom_fields_values_field 
        ON custom_fields_values(field_id)
      `);

      console.log(`✅ Custom fields tables created for tenant: ${tenantId}`);
      
    } catch (error) {
      console.error(`❌ Error creating tables for tenant ${tenantId}:`, error);
    }
  }
  
  console.log('\n✅ Custom fields tables creation completed');
};

// Execute if called directly
if (require.main === module) {
  createCustomFieldsTables().then(() => {
    console.log('Done');
    process.exit(0);
  }).catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
}

export { createCustomFieldsTables };
