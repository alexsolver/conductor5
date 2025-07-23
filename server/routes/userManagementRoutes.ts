import { Router } from 'express';
import { z } from 'zod';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { requirePermission, requireTenantAccess } from '../middleware/rbacMiddleware';
import { userManagementService } from '../services/UserManagementService';
import { db } from '../db';
import { userGroups, insertUserGroupSchema, updateUserGroupSchema } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// ============= SIMPLIFIED USER ROUTES =============

// Get all users for a tenant
router.get('/users', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const users = await userManagementService.getUsers(tenantId);
      res.json({ users });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  }
);

// Get user by ID
router.get('/users/:userId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const tenantId = req.user!.tenantId;
      const user = await userManagementService.getUserById(userId, tenantId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ user });
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  }
);

// ============= USER GROUPS ROUTES =============

// Get all groups for tenant
router.get('/groups', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const groups = await db.select().from(userGroups)
        .where(and(
          eq(userGroups.tenantId, tenantId),
          eq(userGroups.isActive, true)
        ))
        .orderBy(userGroups.createdAt);
      
      res.json({ groups });
    } catch (error) {
      console.error('Error fetching user groups:', error);
      res.status(500).json({ message: 'Failed to fetch user groups' });
    }
  }
);

// Create new group
router.post('/groups', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const validatedData = insertUserGroupSchema.parse(req.body);
      
      const [newGroup] = await db.insert(userGroups)
        .values({
          ...validatedData,
          tenantId
        })
        .returning();
      
      res.status(201).json({ group: newGroup });
    } catch (error: any) {
      console.error('Error creating user group:', error);
      if (error?.code === '23505') { // Unique constraint violation
        res.status(409).json({ message: 'Um grupo com esse nome já existe neste tenant' });
      } else {
        res.status(500).json({ message: 'Failed to create user group' });
      }
    }
  }
);

// Update group
router.put('/groups/:groupId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId } = req.params;
      const tenantId = req.user!.tenantId;
      const validatedData = updateUserGroupSchema.parse(req.body);
      
      const [updatedGroup] = await db.update(userGroups)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(and(
          eq(userGroups.id, groupId),
          eq(userGroups.tenantId, tenantId)
        ))
        .returning();
      
      if (!updatedGroup) {
        return res.status(404).json({ message: 'Group not found' });
      }
      
      res.json({ group: updatedGroup });
    } catch (error) {
      console.error('Error updating user group:', error);
      res.status(500).json({ message: 'Failed to update user group' });
    }
  }
);

// Delete group
router.delete('/groups/:groupId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId } = req.params;
      const tenantId = req.user!.tenantId;
      
      const [deletedGroup] = await db.update(userGroups)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(userGroups.id, groupId),
          eq(userGroups.tenantId, tenantId)
        ))
        .returning();
      
      if (!deletedGroup) {
        return res.status(404).json({ message: 'Group not found' });
      }
      
      res.json({ message: 'Group deleted successfully' });
    } catch (error) {
      console.error('Error deleting user group:', error);
      res.status(500).json({ message: 'Failed to delete user group' });
    }
  }
);

export default router;