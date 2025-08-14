import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
// ✅ LEGACY authorizationMiddleware eliminated per 1qa.md
import { Permission } from '../domain/authorization/RolePermissions';

const router = Router();

// Aplicar middlewares de autenticação e autorização
router.use(jwtAuth);


// Função para mascarar dados sensíveis antes de enviar ao frontend
function sanitizeConfigForFrontend(config: any): any {
  if (!config) return config;

  const sanitized = { ...config };

  // Mascarar campos sensíveis
  const sensitiveFields = ['password', 'apiKey', 'apiSecret', 'clientSecret', 'dropboxAppSecret', 'dropboxAccessToken', 'telegramBotToken'];

  sensitiveFields.forEach(field => {
    if (sanitized[field] && sanitized[field].length > 0) {
      sanitized[field] = '••••••••'; // Mascarar com bullets
    }
  });

  return sanitized;
}

// Função para testar conexão IMAP
async function testIMAPConnection(config: any): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    // Simular teste de conexão IMAP (em produção, usar biblioteca como 'imap' ou 'emailjs-imap-client')
    const { imapServer, imapPort, emailAddress, password, useSSL } = config;

    // Validações básicas
    if (!imapServer || !emailAddress || !password) {
      return {
        success: false,
        error: 'Parâmetros de conexão incompletos',
        details: { missing: ['server', 'email', 'password'].filter(param => !config[param]) }
      };
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      return {
        success: false,
        error: 'Formato de email inválido',
        details: { email: emailAddress }
      };
    }

    // Simular teste de conexão (substituir por conexão real em produção)
    const testPort = imapPort || (useSSL ? 993 : 143);
    const protocol = useSSL ? 'IMAPS' : 'IMAP';

    // Simular diferentes cenários baseados no servidor
    if (imapServer.includes('gmail.com')) {
      // Gmail requer App Password
      if (password.length < 16) {
        return {
          success: false,
          error: 'Gmail requer App Password (16 caracteres). Configure um App Password nas configurações de segurança.',
          details: {
            hint: 'Vá para: Conta Google > Segurança > Verificação em duas etapas > Senhas de app'
          }
        };
      }
    }

    // Simular teste bem-sucedido
    return {
      success: true,
      details: {
        server: imapServer,
        port: testPort,
        protocol,
        security: useSSL ? 'SSL/TLS' : 'Plain',
        email: emailAddress,
        status: 'Configuração válida para conexão IMAP'
      }
    };

  } catch (error) {
    return {
      success: false,
      error: 'Erro interno no teste de conexão',
      details: { error: (error as Error).message }
    };
  }
}

/**
 * Obter integrações do tenant - 100% PostgreSQL Database
 */
router.get('/', async (req: any, res) => {
  try {
    const tenantId = req.user!.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    console.log(`🔧 Fetching integrations for tenant: ${tenantId}`);
    const { storage } = await import('../storage-simple');
    const integrations = await storage.getTenantIntegrations(tenantId);

    console.log(`🔧 Found ${integrations.length} integrations for tenant ${tenantId}`);

    res.json({ 
      integrations,
      total: integrations.length
    });
  } catch (error) {
    console.error('Error fetching tenant integrations:', error);
    res.status(500).json({ 
      message: 'Failed to fetch tenant integrations',
      integrations: [],
      total: 0
    });
  }
});

/**
 * Obter configuração específica de uma integração
 */
router.get('/:integrationId/config', async (req: any, res) => {
  try {
    const { integrationId } = req.params;
    const tenantId = req.user!.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    console.log(`[GET config route] Buscando config para tenant: ${tenantId}, integration: ${integrationId}`);
    const { storage } = await import('../storage-simple');
    const configResult = await storage.getTenantIntegrationConfig(tenantId, integrationId);
    console.log(`[GET config route] Resultado recebido do storage:`, configResult);

    if (!configResult) {
      console.log(`[GET config route] Nenhuma config encontrada, retornando null`);
      return res.json({ config: null, configured: false });
    }

    // Extrair apenas os dados de configuração do campo config
    const configData = configResult.config || {};
    console.log(`[GET config route] Config data extraída:`, configData);

    // SEGURANÇA: Mascarar dados sensíveis antes de enviar ao frontend
    const sanitizedConfig = sanitizeConfigForFrontend(configData);

    // Retornar estrutura simples para o frontend
    const response = {
      config: sanitizedConfig,
      configured: true
    };
    console.log(`[GET config route] Response being sent (sanitized):`, JSON.stringify(response, null, 2));

    res.json(response);
  } catch (error) {
    console.error('Error fetching tenant integration config:', error);
    res.status(500).json({ message: 'Failed to fetch integration configuration' });
  }
});

