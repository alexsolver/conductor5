import { Router } from 'express';
import { z } from 'zod';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { requirePermission } from '../middleware/rbacMiddleware';
import { userManagementService } from '../services/UserManagementService';
import { storage } from '../storage';

const router = Router();

// ============= TENANT ADMIN TEAM MANAGEMENT ROUTES =============
// These routes are for tenant admins to manage users within their tenant
// (excluding SaaS admin level operations)

// Get team statistics for tenant admin
router.get('/stats', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const stats = await userManagementService.getTenantTeamStats(tenantId);
      res.json({ stats });
    } catch (error) {
      console.error('Error fetching team stats:', error);
      res.status(500).json({ message: 'Failed to fetch team statistics' });
    }
  }
);

// Get team members (users within tenant, excluding saas_admin)
router.get('/members', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const members = await userManagementService.getTenantTeamMembers(tenantId);
      res.json({ members });
    } catch (error) {
      console.error('Error fetching team members:', error);
      res.status(500).json({ message: 'Failed to fetch team members' });
    }
  }
);

// Get team users with detailed information (excludes saas_admin)
router.get('/users', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const { 
        includePermissions = false, 
        includeGroups = false, 
        includeRoles = false, 
        includeSessions = false,
        includeActivity = false 
      } = req.query;

      const options = {
        includePermissions: includePermissions === 'true',
        includeGroups: includeGroups === 'true',
        includeRoles: includeRoles === 'true',
        includeSessions: includeSessions === 'true',
        includeActivity: includeActivity === 'true'
      };

      const users = await userManagementService.getTenantUsers(tenantId, options);
      res.json({ users });
    } catch (error) {
      console.error('Error fetching tenant users:', error);
      res.status(500).json({ message: 'Failed to fetch tenant users' });
    }
  }
);

// Create user in tenant (tenant admin version)
router.post('/users', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const userData = req.body;
      
      // Tenant admins cannot create saas_admin users
      if (userData.role === 'saas_admin') {
        return res.status(403).json({ 
          message: 'Tenant admins cannot create SaaS admin users' 
        });
      }

      const user = await userManagementService.createTenantUser(
        tenantId, 
        userData, 
        req.user!.id
      );
      res.status(201).json({ user });
    } catch (error) {
      console.error('Error creating tenant user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  }
);

// Update user in tenant (tenant admin version)
router.put('/users/:userId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const tenantId = req.user!.tenantId;
      const updateData = req.body;

      // Check if user exists and belongs to tenant
      const targetUser = await storage.getUser(userId);
      if (!targetUser || targetUser.tenantId !== tenantId) {
        return res.status(404).json({ message: 'User not found in your tenant' });
      }

      // Tenant admins cannot modify saas_admin users
      if (targetUser.role === 'saas_admin' || updateData.role === 'saas_admin') {
        return res.status(403).json({ 
          message: 'Tenant admins cannot modify SaaS admin users' 
        });
      }

      const user = await userManagementService.updateTenantUser(
        userId, 
        updateData, 
        req.user!.id
      );
      res.json({ user });
    } catch (error) {
      console.error('Error updating tenant user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  }
);

// Invite user to tenant (tenant admin version)
router.post('/invitations', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const invitationData = req.body;
      
      // Tenant admins cannot invite users with saas_admin role
      if (invitationData.role === 'saas_admin') {
        return res.status(403).json({ 
          message: 'Tenant admins cannot invite SaaS admin users' 
        });
      }

      const invitation = await userManagementService.createTenantInvitation(
        tenantId,
        invitationData,
        req.user!.id
      );
      res.status(201).json({ invitation });
    } catch (error) {
      console.error('Error creating tenant invitation:', error);
      res.status(500).json({ message: 'Failed to create invitation' });
    }
  }
);

// Get tenant-specific user groups
router.get('/groups', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const groups = await userManagementService.getTenantUserGroups(tenantId);
      res.json({ groups });
    } catch (error) {
      console.error('Error fetching tenant user groups:', error);
      res.status(500).json({ message: 'Failed to fetch user groups' });
    }
  }
);

// Get tenant-specific custom roles (excluding system-level roles)
router.get('/roles', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const roles = await userManagementService.getTenantCustomRoles(tenantId);
      res.json({ roles });
    } catch (error) {
      console.error('Error fetching tenant custom roles:', error);
      res.status(500).json({ message: 'Failed to fetch custom roles' });
    }
  }
);

// Get tenant user invitations
router.get('/invitations', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const invitations = await userManagementService.getTenantInvitations(tenantId);
      res.json({ invitations });
    } catch (error) {
      console.error('Error fetching tenant invitations:', error);
      res.status(500).json({ message: 'Failed to fetch invitations' });
    }
  }
);

