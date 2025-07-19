import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { requireTenantAdmin, requirePermission, requireTenantAccess, AuthorizedRequest } from '../../middleware/authorizationMiddleware';
import { Permission } from '../../domain/authorization/RolePermissions';
import { DependencyContainer } from '../../application/services/DependencyContainer';

const router = Router();

// Aplicar middlewares de autenticação e autorização
router.use(jwtAuth);
router.use(requireTenantAdmin);

/**
 * GET /api/tenant-admin/settings
 * Obter configurações do tenant
 */
router.get('/settings', requirePermission(Permission.TENANT_MANAGE_SETTINGS), async (req: AuthorizedRequest, res) => {
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
router.put('/settings', requirePermission(Permission.TENANT_MANAGE_SETTINGS), async (req: AuthorizedRequest, res) => {
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
router.get('/branding', requirePermission(Permission.TENANT_MANAGE_SETTINGS), async (req: AuthorizedRequest, res) => {
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
router.put('/branding', requirePermission(Permission.TENANT_MANAGE_SETTINGS), async (req: AuthorizedRequest, res) => {
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
router.get('/users', requirePermission(Permission.TENANT_MANAGE_USERS), async (req: AuthorizedRequest, res) => {
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
router.post('/users', requirePermission(Permission.TENANT_MANAGE_USERS), async (req: AuthorizedRequest, res) => {
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
router.put('/users/:userId', requirePermission(Permission.TENANT_MANAGE_USERS), async (req: AuthorizedRequest, res) => {
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
router.get('/analytics', requirePermission(Permission.TENANT_VIEW_ANALYTICS), async (req: AuthorizedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'User not associated with a tenant' });
    }

    const container = DependencyContainer.getInstance();
    const storage = await container.getStorage();
    
    const stats = await storage.getDashboardStats(tenantId);
    
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
router.get('/slas', requirePermission(Permission.TENANT_MANAGE_SETTINGS), async (req: AuthorizedRequest, res) => {
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
router.post('/slas', requirePermission(Permission.TENANT_MANAGE_SETTINGS), async (req: AuthorizedRequest, res) => {
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
router.get('/sla-metrics', requirePermission(Permission.TENANT_VIEW_ANALYTICS), async (req: AuthorizedRequest, res) => {
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

export default router;
