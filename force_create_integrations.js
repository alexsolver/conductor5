
import pkg from 'pg';
const { Client } = pkg;

async function forceCreateIntegrationsInAllTenants() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  await client.connect();

  const tenantSchemas = [
    { schema: 'tenant_715c510a_3db5_4510_880a_9a1a5c320100', tenantId: '715c510a-3db5-4510-880a-9a1a5c320100' },
    { schema: 'tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a', tenantId: '78a4c88e-0e85-4f7c-ad92-f472dad50d7a' },
    { schema: 'tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056', tenantId: 'cb9056df-d964-43d7-8fd8-b0cc00a72056' }
  ];

  for (const { schema, tenantId } of tenantSchemas) {
    try {
      console.log(`Creating integrations table in ${schema}...`);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".integrations (
          id VARCHAR(255) PRIMARY KEY,
          tenant_id VARCHAR(36) NOT NULL DEFAULT '${tenantId}',
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          icon VARCHAR(100),
          status VARCHAR(50) DEFAULT 'disconnected',
          config JSONB DEFAULT '{}',
          features TEXT[],
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT integrations_tenant_id_format CHECK (LENGTH(tenant_id) = 36)
        )
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS integrations_tenant_category_idx ON "${schema}".integrations (tenant_id, category)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS integrations_tenant_status_idx ON "${schema}".integrations (tenant_id, status)
      `);

      console.log(`✓ Integrations table created in ${schema}`);

      // Create IMAP integration
      console.log(`Creating IMAP integration in ${schema}...`);
      const integrationId = 'imap-email-integration';
      
      try {
        const configData = JSON.stringify({
          emailAddress: "alexsolver@gmail.com",
          password: "cyyj vare pmjh scur", 
          imapServer: "imap.gmail.com",
          imapPort: 993,
          imapSecurity: "SSL/TLS",
          smtpServer: "smtp.gmail.com",
          smtpPort: 587,
          smtpSecurity: "STARTTLS",
          useSSL: true,
          autoSync: true,
          isActive: true,
          configured: true,
          lastSync: new Date().toISOString()
        });

        // Use PostgreSQL array literal format for TEXT[] - NOT JSON string
        await client.query(`
          INSERT INTO "${schema}".integrations (id, tenant_id, name, description, category, icon, status, config, features, created_at, updated_at)
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, ARRAY['emails', 'calendar', 'contacts'], NOW(), NOW()
          ) ON CONFLICT (id) DO UPDATE SET
            tenant_id = $2,
            name = $3,
            description = $4,
            category = $5,
            icon = $6,
            status = $7,
            config = $8,
            features = ARRAY['emails', 'calendar', 'contacts'],
            updated_at = NOW()
        `, [
          integrationId,
          tenantId,
          'IMAP Email',
          'Gmail IMAP Integration with real credentials',
          'communication',
          'email-icon',
          'connected',
          configData
        ]);
        console.log(`✓ IMAP integration created in ${schema}`);
      } catch (error) {
        console.error(`✗ Failed to create/update IMAP integration in ${schema}:`, error.message);
      }

    } catch (error) {
      console.error(`✗ Failed to create integrations table in ${schema}:`, error.message);
    }
  }

  await client.end();
}

forceCreateIntegrationsInAllTenants().catch(console.error);