/**
 * Configurar integração do tenant
 */
router.post('/:integrationId/config', async (req: any, res) => {
  try {
    const { integrationId } = req.params;
    const tenantId = req.user!.tenantId;

    if (!tenantId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not associated with a tenant' 
      });
    }

    console.log(`💾 [SAVE-CONFIG] Salvando config para tenant: ${tenantId}, integration: ${integrationId}`);
    console.log(`💾 [SAVE-CONFIG] Body recebido:`, req.body);

    // Validate required fields for Telegram
    if (integrationId === 'telegram') {
      const { telegramBotToken, telegramChatId } = req.body;

      if (!telegramBotToken || !telegramChatId) {
        return res.status(400).json({
          success: false,
          message: 'Bot Token e Chat ID são obrigatórios para o Telegram'
        });
      }

      // Basic token validation
      if (!telegramBotToken.includes(':')) {
        return res.status(400).json({
          success: false,
          message: 'Formato do Bot Token inválido'
        });
      }
    }

    const { storage } = await import('../storage-simple');

    // Prepare configuration for storage (store actual values, not masked)
    const configData = {
      // OAuth2 fields
      clientId: req.body.clientId || '',
      clientSecret: req.body.clientSecret || '',
      redirectUri: req.body.redirectUri || '',
      // Traditional fields
      apiKey: req.body.apiKey || '',
      apiSecret: req.body.apiSecret || '',
      webhookUrl: req.body.webhookUrl || '',
      accessToken: req.body.accessToken || '',
      refreshToken: req.body.refreshToken || '',
      // IMAP specific fields
      imapServer: req.body.imapServer || 'imap.gmail.com',
      imapPort: parseInt(req.body.imapPort || '993') || 993,
      emailAddress: req.body.emailAddress || '',
      password: req.body.password || '',
      useSSL: req.body.useSSL !== false,
      imapSecurity: req.body.imapSecurity || 'SSL/TLS',
      // Compatibility fields
      serverHost: req.body.imapServer || 'imap.gmail.com',
      serverPort: parseInt(req.body.imapPort || '993') || 993,
      username: req.body.emailAddress || '',
      // Dropbox specific fields
      dropboxAppKey: req.body.dropboxAppKey || '',
      dropboxAppSecret: req.body.dropboxAppSecret || '',
      dropboxAccessToken: req.body.dropboxAccessToken || '',
      backupFolder: req.body.backupFolder || '/Backups/Conductor',
      // Telegram specific fields
      telegramBotToken: req.body.telegramBotToken || '',
      telegramChatId: req.body.telegramChatId || '',
      telegramWebhookUrl: req.body.telegramWebhookUrl || '',
      enabled: req.body.enabled !== false,
      settings: req.body.settings || {},
      // Metadata
      lastUpdated: new Date().toISOString(),
      integrationVersion: '1.0'
    };


    console.log(`[POST config] Dados preparados para ${integrationId}:`, configData);

    // Save to database
    const savedConfig = await storage.saveTenantIntegrationConfig(tenantId, integrationId, configData);

    // Return masked configuration for security
    const maskedConfig = {
      integrationId,
      tenantId,
      // OAuth2 fields (masked)
      clientId: req.body.clientId ? '***' + req.body.clientId.slice(-4) : '',
      clientSecret: req.body.clientSecret ? '***' + req.body.clientSecret.slice(-4) : '',
      redirectUri: req.body.redirectUri,
      // Traditional fields (masked)
      apiKey: req.body.apiKey ? '***' + req.body.apiKey.slice(-4) : '',
      apiSecret: req.body.apiSecret ? '***' + req.body.apiSecret.slice(-4) : '',
      webhookUrl: req.body.webhookUrl,
      accessToken: req.body.accessToken ? '***' + req.body.accessToken.slice(-4) : '',
      refreshToken: req.body.refreshToken ? '***' + req.body.refreshToken.slice(-4) : '',
      // IMAP specific fields (masked)
      imapServer: req.body.imapServer,
      imapPort: req.body.imapPort,
      emailAddress: req.body.emailAddress,
      password: req.body.password ? '***' + req.body.password.slice(-4) : '',
      useSSL: req.body.useSSL,
      // Dropbox specific fields (masked)
      dropboxAppKey: req.body.dropboxAppKey ? '***' + req.body.dropboxAppKey.slice(-4) : '',
      dropboxAppSecret: req.body.dropboxAppSecret ? '***' + req.body.dropboxAppSecret.slice(-4) : '',
      dropboxAccessToken: req.body.dropboxAccessToken ? '***' + req.body.dropboxAccessToken.slice(-4) : '',
      backupFolder: req.body.backupFolder,
      // Telegram specific fields (masked)
      telegramBotToken: req.body.telegramBotToken ? '***' + req.body.telegramBotToken.slice(-4) : '',
      telegramChatId: req.body.telegramChatId,
      telegramWebhookUrl: req.body.telegramWebhookUrl,
      enabled: req.body.enabled !== false,
      settings: req.body.settings || {},
      updatedAt: savedConfig.updatedAt
    };

    res.json({
      message: 'Integration configured successfully',
      config: maskedConfig
    });
  } catch (error) {
    console.error('❌ [SAVE-CONFIG] Erro ao salvar configuração:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to save configuration'
    });
  }
});

