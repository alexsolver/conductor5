import { Router } from 'express''[,;]
import { z } from 'zod''[,;]
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth''[,;]
import { requirePermission, requireTenantAccess } from '../middleware/rbacMiddleware''[,;]
import { userManagementService } from '../services/UserManagementService''[,;]

// Temporary schemas until user-management tables are added to unified schema
const insertUserGroupSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

const insertCustomRoleSchema = z.object({
  name: z.string(),
  permissions: z.array(z.string()),
});

const insertUserRoleAssignmentSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
});

const insertUserPermissionOverrideSchema = z.object({
  userId: z.string(),
  permission: z.string(),
  granted: z.boolean(),
});

const insertUserInvitationSchema = z.object({
  email: z.string().email(),
  role: z.string(),
});

const router = Router();

// ============= USER GROUPS ROUTES =============

// Get all user groups for a tenant
router.get('/groups', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const groups = await userManagementService.getUserGroups(tenantId);
      res.json({ groups });
    } catch (error) {
      console.error('Error fetching user groups:', error);
      res.status(500).json({ message: 'Failed to fetch user groups' });
    }
  }
);

// Create a new user group
router.post('/groups', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const data = insertUserGroupSchema.omit({ tenantId: true, createdBy: true }).parse(req.body);
      
      const group = await userManagementService.createUserGroup(tenantId, data, req.user!.id);
      res.status(201).json({ group });
    } catch (error) {
      console.error('Error creating user group:', error);
      res.status(500).json({ message: 'Failed to create user group' });
    }
  }
);

// Add user to group
router.post('/groups/:groupId/members', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId } = req.params;
      const { userId, role = 'member' } = req.body;
      
      const membership = await userManagementService.addUserToGroup(
        userId, 
        groupId, 
        role, 
        req.user!.id
      );
      res.status(201).json({ membership });
    } catch (error) {
      console.error('Error adding user to group:', error);
      res.status(500).json({ message: 'Failed to add user to group' });
    }
  }
);

// Remove user from group
router.delete('/groups/:groupId/members/:userId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId, userId } = req.params;
      
      await userManagementService.removeUserFromGroup(userId, groupId, req.user!.id);
      res.json({ message: 'User removed from group successfully' });
    } catch (error) {
      console.error('Error removing user from group:', error);
      res.status(500).json({ message: 'Failed to remove user from group' });
    }
  }
);

// ============= CUSTOM ROLES ROUTES =============

// Get all custom roles for a tenant
router.get('/roles', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const includeSystem = req.query.includeSystem === 'true''[,;]
      
      const roles = await userManagementService.getCustomRoles(tenantId, includeSystem);
      res.json({ roles });
    } catch (error) {
      console.error('Error fetching custom roles:', error);
      res.status(500).json({ message: 'Failed to fetch custom roles' });
    }
  }
);

// Create a new custom role
router.post('/roles', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const data = insertCustomRoleSchema.omit({ tenantId: true, createdBy: true }).parse(req.body);
      
      const role = await userManagementService.createCustomRole(tenantId, data, req.user!.id);
      res.status(201).json({ role });
    } catch (error) {
      console.error('Error creating custom role:', error);
      res.status(500).json({ message: 'Failed to create custom role' });
    }
  }
);

// Update a custom role
router.put('/roles/:roleId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { roleId } = req.params;
      const data = req.body;
      
      const role = await userManagementService.updateCustomRole(roleId, data, req.user!.id);
      res.json({ role });
    } catch (error) {
      console.error('Error updating custom role:', error);
      res.status(500).json({ message: 'Failed to update custom role' });
    }
  }
);

// ============= USER ROLE ASSIGNMENTS ROUTES =============

// Assign role to user
router.post('/users/:userId/roles', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const data = insertUserRoleAssignmentSchema.omit({ userId: true, assignedBy: true }).parse(req.body);
      
      const assignment = await userManagementService.assignRoleToUser(userId, data, req.user!.id);
      res.status(201).json({ assignment });
    } catch (error) {
      console.error('Error assigning role to user:', error);
      res.status(500).json({ message: 'Failed to assign role to user' });
    }
  }
);

