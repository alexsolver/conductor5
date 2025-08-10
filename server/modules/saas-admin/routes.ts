import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { requireSaasAdmin, requirePermission, AuthorizedRequest } from '../../middleware/authorizationMiddleware';
import { Permission } from '../../domain/authorization/RolePermissions';
import { DependencyContainer } from '../../application/services/DependencyContainer';
import { SaasAdminController } from './application/controllers/SaasAdminController';
import { GetConfigsUseCase } from './application/use-cases/GetConfigsUseCase'; // Assuming this is the correct path
import { configRepository } from '../../infrastructure/repositories/ConfigRepository'; // Assuming this is the correct path

const router = Router();
const saasAdminController = new SaasAdminController();

// Routes should only handle routing, delegate to controllers

// Aplicar middlewares de autenticação e autorização
router.use(jwtAuth);
router.use(requireSaasAdmin);

/**
 * GET /api/saas-admin/tenants
 * Lista todos os tenants da plataforma
 */
router.get('/tenants', requirePermission(Permission.PLATFORM_MANAGE_TENANTS), async (req: AuthorizedRequest, res) => {
  await saasAdminController.getTenants(req, res);
});

/**
 * POST /api/saas-admin/tenants
 * Criar novo tenant
 */
router.post('/tenants', requirePermission(Permission.PLATFORM_MANAGE_TENANTS), async (req: AuthorizedRequest, res) => {
  await saasAdminController.createTenant(req, res);
});

/**
 * GET /api/saas-admin/users
 * Lista todos os usuários da plataforma
 */
router.get('/users', requirePermission(Permission.PLATFORM_MANAGE_USERS), async (req: AuthorizedRequest, res) => {
  await saasAdminController.getUsers(req, res);
});

/**
 * GET /api/saas-admin/analytics
 * Analytics globais da plataforma
 */
router.get('/analytics', requirePermission(Permission.PLATFORM_VIEW_ANALYTICS), async (req: AuthorizedRequest, res) => {
  await saasAdminController.getPlatformAnalytics(req, res);
});

/**
 * PUT /api/saas-admin/tenants/:tenantId
 * Atualizar configurações de tenant
 */
router.put('/tenants/:tenantId', requirePermission(Permission.PLATFORM_MANAGE_TENANTS), async (req: AuthorizedRequest, res) => {
  await saasAdminController.updateTenant(req, res);
});

/**
 * DELETE /api/saas-admin/tenants/:tenantId
 * Desativar tenant (soft delete)
 */
router.delete('/tenants/:tenantId', requirePermission(Permission.PLATFORM_MANAGE_TENANTS), async (req: AuthorizedRequest, res) => {
  await saasAdminController.deactivateTenant(req, res);
});

/**
 * GET /api/saas-admin/analytics
 * Analytics da plataforma SaaS
 */
router.get('/analytics', requirePermission(Permission.PLATFORM_VIEW_ANALYTICS), async (req: AuthorizedRequest, res) => {
  await saasAdminController.getPlatformAnalytics(req, res);
});

/**
 * GET /api/saas-admin/configs
 * Lista todas as configurações da plataforma
 */
router.get('/configs', (req, res, next) => {
  saasAdminController.getConfigs(req, res).catch(next);
});

/**
 * POST /api/saas-admin/configs
 * Criar nova configuração da plataforma
 */
router.post('/configs', (req, res, next) => {
  saasAdminController.createConfig(req, res).catch(next);
});

/**
 * PUT /api/saas-admin/configs/:id
 * Atualizar configuração da plataforma
 */
router.put('/configs/:id', (req, res, next) => {
  saasAdminController.updateConfig(req, res).catch(next);
});

/**
 * DELETE /api/saas-admin/configs/:id
 * Remover configuração da plataforma
 */
router.delete('/configs/:id', (req, res, next) => {
  saasAdminController.deleteConfig(req, res).catch(next);
});


/**
 * GET /api/saas-admin/users
 * Lista todos os usuários da plataforma
 */
router.get('/users', requirePermission(Permission.PLATFORM_MANAGE_USERS), async (req: AuthorizedRequest, res) => {
  await saasAdminController.getUsers(req, res);
});

/**
 * POST /api/saas-admin/users
 * Criar novo usuário (SaaS admin)
 */
router.post('/users', requirePermission(Permission.PLATFORM_MANAGE_USERS), async (req: AuthorizedRequest, res) => {
  await saasAdminController.createUser(req, res);
});

// Additional routes handled by existing controller at top of file

export default router;