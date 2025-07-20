import pkg from 'pg';
const { Client } = pkg;

const db = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function recreateAllIntegrations() {
  try {
    await db.connect();
    console.log('🔗 Conectado ao PostgreSQL');

    // Buscar todos os tenants
    const tenantsResult = await db.query('SELECT id FROM public.tenants');
    const tenants = tenantsResult.rows;
    
    console.log(`📊 Encontrados ${tenants.length} tenants`);

    // Lista completa das 14 integrações
    const integrations = [
      // Comunicação (7 integrações)
      {
        id: 'gmail-oauth2',
        name: 'Gmail OAuth2',
        description: 'Integração OAuth2 com Gmail para envio e recebimento seguro de emails',
        category: 'Comunicação',
        icon: 'Mail',
        features: ['OAuth2 Authentication', 'Send/Receive Emails', 'Auto-sync', 'Secure Token Management']
      },
      {
        id: 'outlook-oauth2',
        name: 'Outlook OAuth2',
        description: 'Integração OAuth2 com Microsoft Outlook para emails corporativos',
        category: 'Comunicação',
        icon: 'Mail',
        features: ['OAuth2 Authentication', 'Exchange Integration', 'Calendar Sync', 'Corporate Email']
      },
      {
        id: 'email-smtp',
        name: 'Email SMTP',
        description: 'Configuração de servidor SMTP para envio de emails automáticos e notificações',
        category: 'Comunicação',
        icon: 'Mail',
        features: ['Notificações por email', 'Tickets por email', 'Relatórios automáticos']
      },
      {
        id: 'imap-email',
        name: 'IMAP Email',
        description: 'Conecte sua caixa de email via IMAP para sincronização de tickets',
        category: 'Comunicação',
        icon: 'Inbox',
        features: ['Sincronização bidirecional', 'Auto-resposta', 'Filtros avançados']
      },
      {
        id: 'whatsapp-business',
        name: 'WhatsApp Business',
        description: 'Integração com WhatsApp Business API para atendimento via WhatsApp',
        category: 'Comunicação',
        icon: 'MessageSquare',
        features: ['Mensagens automáticas', 'Templates aprovados', 'Webhooks']
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Notificações e gerenciamento de tickets através do Slack',
        category: 'Comunicação',
        icon: 'MessageCircle',
        features: ['Notificações de tickets', 'Comandos slash', 'Bot integrado']
      },
      {
        id: 'twilio-sms',
        name: 'Twilio SMS',
        description: 'Envio de SMS para notificações e alertas importantes',
        category: 'Comunicação',
        icon: 'Phone',
        features: ['SMS automático', 'Notificações críticas', 'Verificação 2FA']
      },
      // Automação (2 integrações)
      {
        id: 'zapier',
        name: 'Zapier',
        description: 'Conecte com mais de 3000 aplicativos através de automações Zapier',
        category: 'Automação',
        icon: 'Zap',
        features: ['Workflows automáticos', '3000+ integrações', 'Triggers personalizados']
      },
      {
        id: 'webhooks',
        name: 'Webhooks',
        description: 'Receba notificações em tempo real de eventos do sistema',
        category: 'Automação',
        icon: 'Webhook',
        features: ['Eventos em tempo real', 'Custom endpoints', 'Retry automático']
      },
      // Dados (2 integrações)
      {
        id: 'crm-integration',
        name: 'CRM Integration',
        description: 'Sincronização com sistemas CRM para gestão unificada de clientes',
        category: 'Dados',
        icon: 'Database',
        features: ['Sincronização bidirecionais', 'Mapeamento de campos', 'Histórico unificado']
      },
      {
        id: 'dropbox-personal',
        name: 'Dropbox Pessoal',
        description: 'Backup automático de dados e arquivos importantes',
        category: 'Dados',
        icon: 'Cloud',
        features: ['Backup automático', 'Sincronização de arquivos', 'Versionamento']
      },
      // Segurança (1 integração)
      {
        id: 'sso-saml',
        name: 'SSO/SAML',
        description: 'Single Sign-On para autenticação corporativa segura',
        category: 'Segurança',
        icon: 'Shield',
        features: ['Single Sign-On', 'SAML 2.0', 'Active Directory', 'Multi-factor Authentication']
      },
      // Produtividade (2 integrações)
      {
        id: 'google-workspace',
        name: 'Google Workspace',
        description: 'Integração completa com Gmail, Drive e Calendar',
        category: 'Produtividade',
        icon: 'Calendar',
        features: ['Gmail sync', 'Drive backup', 'Calendar integration']
      },
      {
        id: 'chatbot-ai',
        name: 'Chatbot IA',
        description: 'Assistente virtual inteligente para atendimento automatizado',
        category: 'Produtividade',
        icon: 'Bot',
        features: ['Respostas automáticas', 'Machine Learning', 'Escalação inteligente']
      }
    ];

    console.log(`🔧 Criando ${integrations.length} integrações para cada tenant...`);

    let totalCreated = 0;

    for (const tenant of tenants) {
      const tenantId = tenant.id;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      console.log(`\n📋 Processando tenant: ${tenantId}`);
      console.log(`📂 Schema: ${schemaName}`);

      // Limpar integrações existentes
      await db.query(`DELETE FROM ${schemaName}.integrations WHERE tenant_id = $1`, [tenantId]);
      console.log(`🗑️ Limpou integrações existentes`);

      // Inserir todas as 14 integrações
      for (const integration of integrations) {
        const insertQuery = `
          INSERT INTO ${schemaName}.integrations 
          (id, name, description, category, icon, status, config, features, tenant_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            icon = EXCLUDED.icon,
            features = EXCLUDED.features,
            updated_at = NOW()
        `;

        await db.query(insertQuery, [
          integration.id,
          integration.name,
          integration.description,
          integration.category,
          integration.icon,
          'disconnected',
          '{}',
          integration.features,
          tenantId
        ]);

        totalCreated++;
      }

      console.log(`✅ Criadas ${integrations.length} integrações para tenant ${tenantId}`);
    }

    console.log(`\n🎉 SUCESSO! Total de integrações criadas: ${totalCreated}`);
    console.log(`📊 ${tenants.length} tenants × ${integrations.length} integrações = ${totalCreated} registros`);
    console.log(`\n📋 CATEGORIAS CRIADAS:`);
    console.log(`• Comunicação: 7 integrações`);
    console.log(`• Automação: 2 integrações`);
    console.log(`• Dados: 2 integrações`);
    console.log(`• Segurança: 1 integração`);
    console.log(`• Produtividade: 2 integrações`);
    console.log(`\n🔧 INTEGRAÇÕES DISPONÍVEIS:`);
    integrations.forEach(int => console.log(`• ${int.name} (${int.category})`));

  } catch (error) {
    console.error('❌ Erro ao recriar integrações:', error);
    throw error;
  } finally {
    await db.end();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar o script
recreateAllIntegrations()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na execução:', error);
    process.exit(1);
  });