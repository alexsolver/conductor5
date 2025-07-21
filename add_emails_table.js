
const { neon } = require('@neondatabase/serverless');

async function createEmailsTable() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('🔗 Conectado ao PostgreSQL');
  
  try {
    // Get all tenants
    const tenants = await sql`
      SELECT id, name FROM public.tenants 
      WHERE status = 'active'
    `;
    
    console.log(`📊 Encontrados ${tenants.length} tenants ativos`);
    
    for (const tenant of tenants) {
      const schemaName = `tenant_${tenant.id.replace(/-/g, '_')}`;
      console.log(`\n📋 Processando tenant: ${tenant.id}`);
      console.log(`📂 Schema: ${schemaName}`);
      
      try {
        // Check if emails table exists
        const tableExists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = ${schemaName} 
            AND table_name = 'emails'
          )
        `;
        
        if (tableExists[0].exists) {
          console.log(`✅ Tabela emails já existe no schema ${schemaName}`);
          continue;
        }
        
        // Create emails table
        await sql`
          CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.emails (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES public.tenants(id),
            message_id TEXT UNIQUE NOT NULL,
            thread_id TEXT,
            from_email TEXT NOT NULL,
            from_name TEXT,
            to_email TEXT NOT NULL,
            cc_emails TEXT DEFAULT '[]',
            bcc_emails TEXT DEFAULT '[]',
            subject TEXT NOT NULL,
            body_text TEXT,
            body_html TEXT,
            has_attachments BOOLEAN DEFAULT FALSE,
            attachment_count INTEGER DEFAULT 0,
            attachment_details JSONB DEFAULT '[]',
            email_headers JSONB DEFAULT '{}',
            priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
            is_read BOOLEAN DEFAULT FALSE,
            is_processed BOOLEAN DEFAULT FALSE,
            rule_matched TEXT,
            ticket_created UUID,
            email_date TIMESTAMP,
            received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        
        // Create indexes
        await sql`
          CREATE INDEX IF NOT EXISTS idx_${sql(schemaName)}_emails_tenant_id ON ${sql(schemaName)}.emails(tenant_id)
        `;
        
        await sql`
          CREATE INDEX IF NOT EXISTS idx_${sql(schemaName)}_emails_message_id ON ${sql(schemaName)}.emails(message_id)
        `;
        
        await sql`
          CREATE INDEX IF NOT EXISTS idx_${sql(schemaName)}_emails_is_read ON ${sql(schemaName)}.emails(is_read)
        `;
        
        await sql`
          CREATE INDEX IF NOT EXISTS idx_${sql(schemaName)}_emails_received_at ON ${sql(schemaName)}.emails(received_at DESC)
        `;
        
        // Insert sample email data for testing
        await sql`
          INSERT INTO ${sql(schemaName)}.emails (
            tenant_id, message_id, from_email, from_name, to_email, subject,
            body_text, body_html, priority, is_read, email_date
          ) VALUES (
            ${tenant.id},
            'test-2025-email-001',
            'cliente@empresa.com',
            'João Cliente',
            'alexsolver@gmail.com',
            'Urgente: Problema no sistema de vendas',
            'Olá, estamos enfrentando um problema crítico no sistema de vendas. Preciso de ajuda urgente.',
            '<p>Olá,</p><p>Estamos enfrentando um problema crítico no sistema de vendas. Preciso de ajuda urgente.</p>',
            'high',
            false,
            '2025-07-20 18:00:00'
          ) ON CONFLICT (message_id) DO NOTHING
        `;
        
        console.log(`✅ Tabela emails criada com sucesso no schema ${schemaName}`);
        
      } catch (error) {
        console.error(`❌ Erro ao processar tenant ${tenant.id}:`, error.message);
      }
    }
    
    console.log('\n🎉 SUCESSO! Tabelas de emails criadas/verificadas para todos os tenants');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    throw error;
  }
}

// Execute the function
createEmailsTable()
  .then(() => {
    console.log('✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error);
    process.exit(1);
  });
