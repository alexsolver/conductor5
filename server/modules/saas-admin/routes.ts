import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { requireSaasAdmin, requirePermission, AuthorizedRequest } from '../../middleware/authorizationMiddleware';
import { Permission } from '../../domain/authorization/RolePermissions';
import { DependencyContainer } from '../../application/services/DependencyContainer';

const router = Router();

// Aplicar middlewares de autenticação e autorização
router.use(jwtAuth);
router.use(requireSaasAdmin);

/**
 * GET /api/saas-admin/tenants
 * Lista todos os tenants da plataforma
 */
router.get('/tenants', requirePermission(Permission.PLATFORM_MANAGE_TENANTS), async (req: AuthorizedRequest, res) => {
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
router.post('/tenants', requirePermission(Permission.PLATFORM_MANAGE_TENANTS), async (req: AuthorizedRequest, res) => {
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
router.get('/users', requirePermission(Permission.PLATFORM_MANAGE_USERS), async (req: AuthorizedRequest, res) => {
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
router.get('/analytics', requirePermission(Permission.PLATFORM_VIEW_ANALYTICS), async (req: AuthorizedRequest, res) => {
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
router.put('/tenants/:tenantId', requirePermission(Permission.PLATFORM_MANAGE_TENANTS), async (req: AuthorizedRequest, res) => {
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
router.delete('/tenants/:tenantId', requirePermission(Permission.PLATFORM_MANAGE_TENANTS), async (req: AuthorizedRequest, res) => {
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
router.get('/analytics', requirePermission(Permission.PLATFORM_VIEW_ANALYTICS), async (req: AuthorizedRequest, res) => {
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
        const tickets = await storage.getTickets(tenant.id, 1, 0);
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
router.get('/users', requirePermission(Permission.PLATFORM_MANAGE_USERS), async (req: AuthorizedRequest, res) => {
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
router.post('/users', requirePermission(Permission.PLATFORM_MANAGE_USERS), async (req: AuthorizedRequest, res) => {
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
router.get('/integrations', requirePermission(Permission.PLATFORM_MANAGE_INTEGRATIONS), async (req: AuthorizedRequest, res) => {
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
 * GET /api/saas-admin/integrations/openweather
 * Obter configuração da integração OpenWeather
 */
router.get('/integrations/openweather', requirePermission(Permission.PLATFORM_MANAGE_INTEGRATIONS), async (req: AuthorizedRequest, res) => {
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
router.put('/integrations/openweather/api-key', requirePermission(Permission.PLATFORM_MANAGE_INTEGRATIONS), async (req: AuthorizedRequest, res) => {
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
 * GET /api/saas-admin/integrations/status/:status
 * Listar integrações por status
 */
router.get('/integrations/status/:status', requirePermission(Permission.PLATFORM_MANAGE_INTEGRATIONS), async (req: AuthorizedRequest, res) => {
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
router.get('/translations/languages', requirePermission(Permission.PLATFORM_MANAGE_TRANSLATIONS), async (req: AuthorizedRequest, res) => {
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
router.get('/translations/:language', requirePermission(Permission.PLATFORM_MANAGE_TRANSLATIONS), async (req: AuthorizedRequest, res) => {
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
router.put('/translations/:language', requirePermission(Permission.PLATFORM_MANAGE_TRANSLATIONS), async (req: AuthorizedRequest, res) => {
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
router.get('/translations/keys/all', requirePermission(Permission.PLATFORM_MANAGE_TRANSLATIONS), async (req: AuthorizedRequest, res) => {
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
router.post('/translations/:language/restore', requirePermission(Permission.PLATFORM_MANAGE_TRANSLATIONS), async (req: AuthorizedRequest, res) => {
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
router.get('/translation-completion/analyze', requirePermission(Permission.PLATFORM_MANAGE_TRANSLATIONS), async (req: AuthorizedRequest, res) => {
  try {
    const translationCompletionService = await import('../../services/TranslationCompletionService');
    const analysis = await translationCompletionService.analyzeTranslationGaps();
    res.json({ success: true, ...analysis });
  } catch (error) {
    console.error('Error analyzing translations:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze translations' });
  }
});

/**
 * POST /api/saas-admin/translation-completion/scan-keys
 * Scan for translation keys in source files
 */
router.post('/translation-completion/scan-keys', requirePermission(Permission.PLATFORM_MANAGE_TRANSLATIONS), async (req: AuthorizedRequest, res) => {
  try {
    const translationCompletionService = await import('../../services/TranslationCompletionService');
    const result = await translationCompletionService.scanTranslationKeys();
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
router.post('/translation-completion/expand-scan', requirePermission(Permission.PLATFORM_MANAGE_TRANSLATIONS), async (req: AuthorizedRequest, res) => {
  try {
    const translationCompletionService = await import('../../services/TranslationCompletionService');
    const result = await translationCompletionService.expandTranslationScan();
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
router.get('/translations/expand-scan', requirePermission(Permission.PLATFORM_MANAGE_TRANSLATIONS), async (req: AuthorizedRequest, res) => {
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
router.get('/users/stats', requirePermission(Permission.PLATFORM_MANAGE_USERS), async (req: AuthorizedRequest, res) => {
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
router.get('/users', requirePermission(Permission.PLATFORM_MANAGE_USERS), async (req: AuthorizedRequest, res) => {
  try {
    // Global user list from public schema
    const globalUsers = [];

    // TODO: Implement actual global user queries against public schema
    res.json({ success: true, users: globalUsers });
  } catch (error) {
    console.error('Error fetching global users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch global users' });
  }
});

/**
 * GET /api/saas-admin/users/groups
 * Get global user groups/roles across all tenants
 */
router.get('/users/groups', requirePermission(Permission.PLATFORM_MANAGE_USERS), async (req: AuthorizedRequest, res) => {
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
router.get('/users/sessions', requirePermission(Permission.PLATFORM_MANAGE_USERS), async (req: AuthorizedRequest, res) => {
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
router.get('/users/activity', requirePermission(Permission.PLATFORM_MANAGE_USERS), async (req: AuthorizedRequest, res) => {
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

export default router;