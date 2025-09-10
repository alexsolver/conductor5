import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';
import { AuthorizedRequest } from '../../middleware/rbacMiddleware';
import { DependencyContainer } from '../../application/services/DependencyContainer';
import crypto from 'crypto';
import translationsRoutes from '../../routes/translations';
import translationCompletionRoutes from '../../routes/translationCompletion';

const router = Router();

// Aplicar middleware de autenticação 
router.use(jwtAuth);

// SaaS Admin validation middleware - Apply to specific routes only
const requireSaasAdmin = (req: AuthenticatedRequest, res: any, next: any) => {
  console.log('🔥 [SAAS-ADMIN-MIDDLEWARE] User check:', {
    hasUser: !!req.user,
    userRole: req.user?.role,
    userEmail: req.user?.email,
    expectedRole: 'saas_admin',
    isMatch: req.user?.role === 'saas_admin'
  });
  
  if (!req.user || req.user.role !== 'saas_admin') {
    console.log('❌ [SAAS-ADMIN-MIDDLEWARE] Access denied - user role mismatch');
    return res.status(403).json({
      success: false,
      message: 'SaaS Admin access required',
      code: 'FORBIDDEN'
    });
  }
  
  console.log('✅ [SAAS-ADMIN-MIDDLEWARE] Access granted');
  next();
};

// Apply SaaS admin requirement to most routes
router.use(['/tenants', '/users', '/analytics', '/integrations'], requireSaasAdmin);

/**
 * GET /api/saas-admin/tenants
 * Lista todos os tenants da plataforma
 */
router.get('/tenants', async (req: AuthorizedRequest, res) => {
  try {
    const container = DependencyContainer.getInstance();
    const tenantRepository = container.tenantRepository;

    const tenants = await tenantRepository.findAll();

    res.json({
      tenants,
      total: tenants.length
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ message: 'Failed to fetch tenants' });
  }
});

/**
 * POST /api/saas-admin/tenants
 * Criar novo tenant
 */
router.post('/tenants', async (req: AuthorizedRequest, res) => {
  try {
    const { name, subdomain, settings = {} } = req.body;

    if (!name || !subdomain) {
      return res.status(400).json({ message: 'Name and subdomain are required' });
    }

    const container = DependencyContainer.getInstance();
    const tenantRepository = container.tenantRepository;

    // Verificar se subdomain já existe
    const existingTenant = await tenantRepository.findBySubdomain(subdomain);
    if (existingTenant) {
      return res.status(409).json({ message: 'Subdomain already exists' });
    }

    // Criar entidade tenant
    const { Tenant } = await import('../../domain/entities/Tenant');
    const tenantEntity = new Tenant(
      crypto.randomUUID(),
      name,
      subdomain,
      settings
    );

    const tenant = await tenantRepository.save(tenantEntity);

    // Inicializar schema do tenant
    await container.storage.initializeTenantSchema(tenant.id);

    res.status(201).json(tenant);
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ message: 'Failed to create tenant' });
  }
});

/**
 * GET /api/saas-admin/users
 * Lista todos os usuários da plataforma
 */
