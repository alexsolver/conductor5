import { schemaManager } from '../db';
import { storageSimple } from '../storage-simple';
import { db } from '../db';
import { eq, and, or, sql, desc, asc } from 'drizzle-orm';
// Removed imports - these tables are not defined in schema-master.ts
// Using basic users and tenants tables instead
import { users, tenants, sessions, type User, type Tenant, type Session } from '../../shared/schema.js';
import { PERMISSIONS } from '../middleware/rbacMiddleware';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

export interface UserManagementOptions {
  includePermissions?: boolean;
  includeGroups?: boolean;
  includeRoles?: boolean;
  includeSessions?: boolean;
  includeActivity?: boolean;
}

export interface EnhancedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  tenantId: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  permissions?: Array<{resource: string, action: string, granted: boolean, source: string}>;
}

export interface InviteUserOptions {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  position?: string;
  systemRole?: string;
  customRoleIds?: string[];
  groupIds?: string[];
  expiresInHours?: number;
  notes?: string;
}

export class UserManagementService {
  private static instance: UserManagementService;

  static getInstance(): UserManagementService {
    if (!UserManagementService.instance) {
      UserManagementService.instance = new UserManagementService();
    }
    return UserManagementService.instance;
  }

  // ============= USER GROUPS MANAGEMENT =============
  
    await this.logActivity(createdBy, tenantId, 'group_create', 'user_group', undefined, { groupName: data.name });
    
    const [group] = await db
      .values({
        ...data,
        tenantId,
        createdBy
      })
      .returning();
    
