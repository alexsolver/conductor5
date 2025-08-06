// SaaS-level integrations
  const saasIntegrations = [
    // General & AI
    {
      id: 'openai',
      name: 'OpenAI',
      provider: 'OpenAI',
      category: 'geral',
      description: 'Integração com GPT-4 para IA conversacional',
      icon: 'Brain',
      status: 'connected',
      apiKeyConfigured: true,
      lastTested: new Date().toISOString()
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      provider: 'Anthropic',
      category: 'geral',
      description: 'Claude AI para análise avançada',
      icon: 'MessageCircle',
      status: 'disconnected',
      apiKeyConfigured: false
    },

    // Communication Integrations
    {
      id: 'google-oauth',
      name: 'Google OAuth2',
      provider: 'Google',
      category: 'comunicacao',
      description: 'Autenticação OAuth2 para serviços Google',
      icon: 'Mail',
      status: 'disconnected',
      apiKeyConfigured: false
    },
    {
      id: 'gmail-api',
      name: 'Gmail API',
      provider: 'Google',
      category: 'comunicacao',
      description: 'Envio e recebimento via Gmail API',
      icon: 'Mail',
      status: 'disconnected',
      apiKeyConfigured: false
    },
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      provider: 'Google',
      category: 'comunicacao',
      description: 'Integração com Google Workspace',
      icon: 'Building',
      status: 'disconnected',
      apiKeyConfigured: false
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      provider: 'Google',
      category: 'comunicacao',
      description: 'Sincronização com Google Calendar',
      icon: 'Calendar',
      status: 'disconnected',
      apiKeyConfigured: false
    },
    {
      id: 'microsoft-graph',
      name: 'Microsoft Graph',
      provider: 'Microsoft',
      category: 'comunicacao',
      description: 'API central da Microsoft',
      icon: 'Building',
      status: 'disconnected',
      apiKeyConfigured: false
    },
    {
      id: 'outlook-api',
      name: 'Outlook API',
      provider: 'Microsoft',
      category: 'comunicacao',
      description: 'Integração com Outlook',
      icon: 'Mail',
      status: 'disconnected',
      apiKeyConfigured: false
    },
    {
      id: 'microsoft-teams',
      name: 'Microsoft Teams',
      provider: 'Microsoft',
      category: 'comunicacao',
      description: 'Notificações via Teams',
      icon: 'MessageSquare',
      status: 'disconnected',
      apiKeyConfigured: false
    },
    {
      id: 'aws-ses',
      name: 'Amazon SES',
      provider: 'Amazon',
      category: 'comunicacao',
      description: 'Email transacional AWS',
      icon: 'Send',
      status: 'disconnected',
      apiKeyConfigured: false
    },
    {
      id: 'aws-sns',
      name: 'Amazon SNS',
      provider: 'Amazon',
      category: 'comunicacao',
      description: 'Notificações Amazon SNS',
      icon: 'Bell',
      status: 'disconnected',
      apiKeyConfigured: false
    },
    {
      id: 'aws-s3',
      name: 'Amazon S3',
      provider: 'Amazon',
      category: 'comunicacao',
      description: 'Armazenamento AWS S3',
      icon: 'Database',
      status: 'disconnected',
      apiKeyConfigured: false
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      provider: 'SendGrid',
      category: 'comunicacao',
      description: 'Email marketing e transacional',
      icon: 'Mail',
      status: 'disconnected',
      apiKeyConfigured: false
    },
    {
      id: 'twilio',
      name: 'Twilio',
      provider: 'Twilio',
      category: 'comunicacao',
      description: 'SMS, WhatsApp e chamadas',
      icon: 'Phone',
      status: 'disconnected',
      apiKeyConfigured: false
    },
    {
      id: 'slack-saas',
      name: 'Slack (SaaS)',
      provider: 'Slack',
      category: 'comunicacao',
      description: 'Integração global do Slack',
      icon: 'Hash',
      status: 'disconnected',
      apiKeyConfigured: false
    },
    {
      id: 'discord-saas',
      name: 'Discord (SaaS)',
      provider: 'Discord',
      category: 'comunicacao',
      description: 'Notificações via Discord',
      icon: 'MessageCircle',
      status: 'disconnected',
      apiKeyConfigured: false
    }
  ];

  // Mock endpoints for integration management
  app.get('/api/integrations', (req, res) => {
    res.json({ 
      integrations: saasIntegrations,
      message: "Integrações SaaS carregadas com sucesso" 
    });
  });

  // Add more endpoints for configuring, enabling, disabling, and testing integrations
  // For example:
  app.post('/api/integrations/configure', (req, res) => {
    const { integrationId, config } = req.body;
    const integration = saasIntegrations.find(i => i.id === integrationId);

    if (integration) {
      // In a real app, you would save this configuration securely
      console.log(`Configuring integration ${integrationId} with:`, config);
      integration.status = 'configured'; // Example status update
      res.json({ message: `Configuração para ${integrationId} atualizada.` });
    } else {
      res.status(404).json({ message: 'Integração não encontrada.' });
    }
  });

  app.post('/api/integrations/enable', (req, res) => {
    const { integrationId } = req.body;
    const integration = saasIntegrations.find(i => i.id === integrationId);

    if (integration) {
      integration.status = 'connected'; // Example status update
      res.json({ message: `${integrationId} habilitada com sucesso.` });
    } else {
      res.status(404).json({ message: 'Integração não encontrada.' });
    }
  });

  app.post('/api/integrations/disable', (req, res) => {
    const { integrationId } = req.body;
    const integration = saasIntegrations.find(i => i.id === integrationId);

    if (integration) {
      integration.status = 'disconnected'; // Example status update
      res.json({ message: `${integrationId} desabilitada com sucesso.` });
    } else {
      res.status(404).json({ message: 'Integração não encontrada.' });
    }
  });

  app.post('/api/integrations/test', (req, res) => {
    const { integrationId } = req.body;
    const integration = saasIntegrations.find(i => i.id === integrationId);

    if (integration) {
      // Simulate a test
      const testResult = Math.random() > 0.5 ? 'success' : 'failure';
      integration.lastTested = new Date().toISOString();
      res.json({ message: `Teste para ${integrationId} ${testResult}.`, result: testResult });
    } else {
      res.status(404).json({ message: 'Integração não encontrada.' });
    }
  });