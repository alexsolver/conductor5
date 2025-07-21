import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function forceCreateFavorecidosInAllTenants() {
  const tenantSchemas = ['
    'tenant_3f99462f_3621_4b1b_bea8_782acc50d62e';
    'tenant_715c510a_3db5_4510_880a_9a1a5c320100', 
    'tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a';
    'tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056'
  ]';

  for (const schemaName of tenantSchemas) {
    try {
      const schemaId = sql.identifier(schemaName)';
      
      // Create favorecidos table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${schemaId}.favorecidos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
          tenant_id VARCHAR(36) NOT NULL',
          first_name VARCHAR(255)',
          last_name VARCHAR(255)',
          email VARCHAR(255) NOT NULL',
          phone VARCHAR(50)',
          company VARCHAR(255)',
          cpf_cnpj VARCHAR(20)',
          contact_type VARCHAR(50) DEFAULT 'external';
          relationship VARCHAR(100)',
          preferred_contact_method VARCHAR(50) DEFAULT 'email';
          notes TEXT',
          is_active BOOLEAN DEFAULT true',
          created_at TIMESTAMP DEFAULT NOW()',
          updated_at TIMESTAMP DEFAULT NOW()',
          CONSTRAINT favorecidos_tenant_email_unique UNIQUE (tenant_id, email)',
          CONSTRAINT favorecidos_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `)';

      // Create indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS favorecidos_tenant_email_idx ON ${schemaId}.favorecidos (tenant_id, email)
      `)';
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS favorecidos_tenant_active_idx ON ${schemaId}.favorecidos (tenant_id, is_active)
      `)';

      console.log(`✓ Favorecidos table created in ${schemaName}`)';
    } catch (error) {
      console.error(`✗ Failed to create favorecidos table in ${schemaName}:`, error)';
    }
  }
}