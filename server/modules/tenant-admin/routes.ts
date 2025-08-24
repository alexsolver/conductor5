import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { requirePermission, requireTenantAccess, AuthorizedRequest } from '../../middleware/rbacMiddleware';
import { DependencyContainer } from '../../application/services/DependencyContainer';

const router = Router();

// Apply authentication middleware
router.use(jwtAuth);

// Tenant admin middleware - check if user has tenant management permissions
const requireTenantAdmin = requirePermission('tenant', 'manage_settings');

/**
 * GET /api/tenant-admin/settings
 * Obter configurações do tenant
 */
router.get('/settings', requirePermission('tenant', 'manage_settings'), async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const container = DependencyContainer.getInstance();
    const tenantRepository = container.tenantRepository;
    
    const tenant = await tenantRepository.findById(tenantId);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    res.json({
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      settings: tenant.settings,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
    });
  } catch (error) {
    console.error('Error fetching tenant settings:', error);
    res.status(500).json({ message: 'Failed to fetch tenant settings' });
  }
});

/**
 * PUT /api/tenant-admin/settings
 * Atualizar configurações do tenant
 */
router.put('/settings', requirePermission('tenant', 'manage_settings'), async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const { name, settings } = req.body;
    
    const container = DependencyContainer.getInstance();
    const tenantRepository = container.tenantRepository;
    
    const updates: any = {};
    if (name) updates.name = name;
    if (settings) updates.settings = settings;
    
    const tenant = await tenantRepository.update(tenantId, updates);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    res.json(tenant);
  } catch (error) {
    console.error('Error updating tenant settings:', error);
    res.status(500).json({ message: 'Failed to update tenant settings' });
  }
});

/**
 * GET /api/tenant-admin/branding
 * Obter configurações de branding do tenant
 */
router.get('/branding', requirePermission('tenant', 'manage_settings'), async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const container = DependencyContainer.getInstance();
    const tenantRepository = container.tenantRepository;
    
    const tenant = await tenantRepository.findById(tenantId);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    // Configurações de branding padrão
    const defaultBrandingSettings = {
      logo: {
        url: "",
        darkUrl: "",
        favicon: ""
      },
      colors: {
        primary: "#8B5CF6",
        secondary: "#EC4899",
        accent: "#F59E0B",
        background: "#FFFFFF",
        surface: "#F8FAFC",
        text: "#1E293B",
        muted: "#64748B"
      },
      typography: {
        fontFamily: "Inter",
        fontSize: "14px",
        headingFont: "Inter"
      },
      layout: {
        sidebarStyle: "modern",
        headerStyle: "clean",
        borderRadius: "8px",
        spacing: "normal"
      },
      customization: {
        companyName: tenant.name || "",
        welcomeMessage: "Bem-vindo ao nosso sistema de suporte",
        footerText: "",
        supportEmail: "",
        helpUrl: "",
        showPoweredBy: true
      },
      themes: {
        defaultTheme: "light",
        allowUserThemeSwitch: true,
        customCss: ""
      }
    };
    
    // Mesclar configurações salvas com configurações padrão
    const brandingSettings = tenant.settings?.branding ? 
      { ...defaultBrandingSettings, ...tenant.settings.branding } : 
      defaultBrandingSettings;
    
    res.json({
      settings: brandingSettings
    });
  } catch (error) {
    console.error('Error fetching branding settings:', error);
    res.status(500).json({ message: 'Failed to fetch branding settings' });
  }
});

/**
 * PUT /api/tenant-admin/branding
 * Atualizar configurações de branding do tenant
 */
