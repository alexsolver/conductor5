import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { requirePermission } from '../middleware/rbacMiddleware';
import { userManagementService } from '../services/UserManagementService';
import { db } from '../db';
import { sql, eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { z } from 'zod';
import { users as usersTable, userGroups, userGroupMemberships } from '@shared/schema';

// Add missing validation schema
const updateUserGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

const router = Router();

// ============= SIMPLIFIED USER ROUTES =============

// Get all users for a tenant from public schema
router.get('/users', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;

      console.log(`🔍 [USER-LIST] Fetching users from public schema for tenant: ${tenantId}`);

      // Buscar usuários do schema público filtrando por tenant_id
      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.tenantId, tenantId))
        .orderBy(usersTable.firstName, usersTable.lastName);

      console.log(`✅ [USER-LIST] Found ${users.length} users in public schema for tenant ${tenantId}`);

      // Formatar dados para o frontend
      const formattedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        tenantId: user.tenantId,
        profileImageUrl: user.profileImageUrl,
        department: user.cargo || '',
        position: user.cargo || ''
      }));

      res.json({ users: formattedUsers });
    } catch (error) {
      console.error('❌ [USER-LIST] Error fetching users from public schema:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  }
);

// Create new user
router.post('/users', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const userData = req.body;

      console.log('🔍 [USER-CREATE] Received data:', {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        tenantId
      });

      // Validação básica
      if (!userData.email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant ID is required' });
      }

      // Verificar se usuário já existe
      const existingUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.email, userData.email.toLowerCase()))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }

      // Gerar senha temporária se não fornecida
      const tempPassword = userData.password || Math.random().toString(36).slice(-8);
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Criar usuário com dados completos
      const userToCreate = {
        id: crypto.randomUUID(),
        email: userData.email.toLowerCase(),
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        passwordHash: hashedPassword,
        role: userData.role || 'agent',
        tenantId: tenantId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Dados HR/Endereço
        integrationCode: userData.integrationCode || null,
        alternativeEmail: userData.alternativeEmail || null,
        cellPhone: userData.cellPhone || null,
        phone: userData.phone || null,
        ramal: userData.ramal || null,
        timeZone: userData.timeZone || 'America/Sao_Paulo',
        vehicleType: userData.vehicleType || null,
        cpfCnpj: userData.cpfCnpj || null,
        supervisorIds: userData.supervisorIds || [],
        // Endereço
        cep: userData.cep || null,
        country: userData.country || 'Brasil',
        state: userData.state || null,
        city: userData.city || null,
        streetAddress: userData.streetAddress || null,
        houseType: userData.houseType || null,
        houseNumber: userData.houseNumber || null,
        complement: userData.complement || null,
        neighborhood: userData.neighborhood || null,
        // Dados RH
        employeeCode: userData.employeeCode || null,
        pis: userData.pis || null,
        cargo: userData.cargo || null,
        ctps: userData.ctps || null,
        serieNumber: userData.serieNumber || null,
        admissionDate: userData.admissionDate ? new Date(userData.admissionDate) : null,
        costCenter: userData.costCenter || null,
        // Campos padrão
        status: 'active',
        performance: 75,
        employmentType: userData.employmentType || 'clt'
      };

      console.log('🔍 [USER-CREATE] Creating user with data:', {
        id: userToCreate.id,
        email: userToCreate.email,
        tenantId: userToCreate.tenantId,
        role: userToCreate.role
      });

      const newUser = await db.insert(usersTable)
        .values(userToCreate)
        .returning();

      console.log(`✅ [USER-CREATE] User created successfully: ${userData.email} (ID: ${newUser[0].id})`);

      res.status(201).json({ 
        success: true,
        message: 'User created successfully',
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          firstName: newUser[0].firstName,
          lastName: newUser[0].lastName,
          role: newUser[0].role,
          isActive: newUser[0].isActive,
          createdAt: newUser[0].createdAt
        },
        tempPassword: userData.sendInvitation ? null : tempPassword // Só retorna se não enviar convite
      });
    } catch (error) {
      console.error('❌ [USER-CREATE] Error creating user:', error);
      if (error.code === '23505') { // Violação de unique constraint
        res.status(409).json({ success: false, message: 'Email already exists' });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to create user',
          error: error.message 
        });
      }
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

