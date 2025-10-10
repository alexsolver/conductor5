import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { enhancedTenantValidator } from '../middleware/tenantValidator';
// ✅ LEGACY authorizationMiddleware eliminated per 1qa.md
import { Permission } from '../domain/authorization/RolePermissions';

const router = Router();

// ✅ DEBUG: Log quando as rotas são carregadas
console.log('🔧 [TENANT-INTEGRATIONS] Registrando rotas de integrações tenant...');

// WEBHOOK ROUTES - Removed duplicate route
// Note: Webhook processing is now handled by /api/webhooks/telegram/:tenantId

// Aplicar middlewares de autenticação e autorização para rotas restantes
router.use(jwtAuth);

// ✅ AUTHENTICATION: Log authentication middleware application
console.log('🔧 [TENANT-INTEGRATIONS] JWT authentication middleware applied to all routes');


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

    // ✅ TELEGRAM FIX: Log específico para verificar se Telegram está nas integrações
    const telegramIntegration = integrations.find(i => i.id === 'telegram');
    if (telegramIntegration) {
      console.log(`✅ TELEGRAM FOUND in tenantIntegrations.ts:`, {
        id: telegramIntegration.id,
        name: telegramIntegration.name,
        status: telegramIntegration.status,
        configured: telegramIntegration.configured
      });
    } else {
      console.log(`❌ TELEGRAM NOT FOUND in ${integrations.length} integrations`);
      console.log(`🔍 Available integrations:`, integrations.map(i => i.id).join(', '));
    }

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
// ✅ GET /api/tenant-admin/integrations/:integrationId/config - Get integration configuration
router.get('/:integrationId/config', async (req: any, res: any) => {
  try {
    // ✅ CRITICAL FIX: Set JSON content type header immediately
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');

    console.log(`🔍 [GET-CONFIG] Route hit for integration: ${req.params.integrationId}`);

    const { integrationId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      console.error('❌ [GET-CONFIG] Tenant ID not found');
      return res.status(401).json({
        success: false,
        message: 'Tenant ID not found'
      });
    }

    if (!integrationId) {
      console.error('❌ [GET-CONFIG] Integration ID not provided');
      return res.status(400).json({
        success: false,
        message: 'Integration ID is required'
      });
    }

    console.log(`[GET config route] Buscando config para tenant: ${tenantId}, integration: ${integrationId}`);
    
    // ✅ SAFETY: Import with comprehensive error handling
    let storage;
    try {
      const importResult = await import('../storage-simple');
      storage = importResult.storage;

      if (!storage) {
        throw new Error('Storage instance not available');
      }
    } catch (importError) {
      console.error('❌ [GET-CONFIG] Storage import error:', importError);
      return res.status(500).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    const configResult = await storage.getTenantIntegrationConfig(tenantId, integrationId);
    console.log(`[GET config route] Resultado recebido do storage:`, configResult);

    if (!configResult) {
      console.log(`⚠️ [GET config route] Nenhuma config encontrada para ${integrationId}, retornando dados padrão`);
      return res.json({ 
        configured: false, 
        config: {},
        message: `Configuração não encontrada para ${integrationId}`
      });
    }

    // ✅ SECURITY: Retornar dados mascarados para segurança
    // Note: configResult is already the config object directly, not wrapped
    
    // Map generic fields back to provider-specific fields
    const configData: any = {
      // Mascarar dados sensíveis
      apiKey: configResult.apiKey ? '••••••••' : '',
      apiSecret: configResult.apiSecret ? '••••••••' : '',
      clientSecret: configResult.clientSecret ? '••••••••' : '',
      password: configResult.password ? '••••••••' : '',
      accessToken: configResult.accessToken ? '••••••••' : '',
      refreshToken: configResult.refreshToken ? '••••••••' : '',
      dropboxAppSecret: configResult.dropboxAppSecret ? '••••••••' : '',
      dropboxAccessToken: configResult.dropboxAccessToken ? '••••••••' : '',
      // ✅ TELEGRAM SPECIFIC: Mascarar token do Telegram mas manter Chat ID
      telegramBotToken: configResult.telegramBotToken ? '••••••••' : '',
      telegramChatId: configResult.telegramChatId || '',
      // Manter outros campos não sensíveis
      enabled: configResult.enabled,
      clientId: configResult.clientId,
      redirectUri: configResult.redirectUri,
      webhookUrl: configResult.webhookUrl,
      telegramWebhookUrl: configResult.telegramWebhookUrl,
      imapServer: configResult.imapServer,
      imapPort: configResult.imapPort,
      imapSecurity: configResult.imapSecurity,
      emailAddress: configResult.emailAddress,
      useSSL: configResult.useSSL,
      backupFolder: configResult.backupFolder,
      settings: configResult.settings || {},
      // AI Provider fields
      baseUrl: configResult.baseUrl || '',
      model: configResult.model || '',
      maxTokens: configResult.maxTokens,
      temperature: configResult.temperature,
      topP: configResult.topP,
      frequencyPenalty: configResult.frequencyPenalty,
      presencePenalty: configResult.presencePenalty,
    };
    
    // Add provider-specific mapped fields
    if (integrationId === 'openai') {
      configData.openaiApiKey = configResult.apiKey ? '••••••••' : '';
      configData.openaiModel = configResult.model || '';
    } else if (integrationId === 'deepseek') {
      configData.deepseekApiKey = configResult.apiKey ? '••••••••' : '';
      configData.deepseekModel = configResult.model || '';
    } else if (integrationId === 'googleai') {
      configData.googleaiApiKey = configResult.apiKey ? '••••••••' : '';
      configData.googleaiModel = configResult.model || '';
    }
    
    const maskedConfig = {
      configured: true,
      config: configData
    };

    console.log(`✅ [GET config route] Retornando config mascarada para ${integrationId}`);
    res.json(maskedConfig);
  } catch (error) {
    console.error('❌ [GET-CONFIG] Error fetching tenant integration config:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch integration configuration' 
    });
  }
});

/**
 * Configurar integração do tenant
 */
