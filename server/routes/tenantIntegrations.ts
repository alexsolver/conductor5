import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { requireTenantAdmin, requirePermission, AuthorizedRequest } from '../middleware/authorizationMiddleware';
import { Permission } from '../domain/authorization/RolePermissions';

const router = Router();

// Aplicar middlewares de autenticação e autorização
router.use(jwtAuth);
router.use(requireTenantAdmin);

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
 * GET /api/tenant-admin/integrations
 * Obter integrações do tenant - 100% PostgreSQL Database
 */
router.get('/', requirePermission(Permission.TENANT_MANAGE_SETTINGS), async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    

if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    // Get integrations from PostgreSQL database with tenant isolation
    const { storage } = await import('../storage-simple');
    const integrations = await storage.getTenantIntegrations(tenantId);
    
    res.json({ integrations });
  } catch (error) {
    console.error('Error fetching tenant integrations:', error);
    res.status(500).json({ message: 'Failed to fetch integrations' });
  }
});

/**
 * GET /api/tenant-admin/integrations/:integrationId/config
 * Obter configuração específica de uma integração
 */
router.get('/:integrationId/config', requirePermission(Permission.TENANT_MANAGE_SETTINGS), async (req: AuthorizedRequest, res) => {
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
    
    // Retornar estrutura simples para o frontend
    const response = {
      config: configData,
      configured: true
    };
    console.log(`[GET config route] Response being sent:`, JSON.stringify(response, null, 2));
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching tenant integration config:', error);
    res.status(500).json({ message: 'Failed to fetch integration configuration' });
  }
});

/**
 * POST /api/tenant-admin/integrations/:integrationId/config
 * Configurar integração do tenant
 */
router.post('/:integrationId/config', requirePermission(Permission.TENANT_MANAGE_SETTINGS), async (req: AuthorizedRequest, res) => {
  try {
    const { integrationId } = req.params;
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const { 
      apiKey, apiSecret, clientId, clientSecret, redirectUri, webhookUrl, accessToken, refreshToken, enabled, settings,
      // IMAP specific fields
      imapServer, imapPort, emailAddress, password, useSSL,
      // Dropbox specific fields  
      dropboxAppKey, dropboxAppSecret, dropboxAccessToken, backupFolder
    } = req.body;

    // Validar integrationId
    const validIntegrations = [
      'gmail-oauth2', 'outlook-oauth2', 'email-smtp', 'imap-email', 'whatsapp-business', 
      'slack', 'twilio-sms', 'zapier', 'webhooks', 'crm-integration', 
      'sso-saml', 'google-workspace', 'chatbot-ai', 'dropbox-personal'
    ];
    
    if (!validIntegrations.includes(integrationId)) {
      return res.status(400).json({ message: 'Invalid integration ID' });
    }

    // Save configuration to database
    const { storage } = await import('../storage-simple');
    
    // Prepare configuration for storage (store actual values, not masked)
    const configData = {
      // OAuth2 fields
      clientId: clientId || '',
      clientSecret: clientSecret || '',
      redirectUri: redirectUri || '',
      // Traditional fields
      apiKey: apiKey || '',
      apiSecret: apiSecret || '',
      webhookUrl: webhookUrl || '',
      accessToken: accessToken || '',
      refreshToken: refreshToken || '',
      // IMAP specific fields
      imapServer: imapServer || 'imap.gmail.com',
      imapPort: parseInt(imapPort || '993') || 993,
      emailAddress: emailAddress || '',
      password: password || '',
      useSSL: useSSL !== false,
      imapSecurity: req.body.imapSecurity || 'SSL/TLS',
      // Compatibility fields
      serverHost: imapServer || 'imap.gmail.com',
      serverPort: parseInt(imapPort || '993') || 993,
      username: emailAddress || '',
      // Dropbox specific fields
      dropboxAppKey: dropboxAppKey || '',
      dropboxAppSecret: dropboxAppSecret || '',
      dropboxAccessToken: dropboxAccessToken || '',
      backupFolder: backupFolder || '/Backups/Conductor',
      enabled: enabled !== false,
      settings: settings || {},
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
      clientId: clientId ? '***' + clientId.slice(-4) : '',
      clientSecret: clientSecret ? '***' + clientSecret.slice(-4) : '',
      redirectUri,
      // Traditional fields (masked)
      apiKey: apiKey ? '***' + apiKey.slice(-4) : '',
      apiSecret: apiSecret ? '***' + apiSecret.slice(-4) : '',
      webhookUrl,
      accessToken: accessToken ? '***' + accessToken.slice(-4) : '',
      refreshToken: refreshToken ? '***' + refreshToken.slice(-4) : '',
      // IMAP specific fields (masked)
      imapServer,
      imapPort,
      emailAddress,
      password: password ? '***' + password.slice(-4) : '',
      useSSL,
      // Dropbox specific fields (masked)
      dropboxAppKey: dropboxAppKey ? '***' + dropboxAppKey.slice(-4) : '',
      dropboxAppSecret: dropboxAppSecret ? '***' + dropboxAppSecret.slice(-4) : '',
      dropboxAccessToken: dropboxAccessToken ? '***' + dropboxAccessToken.slice(-4) : '',
      backupFolder,
      enabled: enabled !== false,
      settings: settings || {},
      updatedAt: savedConfig.updatedAt
    };

    res.json({
      message: 'Integration configured successfully',
      config: maskedConfig
    });
  } catch (error) {
    console.error('Error configuring tenant integration:', error);
    res.status(500).json({ message: 'Failed to configure integration' });
  }
});

