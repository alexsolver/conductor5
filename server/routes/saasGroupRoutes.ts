// ===========================================================================================
// SAAS GROUPS ROUTES - Global Groups Management for SaaS Admins
// ===========================================================================================

import express from 'express';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql, eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { 
  saasGroups, 
  saasGroupMemberships,
  insertSaasGroupSchema,
  insertSaasGroupMembershipSchema 
} from '@shared/schema';

const router = express.Router();

// Database connection for public schema operations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

// Middleware to ensure only SaaS Admin can access these routes
const requireSaasAdmin = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  if (req.user?.role !== 'saas_admin') {
    return res.status(403).json({
      success: false,
      error: 'Only SaaS Admin can access global groups'
    });
  }
  next();
};

// ===========================================================================================
// GET /api/saas/groups - List all SaaS groups
// ===========================================================================================
router.get(
  '/groups',
  jwtAuth,
  requireSaasAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      console.log(`🌐 [SAAS-GROUPS] Fetching all SaaS groups for SaaS Admin: ${req.user!.id}`);

      const groupsResult = await db
        .select({
          id: saasGroups.id,
          name: saasGroups.name,
          description: saasGroups.description,
          isActive: saasGroups.isActive,
          createdAt: saasGroups.createdAt,
          updatedAt: saasGroups.updatedAt,
          createdById: saasGroups.createdById,
          memberCount: sql<number>`COALESCE(COUNT(${saasGroupMemberships.id}), 0)`
        })
        .from(saasGroups)
        .leftJoin(
          saasGroupMemberships,
          and(
            eq(saasGroups.id, saasGroupMemberships.groupId),
            eq(saasGroupMemberships.isActive, true)
          )
        )
        .where(eq(saasGroups.isActive, true))
        .groupBy(
          saasGroups.id,
          saasGroups.name,
          saasGroups.description,
          saasGroups.isActive,
          saasGroups.createdAt,
          saasGroups.updatedAt,
          saasGroups.createdById
        )
        .orderBy(desc(saasGroups.createdAt));

      // Get memberships for each group
      const groupsWithMemberships = await Promise.all(
        groupsResult.map(async (group) => {
          const memberships = await db
            .select({
              id: saasGroupMemberships.id,
              userId: saasGroupMemberships.userId,
              role: saasGroupMemberships.role,
              isActive: saasGroupMemberships.isActive,
              createdAt: saasGroupMemberships.createdAt,
              assignedById: saasGroupMemberships.assignedById
            })
            .from(saasGroupMemberships)
            .where(
              and(
                eq(saasGroupMemberships.groupId, group.id),
                eq(saasGroupMemberships.isActive, true)
              )
            );

          return {
            ...group,
            memberships
          };
        })
      );

      console.log(`✅ [SAAS-GROUPS] Found ${groupsWithMemberships.length} SaaS groups`);

      res.json({
        success: true,
        groups: groupsWithMemberships,
        count: groupsWithMemberships.length
      });
    } catch (error) {
      console.error('❌ [SAAS-GROUPS] Error fetching SaaS groups:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch SaaS groups'
      });
    }
  }
);

// ===========================================================================================
// POST /api/saas/groups - Create new SaaS group
// ===========================================================================================
router.post(
  '/groups',
  jwtAuth,
  requireSaasAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      console.log(`🌐 [SAAS-GROUPS] Creating SaaS group for admin: ${req.user!.id}`);

      // Validate request body
      const validatedData = insertSaasGroupSchema.parse({
        ...req.body,
        createdById: req.user!.id
      });

      const newGroup = await db
        .insert(saasGroups)
        .values(validatedData)
        .returning();

      console.log(`✅ [SAAS-GROUPS] Created SaaS group: ${newGroup[0].id} - ${newGroup[0].name}`);

      res.status(201).json({
        success: true,
        group: newGroup[0],
        message: 'SaaS group created successfully'
      });
    } catch (error) {
      console.error('❌ [SAAS-GROUPS] Error creating SaaS group:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create SaaS group'
      });
    }
  }
);