router.get('/users', async (req: AuthorizedRequest, res) => {
  try {
    const container = DependencyContainer.getInstance();
    const userRepository = container.userRepository;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const users = await userRepository.findAll({ page, limit });

    res.json({
      users,
      pagination: { page, limit }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

/**
 * GET /api/saas-admin/analytics
 * Analytics globais da plataforma
 */
router.get('/analytics', async (req: AuthorizedRequest, res) => {
  try {
    // Implementar métricas globais da plataforma
    const stats = {
      totalTenants: 0,
      totalUsers: 0,
      totalTickets: 0,
      activeUsers: 0,
      // Adicionar mais métricas conforme necessário
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

/**
 * PUT /api/saas-admin/tenants/:tenantId
 * Atualizar configurações de tenant
 */
router.put('/tenants/:tenantId', async (req: AuthorizedRequest, res) => {
  try {
    const { tenantId } = req.params;
    const updates = req.body;

    const container = DependencyContainer.getInstance();
    const tenantRepository = container.tenantRepository;

    const tenant = await tenantRepository.update(tenantId, updates);

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ message: 'Failed to update tenant' });
  }
});

/**
 * DELETE /api/saas-admin/tenants/:tenantId
 * Desativar tenant (soft delete)
 */
router.delete('/tenants/:tenantId', async (req: AuthorizedRequest, res) => {
  try {
    const { tenantId } = req.params;

    const container = DependencyContainer.getInstance();
    const tenantRepository = container.tenantRepository;

    // Implementar soft delete ou desativação
    await tenantRepository.deactivate(tenantId);

    res.json({ message: 'Tenant deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating tenant:', error);
    res.status(500).json({ message: 'Failed to deactivate tenant' });
  }
});

/**
 * GET /api/saas-admin/analytics
 * Analytics da plataforma SaaS
 */
router.get('/analytics', async (req: AuthorizedRequest, res) => {
  try {
    const container = DependencyContainer.getInstance();
    const userRepository = container.userRepository;
    const tenantRepository = container.tenantRepository;

    // Buscar estatísticas globais
    const totalUsers = await userRepository.count();
    const activeUsers = await userRepository.countActive();
    const totalTenants = await tenantRepository.count();

    // Implementar contagem real de tickets por tenant
    let totalTickets = 0;
    try {
      const tenants = await tenantRepository.findAll();
      for (const tenant of tenants) {
        const tickets = await container.storage.getTickets(tenant.id, 1, 0); // Assuming storage is in container
        totalTickets += tickets.length;
      }
    } catch (error) {
      console.warn('Could not count tickets:', error);
      totalTickets = 0;
    }

    res.json({
      totalUsers,
      activeUsers,
      totalTenants,
      totalTickets
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/saas-admin/users
 * Lista todos os usuários da plataforma
 */
router.get('/users', async (req: AuthorizedRequest, res) => {
  try {
    const container = DependencyContainer.getInstance();
    const userRepository = container.userRepository;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const users = await userRepository.findAllWithPagination({ limit, offset });
    const total = await userRepository.count();

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

/**
 * POST /api/saas-admin/users
 * Criar novo usuário (SaaS admin)
 */
router.post('/users', async (req: AuthorizedRequest, res) => {
  try {
    const { email, password, firstName, lastName, role, tenantId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const container = DependencyContainer.getInstance();
    const userRepository = container.userRepository;
    const passwordHasher = container.passwordHasher;

    // Verificar se email já existe
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Hash da senha
    const hashedPassword = await passwordHasher.hash(password);

    // Criar entidade usuário
    const { User } = await import('../../domain/entities/User');
    const userEntity = new User(
      crypto.randomUUID(),
      email,
      hashedPassword,
      firstName || null,
      lastName || null,
      role || 'customer',
      tenantId || null
    );

    const user = await userRepository.save(userEntity);

    // Remover senha do retorno
    const { password: _, ...userResponse } = user;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

/**
 * GET /api/saas-admin/integrations
 * Lista todas as integrações da plataforma
 */
router.get('/integrations', async (req: AuthorizedRequest, res) => {
  try {
    const { DrizzleIntegrationRepository } = await import('./infrastructure/repositories/DrizzleIntegrationRepository');
    const { GetIntegrationsUseCase } = await import('./application/use-cases/GetIntegrationsUseCase');
    const { IntegrationController } = await import('./application/controllers/IntegrationController');
    const { UpdateOpenWeatherApiKeyUseCase } = await import('./application/use-cases/UpdateOpenWeatherApiKeyUseCase');

    const integrationRepository = new DrizzleIntegrationRepository();
    const getIntegrationsUseCase = new GetIntegrationsUseCase(integrationRepository);
    const updateOpenWeatherApiKeyUseCase = new UpdateOpenWeatherApiKeyUseCase(integrationRepository);
    const controller = new IntegrationController(getIntegrationsUseCase, updateOpenWeatherApiKeyUseCase);

    await controller.getAllIntegrations(req, res);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch integrations' });
  }
});

/**
 * GET /api/saas-admin/integrations/openai
 * Buscar configuração específica da OpenAI
 */
router.get('/integrations/openai', async (req: AuthorizedRequest, res) => {
  try {
    console.log('🔧 [SAAS-ADMIN-OPENAI] Getting OpenAI integration config');

    const { DrizzleIntegrationRepository } = await import('./infrastructure/repositories/DrizzleIntegrationRepository');
    const integrationRepository = new DrizzleIntegrationRepository();

    // Buscar configuração da OpenAI
    const config = await integrationRepository.getIntegrationConfig('openai');
    console.log('🔧 [SAAS-ADMIN-OPENAI] Integration config found:', {
      hasConfig: !!config,
      hasApiKey: !!config?.apiKey,
      lastTested: config?.lastTested,
      status: config?.status
    });

    // Determinar status baseado na configuração e último teste
    let status = 'disconnected';
    let apiKeyConfigured = false;

    if (config?.apiKey) {
      apiKeyConfigured = true;

      // Se há um status salvo de um teste anterior, usar ele
      if (config.status) {
        status = config.status;
      } else {
        // Se não há teste anterior, marcar como disconnected até ser testado
        status = 'disconnected';
      }
    }

    res.json({
      success: true,
      status,
      apiKeyConfigured,
      lastTested: config?.lastTested || null,
      config: config ? {
        baseUrl: config.baseUrl || '',
        maxTokens: config.maxTokens || 4000,
        temperature: config.temperature || 0.7,
        enabled: config.enabled !== false
      } : null
    });

  } catch (error) {
    console.error('❌ [SAAS-ADMIN-OPENAI] Error getting OpenAI config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao buscar configuração OpenAI',
      error: error.message 
    });
  }
});

/**
 * GET /api/saas-admin/integrations/openweather
 * Buscar configuração específica do OpenWeather
 */
router.get('/integrations/openweather', async (req: AuthorizedRequest, res) => {
  try {
    const { DrizzleIntegrationRepository } = await import('./infrastructure/repositories/DrizzleIntegrationRepository');
    const { GetIntegrationsUseCase } = await import('./application/use-cases/GetIntegrationsUseCase');
    const { IntegrationController } = await import('./application/controllers/IntegrationController');
    const { UpdateOpenWeatherApiKeyUseCase } = await import('./application/use-cases/UpdateOpenWeatherApiKeyUseCase');

    const integrationRepository = new DrizzleIntegrationRepository();
    const getIntegrationsUseCase = new GetIntegrationsUseCase(integrationRepository);
    const updateOpenWeatherApiKeyUseCase = new UpdateOpenWeatherApiKeyUseCase(integrationRepository);
    const controller = new IntegrationController(getIntegrationsUseCase, updateOpenWeatherApiKeyUseCase);

    await controller.getOpenWeatherIntegration(req, res);
  } catch (error) {
    console.error('Error fetching OpenWeather integration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch OpenWeather integration' });
  }
});

/**
 * PUT /api/saas-admin/integrations/openweather/api-key
 * Atualizar chave da API OpenWeather
 */
router.put('/integrations/openweather/api-key', async (req: AuthorizedRequest, res) => {
  try {
    const { DrizzleIntegrationRepository } = await import('./infrastructure/repositories/DrizzleIntegrationRepository');
    const { GetIntegrationsUseCase } = await import('./application/use-cases/GetIntegrationsUseCase');
    const { IntegrationController } = await import('./application/controllers/IntegrationController');
    const { UpdateOpenWeatherApiKeyUseCase } = await import('./application/use-cases/UpdateOpenWeatherApiKeyUseCase');

    const integrationRepository = new DrizzleIntegrationRepository();
    const getIntegrationsUseCase = new GetIntegrationsUseCase(integrationRepository);
    const updateOpenWeatherApiKeyUseCase = new UpdateOpenWeatherApiKeyUseCase(integrationRepository);
    const controller = new IntegrationController(getIntegrationsUseCase, updateOpenWeatherApiKeyUseCase);

    await controller.updateOpenWeatherApiKey(req, res);
  } catch (error) {
    console.error('Error updating OpenWeather API key:', error);
    res.status(500).json({ success: false, message: 'Failed to update OpenWeather API key' });
  }
});

/**
 * POST /api/saas-admin/integrations/openai/test
 * Testar integração OpenAI
 */
router.post('/integrations/openai/test', async (req: AuthorizedRequest, res) => {
  try {
    console.log('🧪 [SAAS-ADMIN-OPENAI-TEST] Testing OpenAI integration');

    const { DrizzleIntegrationRepository } = await import('./infrastructure/repositories/DrizzleIntegrationRepository');
    const integrationRepository = new DrizzleIntegrationRepository();

    // Get OpenAI configuration
    const integration = await integrationRepository.getIntegrationConfig('openai');

    if (!integration || !integration.apiKey) {
      return res.status(400).json({
        success: false,
        message: 'OpenAI API key não configurada. Configure primeiro a API key.'
      });
    }

    const apiKey = integration.apiKey;
    console.log('🧪 [SAAS-ADMIN-OPENAI-TEST] Testing with API key:', apiKey.substring(0, 8) + '...');

    // Test the OpenAI API with a simple completion request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Conductor-SaaS-Admin/1.0'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a test message to verify the API connection.'
            }
          ],
          max_tokens: 10
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SAAS-ADMIN-OPENAI-TEST] Test successful');

        // Update integration status to connected
        await integrationRepository.updateIntegrationStatus('openai', 'connected');

        return res.json({
          success: true,
          message: 'Teste da integração OpenAI realizado com sucesso!',
          data: {
            model: data.model,
            usage: data.usage,
            response: data.choices?.[0]?.message?.content?.substring(0, 50) + '...'
          }
        });
      } else {
        const errorData = await response.json();
        console.error('❌ [SAAS-ADMIN-OPENAI-TEST] API Error:', response.status, errorData);

        // Update integration status to error
        await integrationRepository.updateIntegrationStatus('openai', 'error');

        return res.status(400).json({
          success: false,
          message: `Erro na API OpenAI: ${errorData.error?.message || 'Erro desconhecido'}`,
          error: errorData.error?.message
        });
      }

    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        console.error('❌ [SAAS-ADMIN-OPENAI-TEST] Request timeout');
        await integrationRepository.updateIntegrationStatus('openai', 'error');

        return res.status(408).json({
          success: false,
          message: 'Timeout ao testar integração OpenAI. Verifique sua conexão.',
          error: 'Request timeout'
        });
      } else {
        console.error('❌ [SAAS-ADMIN-OPENAI-TEST] Network error:', fetchError);
        await integrationRepository.updateIntegrationStatus('openai', 'error');

        return res.status(500).json({
          success: false,
          message: 'Erro de rede ao testar integração OpenAI',
          error: fetchError.message
        });
      }
    }

  } catch (error) {
    console.error('❌ [SAAS-ADMIN-OPENAI-TEST] Error testing OpenAI integration:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao testar integração OpenAI',
      error: error.message
    });
  }
});

/**
 * PUT /api/saas-admin/integrations/openai/api-key
 * Atualizar chave da API OpenAI
 */
router.put('/integrations/openai/api-key', async (req: AuthorizedRequest, res) => {
  try {
    const { apiKey, enabled = true, maxTokens = 4000, temperature = 0.7 } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API key é obrigatória'
      });
    }

    console.log('🔧 [SAAS-ADMIN-OPENAI] Updating OpenAI API key');

    const { DrizzleIntegrationRepository } = await import('./infrastructure/repositories/DrizzleIntegrationRepository');
    const integrationRepository = new DrizzleIntegrationRepository();

    // Update OpenAI configuration and reset status
    const config = {
      apiKey: apiKey.toString().trim(),
      enabled: Boolean(enabled),
      maxTokens: Number(maxTokens),
      temperature: Number(temperature),
      status: 'disconnected', // Reset status when API key changes
      lastUpdated: new Date().toISOString(),
      lastTested: null // Clear last test when key changes
    };

    await integrationRepository.updateIntegrationConfig('openai', config);

    console.log('✅ [SAAS-ADMIN-OPENAI] OpenAI API key updated successfully');

    res.json({
      success: true,
      message: 'Chave da API OpenAI atualizada com sucesso. Clique em "Testar Integração" para verificar a conexão.',
      status: 'disconnected' // Will be updated to 'connected' after successful test
    });

  } catch (error) {
    console.error('❌ [SAAS-ADMIN-OPENAI] Error updating OpenAI API key:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao atualizar chave da API OpenAI',
      error: error.message
    });
  }
});

/**
 * PUT /api/saas-admin/integrations/openai/config
 * Atualizar configuração completa da OpenAI
 */
router.put('/integrations/openai/config', async (req: AuthorizedRequest, res) => {
  try {
    const { apiKey, enabled = true, maxTokens = 4000, temperature = 0.7, baseUrl = '' } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API key é obrigatória'
      });
    }

    console.log('🔧 [SAAS-ADMIN-OPENAI-CONFIG] Updating OpenAI configuration');

    const { DrizzleIntegrationRepository } = await import('./infrastructure/repositories/DrizzleIntegrationRepository');
    const integrationRepository = new DrizzleIntegrationRepository();

    // Update OpenAI configuration
    const config = {
      apiKey: apiKey.toString().trim(),
      enabled: Boolean(enabled),
      maxTokens: Number(maxTokens),
      temperature: Number(temperature),
      baseUrl: baseUrl.toString().trim(),
      lastUpdated: new Date().toISOString()
    };

    await integrationRepository.updateIntegrationConfig('openai', config);
    await integrationRepository.updateIntegrationStatus('openai', 'disconnected');

    console.log('✅ [SAAS-ADMIN-OPENAI-CONFIG] OpenAI configuration updated successfully');

    res.json({
      success: true,
      message: 'Configuração OpenAI atualizada com sucesso',
      status: 'disconnected'
    });

  } catch (error) {
    console.error('❌ [SAAS-ADMIN-OPENAI-CONFIG] Error updating OpenAI configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao atualizar configuração OpenAI',
      error: error.message
    });
  }
});

/**
 * POST /api/saas-admin/integrations/openweather/test
 * Testar integração OpenWeather
 */
router.post('/integrations/openweather/test', async (req: AuthorizedRequest, res) => {
  try {
    console.log('🧪 [SAAS-ADMIN-OPENWEATHER-TEST] Testing OpenWeather integration');

    const { DrizzleIntegrationRepository } = await import('./infrastructure/repositories/DrizzleIntegrationRepository');
    const integrationRepository = new DrizzleIntegrationRepository();

    // Get OpenWeather configuration
    const integration = await integrationRepository.getOpenWeatherConfig();

    if (!integration || !integration.config?.apiKey) {
      return res.status(400).json({
        success: false,
        message: 'OpenWeather API key não configurada. Configure primeiro a API key.'
      });
    }

    const apiKey = integration.config.apiKey;
    const testCity = 'London'; // Cidade padrão para teste

    console.log('🧪 [SAAS-ADMIN-OPENWEATHER-TEST] Testing with API key:', apiKey.substring(0, 8) + '...');

    // Test the OpenWeather API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${testCity}&appid=${apiKey}&units=metric`,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'Conductor-SaaS-Admin/1.0'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();

        console.log('✅ [SAAS-ADMIN-OPENWEATHER-TEST] Test successful');

        // Update integration status to connected
        await integrationRepository.updateIntegrationStatus('openweather', 'connected');

        return res.json({
          success: true,
          message: 'Teste da integração OpenWeather realizado com sucesso!',
          data: {
            city: data.name,
            country: data.sys?.country,
            temperature: Math.round(data.main?.temp || 0),
            description: data.weather?.[0]?.description,
            humidity: data.main?.humidity,
            windSpeed: data.wind?.speed,
            testedAt: new Date().toISOString()
          }
        });
      } else {
        const errorData = await response.text();
        console.error('❌ [SAAS-ADMIN-OPENWEATHER-TEST] API Error:', response.status, errorData);

        let errorMessage = 'Erro na API do OpenWeather';
        if (response.status === 401) {
          errorMessage = 'API Key inválida. Verifique se a chave está correta.';
        } else if (response.status === 429) {
          errorMessage = 'Limite de requisições excedido. Tente novamente mais tarde.';
        }

        // Update integration status to error
        await integrationRepository.updateIntegrationStatus('openweather', 'error');

        return res.status(400).json({
          success: false,
          message: errorMessage,
          details: {
            statusCode: response.status,
            error: errorData
          }
        });
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error('❌ [SAAS-ADMIN-OPENWEATHER-TEST] Network error:', fetchError);

      // Update integration status to error
      await integrationRepository.updateIntegrationStatus('openweather', 'error');

      if (fetchError.name === 'AbortError') {
        return res.status(408).json({
          success: false,
          message: 'Timeout na conexão com OpenWeather API. Verifique sua conexão.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro de conectividade com OpenWeather API',
        details: {
          error: fetchError.message
        }
      });
    }
  } catch (error) {
    console.error('❌ [SAAS-ADMIN-OPENWEATHER-TEST] Error testing OpenWeather:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao testar integração OpenWeather',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/saas-admin/integrations/openai/test
 * Testar integração OpenAI
 */
router.post('/integrations/openai/test', async (req: AuthorizedRequest, res) => {
  try {
    console.log('🧪 [SAAS-ADMIN-OPENAI-TEST] Testing OpenAI integration');

    const { DrizzleIntegrationRepository } = await import('./infrastructure/repositories/DrizzleIntegrationRepository');
    const integrationRepository = new DrizzleIntegrationRepository();

    // Buscar configuração da OpenAI
    const config = await integrationRepository.getIntegrationConfig('openai');
    console.log('🔧 [SAAS-ADMIN-OPENAI-TEST] Integration config found:', {
      hasConfig: !!config,
      hasApiKey: !!config?.apiKey
    });

    if (!config?.apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API Key da OpenAI não configurada. Configure primeiro a chave de API.'
      });
    }

    console.log('🌐 [SAAS-ADMIN-OPENAI-TEST] Making test request to OpenAI API');

    // Timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // Test with a simple completion request
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Conductor-SaaS-Admin/1.0'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: 'Hello! This is a test message from Conductor platform. Please respond with a short confirmation.'
            }
          ],
          max_tokens: 50,
          temperature: 0.7
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SAAS-ADMIN-OPENAI-TEST] Test successful:', {
          model: data.model,
          usage: data.usage
        });

        // Update integration status to connected
        await integrationRepository.updateIntegrationStatus('openai', 'connected');

        return res.json({
          success: true,
          message: 'Teste da OpenAI realizado com sucesso!',
          data: {
            model: data.model,
            response: data.choices?.[0]?.message?.content?.substring(0, 100),
            usage: data.usage,
            testedAt: new Date().toISOString()
          }
        });
      } else {
        const errorData = await response.text();
        console.error('❌ [SAAS-ADMIN-OPENAI-TEST] API Error:', response.status, errorData);

        let errorMessage = 'Erro na API da OpenAI';
        if (response.status === 401) {
          errorMessage = 'API Key inválida. Verifique se a chave está correta.';
        } else if (response.status === 429) {
          errorMessage = 'Limite de requisições excedido. Tente novamente mais tarde.';
        } else if (response.status === 400) {
          errorMessage = 'Requisição inválida. Verifique a configuração.';
        }

        // Update integration status to error
        await integrationRepository.updateIntegrationStatus('openai', 'error');

        return res.status(400).json({
          success: false,
          message: errorMessage,
          details: {
            statusCode: response.status,
            error: errorData
          }
        });
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error('❌ [SAAS-ADMIN-OPENAI-TEST] Network error:', fetchError);

      // Update integration status to error
      await integrationRepository.updateIntegrationStatus('openai', 'error');

      if (fetchError.name === 'AbortError') {
        return res.status(408).json({
          success: false,
          message: 'Timeout na conexão com OpenAI API. Verifique sua conexão.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro de conectividade com OpenAI API',
        details: {
          error: fetchError.message
        }
      });
    }
  } catch (error) {
    console.error('❌ [SAAS-ADMIN-OPENAI-TEST] Error testing OpenAI:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao testar integração OpenAI',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/saas-admin/integrations/status/:status
 * Listar integrações por status
 */
router.get('/integrations/status/:status', async (req: AuthorizedRequest, res) => {
  try {
    const { DrizzleIntegrationRepository } = await import('./infrastructure/repositories/DrizzleIntegrationRepository');
    const { GetIntegrationsUseCase } = await import('./application/use-cases/GetIntegrationsUseCase');
    const { IntegrationController } = await import('./application/controllers/IntegrationController');
    const { UpdateOpenWeatherApiKeyUseCase } = await import('./application/use-cases/UpdateOpenWeatherApiKeyUseCase');

    const integrationRepository = new DrizzleIntegrationRepository();
    const getIntegrationsUseCase = new GetIntegrationsUseCase(integrationRepository);
    const updateOpenWeatherApiKeyUseCase = new UpdateOpenWeatherApiKeyUseCase(integrationRepository);
    const controller = new IntegrationController(getIntegrationsUseCase, updateOpenWeatherApiKeyUseCase);

    await controller.getIntegrationsByStatus(req, res);
  } catch (error) {
    console.error('Error fetching integrations by status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch integrations by status' });
  }
});

/**
 * TRANSLATION MANAGEMENT - SaaS Admin Global Routes
 * These endpoints manage translations across the entire platform
 */

/**
 * GET /api/saas-admin/translations/languages
 * Get all available languages
 */
router.get('/translations/languages', async (req: AuthorizedRequest, res) => {
  try {
    // Import translation routes to delegate
    const translationsRoutes = await import('../../routes/translations');
    // Execute the same logic but in SaaS Admin context
    const languages = ['en', 'pt-BR', 'es', 'fr', 'de'];
    res.json({ success: true, languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch languages' });
  }
});

/**
 * GET /api/saas-admin/translations/:language
 * Get translations for a specific language
 */
router.get('/translations/:language', async (req: AuthorizedRequest, res) => {
  try {
    const { language } = req.params;
    // Delegate to translation service but with SaaS admin permissions
    const translationService = await import('../../services/TranslationService');
    const translations = await translationService.getTranslations(language);
    res.json({ success: true, translations });
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch translations' });
  }
});

/**
 * PUT /api/saas-admin/translations/:language
 * Update translations for a specific language
 */
router.put('/translations/:language', async (req: AuthorizedRequest, res) => {
  try {
    const { language } = req.params;
    const { translations } = req.body;

    const translationService = await import('../../services/TranslationService');
    await translationService.saveTranslations(language, translations);

    res.json({ success: true, message: 'Translations updated successfully' });
  } catch (error) {
    console.error('Error updating translations:', error);
    res.status(500).json({ success: false, message: 'Failed to update translations' });
  }
});

/**
 * GET /api/saas-admin/translations/keys/all
 * Get all available translation keys
 */
router.get('/translations/keys/all', async (req: AuthorizedRequest, res) => {
  try {
    const translationService = await import('../../services/TranslationService');
    const keys = await translationService.getAllTranslationKeys();
    res.json({ success: true, ...keys });
  } catch (error) {
    console.error('Error fetching translation keys:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch translation keys' });
  }
});

/**
 * POST /api/saas-admin/translations/:language/restore
 * Restore translations from backup
 */
router.post('/translations/:language/restore', async (req: AuthorizedRequest, res) => {
  try {
    const { language } = req.params;

    const translationService = await import('../../services/TranslationService');
    await translationService.restoreTranslations(language);

    res.json({ success: true, message: 'Translations restored successfully' });
  } catch (error) {
    console.error('Error restoring translations:', error);
    res.status(500).json({ success: false, message: 'Failed to restore translations' });
  }
});

/**
 * TRANSLATION COMPLETION - SaaS Admin Routes
 */

/**
 * GET /api/saas-admin/translation-completion/analyze
 * Analyze translation gaps across all languages
 */
router.get('/translation-completion/analyze', async (req: AuthorizedRequest, res) => {
  try {
    const { TranslationCompletionService } = await import('../../services/TranslationCompletionService');
    const service = new TranslationCompletionService();
    
    // Use the correct method from the service
    const scannedKeys = await service.scanCodebaseForTranslationKeys();
    const analysis = await service.generateCompletenessReportWithKeys(scannedKeys);
    
    res.json({ 
      success: true, 
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing translations:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze translations' });
  }
});

/**
 * POST /api/saas-admin/translation-completion/scan-keys
 * Scan for translation keys in source files
 */
router.post('/translation-completion/scan-keys', async (req: AuthorizedRequest, res) => {
  try {
    const { TranslationCompletionService } = await import('../../services/TranslationCompletionService');
    const service = new TranslationCompletionService();
    const result = await service.scanExistingTranslationFiles();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error scanning translation keys:', error);
    res.status(500).json({ success: false, message: 'Failed to scan translation keys' });
  }
});

/**
 * POST /api/saas-admin/translation-completion/expand-scan
 * Comprehensive translation expansion scanning
 */
router.post('/translation-completion/expand-scan', async (req: AuthorizedRequest, res) => {
  try {
    const { TranslationCompletionService } = await import('../../services/TranslationCompletionService');
    const service = new TranslationCompletionService();
    const result = await service.scanCodebaseForTranslationKeys();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error expanding translation scan:', error);
    res.status(500).json({ success: false, message: 'Failed to expand translation scan' });
  }
});

/**
 * GET /api/saas-admin/translations/expand-scan
 * Ultra-comprehensive scanning for more translation keys
 */
router.get('/translations/expand-scan', async (req: AuthorizedRequest, res) => {
  try {
    const translationService = await import('../../services/TranslationService');
    const result = await translationService.expandTranslationScan();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error expanding translation scan:', error);
    res.status(500).json({ success: false, message: 'Failed to expand translation scan' });
  }
});

/**
 * USER MANAGEMENT - SaaS Admin Global Routes
 * These endpoints manage users across the entire platform
 */

/**
 * GET /api/saas-admin/users/stats
 * Get global user statistics across all tenants
 */
router.get('/users/stats', async (req: AuthorizedRequest, res) => {
  try {
    // Global user statistics from public schema
    const globalStats = {
      totalUsers: 0,
      activeUsers: 0, 
      pendingInvitations: 0,
      activeSessions: 0,
      roleDistribution: {
        saas_admin: 0,
        tenant_admin: 0,
        agent: 0,
        customer: 0
      }
    };

    // TODO: Implement actual global user stats queries against public schema
    res.json({ success: true, stats: globalStats });
  } catch (error) {
    console.error('Error fetching global user stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch global user stats' });
  }
});

/**
 * GET /api/saas-admin/users
 * Get all users across all tenants
 */
router.get('/users', async (req: AuthorizedRequest, res) => {
  try {
    console.log('🔍 [SAAS-ADMIN-USERS] Fetching all users from public schema');
    
    // Usar o user repository para buscar todos os usuários
    const container = DependencyContainer.getInstance();
    const userRepository = container.userRepository;

    // Buscar todos os usuários ativos
    const globalUsers = await userRepository.findAll();

    console.log(`✅ [SAAS-ADMIN-USERS] Found ${globalUsers.length} users`);
    res.json({ 
      success: true, 
      users: globalUsers,
      pagination: { page: 1, limit: globalUsers.length, total: globalUsers.length }
    });
  } catch (error) {
    console.error('Error fetching global users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch global users' });
  }
});

/**
 * GET /api/saas-admin/users/groups
 * Get global user groups/roles across all tenants
 */
router.get('/users/groups', async (req: AuthorizedRequest, res) => {
  try {
    // Global user groups from public schema
    const globalGroups = [];

    // TODO: Implement actual global groups queries against public schema
    res.json({ success: true, groups: globalGroups });
  } catch (error) {
    console.error('Error fetching global user groups:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch global user groups' });
  }
});

/**
 * GET /api/saas-admin/users/sessions
 * Get global user sessions across all tenants
 */
router.get('/users/sessions', async (req: AuthorizedRequest, res) => {
  try {
    // Global user sessions from public schema
    const globalSessions = [];

    // TODO: Implement actual global sessions queries against public schema
    res.json({ success: true, sessions: globalSessions });
  } catch (error) {
    console.error('Error fetching global user sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch global user sessions' });
  }
});

/**
 * GET /api/saas-admin/users/activity
 * Get global user activity across all tenants
 */
router.get('/users/activity', async (req: AuthorizedRequest, res) => {
  try {
    // Global user activity from public schema
    const globalActivity = [];

    // TODO: Implement actual global activity queries against public schema
    res.json({ success: true, activity: globalActivity });
  } catch (error) {
    console.error('Error fetching global user activity:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch global user activity' });
  }
});

/**
 * TENANT PROVISIONING - SaaS Admin Global Routes
 * These endpoints manage tenant provisioning across the entire platform
 */

/**
 * GET /api/saas-admin/tenant-provisioning/config
 * Get global tenant provisioning configuration
 */
router.get('/tenant-provisioning/config', async (req: AuthorizedRequest, res) => {
  try {
    // Global tenant provisioning configuration from public schema
    const globalConfig = {
      enabled: true,
      allowSelfProvisioning: false,
      autoCreateOnFirstUser: false,
      subdomainGeneration: 'company-based',
      defaultTenantSettings: {
        maxUsers: 100,
        maxTickets: 1000,
        features: ['tickets', 'users', 'reports'],
        theme: 'default'
      }
    };

    // TODO: Implement actual global config queries against public schema
    res.json({ success: true, config: globalConfig });
  } catch (error) {
    console.error('Error fetching global tenant provisioning config:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch global tenant provisioning config' });
  }
});

