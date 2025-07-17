import { Router } from 'express';
import { z } from 'zod';
import { multiTenantService } from '../services/MultiTenantService';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { requirePermission } from '../middleware/rbacMiddleware';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const grantAccessSchema = z.object({
  userId: z.string(),
  tenantId: z.string(),
  role: z.enum(['customer', 'agent', 'tenant_admin']),
  isPrimary: z.boolean().optional().default(false),
  permissions: z.record(z.any()).optional(),
  notes: z.string().optional()
});

const updateRoleSchema = z.object({
  role: z.enum(['customer', 'agent', 'tenant_admin'])
});

const createInvitationSchema = z.object({
  tenantId: z.string(),
  userId: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['customer', 'agent', 'tenant_admin']),
  message: z.string().optional(),
  permissions: z.record(z.any()).optional(),
  expiresInHours: z.number().min(1).max(720).optional().default(168) // 7 days
}).refine(data => data.userId || data.email, {
  message: "Either userId or email must be provided"
});

// ==================== USER TENANT ACCESS ====================

/**
 * GET /api/multi-tenant/user/:userId/tenants
 * Obtém todos os tenants aos quais um usuário tem acesso
 */
router.get('/user/:userId/tenants', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    
    // Verifica se o usuário pode acessar essas informações
    if (req.user?.id !== userId && req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const tenantAccesses = await multiTenantService.getUserTenantAccesses(userId);
    
    res.json({
      success: true,
      tenantAccesses
    });
  } catch (error) {
    logger.error('Error fetching user tenant accesses:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user tenant accesses' 
    });
  }
});

/**
 * GET /api/multi-tenant/user/:userId/tenant/:tenantId/access
 * Verifica se um usuário tem acesso a um tenant específico
 */
router.get('/user/:userId/tenant/:tenantId/access', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, tenantId } = req.params;
    
    // Verifica se o usuário pode acessar essas informações
    if (req.user?.id !== userId && req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const access = await multiTenantService.hasUserTenantAccess(userId, tenantId);
    
    res.json({
      success: true,
      hasAccess: !!access,
      access
    });
  } catch (error) {
    logger.error('Error checking user tenant access:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check user tenant access' 
    });
  }
});

/**
 * POST /api/multi-tenant/grant-access
 * Concede acesso de um usuário a um tenant (somente SaaS Admin)
 */
router.post('/grant-access', jwtAuth, requirePermission('platform', 'manage_tenants'), async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = grantAccessSchema.parse(req.body);
    
    const access = await multiTenantService.grantUserTenantAccess({
      ...validatedData,
      grantedBy: req.user!.id
    });
    
    res.json({
      success: true,
      access,
      message: 'Access granted successfully'
    });
  } catch (error) {
    logger.error('Error granting user tenant access:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to grant access' 
    });
  }
});

/**
 * DELETE /api/multi-tenant/user/:userId/tenant/:tenantId/access
 * Revoga acesso de um usuário a um tenant (somente SaaS Admin)
 */
router.delete('/user/:userId/tenant/:tenantId/access', jwtAuth, requirePermission('platform', 'manage_tenants'), async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, tenantId } = req.params;
    
    const revoked = await multiTenantService.revokeUserTenantAccess(userId, tenantId, req.user!.id);
    
    if (revoked) {
      res.json({
        success: true,
        message: 'Access revoked successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Access not found'
      });
    }
  } catch (error) {
    logger.error('Error revoking user tenant access:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to revoke access' 
    });
  }
});

/**
 * PUT /api/multi-tenant/user/:userId/tenant/:tenantId/role
 * Atualiza o papel de um usuário em um tenant (SaaS Admin ou Tenant Admin)
 */
router.put('/user/:userId/tenant/:tenantId/role', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, tenantId } = req.params;
    const { role } = updateRoleSchema.parse(req.body);
    
    // Verifica permissões
    const canUpdate = req.user?.role === 'saas_admin' || 
                     (req.user?.role === 'tenant_admin' && req.user?.tenantId === tenantId);
    
    if (!canUpdate) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    const updated = await multiTenantService.updateUserTenantRole(userId, tenantId, role, req.user!.id);
    
    if (updated) {
      res.json({
        success: true,
        message: 'Role updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User access not found'
      });
    }
  } catch (error) {
    logger.error('Error updating user tenant role:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update role' 
    });
  }
});

// ==================== TENANT USERS ====================

/**
 * GET /api/multi-tenant/tenant/:tenantId/users
 * Obtém todos os usuários de um tenant
 */
