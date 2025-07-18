import { db } from '../db';
import { eq, and, or, sql, desc, asc } from 'drizzle-orm';
import { 
  userTenantRelationships, 
  userTenantInvitations, 
  userTenantAccessLog,
  type UserTenantRelationship,
  type InsertUserTenantRelationship,
  type UserTenantInvitation,
  type InsertUserTenantInvitation,
  type UserTenantAccessLog,
  type InsertUserTenantAccessLog,
  USER_TENANT_INVITATION_STATUS,
  USER_TENANT_ACCESS_ACTIONS
} from '@shared/schema/multi-tenant';
import { users, tenants } from '@shared/schema/base';
import { nanoid } from 'nanoid';
import logger from '../utils/logger';

export interface UserTenantAccess {
  id: string;
  userId: string;
  tenantId: string;
  tenantName: string;
  tenantSubdomain: string;
  role: string;
  isActive: boolean;
  isPrimary: boolean;
  grantedAt: Date;
  lastAccessed?: Date;
  permissions?: Record<string, any>;
  notes?: string;
}

export interface TenantUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  isPrimary: boolean;
  grantedAt: Date;
  grantedByUser?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  lastAccessed?: Date;
  permissions?: Record<string, any>;
}

export interface MultiTenantInvitation {
  id: string;
  tenantId: string;
  tenantName: string;
  inviterEmail: string;
  inviterName: string;
  userId?: string;
  email?: string;
  role: string;
  message?: string;
  status: string;
  expiresAt?: Date;
  createdAt: Date;
}

export class MultiTenantService {
  private static instance: MultiTenantService;

  public static getInstance(): MultiTenantService {
    if (!MultiTenantService.instance) {
      MultiTenantService.instance = new MultiTenantService();
    }
    return MultiTenantService.instance;
  }

  // ==================== USER TENANT ACCESS ====================

  /**
   * Obtém todos os tenants aos quais um usuário tem acesso
   */
  async getUserTenantAccesses(userId: string): Promise<UserTenantAccess[]> {
    try {
      const accesses = await db
        .select({
          id: userTenantRelationships.id,
          userId: userTenantRelationships.userId,
          tenantId: userTenantRelationships.tenantId,
          tenantName: tenants.name,
          tenantSubdomain: tenants.subdomain,
          role: userTenantRelationships.role,
          isActive: userTenantRelationships.isActive,
          isPrimary: userTenantRelationships.isPrimary,
          grantedAt: userTenantRelationships.grantedAt,
          lastAccessed: userTenantRelationships.lastAccessed,
          permissions: userTenantRelationships.permissions,
          notes: userTenantRelationships.notes
        })
        .from(userTenantRelationships)
        .innerJoin(tenants, eq(userTenantRelationships.tenantId, tenants.id))
        .where(and(
          eq(userTenantRelationships.userId, userId),
          eq(userTenantRelationships.isActive, true),
          eq(tenants.isActive, true)
        ))
        .orderBy(desc(userTenantRelationships.isPrimary), asc(tenants.name));

      return accesses.map(access => ({
        id: access.id,
        userId: access.userId,
        tenantId: access.tenantId,
        tenantName: access.tenantName,
        tenantSubdomain: access.tenantSubdomain,
        role: access.role,
        isActive: access.isActive,
        isPrimary: access.isPrimary,
        grantedAt: access.grantedAt,
        lastAccessed: access.lastAccessed,
        permissions: access.permissions,
        notes: access.notes
      }));
    } catch (error) {
      logger.error('Error fetching user tenant accesses:', error);
      throw new Error('Failed to fetch user tenant accesses');
    }
  }