// Get tenant-specific user groups
router.get('/groups', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
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
        WHERE ug.tenant_id = $1 AND ug.is_active = true
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
            WHERE ugm.group_id = $1 AND ugm.is_active = true
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
  }
);

// Create user group in tenant schema
router.post('/groups', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
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
        WHERE tenant_id = $1 AND name = $2 AND is_active = true
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
  }
);

// Update user group in tenant schema
router.put('/groups/:groupId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId } = req.params;
      const { name, description, permissions } = req.body;
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

      console.log(`✏️ [USER-GROUPS] Updating group ${groupId} in schema: ${schemaName}`);

      // Check if group exists and belongs to tenant
      const groupQuery = `
        SELECT id FROM "${schemaName}".user_groups 
        WHERE id = $1 AND tenant_id = $2 AND is_active = true
      `;
      const groupResult = await db.execute(sql.raw(groupQuery, [groupId, tenantId]));

      if (!groupResult.rows.length) {
        console.log(`Group ${groupId} not found for tenant ${tenantId}`);
        return res.status(404).json({ 
          success: false,
          message: 'Group not found' 
        });
      }

      // Check if name conflicts with existing group (excluding current group)
      const conflictQuery = `
        SELECT id FROM "${schemaName}".user_groups 
        WHERE tenant_id = $1 AND name = $2 AND id != $3 AND is_active = true
      `;
      const conflictResult = await db.execute(sql.raw(conflictQuery, [tenantId, name.trim(), groupId]));

      if (conflictResult.rows.length > 0) {
        return res.status(409).json({ 
          success: false,
          message: 'A group with this name already exists' 
        });
      }

      // Update group
      const updateQuery = `
        UPDATE "${schemaName}".user_groups 
        SET name = $1, description = $2, permissions = $3, updated_at = $4
        WHERE id = $5 AND tenant_id = $6
        RETURNING id, name, description, permissions, is_active, created_at, updated_at
      `;

      const result = await db.execute(sql.raw(updateQuery, [
        name.trim(),
        description?.trim() || null,
        permissions || [],
        new Date(),
        groupId,
        tenantId
      ]));

      if (result.rows.length === 0) {
        return res.status(500).json({ 
          success: false,
          message: 'Failed to update group' 
        });
      }

      const updatedGroup = result.rows[0];

      console.log(`✅ [USER-GROUPS] Updated group ${groupId}`);

      res.json({
        success: true,
        message: 'Group updated successfully',
        group: {
          id: updatedGroup.id,
          name: updatedGroup.name,
          description: updatedGroup.description,
          permissions: updatedGroup.permissions || [],
          isActive: updatedGroup.is_active,
          createdAt: updatedGroup.created_at,
          updatedAt: updatedGroup.updated_at
        }
      });
    } catch (error: any) {
      console.error('❌ [USER-GROUPS] Error updating group:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to update group',
        error: error?.message || 'Unknown error occurred' 
      });
    }
  }
);