router.get('/tenant/:tenantId/users', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { tenantId } = req.params;
    
    // Verifica se o usuário pode acessar essas informações
    const canAccess = req.user?.role === 'saas_admin' || 
                     (req.user?.role === 'tenant_admin' && req.user?.tenantId === tenantId);
    
    if (!canAccess) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    const users = await multiTenantService.getTenantUsers(tenantId);
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    logger.error('Error fetching tenant users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tenant users' 
    });
  }
});

// ==================== INVITATIONS ====================

/**
 * POST /api/multi-tenant/invitations
 * Cria um convite para adicionar um usuário a um tenant
 */
router.post('/invitations', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = createInvitationSchema.parse(req.body);
    
    // Verifica se o usuário pode criar convites para este tenant
    const canInvite = req.user?.role === 'saas_admin' || 
                     (req.user?.role === 'tenant_admin' && req.user?.tenantId === validatedData.tenantId);
    
    if (!canInvite) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    const invitation = await multiTenantService.createTenantInvitation({
      ...validatedData,
      inviterId: req.user!.id
    });
    
    res.json({
      success: true,
      invitation,
      message: 'Invitation created successfully'
    });
  } catch (error) {
    logger.error('Error creating tenant invitation:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to create invitation' 
    });
  }
});

/**
 * GET /api/multi-tenant/user/:userId/invitations
 * Obtém convites pendentes para um usuário
 */
router.get('/user/:userId/invitations', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    
    // Verifica se o usuário pode acessar essas informações
    if (req.user?.id !== userId && req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    const invitations = await multiTenantService.getUserPendingInvitations(userId);
    
    res.json({
      success: true,
      invitations
    });
  } catch (error) {
    logger.error('Error fetching user invitations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch invitations' 
    });
  }
});

/**
 * GET /api/multi-tenant/tenant/:tenantId/invitations
 * Obtém convites enviados por um tenant
 */
router.get('/tenant/:tenantId/invitations', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { tenantId } = req.params;
    
    // Verifica se o usuário pode acessar essas informações
    const canAccess = req.user?.role === 'saas_admin' || 
                     (req.user?.role === 'tenant_admin' && req.user?.tenantId === tenantId);
    
    if (!canAccess) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    const invitations = await multiTenantService.getTenantInvitations(tenantId);
    
    res.json({
      success: true,
      invitations
    });
  } catch (error) {
    logger.error('Error fetching tenant invitations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch invitations' 
    });
  }
});

/**
 * POST /api/multi-tenant/invitations/:invitationId/accept
 * Aceita um convite para se juntar a um tenant
 */
router.post('/invitations/:invitationId/accept', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { invitationId } = req.params;
    
    const access = await multiTenantService.acceptTenantInvitation(invitationId, req.user!.id);
    
    res.json({
      success: true,
      access,
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    logger.error('Error accepting tenant invitation:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to accept invitation' 
    });
  }
});

/**
 * POST /api/multi-tenant/invitations/:invitationId/reject
 * Rejeita um convite para se juntar a um tenant
 */
router.post('/invitations/:invitationId/reject', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { invitationId } = req.params;
    
    const rejected = await multiTenantService.rejectTenantInvitation(invitationId);
    
    if (rejected) {
      res.json({
        success: true,
        message: 'Invitation rejected successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
  } catch (error) {
    logger.error('Error rejecting tenant invitation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reject invitation' 
    });
  }
});

// ==================== ACCESS LOGGING ====================

/**
 * GET /api/multi-tenant/user/:userId/access-logs
 * Obtém logs de acesso de um usuário
 */
router.get('/user/:userId/access-logs', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const { tenantId, limit = '50' } = req.query;
    
    // Verifica se o usuário pode acessar essas informações
    if (req.user?.id !== userId && req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    const logs = await multiTenantService.getUserAccessLogs(
      userId, 
      tenantId as string, 
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    logger.error('Error fetching user access logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch access logs' 
    });
  }
});

/**
 * POST /api/multi-tenant/user/:userId/tenant/:tenantId/access-log
 * Registra um log de acesso (usado pelo sistema)
 */
router.post('/user/:userId/tenant/:tenantId/access-log', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, tenantId } = req.params;
    const { action, metadata } = req.body;
    
    // Verifica se o usuário pode registrar logs
    if (req.user?.id !== userId && req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    await multiTenantService.logUserTenantAccess({
      userId,
      tenantId,
      action,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata
    });
    
    res.json({
      success: true,
      message: 'Access log recorded successfully'
    });
  } catch (error) {
    logger.error('Error recording access log:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to record access log' 
    });
  }
});