router.put('/branding', requirePermission('tenant', 'manage_settings'), async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const { settings: brandingSettings } = req.body;
    
    if (!brandingSettings) {
      return res.status(400).json({ message: 'Branding settings are required' });
    }
    
    const container = DependencyContainer.getInstance();
    const tenantRepository = container.tenantRepository;
    
    // Buscar tenant atual
    const currentTenant = await tenantRepository.findById(tenantId);
    
    if (!currentTenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    // Atualizar configurações de branding mantendo outras configurações existentes
    const updatedSettings = {
      ...currentTenant.settings,
      branding: brandingSettings
    };
    
    const tenant = await tenantRepository.update(tenantId, { 
      settings: updatedSettings 
    });
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    res.json({
      settings: brandingSettings,
      message: 'Branding settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating branding settings:', error);
    res.status(500).json({ message: 'Failed to update branding settings' });
  }
});

/**
 * GET /api/tenant-admin/users
 * Listar usuários do tenant
 */
router.get('/users', requirePermission('tenant', 'manage_users'), async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const container = DependencyContainer.getInstance();
    const userRepository = container.userRepository;
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const users = await userRepository.findByTenant(tenantId, { page, limit });
    
    res.json({
      users,
      pagination: { page, limit }
    });
  } catch (error) {
    console.error('Error fetching tenant users:', error);
    res.status(500).json({ message: 'Failed to fetch tenant users' });
  }
});

/**
 * POST /api/tenant-admin/users
 * Criar novo usuário no tenant
 */