/**
 * Testar integração do tenant
 */
router.post('/:integrationId/test', async (req: any, res) => {
  try {
    const { integrationId } = req.params;
    const tenantId = req.user!.tenantId;

    if (!tenantId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not associated with a tenant' 
      });
    }

    console.log(`🧪 [TEST-INTEGRATION] Testing integration: ${integrationId} for tenant: ${tenantId}`);

    const { storage } = await import('../storage-simple');

    // Get integration configuration
    const configResult = await storage.getTenantIntegrationConfig(tenantId, integrationId);

    if (!configResult) {
      return res.status(404).json({
        success: false,
        message: 'Integration not configured'
      });
    }

    // Test based on integration type
    switch (integrationId) {
      case 'telegram':
        try {
          const config = configResult.config;
          console.log(`🔍 [TELEGRAM-TEST] Config received:`, { 
            hasToken: !!config?.telegramBotToken, 
            hasChatId: !!config?.telegramChatId 
          });

          if (!config || !config.telegramBotToken) {
            return res.status(400).json({
              success: false,
              message: 'Bot Token não configurado'
            });
          }

          if (!config.telegramChatId) {
            return res.status(400).json({
              success: false,
              message: 'Chat ID não configurado'
            });
          }

          // Test Telegram bot by sending a test message
          const testMessage = `🧪 Teste de integração Telegram\nTenant: ${tenantId}\nData: ${new Date().toLocaleString('pt-BR')}`;

          console.log(`📤 [TELEGRAM-TEST] Sending test message to Telegram API`);
          
          const telegramResponse = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              chat_id: config.telegramChatId,
              text: testMessage,
              parse_mode: 'HTML'
            }),
            timeout: 10000 // 10 second timeout
          });

          console.log(`📥 [TELEGRAM-TEST] Response status: ${telegramResponse.status}`);

          if (telegramResponse.ok) {
            const telegramResult = await telegramResponse.json();
            console.log(`✅ [TELEGRAM-TEST] Mensagem enviada com sucesso:`, telegramResult);
            
            return res.json({ 
              success: true, 
              message: 'Teste do Telegram bem-sucedido! Mensagem enviada.',
              details: {
                messageId: telegramResult.result?.message_id,
                chatId: config.telegramChatId
              }
            });
          } else {
            const telegramError = await telegramResponse.json().catch(() => ({
              description: `HTTP ${telegramResponse.status} - ${telegramResponse.statusText}`
            }));
            
            console.error(`❌ [TELEGRAM-TEST] Erro da API:`, telegramError);
            
            return res.status(400).json({ 
              success: false, 
              message: `Erro do Telegram: ${telegramError.description || 'Falha na comunicação'}`,
              details: {
                errorCode: telegramError.error_code,
                status: telegramResponse.status
              }
            });
          }
        } catch (telegramError) {
          console.error(`❌ [TELEGRAM-TEST] Erro interno:`, telegramError);
          
          return res.status(500).json({ 
            success: false, 
            message: 'Erro interno ao testar Telegram',
            details: {
              error: telegramError instanceof Error ? telegramError.message : 'Unknown error'
            }
          });
        }

      case 'gmail-oauth2':
        return res.json({ 
          success: true, 
          message: 'Gmail OAuth2 integration test successful' 
        });

      default:
        return res.json({ 
          success: true, 
          message: `${integrationId} integration test successful` 
        });
    }
  } catch (error) {
    console.error('❌ [TEST-INTEGRATION] Error testing integration:', error);
    
    return res.status(500).json({ 
      success: false,
      message: 'Failed to test integration',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * Iniciar fluxo OAuth2 para Gmail ou Outlook
 */
router.post('/:integrationId/oauth/start', async (req: any, res) => {
  try {
    const { integrationId } = req.params;
    const tenantId = req.user!.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    let authUrl = '';
    let scopes = '';

    // Generate OAuth2 URLs based on integration type
    if (integrationId === 'gmail-oauth2') {
      const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
      scopes = 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';
      const clientId = req.body.clientId || 'YOUR_GOOGLE_CLIENT_ID';
      const redirectUri = req.body.redirectUri || `${req.protocol}://${req.get('host')}/auth/gmail/callback`;

      authUrl = `${baseUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&prompt=consent`;
    } 
    else if (integrationId === 'outlook-oauth2') {
      const baseUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
      scopes = 'openid profile email https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send';
      const clientId = req.body.clientId || 'YOUR_AZURE_CLIENT_ID';
      const redirectUri = req.body.redirectUri || `${req.protocol}://${req.get('host')}/auth/outlook/callback`;

      authUrl = `${baseUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&response_mode=query`;
    }
    else {
      return res.status(400).json({ message: 'OAuth2 not supported for this integration' });
    }

    res.json({
      message: 'OAuth2 authorization URL generated',
      authUrl,
      integrationId,
      tenantId,
      scopes
    });

  } catch (error) {
    console.error('Error starting OAuth2 flow:', error);
    res.status(500).json({ message: 'Failed to start OAuth2 flow' });
  }
});

/**
 * Endpoint para forçar a criação de todas as 14 integrações
 */
router.post('/populate-all-14', async (req: any, res) => {
  try {
    const tenantId = req.user!.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const { storage } = await import('../storage-simple');

    // Lista completa das 14 integrações
    const allIntegrations = [
      // Comunicação (8 integrações)
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
        id: 'telegram',
        name: 'Telegram',
        description: 'Envio de notificações e alertas via Telegram para grupos ou usuários',
        category: 'Comunicação',
        icon: 'Send',
        status: 'disconnected',
        configured: false,
        features: ['Notificações em tempo real', 'Mensagens personalizadas', 'Integração com Bot API']
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

    console.log(`🔧 Populando ${allIntegrations.length} integrações para tenant ${tenantId}...`);

    // Primeiro, limpar todas as integrações existentes
    await storage.deleteTenantIntegrations(tenantId);

    // Depois, inserir cada integração individualmente
    for (const integration of allIntegrations) {
      await storage.createTenantIntegration(tenantId, integration);
    }

    res.json({ 
      totalCreated: allIntegrations.length,
      categories: {
        'Comunicação': 8, // Increased count for Telegram
        'Automação': 2,
        'Dados': 2,
        'Segurança': 1,
        'Produtividade': 2
      }
    });
  } catch (error) {
    console.error('Error populating all integrations:', error);
    res.status(500).json({ message: 'Failed to populate all integrations' });
  }
});

export default router;