/**
 * MODULE INTEGRITY - SaaS Admin Global Routes
 * These endpoints manage module integrity across the entire platform
 */

/**
 * GET /api/saas-admin/module-integrity/monitoring
 * Get global module integrity monitoring data
 */
router.get('/module-integrity/monitoring', async (req: AuthorizedRequest, res) => {
  try {
    // Global module integrity monitoring from public schema
    const globalMonitoring = {
      systemHealth: 'healthy',
      moduleStatuses: [],
      alerts: [],
      lastCheck: new Date().toISOString()
    };

    // TODO: Implement actual global monitoring queries against public schema
    res.json({ success: true, data: globalMonitoring });
  } catch (error) {
    console.error('Error fetching global module integrity monitoring:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch global module integrity monitoring' });
  }
});

// AI-powered translation auto-complete endpoint - MUST BE BEFORE router.use!
router.post('/translation-completion/auto-complete-all', jwtAuth, requireSaasAdmin, async (req: AuthenticatedRequest, res: any) => {
  console.log('🔥 [DEBUG] ENDPOINT HIT! translation-completion/auto-complete-all');
  console.log('🔥 [DEBUG] User:', req.user?.email);
  
  try {
    console.log('🤖 [AI-TRANSLATE] Auto-complete-all requested by:', req.user?.email);
    
    console.log('🔥 [DEBUG] Importing TranslationCompletionService...');
    const { TranslationCompletionService } = await import('../../services/TranslationCompletionService');
    console.log('🔥 [DEBUG] Creating service instance...');
    const translationService = new TranslationCompletionService();
    console.log('🔥 [DEBUG] Service created successfully');
    
    // Use AI to complete missing translations
    console.log('🔥 [DEBUG] Calling performAITranslationCompletion...');
    const aiResult = await translationService.performAITranslationCompletion();
    console.log('🔥 [DEBUG] AI completion finished, result:', { success: aiResult.success });
    console.log(`🤖 [AI-TRANSLATE] AI completion result:`, {
      success: aiResult.success,
      completed: aiResult.completed
    });
    
    if (aiResult.success) {
      res.json({
        success: true,
        data: {
          completed: aiResult.completed,
          details: aiResult.details,
          aiPowered: true
        },
        message: aiResult.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        message: aiResult.message,
        data: aiResult.details
      });
    }
    
  } catch (error) {
    console.error('❌ [AI-TRANSLATE] Auto-complete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete AI auto-completion',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
});

// Add saas-admin prefixed routes for translations - AFTER specific endpoints
router.use('/translations', translationsRoutes);
router.use('/translation-completion', translationCompletionRoutes);

export default router;