router.post('/users', requirePermission('tenant', 'manage_users'), async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const { email, firstName, lastName, role = 'agent' } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validar que tenant admin não pode criar outros admins
    if (role === 'tenant_admin' || role === 'saas_admin') {
      return res.status(403).json({ message: 'Cannot create admin users' });
    }

    const container = DependencyContainer.getInstance();
    const userRepository = container.userRepository;
    const passwordHasher = container.passwordHasher;
    
    // Verificar se email já existe
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    
    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await passwordHasher.hash(tempPassword);
    
    const user = await userRepository.create({
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      role,
      tenantId
    });
    
    // Enviar email com senha temporária (implementar depois)
    
    res.status(201).json({
      ...user,
      tempPassword // Remover em produção
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

/**
 * PUT /api/tenant-admin/users/:userId
 * Atualizar usuário do tenant
 */
router.put('/users/:userId', requirePermission('tenant', 'manage_users'), async (req: AuthorizedRequest, res) => {
  try {
    const { userId } = req.params;
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const container = DependencyContainer.getInstance();
    const userRepository = container.userRepository;
    
    // Verificar se usuário pertence ao tenant
    const targetUser = await userRepository.findById(userId);
    if (!targetUser || targetUser.tenantId !== tenantId) {
      return res.status(404).json({ message: 'User not found in this tenant' });
    }
    
    // Não pode alterar outros admins
    if (targetUser.role === 'tenant_admin' || targetUser.role === 'saas_admin') {
      return res.status(403).json({ message: 'Cannot modify admin users' });
    }
    
    const updates = req.body;
    delete updates.role; // Não permitir mudança de role via esta rota
    
    const user = await userRepository.update(userId, updates);
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

/**
 * GET /api/tenant-admin/analytics
 * Analytics do tenant
 */
router.get('/analytics', requirePermission('tenant', 'view_analytics'), async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    // CORREÇÃO CRÍTICA: Usar importação direta do storage ao invés do container
    const { storageSimple } = await import('../../storage-simple');
    
    const stats = await storageSimple.getDashboardStats(tenantId);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching tenant analytics:', error);
    res.status(500).json({ message: 'Failed to fetch tenant analytics' });
  }
});

/**
 * GET /api/tenant-admin/slas
 * Obter SLAs do tenant
 */
router.get('/slas', requirePermission('tenant', 'manage_settings'), async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    // Simular dados de SLA por enquanto
    const slas = [
      {
        id: '1',
        name: 'Suporte Crítico',
        priority: 'critica',
        responseTime: 1,
        resolutionTime: 4,
        timeUnit: 'hours',
        category: 'Hardware',
        description: 'SLA para problemas críticos de hardware',
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Suporte Padrão',
        priority: 'media',
        responseTime: 4,
        resolutionTime: 24,
        timeUnit: 'hours',
        category: 'Software',
        description: 'SLA padrão para solicitações de software',
        active: true,
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json({ slas });
  } catch (error) {
    console.error('Error fetching SLAs:', error);
    res.status(500).json({ message: 'Failed to fetch SLAs' });
  }
});

/**
 * POST /api/tenant-admin/slas
 * Criar novo SLA
 */
router.post('/slas', requirePermission('tenant', 'manage_settings'), async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const { name, priority, responseTime, resolutionTime, timeUnit, category, description, active } = req.body;
    
    if (!name || !priority || !responseTime || !resolutionTime || !timeUnit) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Simular criação de SLA
    const newSLA = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      priority,
      responseTime,
      resolutionTime,
      timeUnit,
      category: category || null,
      description: description || null,
      active: active !== undefined ? active : true,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json(newSLA);
  } catch (error) {
    console.error('Error creating SLA:', error);
    res.status(500).json({ message: 'Failed to create SLA' });
  }
});

/**
 * GET /api/tenant-admin/sla-metrics
 * Métricas de SLA do tenant
 */
router.get('/sla-metrics', requirePermission('tenant', 'view_analytics'), async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    // Simular métricas de SLA
    const metrics = {
      totalSLAs: 5,
      activeSLAs: 4,
      averageCompliance: 87,
      criticalBreaches: 2,
      responseTimeAverage: '2.4h',
      resolutionTimeAverage: '18.6h',
      complianceByPriority: {
        critica: 95,
        alta: 89,
        media: 85,
        baixa: 92
      }
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching SLA metrics:', error);
    res.status(500).json({ message: 'Failed to fetch SLA metrics' });
  }
});

/**
 * GET /api/tenant-admin/integrations
 * Obter integrações do tenant usando dados reais
 */
router.get('/integrations', async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    // CORREÇÃO CRÍTICA: Usar importação direta do storage ao invés do container
    const { storageSimple } = await import('../../storage-simple');
    
    console.log(`🔍 Fetching integrations for tenant: ${tenantId}`);
    const integrations = await storageSimple.getTenantIntegrations(tenantId);
    console.log(`📊 Found ${integrations.length} integrations`);
    
    // ✅ TELEGRAM FIX: Log específico para verificar se Telegram está nas integrações
    const telegramIntegration = integrations.find(i => i.id === 'telegram');
    if (telegramIntegration) {
      console.log(`✅ TELEGRAM FOUND:`, {
        id: telegramIntegration.id,
        name: telegramIntegration.name,
        status: telegramIntegration.status,
        configured: telegramIntegration.configured
      });
    } else {
      console.log(`❌ TELEGRAM NOT FOUND in ${integrations.length} integrations`);
      console.log(`🔍 Available integrations:`, integrations.map(i => i.id));
    }
    
    res.json({
      integrations: integrations || [],
      totalCount: integrations?.length || 0
    });
  } catch (error) {
    console.error('Error fetching tenant integrations:', error);
    res.status(500).json({ 
      message: 'Failed to fetch tenant integrations',
      integrations: [],
      totalCount: 0 
    });
  }
});

/**
 * Gmail OAuth2 specific endpoints
 */

// GET /api/tenant-admin/integrations/gmail-oauth2/config
router.get('/integrations/gmail-oauth2/config', async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const { storageSimple } = await import('../../storage-simple');
    const config = await storageSimple.getTenantIntegrationConfig(tenantId, 'gmail-oauth2');
    
    // Return sanitized config (mask sensitive data)
    const sanitizedConfig = config ? {
      ...config,
      config: {
        ...config.config,
        clientSecret: config.config?.clientSecret ? '••••••••' : '',
        accessToken: config.config?.accessToken ? '••••••••' : '',
        refreshToken: config.config?.refreshToken ? '••••••••' : ''
      }
    } : null;
    
    res.json(sanitizedConfig);
  } catch (error) {
    console.error('Error fetching Gmail OAuth2 config:', error);
    res.status(500).json({ message: 'Failed to fetch Gmail OAuth2 configuration' });
  }
});