// ===========================================================================================
// PUT /api/saas/groups/:id - Update SaaS group
// ===========================================================================================
router.put(
  '/groups/:id',
  jwtAuth,
  requireSaasAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      console.log(`🌐 [SAAS-GROUPS] Updating SaaS group: ${id}`);

      // Check if group exists
      const existingGroup = await db
        .select()
        .from(saasGroups)
        .where(and(eq(saasGroups.id, id), eq(saasGroups.isActive, true)))
        .limit(1);

      if (!existingGroup.length) {
        return res.status(404).json({
          success: false,
          error: 'SaaS group not found'
        });
      }

      // Validate request body (exclude id and timestamps)
      const updateData = insertSaasGroupSchema.partial().parse(req.body);

      const updatedGroup = await db
        .update(saasGroups)
        .set({
          ...updateData,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(saasGroups.id, id))
        .returning();

      console.log(`✅ [SAAS-GROUPS] Updated SaaS group: ${id}`);

      res.json({
        success: true,
        group: updatedGroup[0],
        message: 'SaaS group updated successfully'
      });
    } catch (error) {
      console.error('❌ [SAAS-GROUPS] Error updating SaaS group:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update SaaS group'
      });
    }
  }
);

// ===========================================================================================
// DELETE /api/saas/groups/:id - Delete SaaS group
// ===========================================================================================
router.delete(
  '/groups/:id',
  jwtAuth,
  requireSaasAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ [SAAS-GROUPS] Deleting SaaS group: ${id}`);

      // Check if group exists
      const existingGroup = await db
        .select()
        .from(saasGroups)
        .where(and(eq(saasGroups.id, id), eq(saasGroups.isActive, true)))
        .limit(1);

      if (!existingGroup.length) {
        return res.status(404).json({
          success: false,
          error: 'SaaS group not found'
        });
      }

      // First remove all memberships (soft delete)
      await db
        .update(saasGroupMemberships)
        .set({ isActive: false })
        .where(eq(saasGroupMemberships.groupId, id));

      // Then soft delete the group
      await db
        .update(saasGroups)
        .set({ 
          isActive: false,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(saasGroups.id, id));

      console.log(`✅ [SAAS-GROUPS] Deleted SaaS group: ${id}`);

      res.json({
        success: true,
        message: 'SaaS group deleted successfully'
      });
    } catch (error) {
      console.error('❌ [SAAS-GROUPS] Error deleting SaaS group:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete SaaS group'
      });
    }
  }
);

// ===========================================================================================
// POST /api/saas/groups/:id/members - Add member to SaaS group
// ===========================================================================================
router.post(
  '/groups/:id/members',
  jwtAuth,
  requireSaasAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id: groupId } = req.params;
      console.log(`👥 [SAAS-GROUPS] Adding member to SaaS group: ${groupId}`);

      // Validate request body
      const validatedData = insertSaasGroupMembershipSchema.parse({
        ...req.body,
        groupId,
        assignedById: req.user!.id
      });

      // Check if group exists
      const existingGroup = await db
        .select()
        .from(saasGroups)
        .where(and(eq(saasGroups.id, groupId), eq(saasGroups.isActive, true)))
        .limit(1);

      if (!existingGroup.length) {
        return res.status(404).json({
          success: false,
          error: 'SaaS group not found'
        });
      }

      // Check if membership already exists
      const existingMembership = await db
        .select()
        .from(saasGroupMemberships)
        .where(
          and(
            eq(saasGroupMemberships.groupId, groupId),
            eq(saasGroupMemberships.userId, validatedData.userId),
            eq(saasGroupMemberships.isActive, true)
          )
        )
        .limit(1);

      if (existingMembership.length) {
        return res.status(409).json({
          success: false,
          error: 'User is already a member of this group'
        });
      }

      const newMembership = await db
        .insert(saasGroupMemberships)
        .values(validatedData)
        .returning();

      console.log(`✅ [SAAS-GROUPS] Added member ${validatedData.userId} to SaaS group: ${groupId}`);

      res.status(201).json({
        success: true,
        membership: newMembership[0],
        message: 'Member added to SaaS group successfully'
      });
    } catch (error) {
      console.error('❌ [SAAS-GROUPS] Error adding member to SaaS group:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add member to SaaS group'
      });
    }
  }
);

// ===========================================================================================
// POST /api/saas/groups/:id/members/bulk - Add multiple members to SaaS group
// ===========================================================================================
router.post(
  '/groups/:id/members/bulk',
  jwtAuth,
  requireSaasAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id: groupId } = req.params;
      
      // ✅ Validação Zod para segurança
      const bulkMemberSchema = z.object({
        userIds: z.array(z.string().uuid()).min(1, 'At least one user ID is required'),
        role: z.enum(['member', 'admin', 'moderator']).default('member')
      });

      const validatedData = bulkMemberSchema.parse(req.body);
      
      // ✅ Deduplicar userIds para evitar erros de duplicata
      const uniqueUserIds = Array.from(new Set(validatedData.userIds));
      
      console.log(`👥 [SAAS-GROUPS] Adding ${uniqueUserIds.length} unique members to SaaS group: ${groupId}`);

      if (uniqueUserIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid user IDs provided'
        });
      }

      // Check if group exists
      const existingGroup = await db
        .select()
        .from(saasGroups)
        .where(and(eq(saasGroups.id, groupId), eq(saasGroups.isActive, true)))
        .limit(1);

      if (!existingGroup.length) {
        return res.status(404).json({
          success: false,
          error: 'SaaS group not found'
        });
      }

      // Check for existing memberships
      const existingMemberships = await db
        .select({ userId: saasGroupMemberships.userId })
        .from(saasGroupMemberships)
        .where(
          and(
            eq(saasGroupMemberships.groupId, groupId),
            eq(saasGroupMemberships.isActive, true)
          )
        );

      const existingUserIds = new Set(existingMemberships.map(m => m.userId));
      const newUserIds = uniqueUserIds.filter(userId => !existingUserIds.has(userId));

      if (newUserIds.length === 0) {
        return res.status(409).json({
          success: false,
          error: 'All selected users are already members of this group'
        });
      }

      // Prepare membership data
      const membershipData = newUserIds.map(userId => ({
        groupId,
        userId,
        role: validatedData.role,
        assignedById: req.user!.id,
        isActive: true
      }));

      // ✅ Insert multiple memberships com ON CONFLICT para evitar erros de duplicata
      const newMemberships = await db
        .insert(saasGroupMemberships)
        .values(membershipData)
        .onConflictDoNothing({ target: [saasGroupMemberships.groupId, saasGroupMemberships.userId] })
        .returning();

      console.log(`✅ [SAAS-GROUPS] Added ${newMemberships.length} members to SaaS group: ${groupId}`);

      const skippedUsers = uniqueUserIds.filter(userId => existingUserIds.has(userId));

      res.status(201).json({
        success: true,
        memberships: newMemberships,
        added: newMemberships.length,
        skipped: skippedUsers.length,
        skippedUsers,
        message: `Successfully added ${newMemberships.length} members to SaaS group`
      });
    } catch (error) {
      console.error('❌ [SAAS-GROUPS] Error adding bulk members to SaaS group:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add members to SaaS group'
      });
    }
  }
);

// ===========================================================================================
// DELETE /api/saas/groups/:id/members/:userId - Remove member from SaaS group
// ===========================================================================================
router.delete(
  '/groups/:id/members/:userId',
  jwtAuth,
  requireSaasAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id: groupId, userId } = req.params;
      console.log(`👥 [SAAS-GROUPS] Removing member ${userId} from SaaS group: ${groupId}`);

      // Find and deactivate the membership
      const result = await db
        .update(saasGroupMemberships)
        .set({ isActive: false })
        .where(
          and(
            eq(saasGroupMemberships.groupId, groupId),
            eq(saasGroupMemberships.userId, userId),
            eq(saasGroupMemberships.isActive, true)
          )
        )
        .returning();

      if (!result.length) {
        return res.status(404).json({
          success: false,
          error: 'Membership not found'
        });
      }

      console.log(`✅ [SAAS-GROUPS] Removed member ${userId} from SaaS group: ${groupId}`);

      res.json({
        success: true,
        message: 'Member removed from SaaS group successfully'
      });
    } catch (error) {
      console.error('❌ [SAAS-GROUPS] Error removing member from SaaS group:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove member from SaaS group'
      });
    }
  }
);

export default router;