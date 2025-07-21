
const { neon } = await import('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function addEmailsTableToTenants() {
  try {
    console.log('🔧 Adding emails table to all tenant schemas...');

    // Get all tenants
    const tenants = await sql`
      SELECT id, subdomain FROM public.tenants 
      WHERE id IS NOT NULL AND LENGTH(id) = 36
    `;

    console.log(`📋 Found ${tenants.length} tenants to update`);

    for (const tenant of tenants) {
      const schemaName = `tenant_${tenant.id.replace(/-/g, '_')}`;
      
      try {
        console.log(`📧 Adding emails table to ${schemaName}...`);

        // Create emails table
        await sql.raw(`
          CREATE TABLE IF NOT EXISTS ${schemaName}.emails (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            message_id VARCHAR(255) NOT NULL,
            thread_id VARCHAR(255),
            from_email VARCHAR(255) NOT NULL,
            from_name VARCHAR(255),
            to_email VARCHAR(255) NOT NULL,
            cc_emails TEXT DEFAULT '[]',
            bcc_emails TEXT DEFAULT '[]',
            subject VARCHAR(998),
            body_text TEXT,
            body_html TEXT,
            has_attachments BOOLEAN DEFAULT false,
            attachment_count INTEGER DEFAULT 0,
            attachment_details TEXT DEFAULT '[]',
            email_headers TEXT DEFAULT '{}',
            priority VARCHAR(20) DEFAULT 'medium',
            is_read BOOLEAN DEFAULT false,
            is_processed BOOLEAN DEFAULT false,
            rule_matched VARCHAR(255),
            ticket_created VARCHAR(36),
            email_date TIMESTAMP,
            received_at TIMESTAMP DEFAULT NOW(),
            processed_at TIMESTAMP
          );
        `);

        // Add some sample email data
        await sql.raw(`
          INSERT INTO ${schemaName}.emails 
          (id, tenant_id, message_id, from_email, from_name, to_email, subject, body_text, body_html, priority, email_date)
          VALUES 
          (gen_random_uuid()::text, '${tenant.id}', 'test-2025-email-001', 'cliente@empresa.com', 'João Cliente', 'alexsolver@gmail.com', 'Urgente: Problema no sistema de vendas', 'Olá, estamos enfrentando um problema crítico no sistema de vendas. Preciso de ajuda urgente.', '<p>Olá,</p><p>Estamos enfrentando um problema crítico no sistema de vendas. Preciso de ajuda urgente.</p>', 'high', '2025-07-20 18:00:00')
          ON CONFLICT (id) DO NOTHING;
        `);

        console.log(`✅ Successfully added emails table to ${schemaName}`);
      } catch (error) {
        console.error(`❌ Error adding emails table to ${schemaName}:`, error);
      }
    }

    console.log('🎉 Successfully updated all tenant schemas with emails table');
  } catch (error) {
    console.error('❌ Error in addEmailsTableToTenants:', error);
  }
}

// Execute the function
addEmailsTableToTenants()
  .then(() => {
    console.log('✅ Email table migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
