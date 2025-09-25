
import { Pool } from 'pg';

const createOmniBridgeSettingsTables = async () => {
  console.log('🔧 [OMNIBRIDGE-SETTINGS] Creating settings tables...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

  try {
    // Get list of tenant schemas
    const tenantSchemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
    `);

    console.log(`🏢 [OMNIBRIDGE-SETTINGS] Found ${tenantSchemasResult.rows.length} tenant schemas`);

    for (const row of tenantSchemasResult.rows) {
      const schemaName = row.schema_name;
      console.log(`🔧 [OMNIBRIDGE-SETTINGS] Creating settings table in schema: ${schemaName}`);

      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS ${schemaName}.omnibridge_settings (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(36) NOT NULL,
            channels JSONB NOT NULL DEFAULT '[]'::jsonb,
            filters JSONB NOT NULL DEFAULT '{}'::jsonb,
            search JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
          )
        `);

        console.log(`✅ [OMNIBRIDGE-SETTINGS] Created settings table in ${schemaName}`);
      } catch (error) {
        console.error(`❌ [OMNIBRIDGE-SETTINGS] Error creating table in ${schemaName}:`, error);
      }
    }

    console.log('✅ [OMNIBRIDGE-SETTINGS] All settings tables created successfully');
  } catch (error) {
    console.error('❌ [OMNIBRIDGE-SETTINGS] Error creating settings tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createOmniBridgeSettingsTables()
    .then(() => {
      console.log('🏁 [OMNIBRIDGE-SETTINGS] Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 [OMNIBRIDGE-SETTINGS] Script failed:', error);
      process.exit(1);
    });
}

export { createOmniBridgeSettingsTables };