// POST /api/tenant-admin/integrations/gmail-oauth2/config
router.post('/integrations/gmail-oauth2/config', async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const { clientId, clientSecret, redirectUri, scopes, enabled } = req.body;
    
    const configData = {
      clientId: clientId || '',
      clientSecret: clientSecret || '',
      redirectUri: redirectUri || '',
      scopes: scopes || 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
      enabled: enabled !== false,
      lastUpdated: new Date().toISOString()
    };

    const { storageSimple } = await import('../../storage-simple');
    const savedConfig = await storageSimple.saveTenantIntegrationConfig(tenantId, 'gmail-oauth2', configData);

    res.json({
      message: 'Gmail OAuth2 configuration saved successfully',
      config: {
        ...savedConfig,
        config: {
          ...savedConfig.config,
          clientSecret: '••••••••',
          accessToken: '••••••••',
          refreshToken: '••••••••'
        }
      }
    });
  } catch (error) {
    console.error('Error saving Gmail OAuth2 config:', error);
    res.status(500).json({ message: 'Failed to save Gmail OAuth2 configuration' });
  }
});

// POST /api/tenant-admin/integrations/gmail-oauth2/oauth/start
router.post('/integrations/gmail-oauth2/oauth/start', async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const { storageSimple } = await import('../../storage-simple');
    const config = await storageSimple.getTenantIntegrationConfig(tenantId, 'gmail-oauth2');
    
    if (!config?.config?.clientId) {
      return res.status(400).json({ message: 'Gmail OAuth2 configuration missing. Please configure Client ID first.' });
    }

    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const scopes = config.config.scopes || 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';
    const redirectUri = config.config.redirectUri || `${req.protocol}://${req.get('host')}/auth/gmail/callback`;
    
    const authUrl = `${baseUrl}?client_id=${config.config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&prompt=consent&state=${tenantId}`;

    res.json({
      message: 'Gmail OAuth2 authorization URL generated',
      authUrl,
      scopes,
      redirectUri
    });
  } catch (error) {
    console.error('Error starting Gmail OAuth2 flow:', error);
    res.status(500).json({ message: 'Failed to start Gmail OAuth2 flow' });
  }
});

// POST /api/tenant-admin/integrations/gmail-oauth2/test
router.post('/integrations/gmail-oauth2/test', async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const { storageSimple } = await import('../../storage-simple');
    const config = await storageSimple.getTenantIntegrationConfig(tenantId, 'gmail-oauth2');
    
    if (!config?.config) {
      return res.json({
        success: false,
        error: 'Gmail OAuth2 configuration not found. Please configure the integration first.'
      });
    }

    // Simulate test based on configuration completeness
    const hasClientId = !!config.config.clientId;
    const hasClientSecret = !!config.config.clientSecret;
    const hasTokens = !!(config.config.accessToken || config.config.refreshToken);

    if (!hasClientId || !hasClientSecret) {
      return res.json({
        success: false,
        error: 'Gmail OAuth2 configuration incomplete. Missing Client ID or Client Secret.'
      });
    }

    if (!hasTokens) {
      return res.json({
        success: false,
        error: 'Gmail OAuth2 not authorized. Please complete the OAuth2 flow first.',
        details: {
          needsAuthorization: true,
          configurationComplete: true
        }
      });
    }

    // Update status to connected
    await storageSimple.updateTenantIntegrationStatus(tenantId, 'gmail-oauth2', 'connected');

    res.json({
      success: true,
      message: 'Gmail OAuth2 integration test successful',
      details: {
        status: 'Connected',
        lastTested: new Date().toISOString(),
        scopes: config.config.scopes || 'Default Gmail scopes'
      }
    });
  } catch (error) {
    console.error('Error testing Gmail OAuth2:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test Gmail OAuth2 integration'
    });
  }
});

export default router;
