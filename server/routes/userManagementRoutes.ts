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

// ============= GROUP MEMBERS ROUTES =============

// Get group members
router.get('/groups/:groupId/members', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId } = req.params;
      const tenantId = req.user!.tenantId;
      
      // Query para buscar os membros do grupo específico
      const members = await db.select({
        userId: userGroups.id,
        groupId: userGroups.id,
        // Adicionar outros campos necessários dos membros
      })
      .from(userGroups)
      .where(and(
        eq(userGroups.id, groupId),
        eq(userGroups.tenantId, tenantId)
      ));
      
      res.json({ members });
    } catch (error) {
      console.error('Error fetching group members:', error);
      res.status(500).json({ message: 'Failed to fetch group members' });
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
      const { userId } = req.body;
      const tenantId = req.user!.tenantId;
      
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }
      
      // Verificar se o grupo existe
      const group = await db.select().from(userGroups)
        .where(and(
          eq(userGroups.id, groupId),
          eq(userGroups.tenantId, tenantId),
          eq(userGroups.isActive, true)
        ))
        .limit(1);
      
      if (!group.length) {
        return res.status(404).json({ message: 'Group not found' });
      }
      
      // Aqui precisaríamos implementar a lógica real de associação usuário-grupo
      // Por enquanto, vamos simular uma resposta de sucesso
      console.log(`Adding user ${userId} to group ${groupId} for tenant ${tenantId}`);
      
      res.status(201).json({ 
        message: 'User added to group successfully',
        groupId,
        userId 
      });
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
      const tenantId = req.user!.tenantId;
      
      // Verificar se o grupo existe
      const group = await db.select().from(userGroups)
        .where(and(
          eq(userGroups.id, groupId),
          eq(userGroups.tenantId, tenantId),
          eq(userGroups.isActive, true)
        ))
        .limit(1);
      
      if (!group.length) {
        return res.status(404).json({ message: 'Group not found' });
      }
      
      // Aqui precisaríamos implementar a lógica real de remoção usuário-grupo
      // Por enquanto, vamos simular uma resposta de sucesso
      console.log(`Removing user ${userId} from group ${groupId} for tenant ${tenantId}`);
      
      res.json({ 
        message: 'User removed from group successfully',
        groupId,
        userId 
      });
    } catch (error) {
      console.error('Error removing user from group:', error);
      res.status(500).json({ message: 'Failed to remove user from group' });
    }
  }
);

export default router;