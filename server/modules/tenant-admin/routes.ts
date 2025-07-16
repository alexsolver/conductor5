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
    const storage = container.storage;
    
    const stats = await storage.getDashboardStats(tenantId);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching tenant analytics:', error);
    res.status(500).json({ message: 'Failed to fetch tenant analytics' });
  }
});

export default router;