router.post('/:integrationId/config', jwtAuth, async (req: any, res) => {
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

    // Map AI provider specific fields to generic apiKey field
    let apiKeyValue = req.body.apiKey || '';
    let modelValue = req.body.model || '';
    
    if (integrationId === 'openai') {
      apiKeyValue = req.body.openaiApiKey || req.body.apiKey || '';
      modelValue = req.body.openaiModel || req.body.model || '';
    } else if (integrationId === 'deepseek') {
      apiKeyValue = req.body.deepseekApiKey || req.body.apiKey || '';
      modelValue = req.body.deepseekModel || req.body.model || '';
    } else if (integrationId === 'googleai') {
      apiKeyValue = req.body.googleaiApiKey || req.body.apiKey || '';
      modelValue = req.body.googleaiModel || req.body.model || '';
    }

    // Validate required fields for Telegram
    if (integrationId === 'telegram') {
      const { telegramBotToken, telegramChatId } = req.body;

      if (!telegramBotToken || telegramBotToken.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Bot Token é obrigatório para o Telegram'
        });
      }

      if (!telegramChatId || telegramChatId.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Chat ID ou @username é obrigatório para o Telegram'
        });
      }

      // Basic token validation
      if (!telegramBotToken.includes(':')) {
        return res.status(400).json({
          success: false,
          message: 'Formato do Bot Token inválido. O token deve ter o formato "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"'
        });
      }

      // ✅ TELEGRAM USERNAME SUPPORT: Validate Chat ID format (numeric, @username, or username)
      const chatIdValue = telegramChatId.trim();
      const isNumericChatId = /^-?\d+$/.test(chatIdValue);
      const isUsername = chatIdValue.startsWith('@') || /^[a-zA-Z0-9_]{5,}$/.test(chatIdValue);

      if (!isNumericChatId && !isUsername) {
        return res.status(400).json({
          success: false,
          message: 'Formato do Chat ID/Username inválido. Use um ID numérico (ex: 123456789) ou username (ex: @meucanal ou meucanal)'
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
      apiKey: apiKeyValue,
      apiSecret: req.body.apiSecret || '',
      webhookUrl: req.body.webhookUrl || '',
      accessToken: req.body.accessToken || '',
      refreshToken: req.body.refreshToken || '',
      // AI Provider specific fields (OpenAI, DeepSeek, Google AI)
      baseUrl: req.body.baseUrl || '',
      model: modelValue,
      maxTokens: req.body.maxTokens ? Number(req.body.maxTokens) : undefined,
      temperature: req.body.temperature !== undefined ? Number(req.body.temperature) : undefined,
      topP: req.body.topP !== undefined ? Number(req.body.topP) : undefined,
      frequencyPenalty: req.body.frequencyPenalty !== undefined ? Number(req.body.frequencyPenalty) : undefined,
      presencePenalty: req.body.presencePenalty !== undefined ? Number(req.body.presencePenalty) : undefined,
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
      // Telegram templates
      notificationTemplate: req.body.notificationTemplate || '',
      alertTemplate: req.body.alertTemplate || '',
      summaryTemplate: req.body.summaryTemplate || '',
      customTemplate: req.body.customTemplate || '',
      // WhatsApp Business specific fields
      whatsappApiKey: req.body.whatsappApiKey || '',
      whatsappPhoneNumberId: req.body.whatsappPhoneNumberId || '',
      whatsappWebhookUrl: req.body.whatsappWebhookUrl || '',
      whatsappVerifyToken: req.body.whatsappVerifyToken || '',
      whatsappNotificationTemplate: req.body.whatsappNotificationTemplate || '',
      whatsappConfirmationTemplate: req.body.whatsappConfirmationTemplate || '',
      enabled: req.body.enabled !== false,
      settings: req.body.settings || {},
      // Metadata
      lastUpdated: new Date().toISOString(),
      integrationVersion: '1.0'
    };


    console.log(`[POST config] Dados preparados para ${integrationId}:`, configData);

    // Save to database
    const savedConfig = await storage.saveTenantIntegrationConfig(tenantId, integrationId, configData);

    // 🎮 DISCORD GATEWAY: Auto-connect when Discord Bot Token is configured
    if (integrationId === 'discord' && apiKeyValue && apiKeyValue !== '••••••••') {
      try {
        const { discordGatewayService } = await import('../services/DiscordGatewayService');
        console.log(`🎮 [DISCORD-GATEWAY] Initializing Gateway connection for tenant: ${tenantId}`);
        await discordGatewayService.connect(tenantId, apiKeyValue);
        console.log(`✅ [DISCORD-GATEWAY] Gateway connection initiated successfully`);
      } catch (error) {
        console.error(`❌ [DISCORD-GATEWAY] Failed to connect Gateway:`, error);
      }
    }

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
      updatedAt: savedConfig?.updatedAt || savedConfig?.updated_at || new Date().toISOString()
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
router.post('/:integrationId/test', jwtAuth, async (req: any, res) => {
  try {
    // ✅ CRITICAL FIX: Set JSON content type header immediately to prevent HTML error pages
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');

    console.log(`🧪 [TESTE-INTEGRAÇÃO] Iniciando teste para integração: ${req.params.integrationId}`);
    console.log(`🧪 [TEST-DEBUG] User:`, req.user);
    console.log(`🧪 [TEST-DEBUG] Params:`, req.params);

    const { integrationId } = req.params;
    const tenantId = req.user?.tenantId;

    console.log(`🧪 [TEST-DEBUG] integrationId: ${integrationId}, tenantId: ${tenantId}`);

    // ✅ VALIDATION: Early validation with proper error response
    if (!tenantId) {
      console.log(`❌ [TEST-DEBUG] No tenantId found`);
      return res.status(400).json({ 
        success: false, 
        message: 'User not associated with a tenant' 
      });
    }

    // ✅ VALIDATION: Integration ID validation
    if (!integrationId || typeof integrationId !== 'string') {
      console.log(`❌ [TEST-DEBUG] Invalid integrationId: ${integrationId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid integration ID provided'
      });
    }

    console.log(`🧪 [TEST-INTEGRATION] Testing integration: ${integrationId} for tenant: ${tenantId}`);

    // ✅ SAFETY: Import with comprehensive error handling
    let storage;
    try {
      const importResult = await import('../storage-simple');
      storage = importResult.storage;

      if (!storage) {
        throw new Error('Storage instance not available');
      }
    } catch (importError) {
      console.error('❌ [TEST-INTEGRATION] Storage import error:', importError);
      return res.status(500).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    // ✅ SAFETY: Get integration configuration with proper error handling
    let configResult;
    try {
      configResult = await storage.getTenantIntegrationConfig(tenantId, integrationId);
      console.log(`🔍 [TEST-INTEGRATION] Config retrieved:`, configResult ? 'Found' : 'Not found');
      console.log(`🔍 [TEST-INTEGRATION] Config type:`, typeof configResult);
      if (configResult) {
        console.log(`🔍 [TEST-INTEGRATION] Config keys:`, Object.keys(configResult));
        console.log(`🔍 [TEST-INTEGRATION] Has apiKey:`, Boolean(configResult.apiKey));
      }
    } catch (configError) {
      console.error('❌ [TEST-INTEGRATION] Config retrieval error:', configError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar configuração da integração'
      });
    }

    // ✅ CRITICAL FIX: getTenantIntegrationConfig returns config directly, not wrapped
    if (!configResult || typeof configResult !== 'object') {
      console.log(`❌ [TEST-INTEGRATION] Config validation failed - returning 404`);
      return res.status(404).json({
        success: false,
        message: 'Integração não configurada. Configure a integração antes de testá-la.'
      });
    }

    // ✅ CRITICAL FIX: Test based on integration type with comprehensive error handling
    if (integrationId === 'telegram') {
      try {
        const config = configResult;
        console.log(`🔍 [TELEGRAM-TEST] Config validation started`);

        // ✅ VALIDATION: Check required configuration fields
        if (!config || typeof config !== 'object') {
          console.log(`❌ [TELEGRAM-TEST] Invalid config object`);
          return res.status(400).json({
            success: false,
            message: 'Configuração da integração inválida ou ausente'
          });
        }

        if (!config.telegramBotToken || typeof config.telegramBotToken !== 'string') {
          console.log(`❌ [TELEGRAM-TEST] Missing bot token`);
          return res.status(400).json({
            success: false,
            message: 'Bot Token não configurado. Configure o Bot Token para continuar.'
          });
        }

        if (!config.telegramChatId || typeof config.telegramChatId !== 'string') {
          console.log(`❌ [TELEGRAM-TEST] Missing chat ID`);
          return res.status(400).json({
            success: false,
            message: 'Chat ID não configurado. Configure o Chat ID para continuar.'
          });
        }

        // ✅ VALIDATION: Basic bot token format validation
        if (!config.telegramBotToken.includes(':')) {
          console.log(`❌ [TELEGRAM-TEST] Invalid token format`);
          return res.status(400).json({
            success: false,
            message: 'Formato do Bot Token inválido. O token deve ter o formato "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"'
          });
        }

        // ✅ SAFETY: Test Telegram bot by sending a test message
        const testMessage = `🧪 Teste de Integração Telegram\n\n✅ Tenant: ${tenantId}\n📅 Data: ${new Date().toLocaleString('pt-BR')}\n🔧 Status: Configuração validada com sucesso!\n\nSe você recebeu esta mensagem, a integração está funcionando corretamente.`;

        console.log(`📤 [TELEGRAM-TEST] Sending test message to Telegram API`);

        // ✅ CRITICAL FIX: Proper fetch with timeout and comprehensive error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout to 15s

        let telegramResponse;
        try {
          telegramResponse = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Conductor-Integration-Test/1.0',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              chat_id: config.telegramChatId,
              text: testMessage,
              parse_mode: 'HTML'
            }),
            signal: controller.signal
          });
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          console.error(`❌ [TELEGRAM-TEST] Fetch error:`, fetchError);

          if (fetchError.name === 'AbortError') {
            return res.status(408).json({
              success: false,
              message: 'Timeout na conexão com Telegram API. Verifique sua conexão de internet.'
            });
          }

          return res.status(500).json({
            success: false,
            message: 'Erro de conectividade com Telegram API',
            details: {
              error: fetchError.message || 'Network error'
            }
          });
        }

        clearTimeout(timeoutId);
        console.log(`📥 [TELEGRAM-TEST] Response status: ${telegramResponse.status}`);

        // ✅ CRITICAL FIX: Proper response handling with detailed error messages
        if (telegramResponse.ok) {
          let telegramResult;
          try {
            telegramResult = await telegramResponse.json();
          } catch (jsonError) {
            console.error(`❌ [TELEGRAM-TEST] JSON parse error:`, jsonError);
            return res.status(500).json({
              success: false,
              message: 'Resposta inválida da API do Telegram'
            });
          }

          console.log(`✅ [TELEGRAM-TEST] Mensagem enviada com sucesso:`, telegramResult);

          // Update integration status to 'connected' after successful test
          await storage.updateTenantIntegrationStatus(tenantId, integrationId, 'connected');

          return res.status(200).json({ 
            success: true, 
            message: '✅ Teste do Telegram realizado com sucesso! Mensagem enviada para o chat configurado.',
            details: {
              messageId: telegramResult.result?.message_id,
              chatId: config.telegramChatId,
              timestamp: new Date().toISOString(),
              status: 'sent'
            }
          });
        } else {
          let telegramError;
          try {
            telegramError = await telegramResponse.json();
          } catch (jsonError) {
            telegramError = {
              description: `HTTP ${telegramResponse.status} - ${telegramResponse.statusText}`
            };
          }

          console.error(`❌ [TELEGRAM-TEST] API error:`, telegramError);

          // ✅ IMPROVED: Better error messages based on common Telegram API errors
          let userFriendlyMessage = 'Erro na API do Telegram';
          if (telegramError.error_code === 401) {
            userFriendlyMessage = 'Bot Token inválido. Verifique se o token está correto.';
          } else if (telegramError.error_code === 400 && telegramError.description?.includes('chat not found')) {
            userFriendlyMessage = 'Chat ID não encontrado. Verifique se o Chat ID está correto e se o bot foi adicionado ao chat.';
          } else if (telegramError.error_code === 403) {
            userFriendlyMessage = 'Bot sem permissão para enviar mensagens. Verifique se o bot foi adicionado ao chat e tem permissões adequadas.';
          } else if (telegramError.description) {
            userFriendlyMessage = `Erro do Telegram: ${telegramError.description}`;
          }

          return res.status(400).json({ 
            success: false, 
            message: userFriendlyMessage,
            details: {
              errorCode: telegramError.error_code || telegramResponse.status,
              status: telegramResponse.status,
              telegramErrorDescription: telegramError.description || 'Unknown error'
            }
          });
        }
      } catch (telegramError: any) {
        console.error(`❌ [TELEGRAM-TEST] Unexpected error:`, telegramError);

        return res.status(500).json({ 
          success: false, 
          message: 'Erro inesperado ao testar integração Telegram',
          details: {
            error: telegramError.message || 'Unknown error',
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // ✅ REAL TESTS: Implement real API tests for all integrations
    // ✅ CRITICAL FIX: configResult IS the config object, not wrapped
    const config = configResult;
    
    switch (integrationId) {
      case 'gmail-oauth2':
        return await testGmailOAuth2(config, res, tenantId);

      case 'outlook-oauth2':
        return await testOutlookOAuth2(config, res, tenantId);

      case 'email-smtp':
        return await testEmailSMTP(config, res, tenantId);

      case 'imap-email':
        return await testIMAPEmail(config, res, tenantId);

      case 'whatsapp-business':
        return await testWhatsAppBusiness(config, res, tenantId);

      case 'slack':
        return await testSlack(config, res, tenantId);

      case 'twilio-sms':
        return await testTwilioSMS(config, res, tenantId);

      case 'zapier':
        return await testZapier(config, res, tenantId);

      case 'webhooks':
        return await testWebhooks(config, res, tenantId);

      case 'crm-integration':
        return await testCRMIntegration(config, res, tenantId);

      case 'dropbox-personal':
        return await testDropboxPersonal(config, res, tenantId);

      case 'sso-saml':
        return await testSSOSAML(config, res, tenantId);

      case 'google-workspace':
        return await testGoogleWorkspace(config, res, tenantId);

      case 'openai':
        return await testOpenAI(config, res, tenantId);

      case 'deepseek':
        return await testDeepSeek(config, res, tenantId);

      case 'googleai':
        return await testGoogleAI(config, res, tenantId);

      // === NOVAS INTEGRAÇÕES TENANT ADMIN ===
      case 'microsoft-365':
        return await testMicrosoft365(config, res, tenantId);

      case 'discord':
        return await testDiscord(config, res, tenantId);

      case 'oauth2-generic':
        return await testOAuth2Generic(config, res, tenantId);

      case 'azure-ad':
        return await testAzureAD(config, res, tenantId);

      case 'google-workspace-sso':
        return await testGoogleWorkspaceSSO(config, res, tenantId);

      case 'sap':
        return await testSAP(config, res, tenantId);

      case 'totvs':
        return await testTotvs(config, res, tenantId);

      case 'jira-service-management':
        return await testJiraServiceManagement(config, res, tenantId);

      case 'servicenow':
        return await testServiceNow(config, res, tenantId);

      case 'zendesk':
        return await testZendesk(config, res, tenantId);

      case 'freshdesk':
        return await testFreshdesk(config, res, tenantId);

      default:
        return res.status(400).json({ 
          success: false, 
          message: `Integração ${integrationId} não suportada para teste real.`
        });
    }
  } catch (error: any) {
    console.error('❌ [TESTE-INTEGRAÇÃO] Erro crítico do sistema:', error);

    // ✅ CRITICAL FIX: Ensure JSON response even in catastrophic failure
    try {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({ 
          success: false,
          message: 'Erro interno do servidor durante teste de integração',
          details: {
            error: error.message || 'Critical system error',
            timestamp: new Date().toISOString()
          }
        });
      } else {
        console.error('❌ [TESTE-INTEGRAÇÃO] Headers já enviados, não é possível definir resposta JSON');
      }
    } catch (headerError) {
      // ✅ LAST RESORT: If even setting headers fails, return a simple response
      console.error('❌ [TESTE-INTEGRAÇÃO] Falha ao definir headers:', headerError);
      if (!res.headersSent) {
        return res.end(JSON.stringify({
          success: false,
          message: 'Critical system error'
        }));
      }
    }
  }
});

/**
 * Iniciar fluxo OAuth2 para Gmail ou Outlook
 */
router.post('/:integrationId/oauth/start', jwtAuth, async (req: any, res) => {
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
router.post('/populate-all-14', jwtAuth, async (req: any, res) => {
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
        status: 'disconnected',
        configured: false,
        features: ['Mensagens automáticas', 'Templates aprovados', 'Webhooks', 'Métricas avançadas']
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
      }
    ];

    console.log(`🔧 Populando ${allIntegrations.length} integrações para tenant ${tenantId}...`);

    // Primeiro, limpar todas as integrações existentes
    await storage.deleteTenantIntegrations(tenantId);

    // Depois, criar integrações padrão
    await storage.initializeTenantIntegrations(tenantId);

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

// Rota de webhook removida - agora está antes do middleware de autenticação

/**
 * Set Telegram Webhook URL
 * POST /api/tenant-admin/integrations/telegram/set-webhook
 */
router.post('/telegram/set-webhook', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    let { webhookUrl, useDefault } = req.body;

    console.log(`🔧 [TELEGRAM-WEBHOOK-SETUP] Setting webhook for tenant: ${tenantId}`);

    // ✅ AUTO-WEBHOOK: Generate default webhook URL if requested
    if (useDefault === true || !webhookUrl) {
      // Generate default webhook URL based on current request
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      const host = req.get('x-forwarded-host') || req.get('host');
      
      if (!host) {
        return res.status(400).json({
          success: false,
          message: 'Não foi possível determinar a URL do servidor automaticamente'
        });
      }

      // Generate the default webhook URL
      webhookUrl = `${protocol}://${host}`;
      
      console.log(`🔧 [TELEGRAM-WEBHOOK-SETUP] Generated default webhook URL: ${webhookUrl}`);
    }

    // ✅ VALIDATION: Check webhook URL format
    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'URL do webhook é obrigatória'
      });
    }

    if (!webhookUrl.startsWith('https://')) {
      return res.status(400).json({
        success: false,
        message: 'URL do webhook deve usar HTTPS'
      });
    }

    // ✅ GET CONFIG: Load Telegram configuration
    const { storage } = await import('../storage-simple');
    const configResult = await storage.getTenantIntegrationConfig(tenantId, 'telegram');

    if (!configResult.configured) {
      return res.status(400).json({
        success: false,
        message: 'Configure a integração Telegram antes de definir o webhook'
      });
    }

    const config = configResult.config;

    // ✅ SET WEBHOOK: Smart URL construction to avoid duplication
    let telegramWebhookUrl;
    const expectedPath = `/api/webhooks/telegram/${tenantId}`;
    
    // Check if the webhook URL already contains the webhook path
    if (webhookUrl.includes('/api/webhooks/telegram/')) {
      // URL already has the full path - use as-is after validation
      telegramWebhookUrl = webhookUrl;
      
      // Security: Validate that the tenantId in the URL matches current tenant
      if (!webhookUrl.endsWith(expectedPath)) {
        return res.status(400).json({
          success: false,
          message: 'URL do webhook contém tenant ID incorreto'
        });
      }
    } else {
      // URL is just the origin/domain - append the webhook path
      telegramWebhookUrl = `${webhookUrl}${expectedPath}`;
    }

    console.log(`📤 [TELEGRAM-WEBHOOK-SETUP] Setting webhook URL: ${telegramWebhookUrl}`);

    const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: telegramWebhookUrl,
        allowed_updates: ['message', 'callback_query']
      })
    });

    const result = await response.json();

    if (result.ok) {
      // ✅ SAVE: Update configuration with webhook URL
      const updatedConfig = {
        ...config,
        telegramWebhookUrl: telegramWebhookUrl,
        webhookConfigured: true,
        lastWebhookUpdate: new Date().toISOString()
      };

      await storage.saveTenantIntegrationConfig(tenantId, 'telegram', updatedConfig);

      console.log(`✅ [TELEGRAM-WEBHOOK-SETUP] Webhook configured successfully`);

      return res.json({
        success: true,
        message: '✅ Webhook do Telegram configurado com sucesso!',
        details: {
          webhookUrl: telegramWebhookUrl,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      console.error(`❌ [TELEGRAM-WEBHOOK-SETUP] Failed to set webhook:`, result);

      return res.status(400).json({
        success: false,
        message: `Erro ao configurar webhook: ${result.description || 'Erro desconhecido'}`,
        details: result
      });
    }

  } catch (error: any) {
    console.error(`❌ [TELEGRAM-WEBHOOK-SETUP] Error:`, error);

    return res.status(500).json({
      success: false,
      message: 'Erro interno ao configurar webhook',
      error: error.message
    });
  }
});