// Delete user group in tenant schema
router.delete('/groups/:groupId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ 
          success: false,
          message: 'Tenant ID required' 
        });
      }

      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      console.log(`🗑️ [USER-GROUPS] Deleting group ${groupId} in schema: ${schemaName}`);

      // Check if group exists and belongs to tenant
      const groupQuery = `
        SELECT id FROM "${schemaName}".user_groups 
        WHERE id = $1 AND tenant_id = $2 AND is_active = true
      `;
      const groupResult = await db.execute(sql.raw(groupQuery, [groupId, tenantId]));

      if (!groupResult.rows.length) {
        console.log(`Group ${groupId} not found for tenant ${tenantId}`);
        return res.status(404).json({ 
          success: false,
          message: 'Group not found' 
        });
      }

      // First, remove all memberships for this group
      const deleteMembershipsQuery = `
        DELETE FROM "${schemaName}".user_group_memberships 
        WHERE group_id = $1
      `;
      await db.execute(sql.raw(deleteMembershipsQuery, [groupId]));

      // Then, delete the group (soft delete by setting is_active to false)
      const deleteGroupQuery = `
        UPDATE "${schemaName}".user_groups 
        SET is_active = false, updated_at = $1
        WHERE id = $2 AND tenant_id = $3
      `;

      const result = await db.execute(sql.raw(deleteGroupQuery, [
        new Date(),
        groupId,
        tenantId
      ]));

      if (result.rowCount === 0) {
        return res.status(500).json({ 
          success: false,
          message: 'Failed to delete group' 
        });
      }

      console.log(`✅ [USER-GROUPS] Deleted group ${groupId}`);

      res.json({
        success: true,
        message: 'Group deleted successfully'
      });
    } catch (error: any) {
      console.error('❌ [USER-GROUPS] Error deleting group:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to delete group',
        error: error?.message || 'Unknown error occurred' 
      });
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

      if (!groupId || !tenantId) {
        return res.status(400).json({ 
          success: false,
          message: 'Group ID and tenant ID are required' 
        });
      }

      console.log(`Fetching members for group ${groupId} in tenant ${tenantId}`);

      // Verificar se o grupo existe e pertence ao tenant
      const groupExists = await db.select({ id: userGroups.id })
        .from(userGroups)
        .where(and(
          eq(userGroups.id, groupId),
          eq(userGroups.tenantId, tenantId),
          eq(userGroups.isActive, true)
        ))
        .limit(1);

      if (!groupExists.length) {
        return res.status(404).json({
          success: false,
          message: 'Group not found or access denied'
        });
      }

      // Query corrigida para buscar os membros do grupo
      const members = await db.select({
        membershipId: userGroupMemberships.id,
        userId: userGroupMemberships.userId,
        role: userGroupMemberships.role,
        userFirstName: usersTable.firstName,
        userLastName: usersTable.lastName,
        userEmail: usersTable.email,
        userPosition: usersTable.cargo,
        addedAt: userGroupMemberships.addedAt
      })
      .from(userGroupMemberships)
      .innerJoin(usersTable, eq(userGroupMemberships.userId, usersTable.id))
      .where(and(
        eq(userGroupMemberships.tenantId, tenantId),
        eq(userGroupMemberships.groupId, groupId),
        eq(userGroupMemberships.isActive, true),
        eq(usersTable.isActive, true)
      ))
      .orderBy(userGroupMemberships.addedAt);

      // Format members data consistently - corrigido para evitar campos undefined
      const formattedMembers = members.map(member => ({
        membershipId: member.membershipId,
        userId: member.userId,
        role: member.role || 'member',
        name: `${member.userFirstName || ''} ${member.userLastName || ''}`.trim() || member.userEmail,
        email: member.userEmail,
        position: member.userPosition || '',
        addedAt: member.addedAt
      }));

      console.log(`Found ${formattedMembers.length} members for group ${groupId}`);
      res.json({ 
        success: true,
        members: formattedMembers,
        count: formattedMembers.length
      });
    } catch (error) {
      console.error('Error fetching group members:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch group members',
        error: error.message 
      });
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

      // Verificar se o usuário existe
      const user = await db.select().from(usersTable)
        .where(and(
          eq(usersTable.id, userId),
          eq(usersTable.tenantId, tenantId),
          eq(usersTable.isActive, true)
        ))
        .limit(1);

      if (!user.length) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verificar se a associação já existe (ativa ou inativa)
      const existingMembership = await db.select().from(userGroupMemberships)
        .where(and(
          eq(userGroupMemberships.tenantId, tenantId),
          eq(userGroupMemberships.userId, userId),
          eq(userGroupMemberships.groupId, groupId)
        ))
        .limit(1);

      if (existingMembership.length > 0) {
        // Se existe mas está inativa, reativar
        if (!existingMembership[0].isActive) {
          const [reactivatedMembership] = await db.update(userGroupMemberships)
            .set({
              isActive: true,
              updatedAt: new Date()
            })
            .where(and(
              eq(userGroupMemberships.tenantId, tenantId),
              eq(userGroupMemberships.userId, userId),
              eq(userGroupMemberships.groupId, groupId)
            ))
            .returning();

          console.log(`Successfully reactivated user ${userId} in group ${groupId}`);
          return res.status(200).json({ 
            message: 'User membership reactivated successfully',
            membership: reactivatedMembership
          });
        } else {
          // Se já está ativa, retornar conflito
          return res.status(409).json({ message: 'User is already a member of this group' });
        }
      }

      // Criar a associação usuário-grupo
      const [membership] = await db.insert(userGroupMemberships)
        .values({
          tenantId,
          userId,
          groupId,
          role: 'member',
          addedById: req.user!.id,
          isActive: true
        })
        .returning();

      console.log(`Successfully added user ${userId} to group ${groupId} for tenant ${tenantId}`);

      res.status(201).json({ 
        message: 'User added to group successfully',
        membership
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

      // Verificar se a associação existe
      const existingMembership = await db.select().from(userGroupMemberships)
        .where(and(
          eq(userGroupMemberships.tenantId, tenantId),
          eq(userGroupMemberships.userId, userId),
          eq(userGroupMemberships.groupId, groupId),
          eq(userGroupMemberships.isActive, true)
        ))
        .limit(1);

      if (!existingMembership.length) {
        return res.status(404).json({ message: 'User is not a member of this group' });
      }

      // Remover a associação (soft delete)
      const [removedMembership] = await db.update(userGroupMemberships)
        .set({
          isActive: false
        })
        .where(and(
          eq(userGroupMemberships.tenantId, tenantId),
          eq(userGroupMemberships.userId, userId),
          eq(userGroupMemberships.groupId, groupId)
        ))
        .returning();

      console.log(`Successfully removed user ${userId} from group ${groupId} for tenant ${tenantId}`);

      res.json({ 
        message: 'User removed from group successfully',
        membership: removedMembership
      });
    } catch (error) {
      console.error('Error removing user from group:', error);
      res.status(500).json({ message: 'Failed to remove user from group' });
    }
  }
);