/**
 * PUT /api/multi-tenant/user/:userId/tenant/:tenantId/last-access
 * Atualiza último acesso do usuário ao tenant
 */
router.put('/user/:userId/tenant/:tenantId/last-access', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, tenantId } = req.params;
    
    // Verifica se o usuário pode atualizar o último acesso
    if (req.user?.id !== userId && req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    await multiTenantService.updateLastAccess(userId, tenantId);
    
    res.json({
      success: true,
      message: 'Last access updated successfully'
    });
  } catch (error) {
    logger.error('Error updating last access:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update last access' 
    });
  }
});

// ==================== STATISTICS ====================

/**
 * GET /api/multi-tenant/stats
 * Get multi-tenant statistics
 */
router.get('/stats', jwtAuth, requirePermission('platform', 'manage_tenants'), async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await multiTenantService.getMultiTenantStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting multi-tenant stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== RELATIONSHIPS ====================

/**
 * GET /api/multi-tenant/relationships
 * Get all user-tenant relationships
 */
router.get('/relationships', jwtAuth, requirePermission('platform', 'manage_tenants'), async (req: AuthenticatedRequest, res) => {
  try {
    const relationships = await multiTenantService.getAllUserTenantRelationships();
    res.json(relationships);
  } catch (error) {
    logger.error('Error getting relationships:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/multi-tenant/relationships
 * Create a new user-tenant relationship
 */
router.post('/relationships', jwtAuth, requirePermission('platform', 'manage_tenants'), async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, tenantId, role, isActive = true, isPrimary = false, notes } = req.body;
    const grantedBy = req.user!.id;
    
    const relationship = await multiTenantService.createUserTenantRelationship({
      userId,
      tenantId,
      role,
      isActive,
      isPrimary,
      grantedBy,
      notes
    });
    
    res.status(201).json(relationship);
  } catch (error) {
    logger.error('Error creating relationship:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PUT /api/multi-tenant/relationships/:id
 * Update a user-tenant relationship
 */
router.put('/relationships/:id', jwtAuth, requirePermission('platform', 'manage_tenants'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { role, isActive, isPrimary, notes } = req.body;
    const updatedBy = req.user!.id;
    
    const success = await multiTenantService.updateUserTenantRelationship(id, {
      role,
      isActive,
      isPrimary,
      notes,
      updatedBy
    });
    
    if (success) {
      res.json({ success: true, message: 'Relationship updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Relationship not found' });
    }
  } catch (error) {
    logger.error('Error updating relationship:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * DELETE /api/multi-tenant/relationships/:id
 * Delete a user-tenant relationship
 */
router.delete('/relationships/:id', jwtAuth, requirePermission('platform', 'manage_tenants'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const success = await multiTenantService.deleteUserTenantRelationship(id);
    
    if (success) {
      res.json({ success: true, message: 'Relationship deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Relationship not found' });
    }
  } catch (error) {
    logger.error('Error deleting relationship:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== USERS AND TENANTS ====================

/**
 * GET /api/multi-tenant/users
 * Get all users for multi-tenant management
 */
router.get('/users', jwtAuth, requirePermission('platform', 'manage_tenants'), async (req: AuthenticatedRequest, res) => {
  try {
    const users = await multiTenantService.getAllUsers();
    res.json(users);
  } catch (error) {
    logger.error('Error getting users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/multi-tenant/tenants
 * Get all tenants for multi-tenant management
 */
router.get('/tenants', jwtAuth, requirePermission('platform', 'manage_tenants'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenants = await multiTenantService.getAllTenants();
    res.json(tenants);
  } catch (error) {
    logger.error('Error getting tenants:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== RESEND AND MANAGE INVITATIONS ====================

/**
 * POST /api/multi-tenant/invitations/:id/resend
 * Resend an invitation
 */
router.post('/invitations/:id/resend', jwtAuth, requirePermission('platform', 'manage_tenants'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const success = await multiTenantService.resendInvitation(id, req.user!.id);
    
    if (success) {
      res.json({ success: true, message: 'Invitation resent successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Invitation not found or cannot be resent' });
    }
  } catch (error) {
    logger.error('Error resending invitation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * DELETE /api/multi-tenant/invitations/:id
 * Cancel an invitation
 */
router.delete('/invitations/:id', jwtAuth, requirePermission('platform', 'manage_tenants'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const success = await multiTenantService.cancelInvitation(id);
    
    if (success) {
      res.json({ success: true, message: 'Invitation cancelled successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Invitation not found' });
    }
  } catch (error) {
    logger.error('Error cancelling invitation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;