/**
 * Get Webhook Status
 * GET /api/tenant-admin/integrations/telegram/webhook-status
 */
router.get('/telegram/webhook-status', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;

    // ✅ GET CONFIG: Load configuration
    const { storage } = await import('../storage-simple');
    const configResult = await storage.getTenantIntegrationConfig(tenantId, 'telegram');

    if (!configResult.configured) {
      return res.status(400).json({
        success: false,
        message: 'Integração Telegram não configurada'
      });
    }

    const config = configResult.config;

    // ✅ CHECK WEBHOOK: Get webhook info from Telegram
    const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/getWebhookInfo`);
    const webhookInfo = await response.json();

    if (webhookInfo.ok) {
      return res.json({
        success: true,
        webhookInfo: webhookInfo.result,
        localConfig: {
          webhookUrl: config.telegramWebhookUrl || null,
          webhookConfigured: config.webhookConfigured || false,
          lastUpdate: config.lastWebhookUpdate || null
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Erro ao obter status do webhook',
        error: webhookInfo.description
      });
    }

  } catch (error: any) {
    console.error(`❌ [TELEGRAM-WEBHOOK-STATUS] Error:`, error);

    return res.status(500).json({
      success: false,
      message: 'Erro interno ao verificar status do webhook',
      error: error.message
    });
  }
});

// ===== HELPER FUNCTIONS =====

/**
 * Process incoming Telegram text message
 */
export async function processTelegramMessage(tenantId: string, message: any) {
  try {
    console.log(`📝 [TELEGRAM-MESSAGE] Processing message for tenant: ${tenantId}`);
    console.log(`📝 [TELEGRAM-MESSAGE] From: ${message.from.first_name} (@${message.from.username})`);
    console.log(`📝 [TELEGRAM-MESSAGE] Text: ${message.text}`);

    // ✅ PROCESS WITH AUTOMATION: Using MessageIngestionService with ProcessMessageUseCase
    const { MessageIngestionService } = await import('../modules/omnibridge/infrastructure/services/MessageIngestionService');
    const { DrizzleMessageRepository } = await import('../modules/omnibridge/infrastructure/repositories/DrizzleMessageRepository');
    const { ProcessMessageUseCase } = await import('../modules/omnibridge/application/use-cases/ProcessMessageUseCase');
    
    const messageRepository = new DrizzleMessageRepository();
    const processMessageUseCase = new ProcessMessageUseCase(messageRepository);
    const ingestionService = new MessageIngestionService(messageRepository, processMessageUseCase);
    
    // Construct Telegram webhook data format
    const webhookData = {
      message: message
    };

    // Process through MessageIngestionService - this saves the message AND processes automation
    const result = await ingestionService.processTelegramWebhook(webhookData, tenantId);
    
    if (result.success) {
      console.log(`✅ [TELEGRAM-MESSAGE] Message processed successfully with automation`);
    } else {
      console.warn(`⚠️ [TELEGRAM-MESSAGE] Message processing completed with issues`);
    }
    
    return {
      messageId: message.message_id,
      chatId: message.chat.id,
      fromUserId: message.from.id,
      fromUsername: message.from.username,
      fromFirstName: message.from.first_name,
      text: message.text,
      timestamp: new Date(message.date * 1000).toISOString(),
      tenantId: tenantId,
      processed: result.success
    };

  } catch (error: any) {
    console.error(`❌ [TELEGRAM-MESSAGE] Error processing message:`, error);
    throw error;
  }
}

/**
 * Process Telegram callback query (button clicks)
 */
async function processTelegramCallback(tenantId: string, callbackQuery: any) {
  try {
    console.log(`🔘 [TELEGRAM-CALLBACK] Processing callback for tenant: ${tenantId}`);
    console.log(`🔘 [TELEGRAM-CALLBACK] Data: ${callbackQuery.data}`);
    console.log(`🔘 [TELEGRAM-CALLBACK] From: ${callbackQuery.from.first_name}`);

    // ✅ PROCESS CALLBACK: Handle button interactions
    const callbackData = {
      callbackId: callbackQuery.id,
      data: callbackQuery.data,
      messageId: callbackQuery.message?.message_id,
      chatId: callbackQuery.message?.chat?.id,
      fromUserId: callbackQuery.from.id,
      fromUsername: callbackQuery.from.username,
      fromFirstName: callbackQuery.from.first_name,
      timestamp: new Date().toISOString(),
      tenantId: tenantId
    };

    // ✅ SAVE TO INBOX: Store callback as interaction in inbox
    const { storage } = await import('../storage-simple');
    
    const inboxMessage = {
      id: `telegram-callback-${callbackQuery.id}-${Date.now()}`,
      tenant_id: tenantId,
      message_id: `telegram-callback-${callbackQuery.id}`,
      from_email: `telegram:${callbackQuery.from.id}`,
      from_name: callbackQuery.from.first_name + (callbackQuery.from.last_name ? ` ${callbackQuery.from.last_name}` : ''),
      to_email: 'telegram-bot@conductor.com',
      cc_emails: JSON.stringify([]),
      bcc_emails: JSON.stringify([]),
      subject: `Interação do Telegram - ${callbackQuery.from.first_name}`,
      body_text: `Botão clicado: ${callbackQuery.data}`,
      body_html: null,
      has_attachments: false,
      attachment_count: 0,
      attachment_details: JSON.stringify([]),
      email_headers: JSON.stringify({
        'telegram-chat-id': callbackQuery.message?.chat?.id?.toString(),
        'telegram-user-id': callbackQuery.from.id.toString(),
        'telegram-username': callbackQuery.from.username || '',
        'telegram-callback-id': callbackQuery.id,
        'telegram-callback-data': callbackQuery.data
      }),
      priority: 'low',
      is_read: false,
      is_processed: false,
      email_date: new Date().toISOString(),
      received_at: new Date().toISOString()
    };

    await storage.saveEmailToInbox(tenantId, inboxMessage);

    console.log(`✅ [TELEGRAM-CALLBACK] Callback saved to inbox successfully`);
    return callbackData;

  } catch (error: any) {
    console.error(`❌ [TELEGRAM-CALLBACK] Error processing callback:`, error);
    throw error;
  }
}

// ===========================
// REAL INTEGRATION TEST FUNCTIONS
// ===========================

/**
 * Test Gmail OAuth2 Integration
 */
async function testGmailOAuth2(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [GMAIL-TEST] Starting Gmail OAuth2 test`);
    
    if (!config.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access Token não configurado. Configure OAuth2 primeiro.'
      });
    }

    // Test Gmail API - Get user profile
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const profile = await response.json();
      return res.json({
        success: true,
        message: '✅ Teste do Gmail OAuth2 realizado com sucesso!',
        details: {
          email: profile.emailAddress,
          messagesTotal: profile.messagesTotal,
          threadsTotal: profile.threadsTotal,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      const error = await response.json();
      return res.status(400).json({
        success: false,
        message: `Erro na API do Gmail: ${error.error?.message || 'Token inválido'}`,
        details: { error: error.error }
      });
    }
  } catch (error: any) {
    console.error(`❌ [GMAIL-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao testar Gmail OAuth2',
      details: { error: error.message }
    });
  }
}

/**
 * Test Outlook OAuth2 Integration
 */
async function testOutlookOAuth2(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [OUTLOOK-TEST] Starting Outlook OAuth2 test`);
    
    if (!config.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access Token não configurado. Configure OAuth2 primeiro.'
      });
    }

    // Test Microsoft Graph API - Get user profile
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const profile = await response.json();
      return res.json({
        success: true,
        message: '✅ Teste do Outlook OAuth2 realizado com sucesso!',
        details: {
          email: profile.mail || profile.userPrincipalName,
          displayName: profile.displayName,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      const error = await response.json();
      return res.status(400).json({
        success: false,
        message: `Erro na API do Outlook: ${error.error?.message || 'Token inválido'}`,
        details: { error: error.error }
      });
    }
  } catch (error: any) {
    console.error(`❌ [OUTLOOK-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao testar Outlook OAuth2',
      details: { error: error.message }
    });
  }
}

/**
 * Test Email SMTP Integration
 */
async function testEmailSMTP(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [SMTP-TEST] Starting SMTP test`);
    
    const { serverHost, serverPort, username, password, useSSL } = config;
    
    if (!serverHost || !serverPort || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Configuração SMTP incompleta. Configure servidor, porta, usuário e senha.'
      });
    }

    // Import nodemailer for real SMTP testing
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      host: serverHost,
      port: parseInt(serverPort),
      secure: useSSL === true,
      auth: {
        user: username,
        pass: password
      }
    });

    // Verify SMTP connection
    await transporter.verify();
    
    // Send test email
    const testEmail = {
      from: username,
      to: username, // Send to self for testing
      subject: `🧪 Teste SMTP - Conductor (${new Date().toLocaleString('pt-BR')})`,
      text: `Este é um teste de conexão SMTP.\n\nTenant: ${tenantId}\nTimestamp: ${new Date().toISOString()}\n\nSe você recebeu este email, a integração SMTP está funcionando corretamente.`
    };

    const info = await transporter.sendMail(testEmail);
    
    return res.json({
      success: true,
      message: '✅ Teste do Email SMTP realizado com sucesso! Email de teste enviado.',
      details: {
        messageId: info.messageId,
        server: `${serverHost}:${serverPort}`,
        secure: useSSL,
        timestamp: new Date().toISOString(),
        status: 'sent'
      }
    });
  } catch (error: any) {
    console.error(`❌ [SMTP-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar SMTP: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test IMAP Email Integration
 */
async function testIMAPEmail(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [IMAP-TEST] Starting IMAP test`);
    
    const { imapServer, imapPort, emailAddress, password, imapSecurity } = config;
    
    if (!imapServer || !imapPort || !emailAddress || !password) {
      return res.status(400).json({
        success: false,
        message: 'Configuração IMAP incompleta. Configure servidor, porta, email e senha.'
      });
    }

    // Import imap for real IMAP testing
    const { default: Imap } = await import('imap');
    
    const imapConfig = {
      user: emailAddress,
      password: password,
      host: imapServer,
      port: parseInt(imapPort),
      tls: imapSecurity === 'SSL/TLS',
      tlsOptions: { rejectUnauthorized: false }
    };

    return new Promise((resolve) => {
      const imap = new Imap(imapConfig);
      
      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err: any, box: any) => {
          if (err) {
            resolve(res.status(400).json({
              success: false,
              message: `Erro ao abrir INBOX: ${err.message}`,
              details: { error: err.message }
            }));
            return;
          }
          
          imap.end();
          resolve(res.json({
            success: true,
            message: '✅ Teste do IMAP Email realizado com sucesso! Conexão estabelecida.',
            details: {
              server: `${imapServer}:${imapPort}`,
              account: emailAddress,
              totalMessages: box.messages.total,
              security: imapSecurity,
              timestamp: new Date().toISOString(),
              status: 'connected'
            }
          }));
        });
      });

      imap.once('error', (err: any) => {
        resolve(res.status(400).json({
          success: false,
          message: `Erro na conexão IMAP: ${err.message}`,
          details: { error: err.message }
        }));
      });

      imap.connect();
    });
  } catch (error: any) {
    console.error(`❌ [IMAP-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar IMAP: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test WhatsApp Business Integration
 */
async function testWhatsAppBusiness(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [WHATSAPP-TEST] Starting WhatsApp Business test`);
    
    const { whatsappApiKey, whatsappPhoneNumberId } = config;
    
    if (!whatsappApiKey || !whatsappPhoneNumberId) {
      return res.status(400).json({
        success: false,
        message: 'API Key e Phone Number ID são obrigatórios para WhatsApp Business.'
      });
    }

    // Test WhatsApp Business API - Get phone number info
    const response = await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${whatsappApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const phoneInfo = await response.json();
      return res.json({
        success: true,
        message: '✅ Teste do WhatsApp Business realizado com sucesso!',
        details: {
          phoneNumber: phoneInfo.display_phone_number,
          verifiedName: phoneInfo.verified_name,
          phoneNumberId: whatsappPhoneNumberId,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      const error = await response.json();
      return res.status(400).json({
        success: false,
        message: `Erro na API do WhatsApp: ${error.error?.message || 'Token inválido'}`,
        details: { error: error.error }
      });
    }
  } catch (error: any) {
    console.error(`❌ [WHATSAPP-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar WhatsApp Business: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Slack Integration
 */
async function testSlack(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [SLACK-TEST] Starting Slack test`);
    
    const { accessToken } = config;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access Token não configurado para Slack.'
      });
    }

    // Test Slack API - auth.test
    const response = await fetch('https://slack.com/api/auth.test', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.ok) {
      return res.json({
        success: true,
        message: '✅ Teste do Slack realizado com sucesso!',
        details: {
          team: result.team,
          user: result.user,
          teamId: result.team_id,
          userId: result.user_id,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Erro na API do Slack: ${result.error}`,
        details: { error: result.error }
      });
    }
  } catch (error: any) {
    console.error(`❌ [SLACK-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Slack: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Twilio SMS Integration
 */
async function testTwilioSMS(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [TWILIO-TEST] Starting Twilio SMS test`);
    
    const { accountSid, authToken, fromPhoneNumber } = config;
    
    if (!accountSid || !authToken || !fromPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Account SID, Auth Token e número de telefone são obrigatórios.'
      });
    }

    // Test Twilio API - Get account info
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.ok) {
      const account = await response.json();
      return res.json({
        success: true,
        message: '✅ Teste do Twilio SMS realizado com sucesso!',
        details: {
          accountSid: account.sid,
          friendlyName: account.friendly_name,
          accountStatus: account.status,
          fromPhoneNumber: fromPhoneNumber,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      const error = await response.json();
      return res.status(400).json({
        success: false,
        message: `Erro na API do Twilio: ${error.message}`,
        details: { error: error }
      });
    }
  } catch (error: any) {
    console.error(`❌ [TWILIO-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Twilio SMS: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Zapier Integration
 */
async function testZapier(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [ZAPIER-TEST] Starting Zapier test`);
    
    const { webhookUrl } = config;
    
    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'Webhook URL não configurada para Zapier.'
      });
    }

    // Test webhook by sending a test payload
    const testPayload = {
      test: true,
      tenantId: tenantId,
      timestamp: new Date().toISOString(),
      message: 'Teste de integração Zapier do Conductor',
      data: {
        event: 'test',
        source: 'conductor-integration-test'
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Conductor-Zapier-Test/1.0'
      },
      body: JSON.stringify(testPayload)
    });

    if (response.ok || response.status === 200 || response.status === 202) {
      return res.json({
        success: true,
        message: '✅ Teste do Zapier realizado com sucesso! Webhook enviado.',
        details: {
          webhookUrl: webhookUrl.substring(0, 50) + '...',
          responseStatus: response.status,
          timestamp: new Date().toISOString(),
          status: 'sent'
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Webhook falhou com status ${response.status}`,
        details: { status: response.status, statusText: response.statusText }
      });
    }
  } catch (error: any) {
    console.error(`❌ [ZAPIER-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Zapier: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Webhooks Integration
 */
async function testWebhooks(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [WEBHOOK-TEST] Starting Webhook test`);
    
    const { webhookUrl } = config;
    
    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'Webhook URL não configurada.'
      });
    }

    // Test webhook endpoint
    const testPayload = {
      test: true,
      tenantId: tenantId,
      timestamp: new Date().toISOString(),
      event: 'integration_test',
      data: {
        message: 'Teste de webhook do Conductor',
        source: 'conductor-webhook-test'
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Conductor-Event': 'test',
        'User-Agent': 'Conductor-Webhook/1.0'
      },
      body: JSON.stringify(testPayload)
    });

    if (response.ok || response.status === 200 || response.status === 202) {
      return res.json({
        success: true,
        message: '✅ Teste do Webhook realizado com sucesso!',
        details: {
          webhookUrl: webhookUrl.substring(0, 50) + '...',
          responseStatus: response.status,
          timestamp: new Date().toISOString(),
          status: 'delivered'
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Webhook falhou com status ${response.status}`,
        details: { status: response.status, statusText: response.statusText }
      });
    }
  } catch (error: any) {
    console.error(`❌ [WEBHOOK-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Webhook: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test CRM Integration
 */
async function testCRMIntegration(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [CRM-TEST] Starting CRM integration test`);
    
    const { apiKey, apiUrl, crmType } = config;
    
    if (!apiKey || !apiUrl) {
      return res.status(400).json({
        success: false,
        message: 'API Key e URL são obrigatórios para integração CRM.'
      });
    }

    // Generic CRM API test
    const response = await fetch(`${apiUrl}/api/v1/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      return res.json({
        success: true,
        message: '✅ Teste da integração CRM realizado com sucesso!',
        details: {
          crmType: crmType || 'Generic',
          apiUrl: apiUrl,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Erro na API do CRM (${response.status})`,
        details: { status: response.status, statusText: response.statusText }
      });
    }
  } catch (error: any) {
    console.error(`❌ [CRM-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar CRM: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Dropbox Personal Integration
 */
async function testDropboxPersonal(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [DROPBOX-TEST] Starting Dropbox test`);
    
    const { dropboxAccessToken } = config;
    
    if (!dropboxAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access Token não configurado para Dropbox.'
      });
    }

    // Test Dropbox API - Get account info
    const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropboxAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });

    if (response.ok) {
      const account = await response.json();
      return res.json({
        success: true,
        message: '✅ Teste do Dropbox realizado com sucesso!',
        details: {
          accountId: account.account_id,
          name: account.name?.display_name,
          email: account.email,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      const error = await response.json();
      return res.status(400).json({
        success: false,
        message: `Erro na API do Dropbox: ${error.error_summary}`,
        details: { error: error }
      });
    }
  } catch (error: any) {
    console.error(`❌ [DROPBOX-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Dropbox: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test SSO/SAML Integration
 */
async function testSSOSAML(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [SSO-TEST] Starting SSO/SAML test`);
    
    const { metadataUrl, entityId } = config;
    
    if (!metadataUrl) {
      return res.status(400).json({
        success: false,
        message: 'Metadata URL não configurada para SSO/SAML.'
      });
    }

    // Test SAML metadata endpoint
    const response = await fetch(metadataUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml',
        'User-Agent': 'Conductor-SAML-Test/1.0'
      }
    });

    if (response.ok) {
      const metadata = await response.text();
      const hasEntityDescriptor = metadata.includes('EntityDescriptor');
      const hasIDPSSODescriptor = metadata.includes('IDPSSODescriptor');
      
      return res.json({
        success: true,
        message: '✅ Teste do SSO/SAML realizado com sucesso!',
        details: {
          metadataUrl: metadataUrl,
          entityId: entityId,
          validMetadata: hasEntityDescriptor && hasIDPSSODescriptor,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Erro ao acessar metadata SAML (${response.status})`,
        details: { status: response.status, statusText: response.statusText }
      });
    }
  } catch (error: any) {
    console.error(`❌ [SSO-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar SSO/SAML: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Google Workspace Integration
 */
async function testGoogleWorkspace(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [WORKSPACE-TEST] Starting Google Workspace test`);
    
    const { accessToken } = config;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access Token não configurado para Google Workspace.'
      });
    }

    // Test Google Workspace API - Get user info
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const userInfo = await response.json();
      return res.json({
        success: true,
        message: '✅ Teste do Google Workspace realizado com sucesso!',
        details: {
          email: userInfo.email,
          name: userInfo.name,
          verified: userInfo.verified_email,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      const error = await response.json();
      return res.status(400).json({
        success: false,
        message: `Erro na API do Google: ${error.error_description}`,
        details: { error: error }
      });
    }
  } catch (error: any) {
    console.error(`❌ [WORKSPACE-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Google Workspace: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test OpenAI Integration
 */
async function testOpenAI(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [OPENAI-TEST] Starting OpenAI test`);
    
    const { apiKey, model } = config;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API Key não configurada. Configure a chave de API do OpenAI para continuar.'
      });
    }

    const testModel = model || 'gpt-3.5-turbo';
    console.log(`🔍 [OPENAI-TEST] Testing with model: ${testModel}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: testModel,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "API Key is valid" in Portuguese.' }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const result = await response.json();
      const aiResponse = result.choices?.[0]?.message?.content || 'No response';
      
      // Update integration status to 'connected' after successful test
      const { storage } = await import('../storage-simple');
      await storage.updateTenantIntegrationStatus(tenantId, 'openai', 'connected');
      
      return res.json({
        success: true,
        message: '✅ Teste do OpenAI realizado com sucesso!',
        details: {
          model: testModel,
          response: aiResponse,
          usage: result.usage,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      const error = await response.json();
      let userMessage = 'Erro na API do OpenAI';
      
      if (response.status === 401) {
        userMessage = 'API Key inválida. Verifique se a chave está correta.';
      } else if (response.status === 429) {
        userMessage = 'Limite de requisições excedido. Verifique seu plano OpenAI.';
      } else if (error.error?.message) {
        userMessage = `Erro do OpenAI: ${error.error.message}`;
      }
      
      return res.status(400).json({
        success: false,
        message: userMessage,
        details: { 
          errorType: error.error?.type,
          errorCode: error.error?.code,
          status: response.status
        }
      });
    }
  } catch (error: any) {
    console.error(`❌ [OPENAI-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar OpenAI: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test DeepSeek Integration
 */
async function testDeepSeek(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [DEEPSEEK-TEST] Starting DeepSeek test`);
    
    const { apiKey, model } = config;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API Key não configurada. Configure a chave de API do DeepSeek para continuar.'
      });
    }

    const testModel = model || 'deepseek-chat';
    console.log(`🔍 [DEEPSEEK-TEST] Testing with model: ${testModel}`);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: testModel,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "API Key is valid" in Portuguese.' }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const result = await response.json();
      const aiResponse = result.choices?.[0]?.message?.content || 'No response';
      
      // Update integration status to 'connected' after successful test
      const { storage } = await import('../storage-simple');
      await storage.updateTenantIntegrationStatus(tenantId, 'deepseek', 'connected');
      
      return res.json({
        success: true,
        message: '✅ Teste do DeepSeek realizado com sucesso!',
        details: {
          model: testModel,
          response: aiResponse,
          usage: result.usage,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      const error = await response.json();
      let userMessage = 'Erro na API do DeepSeek';
      
      if (response.status === 401) {
        userMessage = 'API Key inválida. Verifique se a chave está correta.';
      } else if (response.status === 429) {
        userMessage = 'Limite de requisições excedido. Verifique seu plano DeepSeek.';
      } else if (error.error?.message) {
        userMessage = `Erro do DeepSeek: ${error.error.message}`;
      }
      
      return res.status(400).json({
        success: false,
        message: userMessage,
        details: { 
          errorType: error.error?.type,
          errorCode: error.error?.code,
          status: response.status
        }
      });
    }
  } catch (error: any) {
    console.error(`❌ [DEEPSEEK-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar DeepSeek: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Google AI Integration
 */
async function testGoogleAI(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [GOOGLEAI-TEST] Starting Google AI test`);
    
    const { apiKey, model } = config;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API Key não configurada. Configure a chave de API do Google AI para continuar.'
      });
    }

    const testModel = model || 'gemini-pro';
    console.log(`🔍 [GOOGLEAI-TEST] Testing with model: ${testModel}`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Say "API Key is valid" in Portuguese.'
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 50
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
      
      // Update integration status to 'connected' after successful test
      const { storage } = await import('../storage-simple');
      await storage.updateTenantIntegrationStatus(tenantId, 'googleai', 'connected');
      
      return res.json({
        success: true,
        message: '✅ Teste do Google AI realizado com sucesso!',
        details: {
          model: testModel,
          response: aiResponse,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      const error = await response.json();
      let userMessage = 'Erro na API do Google AI';
      
      if (response.status === 400 && error.error?.message?.includes('API_KEY_INVALID')) {
        userMessage = 'API Key inválida. Verifique se a chave está correta.';
      } else if (response.status === 429) {
        userMessage = 'Limite de requisições excedido. Verifique seu plano Google AI.';
      } else if (error.error?.message) {
        userMessage = `Erro do Google AI: ${error.error.message}`;
      }
      
      return res.status(400).json({
        success: false,
        message: userMessage,
        details: { 
          errorCode: error.error?.code,
          errorMessage: error.error?.message,
          status: response.status
        }
      });
    }
  } catch (error: any) {
    console.error(`❌ [GOOGLEAI-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Google AI: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Microsoft 365 Integration
 */
async function testMicrosoft365(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [MICROSOFT365-TEST] Starting Microsoft 365 test`);
    
    const { clientId, clientSecret, tenantIdMs } = config;
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID não configurado. Configure as credenciais OAuth do Microsoft 365.'
      });
    }

    if (!clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Client Secret não configurado. Configure o Client Secret do Microsoft 365.'
      });
    }

    // Validação de configuração bem-sucedida
    return res.json({
      success: true,
      message: '✅ Configuração do Microsoft 365 validada com sucesso!',
      details: {
        clientId: `${clientId.substring(0, 8)}...`,
        configured: true,
        timestamp: new Date().toISOString(),
        note: 'OAuth flow requires interactive authentication'
      }
    });
  } catch (error: any) {
    console.error(`❌ [MICROSOFT365-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Microsoft 365: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Discord Integration
 */
async function testDiscord(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [DISCORD-TEST] Starting Discord test`);
    
    const { webhookUrl, botToken } = config;
    
    if (!webhookUrl && !botToken) {
      return res.status(400).json({
        success: false,
        message: 'Webhook URL ou Bot Token não configurados. Configure um dos dois para continuar.'
      });
    }

    // Test Discord webhook if configured
    if (webhookUrl) {
      const testMessage = {
        content: `🧪 **Teste de Integração Discord**\n\n✅ Tenant: ${tenantId}\n📅 Data: ${new Date().toLocaleString('pt-BR')}\n\nSe você recebeu esta mensagem, a integração está funcionando!`
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testMessage)
      });

      if (response.ok || response.status === 204) {
        return res.json({
          success: true,
          message: '✅ Teste do Discord realizado com sucesso! Mensagem enviada via webhook.',
          details: {
            method: 'webhook',
            timestamp: new Date().toISOString(),
            status: 'sent'
          }
        });
      } else {
        const errorText = await response.text();
        return res.status(400).json({
          success: false,
          message: 'Erro ao enviar mensagem via Discord webhook',
          details: {
            status: response.status,
            error: errorText
          }
        });
      }
    }

    // If only bot token is configured
    return res.json({
      success: true,
      message: '✅ Configuração do Discord validada!',
      details: {
        method: 'bot',
        configured: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error(`❌ [DISCORD-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Discord: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Generic OAuth 2.0 Integration
 */
async function testOAuth2Generic(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [OAUTH2-TEST] Starting OAuth 2.0 test`);
    
    const { clientId, clientSecret, authorizationUrl, tokenUrl } = config;
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID não configurado.'
      });
    }

    if (!clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Client Secret não configurado.'
      });
    }

    if (!authorizationUrl || !tokenUrl) {
      return res.status(400).json({
        success: false,
        message: 'URLs de autorização e token não configuradas.'
      });
    }

    return res.json({
      success: true,
      message: '✅ Configuração OAuth 2.0 validada com sucesso!',
      details: {
        clientId: `${clientId.substring(0, 8)}...`,
        authorizationUrl,
        tokenUrl,
        configured: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error(`❌ [OAUTH2-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar OAuth 2.0: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Azure AD Integration
 */
async function testAzureAD(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [AZUREAD-TEST] Starting Azure AD test`);
    
    const { clientId, clientSecret, tenantIdAzure } = config;
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID (Application ID) não configurado.'
      });
    }

    if (!clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Client Secret não configurado.'
      });
    }

    if (!tenantIdAzure) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID do Azure não configurado.'
      });
    }

    return res.json({
      success: true,
      message: '✅ Configuração Azure AD validada com sucesso!',
      details: {
        clientId: `${clientId.substring(0, 8)}...`,
        tenantId: tenantIdAzure,
        configured: true,
        timestamp: new Date().toISOString(),
        note: 'SSO flow requires interactive authentication'
      }
    });
  } catch (error: any) {
    console.error(`❌ [AZUREAD-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Azure AD: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Google Workspace SSO Integration
 */
async function testGoogleWorkspaceSSO(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [GOOGLEWORKSPACE-SSO-TEST] Starting Google Workspace SSO test`);
    
    const { clientId, clientSecret, domain } = config;
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID não configurado.'
      });
    }

    if (!clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Client Secret não configurado.'
      });
    }

    return res.json({
      success: true,
      message: '✅ Configuração Google Workspace SSO validada com sucesso!',
      details: {
        clientId: `${clientId.substring(0, 8)}...`,
        domain: domain || 'not specified',
        configured: true,
        timestamp: new Date().toISOString(),
        note: 'SSO flow requires interactive authentication'
      }
    });
  } catch (error: any) {
    console.error(`❌ [GOOGLEWORKSPACE-SSO-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Google Workspace SSO: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test SAP Integration
 */
async function testSAP(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [SAP-TEST] Starting SAP test`);
    
    const { baseUrl, apiKey, username, password } = config;
    
    if (!baseUrl) {
      return res.status(400).json({
        success: false,
        message: 'SAP Base URL não configurada.'
      });
    }

    if (!apiKey && !username) {
      return res.status(400).json({
        success: false,
        message: 'API Key ou credenciais de usuário não configuradas.'
      });
    }

    return res.json({
      success: true,
      message: '✅ Configuração SAP validada com sucesso!',
      details: {
        baseUrl,
        authMethod: apiKey ? 'API Key' : 'Username/Password',
        configured: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error(`❌ [SAP-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar SAP: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Totvs Integration
 */
async function testTotvs(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [TOTVS-TEST] Starting Totvs test`);
    
    const { baseUrl, apiKey, username, password } = config;
    
    if (!baseUrl) {
      return res.status(400).json({
        success: false,
        message: 'Totvs Base URL não configurada.'
      });
    }

    if (!apiKey && !username) {
      return res.status(400).json({
        success: false,
        message: 'API Key ou credenciais não configuradas.'
      });
    }

    return res.json({
      success: true,
      message: '✅ Configuração Totvs validada com sucesso!',
      details: {
        baseUrl,
        authMethod: apiKey ? 'API Key' : 'Username/Password',
        configured: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error(`❌ [TOTVS-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Totvs: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Jira Service Management Integration
 */
async function testJiraServiceManagement(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [JIRA-TEST] Starting Jira Service Management test`);
    
    const { baseUrl, email, apiToken } = config;
    
    if (!baseUrl) {
      return res.status(400).json({
        success: false,
        message: 'Jira Base URL não configurada.'
      });
    }

    if (!email || !apiToken) {
      return res.status(400).json({
        success: false,
        message: 'Email ou API Token não configurados.'
      });
    }

    // Test Jira API
    const response = await fetch(`${baseUrl}/rest/api/3/myself`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const userData = await response.json();
      return res.json({
        success: true,
        message: '✅ Teste do Jira realizado com sucesso!',
        details: {
          displayName: userData.displayName,
          emailAddress: userData.emailAddress,
          accountId: userData.accountId,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Erro ao conectar com Jira. Verifique suas credenciais.',
        details: {
          status: response.status,
          statusText: response.statusText
        }
      });
    }
  } catch (error: any) {
    console.error(`❌ [JIRA-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Jira: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test ServiceNow Integration
 */
async function testServiceNow(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [SERVICENOW-TEST] Starting ServiceNow test`);
    
    const { instanceUrl, username, password, clientId, clientSecret } = config;
    
    if (!instanceUrl) {
      return res.status(400).json({
        success: false,
        message: 'ServiceNow Instance URL não configurada.'
      });
    }

    if (!username && !clientId) {
      return res.status(400).json({
        success: false,
        message: 'Credenciais não configuradas. Configure username/password ou OAuth credentials.'
      });
    }

    return res.json({
      success: true,
      message: '✅ Configuração ServiceNow validada com sucesso!',
      details: {
        instanceUrl,
        authMethod: clientId ? 'OAuth' : 'Basic Auth',
        configured: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error(`❌ [SERVICENOW-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar ServiceNow: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Zendesk Integration
 */
async function testZendesk(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [ZENDESK-TEST] Starting Zendesk test`);
    
    const { subdomain, email, apiToken } = config;
    
    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message: 'Zendesk Subdomain não configurado.'
      });
    }

    if (!email || !apiToken) {
      return res.status(400).json({
        success: false,
        message: 'Email ou API Token não configurados.'
      });
    }

    // Test Zendesk API
    const zendeskUrl = `https://${subdomain}.zendesk.com/api/v2/users/me.json`;
    const auth = Buffer.from(`${email}/token:${apiToken}`).toString('base64');

    const response = await fetch(zendeskUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        message: '✅ Teste do Zendesk realizado com sucesso!',
        details: {
          name: data.user?.name,
          email: data.user?.email,
          role: data.user?.role,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Erro ao conectar com Zendesk. Verifique suas credenciais.',
        details: {
          status: response.status,
          statusText: response.statusText
        }
      });
    }
  } catch (error: any) {
    console.error(`❌ [ZENDESK-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Zendesk: ${error.message}`,
      details: { error: error.message }
    });
  }
}

/**
 * Test Freshdesk Integration
 */
async function testFreshdesk(config: any, res: any, tenantId: string) {
  try {
    console.log(`🔍 [FRESHDESK-TEST] Starting Freshdesk test`);
    
    const { domain, apiKey } = config;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Freshdesk Domain não configurado.'
      });
    }

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API Key não configurada.'
      });
    }

    // Test Freshdesk API
    const freshdeskUrl = `https://${domain}.freshdesk.com/api/v2/agents/me`;
    const auth = Buffer.from(`${apiKey}:X`).toString('base64');

    const response = await fetch(freshdeskUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        message: '✅ Teste do Freshdesk realizado com sucesso!',
        details: {
          name: data.contact?.name,
          email: data.contact?.email,
          role: data.contact?.job_title,
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Erro ao conectar com Freshdesk. Verifique suas credenciais.',
        details: {
          status: response.status,
          statusText: response.statusText
        }
      });
    }
  } catch (error: any) {
    console.error(`❌ [FRESHDESK-TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao testar Freshdesk: ${error.message}`,
      details: { error: error.message }
    });
  }
}

export default router;