// ============= ROLES MANAGEMENT ROUTES =============

// Get all roles for tenant
router.get('/roles', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;

      // Mock roles data - TODO: implement real database query
      const roles = [
        {
          id: '1',
          name: 'Administrador de Workspace',
          description: 'Controle total sobre o workspace',
          permissions: ['workspace.manage', 'user.create', 'user.edit', 'user.delete', 'tickets.manage'],
          isActive: true,
          isSystem: true,
          userCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Agente de Suporte',
          description: 'Acesso para atendimento ao cliente',
          permissions: ['tickets.view', 'tickets.create', 'tickets.edit', 'customers.view'],
          isActive: true,
          isSystem: false,
          userCount: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      res.json({ roles });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ message: 'Failed to fetch roles' });
    }
  }
);

// Get permissions catalog
router.get('/permissions', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      // Mock permissions data based on workspace categories
      const permissions = [
        // Administração do Workspace
        { id: 'workspace.manage', name: 'Gerenciar Workspace', category: 'workspace_admin', description: 'Controle total do workspace', level: 'workspace' },
        { id: 'workspace.configure', name: 'Configurar Workspace', category: 'workspace_admin', description: 'Alterar configurações', level: 'workspace' },
        { id: 'workspace.security', name: 'Configurações de Segurança', category: 'workspace_admin', description: 'Definir políticas de segurança', level: 'workspace' },
        { id: 'workspace.integrations', name: 'Gerenciar Integrações', category: 'workspace_admin', description: 'Configurar integrações', level: 'workspace' },

        // Gestão de Usuários e Acesso  
        { id: 'user.view', name: 'Visualizar Usuários', category: 'user_access', description: 'Ver lista de usuários', level: 'workspace' },
        { id: 'user.create', name: 'Criar Usuários', category: 'user_access', description: 'Adicionar novos usuários', level: 'workspace' },
        { id: 'user.edit', name: 'Editar Usuários', category: 'user_access', description: 'Modificar dados dos usuários', level: 'workspace' },
        { id: 'user.delete', name: 'Excluir Usuários', category: 'user_access', description: 'Remover usuários', level: 'workspace' },
        { id: 'groups.manage', name: 'Gerenciar Grupos', category: 'user_access', description: 'Administrar grupos de usuários', level: 'workspace' },
        { id: 'sessions.monitor', name: 'Monitorar Sessões', category: 'user_access', description: 'Ver sessões ativas', level: 'workspace' },

        // Atendimento ao Cliente
        { id: 'tickets.view', name: 'Visualizar Tickets', category: 'customer_support', description: 'Ver tickets de suporte', level: 'workspace' },
        { id: 'tickets.create', name: 'Criar Tickets', category: 'customer_support', description: 'Abrir novos tickets', level: 'workspace' },
        { id: 'tickets.edit', name: 'Editar Tickets', category: 'customer_support', description: 'Modificar tickets', level: 'workspace' },
        { id: 'tickets.delete', name: 'Excluir Tickets', category: 'customer_support', description: 'Remover tickets', level: 'workspace' },
        { id: 'tickets.assign', name: 'Atribuir Tickets', category: 'customer_support', description: 'Designar responsáveis', level: 'workspace' },
        { id: 'tickets.manage', name: 'Gerenciar Tickets', category: 'customer_support', description: 'Controle total sobre tickets', level: 'workspace' },

        // Gestão de Clientes
        { id: 'customers.view', name: 'Visualizar Clientes', category: 'customer_management', description: 'Ver dados dos clientes', level: 'workspace' },
        { id: 'customers.create', name: 'Criar Clientes', category: 'customer_management', description: 'Adicionar novos clientes', level: 'workspace' },
        { id: 'customers.edit', name: 'Editar Clientes', category: 'customer_management', description: 'Modificar dados dos clientes', level: 'workspace' },
        { id: 'customers.delete', name: 'Excluir Clientes', category: 'customer_management', description: 'Remover clientes', level: 'workspace' },


        // Recursos Humanos e Equipe
        { id: 'hr.view', name: 'Visualizar RH', category: 'hr_team', description: 'Ver dados de RH', level: 'workspace' },
        { id: 'hr.performance', name: 'Gerenciar Performance', category: 'hr_team', description: 'Avaliar desempenho', level: 'workspace' },
        { id: 'hr.skills', name: 'Matriz de Habilidades', category: 'hr_team', description: 'Gerenciar habilidades', level: 'workspace' },
        { id: 'hr.absence', name: 'Gestão de Ausências', category: 'hr_team', description: 'Aprovar férias e licenças', level: 'workspace' },

        // Timecard e Ponto
        { id: 'timecard.view', name: 'Visualizar Ponto', category: 'timecard', description: 'Ver registros de ponto', level: 'workspace' },
        { id: 'timecard.manage', name: 'Gerenciar Ponto', category: 'timecard', description: 'Administrar registros', level: 'workspace' },
        { id: 'timecard.approve', name: 'Aprovar Horas', category: 'timecard', description: 'Aprovar registros de horas', level: 'workspace' },

        // Projetos e Tarefas

        // Analytics e Relatórios
        { id: 'analytics.view', name: 'Visualizar Analytics', category: 'analytics', description: 'Acessar relatórios', level: 'workspace' },
        { id: 'analytics.create', name: 'Criar Relatórios', category: 'analytics', description: 'Gerar relatórios customizados', level: 'workspace' },

        // Configurações e Personalização
        { id: 'settings.view', name: 'Visualizar Configurações', category: 'settings', description: 'Ver configurações', level: 'workspace' },
        { id: 'settings.edit', name: 'Editar Configurações', category: 'settings', description: 'Modificar configurações', level: 'workspace' },
        { id: 'settings.branding', name: 'Personalizar Branding', category: 'settings', description: 'Alterar visual', level: 'workspace' },

        // Compliance e Segurança
        { id: 'compliance.view', name: 'Visualizar Compliance', category: 'compliance', description: 'Ver logs de auditoria', level: 'workspace' },
        { id: 'compliance.manage', name: 'Gerenciar Compliance', category: 'compliance', description: 'Administrar conformidade', level: 'workspace' }
      ];

      res.json({ permissions });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({ message: 'Failed to fetch permissions' });
    }
  }
);

