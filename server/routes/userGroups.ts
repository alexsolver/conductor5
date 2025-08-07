import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { db } from '../db';
import { userGroups, userGroupMemberships } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { users } from '@shared/schema'; // Assuming users is in shared/schema
import crypto from 'crypto';

const userGroupsRouter = Router();

// Get user groups for assignment dropdown
userGroupsRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Get groups with member count
    const groupsWithCounts = await db
      .select({
        id: userGroups.id,
        name: userGroups.name,
        description: userGroups.description,
        isActive: userGroups.isActive,
        createdAt: userGroups.createdAt,
        memberCount: sql`COALESCE(COUNT(${userGroupMemberships.id}), 0)`.as('memberCount')
      })
      .from(userGroups)
      .leftJoin(
        userGroupMemberships, 
        eq(userGroups.id, userGroupMemberships.groupId)
      )
      .where(and(
        eq(userGroups.tenantId, req.user.tenantId),
        eq(userGroups.isActive, true)
      ))
      .groupBy(userGroups.id, userGroups.name, userGroups.description, userGroups.isActive, userGroups.createdAt)
      .orderBy(userGroups.name);

    // Get detailed memberships for each group
    const groupsWithMemberships = await Promise.all(
      groupsWithCounts.map(async (group) => {
        const memberships = await db
          .select({
            id: userGroupMemberships.id,
            userId: userGroupMemberships.userId,
            role: userGroupMemberships.role
          })
          .from(userGroupMemberships)
          .where(eq(userGroupMemberships.groupId, group.id));

        return {
          ...group,
          memberships: memberships,
          memberCount: Number(group.memberCount)
        };
      })
    );

    res.json({
      success: true,
      groups: groupsWithMemberships,
      count: groupsWithMemberships.length
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user groups' 
    });
  }
});

// Add user to group
userGroupsRouter.post('/:groupId/members', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const tenantId = req.user!.tenantId;

    console.log(`Adding user ${userId} to group ${groupId} for tenant ${tenantId}`);

    // Validate input
    if (!userId || !groupId) {
      return res.status(400).json({ message: 'userId and groupId are required' });
    }

    // Check if group exists and belongs to tenant
    const groupResult = await db.select()
      .from(userGroups)
      .where(and(
        eq(userGroups.id, groupId),
        eq(userGroups.tenantId, tenantId),
        eq(userGroups.isActive, true)
      ))
      .limit(1);

    if (!groupResult.length) {
      console.log(`Group ${groupId} not found for tenant ${tenantId}`);
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user exists and belongs to tenant
    const userResult = await db.select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.tenantId, tenantId),
        eq(users.isActive, true)
      ))
      .limit(1);

    if (!userResult.length) {
      console.log(`User ${userId} not found for tenant ${tenantId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if membership already exists and is active
    const existingMembership = await db.select()
      .from(userGroupMemberships)
      .where(and(
        eq(userGroupMemberships.userId, userId),
        eq(userGroupMemberships.groupId, groupId),
        eq(userGroupMemberships.isActive, true)
      ))
      .limit(1);

    if (existingMembership.length > 0) {
      console.log(`User ${userId} is already an active member of group ${groupId}`);
      return res.status(409).json({ message: 'User is already a member of this group' });
    }

    // Add user to group
    const membershipId = crypto.randomUUID();
    await db.insert(userGroupMemberships)
      .values({
        id: membershipId,
        tenantId: tenantId,
        userId,
        groupId,
        role: 'member',
        addedById: req.user!.id,
        addedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

    console.log(`Successfully added user ${userId} to group ${groupId}`);
    res.status(201).json({ 
      success: true,
      message: 'User added to group successfully',
      membershipId 
    });
  } catch (error: any) {
      console.error('Error adding user to group:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to add user to group',
        error: error?.message || 'Unknown error occurred' 
      });
    }
});

// Remove user from group
userGroupsRouter.delete('/:groupId/members/:userId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { groupId, userId } = req.params;
    const tenantId = req.user!.tenantId;

    console.log(`Removing user ${userId} from group ${groupId} for tenant ${tenantId}`);

    // Validate input
    if (!userId || !groupId) {
      return res.status(400).json({ message: 'userId and groupId are required' });
    }

    // Check if group exists and belongs to tenant
    const groupResult = await db.select()
      .from(userGroups)
      .where(and(
        eq(userGroups.id, groupId),
        eq(userGroups.tenantId, tenantId),
        eq(userGroups.isActive, true)
      ))
      .limit(1);

    if (!groupResult.length) {
      console.log(`Group ${groupId} not found for tenant ${tenantId}`);
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if active membership exists
    const existingMembership = await db.select()
      .from(userGroupMemberships)
      .where(and(
        eq(userGroupMemberships.userId, userId),
        eq(userGroupMemberships.groupId, groupId),
        eq(userGroupMemberships.isActive, true)
      ))
      .limit(1);

    if (!existingMembership.length) {
      console.log(`Active membership not found for user ${userId} in group ${groupId}`);
      return res.status(404).json({ message: 'User is not a member of this group' });
    }

    // Remove user from group (only active memberships)
    const result = await db.delete(userGroupMemberships)
      .where(and(
        eq(userGroupMemberships.userId, userId),
        eq(userGroupMemberships.groupId, groupId),
        eq(userGroupMemberships.isActive, true)
      ));

    if (result.rowCount === 0) {
      console.log(`Failed to remove user ${userId} from group ${groupId}`);
      return res.status(404).json({ message: 'Failed to remove membership' });
    }

    console.log(`Successfully removed user ${userId} from group ${groupId}`);
    res.json({ 
      success: true,
      message: 'User removed from group successfully' 
    });
  } catch (error: any) {
      console.error('Error removing user from group:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to remove user from group',
        error: error?.message || 'Unknown error occurred' 
      });
    }
});

export { userGroupsRouter };