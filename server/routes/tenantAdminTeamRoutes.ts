import { Router } from 'express';
import { z } from 'zod';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { requirePermission } from '../middleware/rbacMiddleware';
import { userManagementService } from '../services/UserManagementService';
import { storageSimple } from '../storage-simple';

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
      const targetUser = await storageSimple.getUser(userId);
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

export default router;