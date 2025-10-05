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

    // TENANT ADMIN INTEGRATIONS
    const tenantIntegrations = [
      // === COMUNICAÇÃO ===
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
        id: 'microsoft-365',
        name: 'Microsoft 365 OAuth',
        description: 'Integração corporativa completa com Microsoft 365',
        category: 'Comunicação',
        icon: 'Mail',
        features: ['OAuth2 Authentication', 'Exchange', 'Teams', 'SharePoint Integration']
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
        id: 'discord',
        name: 'Discord',
        description: 'Integração com Discord para comunidades e suporte',
        category: 'Comunicação',
        icon: 'MessageCircle',
        features: ['Notificações', 'Bot commands', 'Community management']
      },
      {
        id: 'twilio-sms',
        name: 'Twilio SMS',
        description: 'Envio de SMS para notificações e alertas importantes',
        category: 'Comunicação',
        icon: 'Phone',
        features: ['SMS automático', 'Notificações críticas', 'Verificação 2FA']
      },
      {
        id: 'telegram',
        name: 'Telegram',
        description: 'Notificações e alertas via Telegram Bot',
        category: 'Comunicação',
        icon: 'Send',
        features: ['Bot integrado', 'Notificações em tempo real', 'Comandos personalizados']
      },

      // === SEGURANÇA (SSO) ===
      {
        id: 'sso-saml',
        name: 'SAML 2.0',
        description: 'Single Sign-On padrão enterprise com SAML 2.0',
        category: 'Segurança',
        icon: 'Shield',
        features: ['SAML 2.0', 'Enterprise SSO', 'Active Directory', 'Multi-factor Authentication']
      },
      {
        id: 'oauth2-generic',
        name: 'OAuth 2.0 Genérico',
        description: 'Autenticação OAuth 2.0 flexível para diversos provedores',
        category: 'Segurança',
        icon: 'Shield',
        features: ['OAuth 2.0', 'Custom providers', 'Token management', 'Refresh tokens']
      },
      {
        id: 'azure-ad',
        name: 'Azure AD / Entra ID',
        description: 'Autenticação corporativa com Microsoft Azure Active Directory',
        category: 'Segurança',
        icon: 'Shield',
        features: ['Azure AD', 'Entra ID', 'Conditional Access', 'MFA']
      },
      {
        id: 'google-workspace-sso',
        name: 'Google Workspace SSO',
        description: 'Autenticação corporativa com Google Workspace',
        category: 'Segurança',
        icon: 'Shield',
        features: ['Google SSO', 'Workspace integration', 'Admin console', 'Security policies']
      },

      // === AUTOMAÇÃO ===
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

      // === DADOS ===
      {
        id: 'crm-integration',
        name: 'CRM Integration',
        description: 'Sincronização com sistemas CRM para gestão unificada de clientes',
        category: 'Dados',
        icon: 'Database',
        features: ['Sincronização bidirecional', 'Mapeamento de campos', 'Histórico unificado']
      },
      {
        id: 'dropbox-personal',
        name: 'Dropbox',
        description: 'Backup automático de dados e arquivos importantes',
        category: 'Dados',
        icon: 'Cloud',
        features: ['Backup automático', 'Sincronização de arquivos', 'Versionamento']
      },

      // === PRODUTIVIDADE ===
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
      },

      // === OUTROS (Service Desk / ERP) ===
      {
        id: 'sap',
        name: 'SAP',
        description: 'Integração com SAP ERP para gestão empresarial completa',
        category: 'Outros',
        icon: 'Building2',
        features: ['ERP Integration', 'Financial sync', 'HR integration', 'Supply chain']
      },
      {
        id: 'totvs',
        name: 'Totvs',
        description: 'Integração com Totvs ERP para empresas brasileiras',
        category: 'Outros',
        icon: 'Building2',
        features: ['ERP Brasil', 'Fiscal compliance', 'Financial integration', 'HR sync']
      },
      {
        id: 'jira-service-management',
        name: 'Jira Service Management',
        description: 'Sincronização bidirecional com Jira Service Management',
        category: 'Outros',
        icon: 'Ticket',
        features: ['Ticket sync', 'SLA management', 'Asset tracking', 'Change management']
      },
      {
        id: 'servicenow',
        name: 'ServiceNow',
        description: 'Integração enterprise com ServiceNow ITSM',
        category: 'Outros',
        icon: 'Ticket',
        features: ['ITSM integration', 'Incident management', 'CMDB sync', 'Change control']
      },
      {
        id: 'zendesk',
        name: 'Zendesk',
        description: 'Migração e sincronização com Zendesk Support',
        category: 'Outros',
        icon: 'Ticket',
        features: ['Ticket migration', 'API sync', 'Knowledge base', 'Customer data']
      },
      {
        id: 'freshdesk',
        name: 'Freshdesk',
        description: 'Integração com Freshdesk para sincronização de tickets',
        category: 'Outros',
        icon: 'Ticket',
        features: ['Ticket sync', 'Multi-channel', 'Automation', 'Reporting']
      }
    ];

    // SAAS ADMIN INTEGRATIONS (public.integrations)
    const saasIntegrations = [
      // === IA ===
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'Configure as chaves de API do OpenAI (GPT-4, GPT-3.5, etc.)',
        category: 'IA',
        icon: 'Brain',
        features: ['GPT-4', 'GPT-3.5 Turbo', 'Chat Completions', 'Fine-tuning']
      },
      {
        id: 'anthropic',
        name: 'Anthropic Claude',
        description: 'Integração com Anthropic Claude para diversificação de modelos',
        category: 'IA',
        icon: 'Brain',
        features: ['Claude 3', 'Long context', 'Constitutional AI', 'Safety features']
      },
      {
        id: 'google-gemini',
        name: 'Google Gemini',
        description: 'Integração com Google Gemini - alternativa competitiva',
        category: 'IA',
        icon: 'Brain',
        features: ['Gemini Pro', 'Multimodal', 'Fast inference', 'Google integration']
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        description: 'Modelo de IA de baixo custo com alta performance',
        category: 'IA',
        icon: 'Brain',
        features: ['Low cost', 'High performance', 'Chat models', 'Code generation']
      },
      {
        id: 'azure-openai',
        name: 'Azure OpenAI',
        description: 'OpenAI via Azure para clientes enterprise',
        category: 'IA',
        icon: 'Brain',
        features: ['Enterprise grade', 'Private deployment', 'Compliance', 'SLA guarantees']
      },
      {
        id: 'googleai',
        name: 'Google AI',
        description: 'Integração com Google AI Platform (Gemini, Vertex AI)',
        category: 'IA',
        icon: 'Brain',
        features: ['Vertex AI', 'Custom models', 'AutoML', 'Model Garden']
      },

      // === DADOS ===
      {
        id: 'dropbox',
        name: 'Dropbox',
        description: 'Armazenamento e backup de arquivos via Dropbox',
        category: 'Dados',
        icon: 'Cloud',
        features: ['File storage', 'Automatic backup', 'Version control', 'Team folders']
      },
      {
        id: 'aws-s3',
        name: 'AWS S3',
        description: 'Storage enterprise com Amazon S3',
        category: 'Dados',
        icon: 'Cloud',
        features: ['Scalable storage', 'CDN integration', 'Lifecycle policies', 'Encryption']
      },

      // === PAGAMENTOS E BILLING ===
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Pagamentos internacionais via Stripe',
        category: 'Pagamentos',
        icon: 'CreditCard',
        features: ['International payments', 'Subscriptions', 'Invoicing', 'Payment links']
      },
      {
        id: 'pagseguro',
        name: 'PagSeguro/PagBank',
        description: 'Pagamentos para o mercado brasileiro via PagSeguro',
        category: 'Pagamentos',
        icon: 'CreditCard',
        features: ['PIX', 'Boleto', 'Credit cards', 'Split payments']
      },
      {
        id: 'mercadopago',
        name: 'Mercado Pago',
        description: 'Pagamentos para América Latina via Mercado Pago',
        category: 'Pagamentos',
        icon: 'CreditCard',
        features: ['Multi-country', 'PIX', 'Credit cards', 'QR Code payments']
      },

      // === COMUNICAÇÃO (Email services for SaaS level) ===
      {
        id: 'sendgrid',
        name: 'SendGrid',
        description: 'Serviço de email transacional via SendGrid',
        category: 'Comunicação',
        icon: 'Mail',
        features: ['Email delivery', 'Templates', 'Analytics', 'A/B testing']
      },

      // === ANALYTICS ===
      {
        id: 'openweather',
        name: 'OpenWeather',
        description: 'Dados meteorológicos via OpenWeather API',
        category: 'Dados',
        icon: 'Cloud',
        features: ['Weather data', 'Forecasts', 'Historical data', 'Alerts']
      }
    ];

    console.log(`🔧 Criando integrações para cada tenant...`);
    console.log(`📋 Tenant Admin: ${tenantIntegrations.length} integrações`);
    console.log(`📋 SaaS Admin: ${saasIntegrations.length} integrações`);

    let totalTenantIntegrations = 0;
    let totalSaasIntegrations = 0;

    // Create tenant-level integrations
    for (const tenant of tenants) {
      const tenantId = tenant.id;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      console.log(`\n📋 Processando tenant: ${tenantId}`);
      console.log(`📂 Schema: ${schemaName}`);

      // Verificar se a tabela de integrações existe
      const tableCheckResult = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'integrations'
        )
      `, [schemaName]);

      if (!tableCheckResult.rows[0].exists) {
        console.log(`⚠️ Tabela integrations não existe no schema ${schemaName}, pulando...`);
        continue;
      }

      // Verificar tipo da coluna id
      const idTypeResult = await db.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = 'integrations' AND column_name = 'id'
      `, [schemaName]);

      const idType = idTypeResult.rows[0]?.data_type;
      const isUuidType = idType === 'uuid';

      console.log(`🔍 Tipo do campo id: ${idType}${isUuidType ? ' (usará UUID)' : ' (usará string)'}`);

      // Limpar integrações existentes
      await db.query(`DELETE FROM ${schemaName}.integrations WHERE tenant_id = $1`, [tenantId]);
      console.log(`🗑️ Limpou integrações existentes do tenant`);

      // Inserir todas as integrações do tenant
      for (const integration of tenantIntegrations) {
        // Se a coluna é UUID, gerar um UUID novo; senão, usar o id string
        const integrationId = isUuidType ? 
          (await db.query('SELECT gen_random_uuid() as id')).rows[0].id : 
          integration.id;

        const insertQuery = `
          INSERT INTO ${schemaName}.integrations 
          (id, name, description, category, icon, status, config, features, tenant_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        `;

        await db.query(insertQuery, [
          integrationId,
          integration.name,
          integration.description,
          integration.category,
          integration.icon,
          'disconnected',
          '{}',
          integration.features,
          tenantId
        ]);

        totalTenantIntegrations++;
      }

      console.log(`✅ Criadas ${tenantIntegrations.length} integrações para tenant ${tenantId}`);
    }

    // Create SaaS-level integrations (public schema)
    console.log(`\n📋 Processando integrações SaaS Admin (public.integrations)`);
    
    // Verificar se existe coluna icon em public.integrations
    const iconColumnResult = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'integrations' AND column_name = 'icon'
      )
    `);
    const hasIconColumn = iconColumnResult.rows[0].exists;

    // Verificar se existe coluna status
    const statusColumnResult = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'integrations' AND column_name = 'status'
      )
    `);
    const hasStatusColumn = statusColumnResult.rows[0].exists;

    // Verificar se existe coluna features
    const featuresColumnResult = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'integrations' AND column_name = 'features'
      )
    `);
    const hasFeaturesColumn = featuresColumnResult.rows[0].exists;

    console.log(`🔍 Schema public.integrations: icon=${hasIconColumn}, status=${hasStatusColumn}, features=${hasFeaturesColumn}`);
    
    // Limpar integrações SaaS existentes
    await db.query(`DELETE FROM public.integrations`);
    console.log(`🗑️ Limpou integrações SaaS existentes`);

    for (const integration of saasIntegrations) {
      // Construir query dinamicamente baseado nas colunas disponíveis
      let columns = ['id', 'name', 'description', 'category', 'config', 'created_at', 'updated_at'];
      let placeholders = ['$1', '$2', '$3', '$4', '$5', 'NOW()', 'NOW()'];
      let values = [
        integration.id,
        integration.name,
        integration.description,
        integration.category,
        '{}'
      ];

      let paramIndex = 6;
      
      if (hasIconColumn) {
        columns.splice(5, 0, 'icon');
        placeholders.splice(5, 0, `$${paramIndex++}`);
        values.push(integration.icon);
      }
      
      if (hasStatusColumn) {
        columns.splice(hasIconColumn ? 6 : 5, 0, 'status');
        placeholders.splice(hasIconColumn ? 6 : 5, 0, `$${paramIndex++}`);
        values.push('disconnected');
      }
      
      if (hasFeaturesColumn) {
        columns.splice(-2, 0, 'features');
        placeholders.splice(-2, 0, `$${paramIndex++}`);
        values.push(integration.features);
      }

      const insertQuery = `
        INSERT INTO public.integrations 
        (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
      `;

      await db.query(insertQuery, values);
      totalSaasIntegrations++;
    }

    console.log(`✅ Criadas ${saasIntegrations.length} integrações SaaS Admin`);

    // Summary
    console.log(`\n🎉 SUCESSO!`);
    console.log(`📊 Tenant Admin: ${totalTenantIntegrations} integrações (${tenants.length} tenants × ${tenantIntegrations.length})`);
    console.log(`📊 SaaS Admin: ${totalSaasIntegrations} integrações`);
    
    console.log(`\n📋 TENANT ADMIN CATEGORIAS:`);
    const tenantCategories = {};
    tenantIntegrations.forEach(int => {
      tenantCategories[int.category] = (tenantCategories[int.category] || 0) + 1;
    });
    Object.entries(tenantCategories).forEach(([cat, count]) => {
      console.log(`• ${cat}: ${count} integrações`);
    });

    console.log(`\n📋 SAAS ADMIN CATEGORIAS:`);
    const saasCategories = {};
    saasIntegrations.forEach(int => {
      saasCategories[int.category] = (saasCategories[int.category] || 0) + 1;
    });
    Object.entries(saasCategories).forEach(([cat, count]) => {
      console.log(`• ${cat}: ${count} integrações`);
    });

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