// Remove role from user
router.delete('/users/:userId/roles/:assignmentId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, assignmentId } = req.params;
      
      await userManagementService.removeRoleFromUser(userId, assignmentId, req.user!.id);
      res.json({ message: 'Role removed from user successfully' });
    } catch (error) {
      console.error('Error removing role from user:', error);
      res.status(500).json({ message: 'Failed to remove role from user' });
    }
  }
);

// ============= PERMISSION OVERRIDES ROUTES =============

// Grant permission override to user
router.post('/users/:userId/permissions', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const data = insertUserPermissionOverrideSchema.omit({ userId: true, grantedBy: true }).parse(req.body);
      
      const override = await userManagementService.grantPermissionOverride(userId, data, req.user!.id);
      res.status(201).json({ override });
    } catch (error) {
      console.error('Error granting permission override:', error);
      res.status(500).json({ message: 'Failed to grant permission override' });
    }
  }
);

// ============= USER INVITATIONS ROUTES =============

// Send user invitation
router.post('/invitations', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const inviteSchema = z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        systemRole: z.string().optional(),
        customRoleIds: z.array(z.string()).optional(),
        groupIds: z.array(z.string()).optional(),
        expiresInHours: z.number().default(48),
        notes: z.string().optional()
      });
      
      const data = inviteSchema.parse(req.body);
      
      const invitation = await userManagementService.inviteUser(tenantId, data, req.user!.id);
      res.status(201).json({ invitation });
    } catch (error) {
      console.error('Error sending user invitation:', error);
      res.status(500).json({ message: 'Failed to send user invitation' });
    }
  }
);

// Accept user invitation
router.post('/invitations/:token/accept', 
  jwtAuth, 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { token } = req.params;
      
      await userManagementService.acceptInvitation(token, req.user!.id);
      res.json({ message: 'Invitation accepted successfully' });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      res.status(500).json({ message: 'Failed to accept invitation' });
    }
  }
);

// ============= ENHANCED USER MANAGEMENT ROUTES =============

// Get enhanced user information
router.get('/users/:userId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const options = {
        includePermissions: req.query.includePermissions === 'true''[,;]
        includeGroups: req.query.includeGroups === 'true''[,;]
        includeRoles: req.query.includeRoles === 'true''[,;]
        includeSessions: req.query.includeSessions === 'true''[,;]
        includeActivity: req.query.includeActivity === 'true'
      };
      
      const user = await userManagementService.getEnhancedUser(userId, options);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ user });
    } catch (error) {
      console.error('Error fetching enhanced user:', error);
      res.status(500).json({ message: 'Failed to fetch user information' });
    }
  }
);

// Get user effective permissions
router.get('/users/:userId/permissions', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      
      const permissions = await userManagementService.getUserEffectivePermissions(userId);
      res.json({ permissions });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({ message: 'Failed to fetch user permissions' });
    }
  }
);

// ============= SESSION MANAGEMENT ROUTES =============

// Get active sessions for a user
router.get('/users/:userId/sessions', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      
      const user = await userManagementService.getEnhancedUser(userId, { includeSessions: true });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ sessions: user.sessions || [] });
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      res.status(500).json({ message: 'Failed to fetch user sessions' });
    }
  }
);

// Terminate a specific session
router.delete('/sessions/:sessionId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { sessionId } = req.params;
      
      await userManagementService.terminateSession(sessionId, req.user!.id);
      res.json({ message: 'Session terminated successfully' });
    } catch (error) {
      console.error('Error terminating session:', error);
      res.status(500).json({ message: 'Failed to terminate session' });
    }
  }
);

// Terminate all sessions for a user
router.delete('/users/:userId/sessions', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      
      await userManagementService.terminateAllUserSessions(userId, req.user!.id);
      res.json({ message: 'All user sessions terminated successfully' });
    } catch (error) {
      console.error('Error terminating user sessions:', error);
      res.status(500).json({ message: 'Failed to terminate user sessions' });
    }
  }
);

// ============= STATISTICS AND AUDIT ROUTES =============

// Get user management statistics
router.get('/stats', 
  jwtAuth, 
  requirePermission('tenant', 'view_analytics'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      
      const stats = await userManagementService.getUserStats(tenantId);
      res.json({ stats });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ message: 'Failed to fetch user statistics' });
    }
  }
);