// Get tenant user sessions
router.get('/sessions', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const sessions = await userManagementService.getTenantUserSessions(tenantId);
      res.json({ sessions });
    } catch (error) {
      console.error('Error fetching tenant user sessions:', error);
      res.status(500).json({ message: 'Failed to fetch user sessions' });
    }
  }
);

// Get tenant user activity
router.get('/activity', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const { days = 7 } = req.query;
      const activity = await userManagementService.getTenantUserActivity(
        tenantId, 
        parseInt(days as string)
      );
      res.json({ activity });
    } catch (error) {
      console.error('Error fetching tenant user activity:', error);
      res.status(500).json({ message: 'Failed to fetch user activity' });
    }
  }
);

// ============= USER-LOCATION ASSIGNMENT ROUTES =============

// Get user location assignments
router.get('/users/:userId/locations', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const tenantId = req.user!.tenantId;
      
      const assignments = await userManagementService.getUserLocationAssignments(userId, tenantId);
      res.json({ assignments });
    } catch (error) {
      const { logError } = await import('../utils/logger');
      logError('Error fetching user location assignments', error, { 
        userId: req.params.userId,
        tenantId: req.user?.tenantId 
      });
      res.status(500).json({ message: 'Failed to fetch user location assignments' });
    }
  }
);

// Assign user to location
router.post('/users/:userId/locations', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const tenantId = req.user!.tenantId;
      const assignmentData = req.body;

      // Validate assignment data
      const assignmentSchema = z.object({
        locationId: z.string().uuid(),
        role: z.enum(['assigned', 'primary_contact', 'backup_contact', 'manager']).default('assigned'),
        isPrimary: z.boolean().default(false),
        accessLevel: z.enum(['basic', 'advanced', 'admin']).default('basic'),
        specialPermissions: z.array(z.string()).default([]),
        validFrom: z.string().datetime().optional(),
        validUntil: z.string().datetime().optional(),
        notes: z.string().optional()
      });

      const validatedData = assignmentSchema.parse(assignmentData);
      
      const assignment = await userManagementService.assignUserToLocation(
        userId, 
        tenantId, 
        validatedData,
        req.user!.id
      );
      
      res.status(201).json({ assignment });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      const { logError } = await import('../utils/logger');
      logError('Error assigning user to location', error, { 
        userId: req.params.userId,
        tenantId: req.user?.tenantId 
      });
      res.status(500).json({ message: 'Failed to assign user to location' });
    }
  }
);

// Update user location assignment
router.put('/users/:userId/locations/:assignmentId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, assignmentId } = req.params;
      const tenantId = req.user!.tenantId;
      const updateData = req.body;

      // Validate update data
      const updateSchema = z.object({
        role: z.enum(['assigned', 'primary_contact', 'backup_contact', 'manager']).optional(),
        isPrimary: z.boolean().optional(),
        accessLevel: z.enum(['basic', 'advanced', 'admin']).optional(),
        specialPermissions: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        validFrom: z.string().datetime().optional(),
        validUntil: z.string().datetime().optional(),
        notes: z.string().optional()
      });

      const validatedData = updateSchema.parse(updateData);
      
      const assignment = await userManagementService.updateUserLocationAssignment(
        assignmentId, 
        userId,
        tenantId, 
        validatedData,
        req.user!.id
      );
      
      res.json({ assignment });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      const { logError } = await import('../utils/logger');
      logError('Error updating user location assignment', error, { 
        userId: req.params.userId,
        assignmentId: req.params.assignmentId,
        tenantId: req.user?.tenantId 
      });
      res.status(500).json({ message: 'Failed to update user location assignment' });
    }
  }
);

// Remove user from location
router.delete('/users/:userId/locations/:assignmentId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, assignmentId } = req.params;
      const tenantId = req.user!.tenantId;
      
      await userManagementService.removeUserFromLocation(
        assignmentId, 
        userId,
        tenantId,
        req.user!.id
      );
      
      res.status(204).send();
    } catch (error) {
      const { logError } = await import('../utils/logger');
      logError('Error removing user from location', error, { 
        userId: req.params.userId,
        assignmentId: req.params.assignmentId,
        tenantId: req.user?.tenantId 
      });
      res.status(500).json({ message: 'Failed to remove user from location' });
    }
  }
);

// Get locations available for assignment
router.get('/locations', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const locations = await userManagementService.getAvailableLocations(tenantId);
      res.json({ locations });
    } catch (error) {
      const { logError } = await import('../utils/logger');
      logError('Error fetching available locations', error, { 
        tenantId: req.user?.tenantId 
      });
      res.status(500).json({ message: 'Failed to fetch available locations' });
    }
  }
);

export default router;