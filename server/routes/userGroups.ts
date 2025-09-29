import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { db } from '../db';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';

const userGroupsRouter = Router();

// Get user groups for assignment dropdown
userGroupsRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🔍 [USER-GROUPS] GET / called. User:', req.user);
    
    if (!req.user?.tenantId) {
      console.log('❌ [USER-GROUPS] No tenant ID in request');
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const tenantId = req.user.tenantId;
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    console.log(`🔍 [USER-GROUPS] Fetching groups from schema: ${schemaName}`);

    // Get groups with member count using tenant schema
    const groupsQuery = `
      SELECT 
        ug.id,
        ug.name,
        ug.description,
        ug.is_active,
        ug.created_at,
        COALESCE(COUNT(ugm.id), 0) as member_count
      FROM "${schemaName}".user_groups ug
      LEFT JOIN "${schemaName}".user_group_memberships ugm 
        ON ug.id = ugm.group_id AND ugm.is_active = true
      WHERE ug.tenant_id = $1::uuid AND ug.is_active = true
      GROUP BY ug.id, ug.name, ug.description, ug.is_active, ug.created_at
      ORDER BY ug.name
    `;

    const groupsResult = await db.execute(sql.raw(groupsQuery, [tenantId]));

    // Get detailed memberships for each group
    const groupsWithMemberships = await Promise.all(
      groupsResult.rows.map(async (group: any) => {
        const membershipsQuery = `
          SELECT 
            ugm.id,
            ugm.user_id,
            ugm.role
          FROM "${schemaName}".user_group_memberships ugm
          WHERE ugm.group_id = $1::uuid AND ugm.is_active = true
        `;

        const membershipsResult = await db.execute(sql.raw(membershipsQuery, [group.id]));

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          isActive: group.is_active,
          createdAt: group.created_at,
          memberships: membershipsResult.rows,
          memberCount: Number(group.member_count)
        };
      })
    );

    console.log(`✅ [USER-GROUPS] Found ${groupsWithMemberships.length} groups in tenant schema`);

    res.json({
      success: true,
      groups: groupsWithMemberships,
      count: groupsWithMemberships.length
    });
  } catch (error) {
    console.error('❌ [USER-GROUPS] Error fetching user groups:', error);
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
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    console.log(`Adding user ${userId} to group ${groupId} for tenant ${tenantId} in schema ${schemaName}`);

    // Validate input
    if (!userId || !groupId) {
      return res.status(400).json({ message: 'userId and groupId are required' });
    }

    // Check if group exists and belongs to tenant
    const groupQuery = `
      SELECT id FROM "${schemaName}".user_groups 
      WHERE id = $1::uuid AND tenant_id = $2::uuid AND is_active = true
    `;
    const groupResult = await db.execute(sql.raw(groupQuery, [groupId, tenantId]));

    if (!groupResult.rows.length) {
      console.log(`Group ${groupId} not found for tenant ${tenantId}`);
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user exists and belongs to tenant (users are in public schema)
    const userQuery = `
      SELECT id FROM public.users 
      WHERE id = $1::uuid AND tenant_id = $2::uuid AND is_active = true
    `;
    const userResult = await db.execute(sql.raw(userQuery, [userId, tenantId]));

    if (!userResult.rows.length) {
      console.log(`User ${userId} not found for tenant ${tenantId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if membership already exists and is active
    const existingQuery = `
      SELECT id FROM "${schemaName}".user_group_memberships 
      WHERE user_id = $1::uuid AND group_id = $2::uuid AND is_active = true
    `;
    const existingResult = await db.execute(sql.raw(existingQuery, [userId, groupId]));

    if (existingResult.rows.length > 0) {
      console.log(`User ${userId} is already an active member of group ${groupId}`);
      return res.status(409).json({ message: 'User is already a member of this group' });
    }

    // Add user to group
    const membershipId = crypto.randomUUID();
    const insertQuery = `
      INSERT INTO "${schemaName}".user_group_memberships 
      (id, tenant_id, user_id, group_id, role, added_by_id, added_at, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    const now = new Date();
    await db.execute(sql.raw(insertQuery, [
      membershipId,
      tenantId,
      userId,
      groupId,
      'member',
      req.user!.id,
      now,
      true,
      now,
      now
    ]));

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
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    console.log(`Removing user ${userId} from group ${groupId} for tenant ${tenantId} in schema ${schemaName}`);

    // Validate input
    if (!userId || !groupId) {
      return res.status(400).json({ message: 'userId and groupId are required' });
    }

    // Check if group exists and belongs to tenant
    const groupQuery = `
      SELECT id FROM "${schemaName}".user_groups 
      WHERE id = $1::uuid AND tenant_id = $2::uuid AND is_active = true
    `;
    const groupResult = await db.execute(sql.raw(groupQuery, [groupId, tenantId]));

    if (!groupResult.rows.length) {
      console.log(`Group ${groupId} not found for tenant ${tenantId}`);
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if active membership exists
    const existingQuery = `
      SELECT id FROM "${schemaName}".user_group_memberships 
      WHERE user_id = $1::uuid AND group_id = $2::uuid AND is_active = true
    `;
    const existingResult = await db.execute(sql.raw(existingQuery, [userId, groupId]));

    if (!existingResult.rows.length) {
      console.log(`Active membership not found for user ${userId} in group ${groupId}`);
      return res.status(404).json({ message: 'User is not a member of this group' });
    }

    // Remove user from group (only active memberships)
    const deleteQuery = `
      DELETE FROM "${schemaName}".user_group_memberships 
      WHERE user_id = $1::uuid AND group_id = $2::uuid AND is_active = true
    `;
    const result = await db.execute(sql.raw(deleteQuery, [userId, groupId]));

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

// Create user group
userGroupsRouter.post('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(400).json({ 
        success: false,
        message: 'Tenant ID and user ID required' 
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Group name is required' 
      });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    console.log(`🆕 [USER-GROUPS] Creating group "${name}" in schema: ${schemaName}`);

    // Check if group name already exists for this tenant
    const existingGroupQuery = `
      SELECT id FROM "${schemaName}".user_groups 
      WHERE tenant_id = $1::uuid AND name = $2 AND is_active = true
    `;
    const existingResult = await db.execute(sql.raw(existingGroupQuery, [tenantId, name.trim()]));

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ 
        success: false,
        message: 'A group with this name already exists' 
      });
    }

    // Create new group
    const groupId = crypto.randomUUID();
    const now = new Date();

    const insertQuery = `
      INSERT INTO "${schemaName}".user_groups 
      (id, tenant_id, name, description, permissions, is_active, created_by_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, description, permissions, is_active, created_at
    `;

    const result = await db.execute(sql.raw(insertQuery, [
      groupId,
      tenantId,
      name.trim(),
      description?.trim() || null,
      req.body.permissions || [],
      true,
      userId,
      now,
      now
    ]));

    if (result.rows.length === 0) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to create group' 
      });
    }

    const newGroup = result.rows[0];

    console.log(`✅ [USER-GROUPS] Created group "${name}" with ID: ${groupId}`);

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: {
        id: newGroup.id,
        name: newGroup.name,
        description: newGroup.description,
        permissions: newGroup.permissions || [],
        isActive: newGroup.is_active,
        createdAt: newGroup.created_at,
        memberCount: 0,
        memberships: []
      }
    });
  } catch (error: any) {
    console.error('❌ [USER-GROUPS] Error creating group:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create group',
      error: error?.message || 'Unknown error occurred' 
    });
  }
});

export { userGroupsRouter };