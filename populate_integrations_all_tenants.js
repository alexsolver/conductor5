import pkg from 'pg';
const { Client } = pkg;

async function populateIntegrationsInAllTenants() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get all tenant schemas
    const tenantSchemas = ['715c510a_3db5_4510_880a_9a1a5c320100', '78a4c88e_0e85_4f7c_ad92_f472dad50d7a', 'cb9056df_d964_43d7_8fd8_b0cc00a72056'];
    
    for (const schemaId of tenantSchemas) {
      const schemaName = `tenant_${schemaId}`;
      const tenantId = schemaId.replace(/_/g, '-');
      
      console.log(`Populating integrations for ${schemaName}...`);
      
      const insertQuery = `
        INSERT INTO ${schemaName}.integrations 
        (id, tenant_id, name, description, category, icon, status, config, features)
        VALUES 
        ('imap-email', '${tenantId}', 'IMAP Email', 'Conecte sua caixa de email via IMAP para sincronização de tickets', 'Comunicação', 'Mail', 'disconnected', '{}', ARRAY['Sincronização bidirecional', 'Auto-resposta', 'Filtros avançados']),
        ('dropbox-personal', '${tenantId}', 'Dropbox Pessoal', 'Backup automático de dados e arquivos importantes', 'Dados', 'Cloud', 'disconnected', '{}', ARRAY['Backup automático', 'Sincronização de arquivos', 'Versionamento']),
        ('whatsapp-business', '${tenantId}', 'WhatsApp Business', 'Integração com WhatsApp Business API', 'Comunicação', 'MessageCircle', 'disconnected', '{}', ARRAY['Mensagens automáticas', 'Chatbot', 'Histórico completo']),
        ('slack', '${tenantId}', 'Slack', 'Notificações e colaboração em equipe', 'Comunicação', 'Hash', 'disconnected', '{}', ARRAY['Notificações em tempo real', 'Canais dedicados', 'Bot integrado']),
        ('google-workspace', '${tenantId}', 'Google Workspace', 'Integração completa com Gmail, Drive e Calendar', 'Produtividade', 'Chrome', 'disconnected', '{}', ARRAY['Gmail sync', 'Drive backup', 'Calendar integration'])
        ON CONFLICT (id) DO NOTHING
      `;
      
      await client.query(insertQuery);
      console.log(`✓ Integrations populated in ${schemaName}`);
    }

    console.log('All tenant integrations populated successfully!');
  } catch (error) {
    console.error('Error populating integrations:', error);
  } finally {
    await client.end();
  }
}

populateIntegrationsInAllTenants();