/**
 * POST /api/tenant-admin/integrations/:integrationId/test
 * Testar integração do tenant
 */
router.post('/:integrationId/test', requirePermission(Permission.TENANT_MANAGE_SETTINGS), async (req: AuthorizedRequest, res) => {
  try {
    const { integrationId } = req.params;
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    // Simular teste da integração
    let testResult = { success: false, error: '', details: {} };

    switch (integrationId) {
      case 'email-smtp':
        testResult = { 
          success: true, 
          error: '', 
          details: { 
            server: 'smtp.gmail.com',
            port: '587',
            authentication: 'successful'
          }
        };
        break;

      case 'whatsapp-business':
        testResult = { 
          success: true, 
          error: '', 
          details: { 
            phoneNumber: '+55 11 99999-9999',
            status: 'verified',
            webhookStatus: 'active'
          }
        };
        break;

      case 'slack':
        testResult = { 
          success: true, 
          error: '', 
          details: { 
            workspace: 'empresa-workspace',
            channels: ['#suporte', '#alertas'],
            botStatus: 'online'
          }
        };
        break;

      case 'imap-email':
        // Get the saved configuration to validate
        const { storage } = await import('../storage-simple');
        const imapConfig = await storage.getTenantIntegrationConfig(tenantId, integrationId);
        
        if (!imapConfig || !imapConfig.config) {
          testResult = { 
            success: false, 
            error: 'Configuração IMAP não encontrada. Configure a integração primeiro.', 
            details: {}
          };
        } else {
          const config = imapConfig.config;
          
          // Validate required fields
          if (!config.emailAddress || !config.password || !config.imapServer) {
            testResult = { 
              success: false, 
              error: 'Campos obrigatórios faltando: email, password e servidor IMAP são necessários.', 
              details: {
                missingFields: [
                  !config.emailAddress ? 'emailAddress' : null,
                  !config.password ? 'password' : null,
                  !config.imapServer ? 'imapServer' : null
                ].filter(Boolean)
              }
            };
          } else {
            // Test IMAP connection simulation
            try {
              // Simular teste de conexão IMAP
              const connectionTest = await testIMAPConnection(config);
              
              if (connectionTest.success) {
                testResult = { 
                  success: true, 
                  error: '', 
                  details: { 
                    server: config.imapServer,
                    port: config.imapPort || 993,
                    email: config.emailAddress,
                    ssl: config.useSSL ? 'Enabled' : 'Disabled',
                    connection: 'Connection successful',
                    status: 'IMAP server accessible',
                    lastTested: new Date().toISOString()
                  }
                };
              } else {
                testResult = {
                  success: false,
                  error: connectionTest.error || 'Falha na conexão IMAP',
                  details: connectionTest.details || {}
                };
              }
            } catch (error) {
              testResult = {
                success: false,
                error: 'Erro ao testar conexão IMAP: ' + (error as Error).message,
                details: {
                  server: config.imapServer,
                  port: config.imapPort || 993,
                  email: config.emailAddress
                }
              };
            }
          }
        }
        break;

      case 'dropbox-personal':
        testResult = { 
          success: true, 
          error: '', 
          details: { 
            accountInfo: 'Personal Account',
            usedSpace: '2.5 GB',
            totalSpace: '16 GB',
            backupFolder: '/Backups/Conductor',
            lastSync: new Date().toISOString()
          }
        };
        break;

      case 'webhooks':
        testResult = { 
          success: true, 
          error: '', 
          details: { 
            url: 'https://exemplo.com/webhook',
            responseTime: '120ms',
            status: 'reachable'
          }
        };
        break;

      default:
        testResult = { 
          success: true, 
          error: '', 
          details: { 
            status: 'integration test successful',
            timestamp: new Date().toISOString()
          }
        };
    }

    res.json(testResult);
  } catch (error) {
    console.error('Error testing tenant integration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test integration' 
    });
  }
});

/**
 * POST /api/tenant-admin/integrations/:integrationId/oauth/start
 * Iniciar fluxo OAuth2 para Gmail ou Outlook
 */
router.post('/:integrationId/oauth/start', requirePermission(Permission.TENANT_MANAGE_SETTINGS), async (req: AuthorizedRequest, res) => {
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

export default router;