  /**
   * Verifica se um usuário tem acesso a um tenant específico
   */
  async hasUserTenantAccess(userId: string, tenantId: string): Promise<UserTenantAccess | null> {
    try {
      const access = await db
        .select({
          id: userTenantRelationships.id,
          userId: userTenantRelationships.userId,
          tenantId: userTenantRelationships.tenantId,
          tenantName: tenants.name,
          tenantSubdomain: tenants.subdomain,
          role: userTenantRelationships.role,
          isActive: userTenantRelationships.isActive,
          isPrimary: userTenantRelationships.isPrimary,
          grantedAt: userTenantRelationships.grantedAt,
          lastAccessed: userTenantRelationships.lastAccessed,
          permissions: userTenantRelationships.permissions,
          notes: userTenantRelationships.notes
        })
        .from(userTenantRelationships)
        .innerJoin(tenants, eq(userTenantRelationships.tenantId, tenants.id))
        .where(and(
          eq(userTenantRelationships.userId, userId),
          eq(userTenantRelationships.tenantId, tenantId),
          eq(userTenantRelationships.isActive, true),
          eq(tenants.isActive, true)
        ))
        .limit(1);

      if (access.length === 0) return null;

      return {
        id: access[0].id,
        userId: access[0].userId,
        tenantId: access[0].tenantId,
        tenantName: access[0].tenantName,
        tenantSubdomain: access[0].tenantSubdomain,
        role: access[0].role,
        isActive: access[0].isActive,
        isPrimary: access[0].isPrimary,
        grantedAt: access[0].grantedAt,
        lastAccessed: access[0].lastAccessed,
        permissions: access[0].permissions,
        notes: access[0].notes
      };
    } catch (error) {
      logger.error('Error checking user tenant access:', error);
      throw new Error('Failed to check user tenant access');
    }
  }

  /**
   * Concede acesso de um usuário a um tenant
   */
  async grantUserTenantAccess(data: {
    userId: string;
    tenantId: string;
    role: string;
    grantedBy: string;
    isPrimary?: boolean;
    permissions?: Record<string, any>;
    notes?: string;
  }): Promise<UserTenantAccess> {
    try {
      // Verifica se o usuário já tem acesso
      const existingAccess = await this.hasUserTenantAccess(data.userId, data.tenantId);
      if (existingAccess) {
        throw new Error('User already has access to this tenant');
      }

      // Se for acesso primário, remove o primário anterior
      if (data.isPrimary) {
        await db
          .update(userTenantRelationships)
          .set({ isPrimary: false })
          .where(eq(userTenantRelationships.userId, data.userId));
      }

      // Cria o relacionamento
      const [relationship] = await db
        .insert(userTenantRelationships)
        .values({
          userId: data.userId,
          tenantId: data.tenantId,
          role: data.role,
          isActive: true,
          isPrimary: data.isPrimary || false,
          grantedBy: data.grantedBy,
          permissions: data.permissions,
          notes: data.notes
        })
        .returning();

      // Registra o log de acesso
      await this.logUserTenantAccess({
        userId: data.userId,
        tenantId: data.tenantId,
        action: USER_TENANT_ACCESS_ACTIONS.ACCESS_GRANTED,
        metadata: {
          grantedBy: data.grantedBy,
          role: data.role,
          isPrimary: data.isPrimary
        }
      });

      // Retorna os dados completos
      const access = await this.hasUserTenantAccess(data.userId, data.tenantId);
      if (!access) {
        throw new Error('Failed to retrieve created access');
      }

      return access;
    } catch (error) {
      logger.error('Error granting user tenant access:', error);
      throw new Error('Failed to grant user tenant access');
    }
  }

  /**
   * Revoga acesso de um usuário a um tenant
   */
  async revokeUserTenantAccess(userId: string, tenantId: string, revokedBy: string): Promise<boolean> {
    try {
      const result = await db
        .update(userTenantRelationships)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(userTenantRelationships.userId, userId),
          eq(userTenantRelationships.tenantId, tenantId)
        ));