// Get activity log for audit
router.get('/activity', 
  jwtAuth, 
  requirePermission('tenant', 'view_analytics'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const stats = await userManagementService.getUserStats(tenantId);
      const activity = stats.recentActivity.slice(offset, offset + limit);
      
      res.json({ 
        activity,
        total: stats.recentActivity.length,
        limit,
        offset
      });
    } catch (error) {
      console.error('Error fetching activity log:', error);
      res.status(500).json({ message: 'Failed to fetch activity log' });
    }
  }
);

// ============= SYSTEM ROLES AND PERMISSIONS INFO =============

// Get available system roles
router.get('/system-roles', 
  jwtAuth, 
  async (req: AuthenticatedRequest, res) => {
    try {
      const systemRoles = [
        {
          name: 'saas_admin''[,;]
          displayName: 'SaaS Administrator''[,;]
          description: 'Full platform access including all tenants''[,;]
          isSystem: true
        },
        {
          name: 'tenant_admin''[,;]
          displayName: 'Tenant Administrator''[,;]
          description: 'Full access to tenant resources and user management''[,;]
          isSystem: true
        },
        {
          name: 'agent''[,;]
          displayName: 'Support Agent''[,;]
          description: 'Can handle tickets and manage customers''[,;]
          isSystem: true
        },
        {
          name: 'customer''[,;]
          displayName: 'Customer''[,;]
          description: 'Limited access to own tickets and profile''[,;]
          isSystem: true
        }
      ];
      
      res.json({ roles: systemRoles });
    } catch (error) {
      console.error('Error fetching system roles:', error);
      res.status(500).json({ message: 'Failed to fetch system roles' });
    }
  }
);

// Get available permissions
router.get('/permissions', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const permissions = [
        // Platform permissions
        { category: 'Platform', resource: 'platform', action: 'manage_tenants', description: 'Manage all tenants' },
        { category: 'Platform', resource: 'platform', action: 'manage_users', description: 'Manage all users across tenants' },
        { category: 'Platform', resource: 'platform', action: 'view_analytics', description: 'View platform-wide analytics' },
        { category: 'Platform', resource: 'platform', action: 'manage_billing', description: 'Manage platform billing' },
        { category: 'Platform', resource: 'platform', action: 'manage_security', description: 'Manage security settings' },
        
        // Tenant permissions
        { category: 'Tenant', resource: 'tenant', action: 'manage_settings', description: 'Manage tenant settings' },
        { category: 'Tenant', resource: 'tenant', action: 'manage_users', description: 'Manage tenant users' },
        { category: 'Tenant', resource: 'tenant', action: 'view_analytics', description: 'View tenant analytics' },
        { category: 'Tenant', resource: 'tenant', action: 'manage_billing', description: 'Manage tenant billing' },
        { category: 'Tenant', resource: 'tenant', action: 'configure_integrations', description: 'Configure integrations' },
        
        // Ticket permissions
        { category: 'Tickets', resource: 'ticket', action: 'view_all', description: 'View all tickets' },
        { category: 'Tickets', resource: 'ticket', action: 'view_assigned', description: 'View assigned tickets' },
        { category: 'Tickets', resource: 'ticket', action: 'view_own', description: 'View own tickets' },
        { category: 'Tickets', resource: 'ticket', action: 'create', description: 'Create tickets' },
        { category: 'Tickets', resource: 'ticket', action: 'update', description: 'Update tickets' },
        { category: 'Tickets', resource: 'ticket', action: 'delete', description: 'Delete tickets' },
        { category: 'Tickets', resource: 'ticket', action: 'assign', description: 'Assign tickets' },
        { category: 'Tickets', resource: 'ticket', action: 'resolve', description: 'Resolve tickets' },
        
        // Customer permissions
        { category: 'Customers', resource: 'customer', action: 'view_all', description: 'View all customers' },
        { category: 'Customers', resource: 'customer', action: 'view_own', description: 'View own customer profile' },
        { category: 'Customers', resource: 'customer', action: 'create', description: 'Create customers' },
        { category: 'Customers', resource: 'customer', action: 'update', description: 'Update customers' },
        { category: 'Customers', resource: 'customer', action: 'delete', description: 'Delete customers' },
        { category: 'Customers', resource: 'customer', action: 'export', description: 'Export customer data' }
      ];
      
      res.json({ permissions });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({ message: 'Failed to fetch permissions' });
    }
  }
);

export default router;