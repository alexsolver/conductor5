import { Router } from 'express';
import { z } from 'zod';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { requirePermission, requireTenantAccess } from '../middleware/rbacMiddleware';
import { userManagementService } from '../services/UserManagementService';
import { db } from '../db';
import { userGroups, userGroupMemberships, insertUserGroupSchema, insertUserGroupMembershipSchema, users as usersTable } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';

// Add missing validation schema
const updateUserGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

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

// Get all groups for tenant
router.get('/groups', 
  jwtAuth, 
  requirePermission('tenant', 'manage_users'), 
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      
      // Buscar grupos com contagem de membros
      const groups = await db.select({
        id: userGroups.id,
        name: userGroups.name,
        description: userGroups.description,
        isActive: userGroups.isActive,
        createdAt: userGroups.createdAt,
        updatedAt: userGroups.updatedAt
      }).from(userGroups)
        .where(and(
          eq(userGroups.tenantId, tenantId),
          eq(userGroups.isActive, true)
        ))
        .orderBy(userGroups.createdAt);

      // Para cada grupo, buscar a contagem de membros ativos
      const groupsWithMemberCount = await Promise.all(
        groups.map(async (group) => {
          const memberCount = await db.select({ count: sql<number>`count(*)` })
            .from(userGroupMemberships)
            .where(and(
              eq(userGroupMemberships.groupId, group.id),
              eq(userGroupMemberships.tenantId, tenantId),
              eq(userGroupMemberships.isActive, true)
            ));

          return {
            ...group,
            memberCount: Number(memberCount[0]?.count || 0)
          };
        })
      );
      
      res.json({ 
        success: true,
        groups: groupsWithMemberCount 
      });
    } catch (error) {
      console.error('Error fetching user groups:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch user groups',
        error: error.message 
      });
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
      
      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant ID is required' });
      }
      
      // Create group data with tenantId
      const groupData = {
        ...req.body,
        tenantId,
        id: crypto.randomUUID(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Validate the complete data
      const validatedData = insertUserGroupSchema.parse(groupData);
      
      const [newGroup] = await db.insert(userGroups)
        .values(validatedData)
        .returning();
      
      res.status(201).json({ 
        success: true,
        group: newGroup,
        message: 'Grupo criado com sucesso'
      });
    } catch (error: any) {
      console.error('Error creating user group:', error);
      if (error?.code === '23505') { // Unique constraint violation
        res.status(409).json({ 
          success: false,
          message: 'Um grupo com esse nome já existe neste tenant' 
        });
      } else if (error.name === 'ZodError') {
        res.status(400).json({ 
          success: false,
          message: 'Dados inválidos fornecidos',
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: 'Failed to create user group' 
        });
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

// Duplicate route removed - using the primary /users route above

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