      if (result.rowCount && result.rowCount > 0) {
        // Registra o log de revogação
        await this.logUserTenantAccess({
          userId,
          tenantId,
          action: USER_TENANT_ACCESS_ACTIONS.ACCESS_REVOKED,
          metadata: {
            revokedBy
          }
        });
      }

      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      logger.error('Error revoking user tenant access:', error);
      throw new Error('Failed to revoke user tenant access');
    }
  }

  /**
   * Atualiza o papel de um usuário em um tenant
   */
  async updateUserTenantRole(
    userId: string, 
    tenantId: string, 
    newRole: string, 
    updatedBy: string
  ): Promise<boolean> {
    try {
      const result = await db
        .update(userTenantRelationships)
        .set({ 
          role: newRole,
          updatedAt: new Date()
        })
        .where(and(
          eq(userTenantRelationships.userId, userId),
          eq(userTenantRelationships.tenantId, tenantId),
          eq(userTenantRelationships.isActive, true)
        ));

      if (result.rowCount && result.rowCount > 0) {
        // Registra o log de atualização
        await this.logUserTenantAccess({
          userId,
          tenantId,
          action: 'role_updated',
          metadata: {
            newRole,
            updatedBy
          }
        });
      }

      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      logger.error('Error updating user tenant role:', error);
      throw new Error('Failed to update user tenant role');
    }
  }

  // ==================== TENANT USERS ====================

  /**
   * Obtém todos os usuários de um tenant
   */
  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    try {
      const tenantUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: userTenantRelationships.role,
          isActive: userTenantRelationships.isActive,
          isPrimary: userTenantRelationships.isPrimary,
          grantedAt: userTenantRelationships.grantedAt,
          grantedBy: userTenantRelationships.grantedBy,
          lastAccessed: userTenantRelationships.lastAccessed,
          permissions: userTenantRelationships.permissions
        })
        .from(userTenantRelationships)
        .innerJoin(users, eq(userTenantRelationships.userId, users.id))
        .where(and(
          eq(userTenantRelationships.tenantId, tenantId),
          eq(userTenantRelationships.isActive, true)
        ))
        .orderBy(desc(userTenantRelationships.isPrimary), asc(users.email));

      // Busca dados dos usuários que concederam acesso
      const result: TenantUser[] = [];
      for (const user of tenantUsers) {
        let grantedByUser = undefined;
        if (user.grantedBy) {
          const grantedBy = await db
            .select({
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName
            })
            .from(users)
            .where(eq(users.id, user.grantedBy))
            .limit(1);
          
          if (grantedBy.length > 0) {
            grantedByUser = grantedBy[0];
          }
        }

        result.push({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          isPrimary: user.isPrimary,
          grantedAt: user.grantedAt,
          grantedByUser,
          lastAccessed: user.lastAccessed,
          permissions: user.permissions
        });
      }

      return result;
    } catch (error) {
      logger.error('Error fetching tenant users:', error);
      throw new Error('Failed to fetch tenant users');
    }
  }

  // ==================== INVITATIONS ====================

  /**
   * Cria um convite para adicionar um usuário a um tenant
   */
  async createTenantInvitation(data: {
    tenantId: string;
    inviterId: string;
    userId?: string;
    email?: string;
    role: string;
    message?: string;
    permissions?: Record<string, any>;
    expiresInHours?: number;
  }): Promise<UserTenantInvitation> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || 168)); // 7 dias por padrão

      const [invitation] = await db
        .insert(userTenantInvitations)
        .values({
          tenantId: data.tenantId,
          inviterId: data.inviterId,
          userId: data.userId,
          email: data.email,
          role: data.role,
          message: data.message,
          permissions: data.permissions,
          status: USER_TENANT_INVITATION_STATUS.PENDING,
          expiresAt
        })
        .returning();

      return invitation;
    } catch (error) {
      logger.error('Error creating tenant invitation:', error);
      throw new Error('Failed to create tenant invitation');
    }
  }

  /**
   * Aceita um convite para se juntar a um tenant
   */
  async acceptTenantInvitation(invitationId: string, userId: string): Promise<UserTenantAccess> {
    try {
      // Busca o convite
      const invitation = await db
        .select()
        .from(userTenantInvitations)
        .where(eq(userTenantInvitations.id, invitationId))
        .limit(1);

      if (invitation.length === 0) {
        throw new Error('Invitation not found');
      }

      const inv = invitation[0];
      
      if (inv.status !== USER_TENANT_INVITATION_STATUS.PENDING) {
        throw new Error('Invitation is not pending');
      }

      if (inv.expiresAt && inv.expiresAt < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Verifica se o usuário já tem acesso
      const existingAccess = await this.hasUserTenantAccess(userId, inv.tenantId);
      if (existingAccess) {
        throw new Error('User already has access to this tenant');
      }

      // Concede acesso
      const access = await this.grantUserTenantAccess({
        userId,
        tenantId: inv.tenantId,
        role: inv.role,
        grantedBy: inv.inviterId,
        permissions: inv.permissions
      });

      // Atualiza o status do convite
      await db
        .update(userTenantInvitations)
        .set({
          status: USER_TENANT_INVITATION_STATUS.ACCEPTED,
          respondedAt: new Date()
        })
        .where(eq(userTenantInvitations.id, invitationId));

      return access;
    } catch (error) {
      logger.error('Error accepting tenant invitation:', error);
      throw new Error('Failed to accept tenant invitation');
    }
  }

  /**
   * Rejeita um convite para se juntar a um tenant
   */
  async rejectTenantInvitation(invitationId: string): Promise<boolean> {
    try {
      const result = await db
        .update(userTenantInvitations)
        .set({
          status: USER_TENANT_INVITATION_STATUS.REJECTED,
          respondedAt: new Date()
        })
        .where(eq(userTenantInvitations.id, invitationId));

      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      logger.error('Error rejecting tenant invitation:', error);
      throw new Error('Failed to reject tenant invitation');
    }
  }

  /**
   * Obtém convites pendentes para um usuário
   */
  async getUserPendingInvitations(userId: string): Promise<MultiTenantInvitation[]> {
    try {
      const invitations = await db
        .select({
          id: userTenantInvitations.id,
          tenantId: userTenantInvitations.tenantId,
          tenantName: tenants.name,
          inviterEmail: users.email,
          inviterFirstName: users.firstName,
          inviterLastName: users.lastName,
          role: userTenantInvitations.role,
          message: userTenantInvitations.message,
          status: userTenantInvitations.status,
          expiresAt: userTenantInvitations.expiresAt,
          createdAt: userTenantInvitations.createdAt
        })
        .from(userTenantInvitations)
        .innerJoin(tenants, eq(userTenantInvitations.tenantId, tenants.id))
        .innerJoin(users, eq(userTenantInvitations.inviterId, users.id))
        .where(and(
          eq(userTenantInvitations.userId, userId),
          eq(userTenantInvitations.status, USER_TENANT_INVITATION_STATUS.PENDING),
          sql`${userTenantInvitations.expiresAt} > NOW()`
        ))
        .orderBy(desc(userTenantInvitations.createdAt));

      return invitations.map(inv => ({
        id: inv.id,
        tenantId: inv.tenantId,
        tenantName: inv.tenantName,
        inviterEmail: inv.inviterEmail,
        inviterName: `${inv.inviterFirstName || ''} ${inv.inviterLastName || ''}`.trim(),
        role: inv.role,
        message: inv.message,
        status: inv.status,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt
      }));
    } catch (error) {
      logger.error('Error fetching user pending invitations:', error);
      throw new Error('Failed to fetch user pending invitations');
    }
  }

  /**
   * Obtém convites enviados por um tenant
   */
  async getTenantInvitations(tenantId: string): Promise<MultiTenantInvitation[]> {
    try {
      const invitations = await db
        .select({
          id: userTenantInvitations.id,
          tenantId: userTenantInvitations.tenantId,
          tenantName: tenants.name,
          inviterEmail: users.email,
          inviterFirstName: users.firstName,
          inviterLastName: users.lastName,
          userId: userTenantInvitations.userId,
          email: userTenantInvitations.email,
          role: userTenantInvitations.role,
          message: userTenantInvitations.message,
          status: userTenantInvitations.status,
          expiresAt: userTenantInvitations.expiresAt,
          createdAt: userTenantInvitations.createdAt
        })
        .from(userTenantInvitations)
        .innerJoin(tenants, eq(userTenantInvitations.tenantId, tenants.id))
        .innerJoin(users, eq(userTenantInvitations.inviterId, users.id))
        .where(eq(userTenantInvitations.tenantId, tenantId))
        .orderBy(desc(userTenantInvitations.createdAt));

      return invitations.map(inv => ({
        id: inv.id,
        tenantId: inv.tenantId,
        tenantName: inv.tenantName,
        inviterEmail: inv.inviterEmail,
        inviterName: `${inv.inviterFirstName || ''} ${inv.inviterLastName || ''}`.trim(),
        userId: inv.userId,
        email: inv.email,
        role: inv.role,
        message: inv.message,
        status: inv.status,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt
      }));
    } catch (error) {
      logger.error('Error fetching tenant invitations:', error);
      throw new Error('Failed to fetch tenant invitations');
    }
  }

  // ==================== ACCESS LOGGING ====================

  /**
   * Registra um log de acesso do usuário
   */
  async logUserTenantAccess(data: {
    userId: string;
    tenantId: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await db
        .insert(userTenantAccessLog)
        .values({
          userId: data.userId,
          tenantId: data.tenantId,
          action: data.action,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata
        });
    } catch (error) {
      logger.error('Error logging user tenant access:', error);
      // Não lança erro para não interromper o fluxo principal
    }
  }

  /**
   * Atualiza último acesso do usuário ao tenant
   */
  async updateLastAccess(userId: string, tenantId: string): Promise<void> {
    try {
      await db
        .update(userTenantRelationships)
        .set({ lastAccessed: new Date() })
        .where(and(
          eq(userTenantRelationships.userId, userId),
          eq(userTenantRelationships.tenantId, tenantId)
        ));
    } catch (error) {
      logger.error('Error updating last access:', error);
      // Não lança erro para não interromper o fluxo principal
    }
  }

  /**
   * Obtém logs de acesso de um usuário
   */
  async getUserAccessLogs(userId: string, tenantId?: string, limit: number = 50): Promise<UserTenantAccessLog[]> {
    try {
      const query = db
        .select()
        .from(userTenantAccessLog)
        .where(eq(userTenantAccessLog.userId, userId))
        .orderBy(desc(userTenantAccessLog.timestamp))
        .limit(limit);

      if (tenantId) {
        query.where(and(
          eq(userTenantAccessLog.userId, userId),
          eq(userTenantAccessLog.tenantId, tenantId)
        ));
      }

      return await query;
    } catch (error) {
      logger.error('Error fetching user access logs:', error);
      throw new Error('Failed to fetch user access logs');
    }
  }

  /**
   * Obtém estatísticas do sistema multi-tenant
   */
  async getMultiTenantStats() {
    try {
      const [
        tenantsCount,
        usersCount,
        relationshipsCount,
        pendingInvitations,
        acceptedInvitations,
        expiredInvitations,
        recentActivity
      ] = await Promise.all([
        // Total de tenants
        db.select({ count: count() }).from(tenants),
        
        // Total de usuários
        db.select({ count: count() }).from(users),
        
        // Total de relacionamentos
        db.select({ count: count() }).from(userTenantRelationships),
        
        // Convites pendentes
        db.select({ count: count() })
          .from(userTenantInvitations)
          .where(eq(userTenantInvitations.status, 'pending')),
        
        // Convites aceitos
        db.select({ count: count() })
          .from(userTenantInvitations)
          .where(eq(userTenantInvitations.status, 'accepted')),
        
        // Convites expirados
        db.select({ count: count() })
          .from(userTenantInvitations)
          .where(eq(userTenantInvitations.status, 'expired')),
        
        // Atividade recente
        db.select({
          id: userTenantAccessLog.id,
          action: userTenantAccessLog.action,
          userId: userTenantAccessLog.userId,
          tenantId: userTenantAccessLog.tenantId,
          timestamp: userTenantAccessLog.timestamp
        })
        .from(userTenantAccessLog)
        .orderBy(desc(userTenantAccessLog.timestamp))
        .limit(10)
      ]);

      return {
        totalTenants: tenantsCount[0].count,
        totalUsers: usersCount[0].count,
        totalRelationships: relationshipsCount[0].count,
        pendingInvitations: pendingInvitations[0].count,
        activeInvitations: acceptedInvitations[0].count,
        expiredInvitations: expiredInvitations[0].count,
        recentActivity: recentActivity
      };
    } catch (error) {
      logger.error('Error getting multi-tenant stats:', error);
      throw new Error('Failed to get multi-tenant statistics');
    }
  }

  /**
   * Obtém todos os relacionamentos usuário-tenant
   */
  async getAllUserTenantRelationships() {
    try {
      const relationships = await db
        .select({
          id: userTenantRelationships.id,
          userId: userTenantRelationships.userId,
          tenantId: userTenantRelationships.tenantId,
          role: userTenantRelationships.role,
          isActive: userTenantRelationships.isActive,
          isPrimary: userTenantRelationships.isPrimary,
          grantedBy: userTenantRelationships.grantedBy,
          grantedAt: userTenantRelationships.grantedAt,
          lastAccessed: userTenantRelationships.lastAccessed,
          notes: userTenantRelationships.notes,
          permissions: userTenantRelationships.permissions,
          // User info
          userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          userEmail: users.email,
          // Tenant info
          tenantName: tenants.name
        })
        .from(userTenantRelationships)
        .leftJoin(users, eq(userTenantRelationships.userId, users.id))
        .leftJoin(tenants, eq(userTenantRelationships.tenantId, tenants.id))
        .orderBy(desc(userTenantRelationships.grantedAt));

      return relationships;
    } catch (error) {
      logger.error('Error getting all user-tenant relationships:', error);
      throw new Error('Failed to get user-tenant relationships');
    }
  }

  /**
   * Cria um novo relacionamento usuário-tenant
   */
  async createUserTenantRelationship(data: {
    userId: string;
    tenantId: string;
    role: string;
    isActive?: boolean;
    isPrimary?: boolean;
    grantedBy: string;
    notes?: string;
  }) {
    try {
      const [relationship] = await db
        .insert(userTenantRelationships)
        .values({
          id: nanoid(),
          userId: data.userId,
          tenantId: data.tenantId,
          role: data.role,
          isActive: data.isActive ?? true,
          isPrimary: data.isPrimary ?? false,
          grantedBy: data.grantedBy,
          grantedAt: new Date(),
          notes: data.notes
        })
        .returning();

      return relationship;
    } catch (error) {
      logger.error('Error creating user-tenant relationship:', error);
      throw new Error('Failed to create user-tenant relationship');
    }
  }

  /**
   * Atualiza um relacionamento usuário-tenant
   */
  async updateUserTenantRelationship(id: string, data: {
    role?: string;
    isActive?: boolean;
    isPrimary?: boolean;
    notes?: string;
    updatedBy: string;
  }) {
    try {
      const updateData: any = {};
      
      if (data.role !== undefined) updateData.role = data.role;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.isPrimary !== undefined) updateData.isPrimary = data.isPrimary;
      if (data.notes !== undefined) updateData.notes = data.notes;
      
      const result = await db
        .update(userTenantRelationships)
        .set(updateData)
        .where(eq(userTenantRelationships.id, id));

      return result.rowCount && result.rowCount > 0;
    } catch (error) {
      logger.error('Error updating user-tenant relationship:', error);
      throw new Error('Failed to update user-tenant relationship');
    }
  }

  /**
   * Remove um relacionamento usuário-tenant
   */
  async deleteUserTenantRelationship(id: string) {
    try {
      const result = await db
        .delete(userTenantRelationships)
        .where(eq(userTenantRelationships.id, id));

      return result.rowCount && result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting user-tenant relationship:', error);
      throw new Error('Failed to delete user-tenant relationship');
    }
  }

  /**
   * Obtém todos os usuários
   */
  async getAllUsers() {
    try {
      const usersList = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          fullName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`
        })
        .from(users)
        .orderBy(users.firstName, users.lastName);

      return usersList;
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw new Error('Failed to get users');
    }
  }

  /**
   * Obtém todos os tenants
   */
  async getAllTenants() {
    try {
      const tenantsList = await db
        .select({
          id: tenants.id,
          name: tenants.name,
          subdomain: tenants.subdomain
        })
        .from(tenants)
        .orderBy(tenants.name);

      return tenantsList;
    } catch (error) {
      logger.error('Error getting all tenants:', error);
      throw new Error('Failed to get tenants');
    }
  }

  /**
   * Reenvia um convite
   */
  async resendInvitation(invitationId: string, resenderId: string) {
    try {
      const result = await db
        .update(userTenantInvitations)
        .set({
          status: 'pending',
          updatedAt: new Date()
        })
        .where(eq(userTenantInvitations.id, invitationId));

      return result.rowCount && result.rowCount > 0;
    } catch (error) {
      logger.error('Error resending invitation:', error);
      throw new Error('Failed to resend invitation');
    }
  }

  /**
   * Cancela um convite
   */
  async cancelInvitation(invitationId: string) {
    try {
      const result = await db
        .update(userTenantInvitations)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(userTenantInvitations.id, invitationId));

      return result.rowCount && result.rowCount > 0;
    } catch (error) {
      logger.error('Error cancelling invitation:', error);
      throw new Error('Failed to cancel invitation');
    }
  }
}

export const multiTenantService = MultiTenantService.getInstance();