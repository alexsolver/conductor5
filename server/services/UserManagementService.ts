import { schemaManager } from '../db';
import { storage } from '../storage';
import { db } from '../db';
import { eq, and, or, sql, desc, asc } from 'drizzle-orm';
import { 
  userGroups, 
  userGroupMemberships, 
  customRoles, 
  userRoleAssignments, 
  userPermissionOverrides,
  userInvitations,
  userStatusTypes,
  userActivityLog,
  activeSessions,
  type UserGroup,
  type InsertUserGroup,
  type UserGroupMembership,
  type InsertUserGroupMembership,
  type CustomRole,
  type InsertCustomRole,
  type UserRoleAssignment,
  type InsertUserRoleAssignment,
  type UserPermissionOverride,
  type InsertUserPermissionOverride,
  type UserInvitation,
  type InsertUserInvitation,
  type UserActivityLog,
  type InsertUserActivityLog,
  type ActiveSession,
  type InsertActiveSession
} from '@shared/schema/user-management';
import { users, tenants } from '@shared/schema/base';
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
  groups?: UserGroup[];
  roles?: (CustomRole | { systemRole: string })[];
  permissions?: Array<{resource: string, action: string, granted: boolean, source: string}>;
  sessions?: ActiveSession[];
  recentActivity?: UserActivityLog[];
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
  
  async createUserGroup(tenantId: string, data: Omit<InsertUserGroup, 'tenantId' | 'createdBy'>, createdBy: string): Promise<UserGroup> {
    await this.logActivity(createdBy, tenantId, 'group_create', 'user_group', undefined, { groupName: data.name });
    
    const [group] = await db
      .insert(userGroups)
      .values({
        ...data,
        tenantId,
        createdBy
      })
      .returning();
    
    return group;
  }

  async getUserGroups(tenantId: string): Promise<UserGroup[]> {
    return await db
      .select()
      .from(userGroups)
      .where(eq(userGroups.tenantId, tenantId))
      .orderBy(asc(userGroups.name));
  }

  async addUserToGroup(userId: string, groupId: string, role: string = 'member', assignedBy: string): Promise<UserGroupMembership> {
    const user = await storage.getUser(userId);
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
    const user = await storage.getUser(userId);
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

  async createCustomRole(tenantId: string, data: Omit<InsertCustomRole, 'tenantId' | 'createdBy'>, createdBy: string): Promise<CustomRole> {
    await this.logActivity(createdBy, tenantId, 'role_create', 'custom_role', undefined, { roleName: data.name });

    const [role] = await db
      .insert(customRoles)
      .values({
        ...data,
        tenantId,
        createdBy
      })
      .returning();

    return role;
  }

  async getCustomRoles(tenantId: string, includeSystem: boolean = false): Promise<CustomRole[]> {
    const conditions = [eq(customRoles.tenantId, tenantId)];
    if (!includeSystem) {
      conditions.push(eq(customRoles.isSystem, false));
    }

    return await db
      .select()
      .from(customRoles)
      .where(and(...conditions))
      .orderBy(asc(customRoles.name));
  }

  async updateCustomRole(roleId: string, data: Partial<CustomRole>, updatedBy: string): Promise<CustomRole> {
    const role = await db.select().from(customRoles).where(eq(customRoles.id, roleId)).limit(1);
    if (!role[0]) throw new Error('Role not found');
    if (role[0].isSystem) throw new Error('System roles cannot be modified');

    await this.logActivity(updatedBy, role[0].tenantId, 'role_update', 'custom_role', roleId, data);

    const [updatedRole] = await db
      .update(customRoles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customRoles.id, roleId))
      .returning();

    return updatedRole;
  }

  // ============= USER ROLE ASSIGNMENTS =============

  async assignRoleToUser(
    userId: string, 
    assignment: Omit<InsertUserRoleAssignment, 'userId' | 'assignedBy'>, 
    assignedBy: string
  ): Promise<UserRoleAssignment> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error('User not found');

    await this.logActivity(assignedBy, user.tenantId, 'role_assign', 'user', userId, assignment);

    const [roleAssignment] = await db
      .insert(userRoleAssignments)
      .values({
        ...assignment,
        userId,
        assignedBy
      })
      .returning();

    return roleAssignment;
  }

  async removeRoleFromUser(userId: string, roleAssignmentId: string, removedBy: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error('User not found');

    await this.logActivity(removedBy, user.tenantId, 'role_remove', 'user', userId, { roleAssignmentId });

    await db
      .update(userRoleAssignments)
      .set({ isActive: false })
      .where(eq(userRoleAssignments.id, roleAssignmentId));
  }

  // ============= PERMISSION OVERRIDES =============

  async grantPermissionOverride(
    userId: string,
    override: Omit<InsertUserPermissionOverride, 'userId' | 'grantedBy'>,
    grantedBy: string
  ): Promise<UserPermissionOverride> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error('User not found');

    await this.logActivity(grantedBy, user.tenantId, 'permission_override', 'user', userId, override);

    const [permissionOverride] = await db
      .insert(userPermissionOverrides)
      .values({
        ...override,
        userId,
        grantedBy
      })
      .returning();

    return permissionOverride;
  }

  // ============= USER INVITATIONS =============

  async inviteUser(tenantId: string, options: InviteUserOptions, invitedBy: string): Promise<UserInvitation> {
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
      .insert(userInvitations)
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
      .from(userInvitations)
      .where(and(
        eq(userInvitations.token, token),
        eq(userInvitations.status, 'pending')
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
      .update(userInvitations)
      .set({ 
        status: 'accepted',
        acceptedAt: new Date()
      })
      .where(eq(userInvitations.id, invitation.id));

    await this.logActivity(userId, invitation.tenantId, 'invitation_accept', 'user_invitation', invitation.id);
  }

  // ============= ENHANCED USER MANAGEMENT =============

  async getEnhancedUser(userId: string, options: UserManagementOptions = {}): Promise<EnhancedUser | null> {
    const user = await storage.getUser(userId);
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
      enhancedUser.groups = await this.getUserGroups(user.tenantId);
    }

    if (options.includeRoles) {
      const roleAssignments = await db
        .select()
        .from(userRoleAssignments)
        .where(and(
          eq(userRoleAssignments.userId, userId),
          eq(userRoleAssignments.isActive, true)
        ));

      enhancedUser.roles = [];
      for (const assignment of roleAssignments) {
        if (assignment.roleId) {
          const [customRole] = await db
            .select()
            .from(customRoles)
            .where(eq(customRoles.id, assignment.roleId))
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
        .from(activeSessions)
        .where(and(
          eq(activeSessions.userId, userId),
          eq(activeSessions.isActive, true)
        ));
    }

    if (options.includeActivity) {
      enhancedUser.recentActivity = await db
        .select()
        .from(userActivityLog)
        .where(eq(userActivityLog.userId, userId))
        .orderBy(desc(userActivityLog.performedAt))
        .limit(10);
    }

    return enhancedUser;
  }

  async getUserEffectivePermissions(userId: string): Promise<Array<{resource: string, action: string, granted: boolean, source: string}>> {
    const user = await storage.getUser(userId);
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
      .from(userRoleAssignments)
      .leftJoin(customRoles, eq(userRoleAssignments.roleId, customRoles.id))
      .where(and(
        eq(userRoleAssignments.userId, userId),
        eq(userRoleAssignments.isActive, true)
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
      .from(userPermissionOverrides)
      .where(and(
        eq(userPermissionOverrides.userId, userId),
        or(
          eq(userPermissionOverrides.validUntil, null),
          sql`${userPermissionOverrides.validUntil} > NOW()`
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
      .insert(userActivityLog)
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

  async createSession(userId: string, sessionData: Omit<InsertActiveSession, 'userId'>): Promise<ActiveSession> {
    const [session] = await db
      .insert(activeSessions)
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
      .from(activeSessions)
      .where(eq(activeSessions.id, sessionId))
      .limit(1);

    if (session) {
      await this.logActivity(session.userId, session.tenantId, 'session_terminate', 'session', sessionId, undefined, terminatedBy);
      
      await db
        .update(activeSessions)
        .set({ isActive: false })
        .where(eq(activeSessions.id, sessionId));
    }
  }

  async terminateAllUserSessions(userId: string, terminatedBy: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) return;

    await this.logActivity(userId, user.tenantId, 'sessions_terminate_all', 'user', userId, undefined, terminatedBy);

    await db
      .update(activeSessions)
      .set({ isActive: false })
      .where(eq(activeSessions.userId, userId));
  }

  // ============= USER STATISTICS =============

  async getUserStats(tenantId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    pendingInvitations: number;
    activeSessions: number;
    roleDistribution: Record<string, number>;
    recentActivity: UserActivityLog[];
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
      .from(userInvitations)
      .where(and(
        eq(userInvitations.tenantId, tenantId),
        eq(userInvitations.status, 'pending')
      ));

    const [activeSessionsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(activeSessions)
      .where(and(
        eq(activeSessions.tenantId, tenantId),
        eq(activeSessions.isActive, true)
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
      .from(userActivityLog)
      .where(eq(userActivityLog.tenantId, tenantId))
      .orderBy(desc(userActivityLog.performedAt))
      .limit(20);

    return {
      totalUsers: totalUsersResult.count,
      activeUsers: activeUsersResult.count,
      pendingInvitations: pendingInvitationsResult.count,
      activeSessions: activeSessionsResult.count,
      roleDistribution: roleDistribution.reduce((acc, item) => {
        acc[item.role] = item.count;
        return acc;
      }, {} as Record<string, number>),
      recentActivity
    };
  }
}

export const userManagementService = UserManagementService.getInstance();