    return group;
  }

    return await db
      .select()
  }

    const user = await storageSimple.getUser(userId);
    if (!user) throw new Error('User not found');

    await this.logActivity(assignedBy, user.tenantId, 'group_assign', 'user_group', groupId, { userId, role });

    const [membership] = await db
      .insert(userGroupMemberships)
      .values({
        userId,
        groupId,
        role,
        assignedBy
      })
      .returning();

    return membership;
  }

  async removeUserFromGroup(userId: string, groupId: string, removedBy: string): Promise<void> {
    const user = await storageSimple.getUser(userId);
    if (!user) throw new Error('User not found');

    await this.logActivity(removedBy, user.tenantId, 'group_remove', 'user_group', groupId, { userId });

    await db
      .update(userGroupMemberships)
      .set({ isActive: false })
      .where(and(
        eq(userGroupMemberships.userId, userId),
        eq(userGroupMemberships.groupId, groupId)
      ));
  }

  // ============= CUSTOM ROLES MANAGEMENT =============

    await this.logActivity(createdBy, tenantId, 'role_create', 'custom_role', undefined, { roleName: data.name });

    const [role] = await db
      .values({
        ...data,
        tenantId,
        createdBy
      })
      .returning();

    return role;
  }

    if (!includeSystem) {
    }

    return await db
      .select()
      .where(and(...conditions))
  }

    if (!role[0]) throw new Error('Role not found');
    if (role[0].isSystem) throw new Error('System roles cannot be modified');

    await this.logActivity(updatedBy, role[0].tenantId, 'role_update', 'custom_role', roleId, data);

    const [updatedRole] = await db
      .set({ ...data, updatedAt: new Date() })
      .returning();

    return updatedRole;
  }

  // ============= USER ROLE ASSIGNMENTS =============

  async assignRoleToUser(
    userId: string, 
    assignedBy: string
    const user = await storageSimple.getUser(userId);
    if (!user) throw new Error('User not found');

    await this.logActivity(assignedBy, user.tenantId, 'role_assign', 'user', userId, assignment);

    const [roleAssignment] = await db
      .values({
        ...assignment,
        userId,
        assignedBy
      })
      .returning();

    return roleAssignment;
  }

  async removeRoleFromUser(userId: string, roleAssignmentId: string, removedBy: string): Promise<void> {
    const user = await storageSimple.getUser(userId);
    if (!user) throw new Error('User not found');

    await this.logActivity(removedBy, user.tenantId, 'role_remove', 'user', userId, { roleAssignmentId });

    await db
      .set({ isActive: false })
  }

  // ============= PERMISSION OVERRIDES =============

  async grantPermissionOverride(
    userId: string,
    grantedBy: string
    const user = await storageSimple.getUser(userId);
    if (!user) throw new Error('User not found');

    await this.logActivity(grantedBy, user.tenantId, 'permission_override', 'user', userId, override);

    const [permissionOverride] = await db
      .values({
        ...override,
        userId,
        grantedBy
      })
      .returning();

    return permissionOverride;
  }

  // ============= USER INVITATIONS =============

    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (options.expiresInHours || 48));

    const roleAssignments = [];
    if (options.systemRole) {
      roleAssignments.push({ systemRole: options.systemRole });
    }
    if (options.customRoleIds?.length) {
      roleAssignments.push(...options.customRoleIds.map(id => ({ customRoleId: id })));
    }
    if (options.groupIds?.length) {
      roleAssignments.push({ groupIds: options.groupIds });
    }

    await this.logActivity(invitedBy, tenantId, 'user_invite', 'user_invitation', undefined, { email: options.email });

    const [invitation] = await db
      .values({
        tenantId,
        email: options.email,
        firstName: options.firstName,
        lastName: options.lastName,
        phone: options.phone,
        department: options.department,
        position: options.position,
        roleAssignments,
        token,
        expiresAt,
        invitedBy,
        notes: options.notes
      })
      .returning();

    return invitation;
  }

  async acceptInvitation(token: string, userId: string): Promise<void> {
    const [invitation] = await db
      .select()
      .where(and(
      ))
      .limit(1);

    if (!invitation) throw new Error('Invalid or expired invitation');
    if (new Date() > invitation.expiresAt) throw new Error('Invitation expired');

    // Process role assignments
    for (const assignment of invitation.roleAssignments) {
      if (assignment.systemRole) {
        await this.assignRoleToUser(userId, {
          systemRole: assignment.systemRole,
          scope: 'tenant',
          scopeId: invitation.tenantId
        }, invitation.invitedBy);
      }
      if (assignment.customRoleId) {
        await this.assignRoleToUser(userId, {
          roleId: assignment.customRoleId,
          scope: 'tenant',
          scopeId: invitation.tenantId
        }, invitation.invitedBy);
      }
      if (assignment.groupIds) {
        for (const groupId of assignment.groupIds) {
          await this.addUserToGroup(userId, groupId, 'member', invitation.invitedBy);
        }
      }
    }

    await db
      .set({ 
        status: 'accepted',
        acceptedAt: new Date()
      })

    await this.logActivity(userId, invitation.tenantId, 'invitation_accept', 'user_invitation', invitation.id);
  }

  // ============= ENHANCED USER MANAGEMENT =============

  async getEnhancedUser(userId: string, options: UserManagementOptions = {}): Promise<EnhancedUser | null> {
    const user = await storageSimple.getUser(userId);
    if (!user) return null;

    const enhancedUser: EnhancedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    if (options.includeGroups) {
    }

    if (options.includeRoles) {
      const roleAssignments = await db
        .select()
        .where(and(
        ));

      enhancedUser.roles = [];
      for (const assignment of roleAssignments) {
        if (assignment.roleId) {
          const [customRole] = await db
            .select()
            .limit(1);
          if (customRole) enhancedUser.roles.push(customRole);
        } else if (assignment.systemRole) {
          enhancedUser.roles.push({ systemRole: assignment.systemRole });
        }
      }
    }

    if (options.includePermissions) {
      enhancedUser.permissions = await this.getUserEffectivePermissions(userId);
    }

    if (options.includeSessions) {
      enhancedUser.sessions = await db
        .select()
        .where(and(
        ));
    }

    if (options.includeActivity) {
      enhancedUser.recentActivity = await db
        .select()
        .limit(10);
    }

    return enhancedUser;
  }

  async getUserEffectivePermissions(userId: string): Promise<Array<{resource: string, action: string, granted: boolean, source: string}>> {
    const user = await storageSimple.getUser(userId);
    if (!user) return [];

    const permissions: Array<{resource: string, action: string, granted: boolean, source: string}> = [];

    // Get system role permissions
    const systemPermissions = this.getSystemRolePermissions(user.role);
    permissions.push(...systemPermissions.map(p => ({
      resource: p.resource,
      action: p.action,
      granted: true,
      source: `system_role:${user.role}`
    })));

    // Get custom role permissions
    const roleAssignments = await db
      .select()
      .where(and(
      ));

    for (const assignment of roleAssignments) {
      if (assignment.custom_roles?.permissions) {
        permissions.push(...assignment.custom_roles.permissions.map(p => ({
          resource: p.resource,
          action: p.action,
          granted: true,
          source: `custom_role:${assignment.custom_roles.name}`
        })));
      }
    }

    // Get permission overrides
    const overrides = await db
      .select()
      .where(and(
        or(
        )
      ));

    for (const override of overrides) {
      permissions.push({
        resource: override.resource,
        action: override.action,
        granted: override.granted,
        source: `override:${override.justification || 'manual'}`
      });
    }

    return permissions;
  }

  private getSystemRolePermissions(role: string): Array<{resource: string, action: string}> {
    switch (role) {
      case 'saas_admin':
        return Object.values(PERMISSIONS.PLATFORM).concat(
          Object.values(PERMISSIONS.TENANT),
          Object.values(PERMISSIONS.TICKET),
          Object.values(PERMISSIONS.CUSTOMER)
        );
      case 'tenant_admin':
        return Object.values(PERMISSIONS.TENANT).concat(
          Object.values(PERMISSIONS.TICKET),
          Object.values(PERMISSIONS.CUSTOMER)
        );
      case 'agent':
        return [
          PERMISSIONS.TICKET.VIEW_ASSIGNED,
          PERMISSIONS.TICKET.CREATE,
          PERMISSIONS.TICKET.UPDATE,
          PERMISSIONS.CUSTOMER.VIEW_ALL,
          PERMISSIONS.CUSTOMER.CREATE,
          PERMISSIONS.CUSTOMER.UPDATE
        ];
      case 'customer':
        return [
          PERMISSIONS.TICKET.VIEW_OWN,
          PERMISSIONS.TICKET.CREATE,
          PERMISSIONS.CUSTOMER.VIEW_OWN
        ];
      default:
        return [];
    }
  }

  // ============= ACTIVITY LOGGING =============

  async logActivity(
    userId: string,
    tenantId: string,
    action: string,
    resource?: string,
    resourceId?: string,
    details?: Record<string, any>,
    performedBy?: string
  ): Promise<void> {
    await db
      .values({
        userId,
        tenantId,
        action,
        resource,
        resourceId,
        details,
        performedBy: performedBy || userId
      });
  }

  // ============= SESSION MANAGEMENT =============

    const [session] = await db
      .values({
        ...sessionData,
        userId
      })
      .returning();

    return session;
  }

  async terminateSession(sessionId: string, terminatedBy: string): Promise<void> {
    const [session] = await db
      .select()
      .limit(1);

    if (session) {
      await this.logActivity(session.userId, session.tenantId, 'session_terminate', 'session', sessionId, undefined, terminatedBy);
      
      await db
        .set({ isActive: false })
    }
  }

  async terminateAllUserSessions(userId: string, terminatedBy: string): Promise<void> {
    const user = await storageSimple.getUser(userId);
    if (!user) return;

    await this.logActivity(userId, user.tenantId, 'sessions_terminate_all', 'user', userId, undefined, terminatedBy);

    await db
      .set({ isActive: false })
  }

  // ============= USER STATISTICS =============

  async getUserStats(tenantId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    pendingInvitations: number;
    roleDistribution: Record<string, number>;
  }> {
    const [totalUsersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.tenantId, tenantId));

    const [activeUsersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        eq(users.tenantId, tenantId),
        eq(users.isActive, true)
      ));

    const [pendingInvitationsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .where(and(
      ));

      .select({ count: sql<number>`count(*)` })
      .where(and(
      ));

    const roleDistribution = await db
      .select({
        role: users.role,
        count: sql<number>`count(*)`
      })
      .from(users)
      .where(eq(users.tenantId, tenantId))
      .groupBy(users.role);

    const recentActivity = await db
      .select()
      .limit(20);

    return {
      totalUsers: totalUsersResult.count,
      activeUsers: activeUsersResult.count,
      pendingInvitations: pendingInvitationsResult.count,
      roleDistribution: roleDistribution.reduce((acc, item) => {
        acc[item.role] = item.count;
        return acc;
      }, {} as Record<string, number>),
      recentActivity
    };
  }

  // ================ TENANT ADMIN TEAM MANAGEMENT METHODS ================
  // These methods are specifically for tenant admins to manage their team
  // They exclude SaaS admin users and operations

  async getTenantTeamStats(tenantId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    pendingInvitations: number;
    roleDistribution: Record<string, number>;
  }> {
    try {
      // Get total users (excluding saas_admin)
      const [totalUsersResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.tenantId, tenantId),
          sql`${users.role} != 'saas_admin'`
        ));

      // Get active users (logged in last 30 days, excluding saas_admin)
      const [activeUsersResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.tenantId, tenantId),
          eq(users.isActive, true),
          sql`${users.role} != 'saas_admin'`
        ));

      // Get pending invitations for this tenant
      const [pendingInvitationsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .where(and(
        ));

      // Get active sessions for tenant users (excluding saas_admin)
        .select({ count: sql<number>`count(*)` })
        .where(and(
          eq(users.tenantId, tenantId),
          sql`${users.role} != 'saas_admin'`
        ));

      // Get role distribution for tenant users (excluding saas_admin)
      const roleDistributionResult = await db
        .select({
          role: users.role,
          count: sql<number>`count(*)`
        })
        .from(users)
        .where(and(
          eq(users.tenantId, tenantId),
          sql`${users.role} != 'saas_admin'`
        ))
        .groupBy(users.role);

      const roleDistribution: Record<string, number> = {};
      roleDistributionResult.forEach(row => {
        roleDistribution[row.role] = row.count;
      });

      return {
        totalUsers: totalUsersResult?.count || 0,
        activeUsers: activeUsersResult?.count || 0,
        pendingInvitations: pendingInvitationsResult?.count || 0,
        roleDistribution
      };
    } catch (error) {
      console.error('Error fetching tenant team stats:', error);
      throw new Error('Failed to fetch tenant team statistics');
    }
  }

  async getTenantTeamMembers(tenantId: string): Promise<any[]> {
    try {
      const members = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          lastLogin: users.lastLogin,
          createdAt: users.createdAt
        })
        .from(users)
        .where(and(
          eq(users.tenantId, tenantId),
          sql`${users.role} != 'saas_admin'`
        ))
        .orderBy(asc(users.email));

      return members;
    } catch (error) {
      console.error('Error fetching tenant team members:', error);
      throw new Error('Failed to fetch tenant team members');
    }
  }

  async getTenantUsers(tenantId: string, options: UserManagementOptions = {}): Promise<EnhancedUser[]> {
    try {
      // Get base user data (excluding saas_admin)
      const baseUsers = await db
        .select()
        .from(users)
        .where(and(
          eq(users.tenantId, tenantId),
          sql`${users.role} != 'saas_admin'`
        ))
        .orderBy(asc(users.email));

      const enhancedUsers: EnhancedUser[] = [];

      for (const user of baseUsers) {
        const enhancedUser: EnhancedUser = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          tenantId: user.tenantId,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        };

        // Add groups if requested
        if (options.includeGroups) {
        }

        // Add roles if requested
        if (options.includeRoles) {
          enhancedUser.roles = await this.getUserRoles(user.id);
        }

        // Add permissions if requested
        if (options.includePermissions) {
          enhancedUser.permissions = await this.getUserPermissions(user.id);
        }

        // Add sessions if requested
        if (options.includeSessions) {
        }

        // Add recent activity if requested
        if (options.includeActivity) {
          enhancedUser.recentActivity = await this.getUserRecentActivity(user.id, 10);
        }

        enhancedUsers.push(enhancedUser);
      }

      return enhancedUsers;
    } catch (error) {
      console.error('Error fetching tenant users:', error);
      throw new Error('Failed to fetch tenant users');
    }
  }

  async createTenantUser(tenantId: string, userData: any, createdByUserId: string): Promise<any> {
    try {
      // Ensure the role is not saas_admin
      if (userData.role === 'saas_admin') {
        throw new Error('Tenant admins cannot create SaaS admin users');
      }

      return await this.createUser({
        ...userData,
        tenantId
      });
    } catch (error) {
      console.error('Error creating tenant user:', error);
      throw new Error('Failed to create tenant user');
    }
  }

  async updateTenantUser(userId: string, updateData: any, updatedByUserId: string): Promise<any> {
    try {
      // Get the user to verify tenant and role
      const user = await storageSimple.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Prevent modifications to saas_admin users
      if (user.role === 'saas_admin' || updateData.role === 'saas_admin') {
        throw new Error('Tenant admins cannot modify SaaS admin users');
      }

      return await this.updateUser(userId, updateData);
    } catch (error) {
      console.error('Error updating tenant user:', error);
      throw new Error('Failed to update tenant user');
    }
  }

  async createTenantInvitation(tenantId: string, invitationData: any, invitedByUserId: string): Promise<any> {
    try {
      // Ensure the role is not saas_admin
      if (invitationData.role === 'saas_admin') {
        throw new Error('Tenant admins cannot invite SaaS admin users');
      }

      return await this.inviteUser({
        ...invitationData,
        tenantId,
        invitedByUserId
      });
    } catch (error) {
      console.error('Error creating tenant invitation:', error);
      throw new Error('Failed to create tenant invitation');
    }
  }

    try {
      return await db
        .select()
    } catch (error) {
      console.error('Error fetching tenant user groups:', error);
      throw new Error('Failed to fetch tenant user groups');
    }
  }

    try {
      return await db
        .select()
        .where(and(
        ))
    } catch (error) {
      console.error('Error fetching tenant custom roles:', error);
      throw new Error('Failed to fetch tenant custom roles');
    }
  }

    try {
      return await db
        .select()
    } catch (error) {
      console.error('Error fetching tenant invitations:', error);
      throw new Error('Failed to fetch tenant invitations');
    }
  }

  async getTenantUserSessions(tenantId: string): Promise<any[]> {
    try {
      const sessions = await db
        .select({
          userEmail: users.email,
          userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        })
        .where(and(
          eq(users.tenantId, tenantId),
          sql`${users.role} != 'saas_admin'`
        ))

      return sessions;
    } catch (error) {
      console.error('Error fetching tenant user sessions:', error);
      throw new Error('Failed to fetch tenant user sessions');
    }
  }

  async getTenantUserActivity(tenantId: string, days: number = 7): Promise<any[]> {
    try {
      const activity = await db
        .select({
          userEmail: users.email,
          userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        })
        .where(and(
          eq(users.tenantId, tenantId),
          sql`${users.role} != 'saas_admin'`,
        ))
        .limit(100);

      return activity;
    } catch (error) {
      console.error('Error fetching tenant user activity:', error);
      throw new Error('Failed to fetch tenant user activity');
    }
  }
}

export const userManagementService = UserManagementService.getInstance();