// Create role
router.post('/roles', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description, permissions } = req.body;
      const tenantId = req.user!.tenantId;

      if (!name || !Array.isArray(permissions)) {
        return res.status(400).json({ message: 'Name and permissions are required' });
      }

      // Mock creation - TODO: implement real database insert
      const newRole = {
        id: Date.now().toString(),
        name,
        description: description || '',
        permissions,
        isActive: true,
        isSystem: false,
        userCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log(`Creating role "${name}" with ${permissions.length} permissions for tenant ${tenantId}`);

      res.status(201).json({ role: newRole });
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({ message: 'Failed to create role' });
    }
  }
);

// Update role
router.put('/roles/:roleId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { roleId } = req.params;
      const { name, description, permissions } = req.body;
      const tenantId = req.user!.tenantId;

      // Mock update - TODO: implement real database update
      const updatedRole = {
        id: roleId,
        name: name || 'Updated Role',
        description: description || '',
        permissions: permissions || [],
        isActive: true,
        isSystem: false,
        userCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log(`Updating role ${roleId} for tenant ${tenantId}`);

      res.json({ role: updatedRole });
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ message: 'Failed to update role' });
    }
  }
);

// Delete role
router.delete('/roles/:roleId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { roleId } = req.params;
      const tenantId = req.user!.tenantId;

      // Mock deletion - TODO: implement real database soft delete
      console.log(`Deleting role ${roleId} for tenant ${tenantId}`);

      res.json({ message: 'Role deleted successfully' });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ message: 'Failed to delete role' });
    }
  }
);

// Assign user to role
router.post('/roles/:roleId/users', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { roleId } = req.params;
      const { userId } = req.body;
      const tenantId = req.user!.tenantId;

      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }

      // Mock assignment - TODO: implement real database insert
      console.log(`Assigning user ${userId} to role ${roleId} for tenant ${tenantId}`);

      res.status(201).json({ 
        message: 'User assigned to role successfully',
        roleId,
        userId 
      });
    } catch (error) {
      console.error('Error assigning user to role:', error);
      res.status(500).json({ message: 'Failed to assign user to role' });
    }
  }
);

// Remove user from role
router.delete('/roles/:roleId/users/:userId', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const { roleId, userId } = req.params;
      const tenantId = req.user!.tenantId;

      // Mock removal - TODO: implement real database delete
      console.log(`Removing user ${userId} from role ${roleId} for tenant ${tenantId}`);

      res.json({ 
        message: 'User removed from role successfully',
        roleId,
        userId 
      });
    } catch (error) {
      console.error('Error removing user from role:', error);
      res.status(500).json({ message: 'Failed to remove user from role' });
    }
  }
);

export default router;