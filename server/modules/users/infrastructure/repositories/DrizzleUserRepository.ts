/**
 * INFRASTRUCTURE LAYER - DRIZZLE USER REPOSITORY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { eq, and, or, like, gte, lte, inArray, desc, asc, count, isNull } from 'drizzle-orm';
import { db } from '../../../../db';
import { users } from '@shared/schema';
import { User } from '../../domain/entities/User';
import { 
  IUserRepository, 
  UserFilters, 
  PaginationOptions, 
  UserListResult 
} from '../../domain/repositories/IUserRepository';

export class DrizzleUserRepository implements IUserRepository {
  
  async findById(id: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, id),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    return this.mapToUser(result[0]) || null;
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, id),
          eq(users.tenantId, tenantId),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    return this.mapToUser(result[0]) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    return this.mapToUser(result[0]) || null;
  }

  async findByEmailAndTenant(email: string, tenantId: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.tenantId, tenantId),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    return this.mapToUser(result[0]) || null;
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    
    const insertData = {
      tenantId: userData.tenantId,
      email: userData.email,
      passwordHash: userData.passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      employmentType: userData.employmentType,
      isActive: userData.isActive,
      
      // Profile information - mapping to schema columns
      phone: userData.phoneNumber, // Map phoneNumber to phone
      position: userData.position,
      // department mapping would need a department table lookup
      profileImageUrl: userData.avatar, // Map avatar to profileImageUrl
      
      // Preferences
      timeZone: userData.timezone, // Map timezone to timeZone
      // language and theme would need additional schema columns
      
      // Authentication
      loginCount: userData.loginCount || 0,
      lastLoginAt: userData.lastLoginAt,
      
      // Audit
      createdAt: now,
      updatedAt: now
    };

    const result = await db
      .insert(users)
      .values(insertData)
      .returning();

    return this.mapToUser(result[0])!;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const updateData: any = {
      updatedAt: new Date()
    };

    // Map domain fields to schema fields
    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.employmentType !== undefined) updateData.employmentType = updates.employmentType;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.phoneNumber !== undefined) updateData.phone = updates.phoneNumber;
    if (updates.position !== undefined) updateData.position = updates.position;
    if (updates.avatar !== undefined) updateData.profileImageUrl = updates.avatar;
    if (updates.timezone !== undefined) updateData.timeZone = updates.timezone;
    if (updates.passwordHash !== undefined) updateData.passwordHash = updates.passwordHash;
    if (updates.lastLoginAt !== undefined) updateData.lastLoginAt = updates.lastLoginAt;
    if (updates.loginCount !== undefined) updateData.loginCount = updates.loginCount;

    const result = await db
      .update(users)
      .set(updateData)
      .where(
        and(
          eq(users.id, id),
          eq(users.isActive, true)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new Error('User not found or already deleted');
    }

    return this.mapToUser(result[0])!;
  }

  async delete(id: string): Promise<void> {
    const result = await db
      .update(users)
      .set({ 
        isActive: false, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));

    if (result.rowCount === 0) {
      throw new Error('User not found');
    }
  }

  async findByFilters(
    filters: UserFilters, 
    pagination: PaginationOptions, 
    tenantId?: string
  ): Promise<UserListResult> {
    // Build where conditions
    const conditions = [eq(users.isActive, true)];

    // Add tenant filter if specified
    if (tenantId) {
      conditions.push(eq(users.tenantId, tenantId));
    }

    // Apply filters
    if (filters.role?.length) {
      conditions.push(inArray(users.role, filters.role));
    }

    if (filters.employmentType?.length) {
      conditions.push(inArray(users.employmentType, filters.employmentType));
    }

    if (filters.isActive !== undefined) {
      conditions[0] = eq(users.isActive, filters.isActive); // Replace the default isActive filter
    }

    if (filters.department) {
      // Note: This would need a proper department join in a real implementation
      // For now, we'll skip this filter or use a placeholder
    }

    if (filters.dateFrom) {
      conditions.push(gte(users.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(users.createdAt, filters.dateTo));
    }

    if (filters.search) {
      conditions.push(
        or(
          like(users.firstName, `%${filters.search}%`),
          like(users.lastName, `%${filters.search}%`),
          like(users.email, `%${filters.search}%`),
          like(users.position, `%${filters.search}%`)
        )
      );
    }

    // Count total results
    const totalResult = await db
      .select({ count: count() })
      .from(users)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    // Calculate offset
    const offset = (pagination.page - 1) * pagination.limit;

    // Build order by
    const orderColumn = users[pagination.sortBy as keyof typeof users] || users.firstName;
    const orderDirection = pagination.sortOrder === 'asc' ? asc : desc;

    // Fetch paginated results
    const userResults = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(orderDirection(orderColumn))
      .limit(pagination.limit)
      .offset(offset);

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      users: userResults.map(u => this.mapToUser(u)!),
      total,
      page: pagination.page,
      totalPages
    };
  }

  async findByTenant(tenantId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          eq(users.isActive, true)
        )
      )
      .orderBy(asc(users.firstName));

    return result.map(u => this.mapToUser(u)!);
  }

  async findByRole(role: string, tenantId?: string): Promise<User[]> {
    const conditions = [
      eq(users.role, role),
      eq(users.isActive, true)
    ];

    if (tenantId) {
      conditions.push(eq(users.tenantId, tenantId));
    }

    const result = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(asc(users.firstName));

    return result.map(u => this.mapToUser(u)!);
  }

  async findByEmploymentType(employmentType: string, tenantId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.employmentType, employmentType),
          eq(users.tenantId, tenantId),
          eq(users.isActive, true)
        )
      )
      .orderBy(asc(users.firstName));

    return result.map(u => this.mapToUser(u)!);
  }

  async countByFilters(filters: UserFilters, tenantId?: string): Promise<number> {
    const conditions = [eq(users.isActive, true)];

    if (tenantId) {
      conditions.push(eq(users.tenantId, tenantId));
    }

    // Apply same filters as findByFilters
    if (filters.role?.length) {
      conditions.push(inArray(users.role, filters.role));
    }

    if (filters.employmentType?.length) {
      conditions.push(inArray(users.employmentType, filters.employmentType));
    }

    if (filters.isActive !== undefined) {
      conditions[0] = eq(users.isActive, filters.isActive);
    }

    if (filters.search) {
      conditions.push(
        or(
          like(users.firstName, `%${filters.search}%`),
          like(users.lastName, `%${filters.search}%`),
          like(users.email, `%${filters.search}%`)
        )
      );
    }

    const result = await db
      .select({ count: count() })
      .from(users)
      .where(and(...conditions));

    return result[0]?.count || 0;
  }

  async getStatistics(tenantId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    byEmploymentType: Record<string, number>;
    recentLogins: number;
  }> {
    const conditions = [];
    if (tenantId) {
      conditions.push(eq(users.tenantId, tenantId));
    }

    // Get basic statistics
    const totalResult = await db
      .select({ count: count() })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const activeResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        conditions.length > 0 
          ? and(...conditions, eq(users.isActive, true))
          : eq(users.isActive, true)
      );

    const inactiveResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        conditions.length > 0 
          ? and(...conditions, eq(users.isActive, false))
          : eq(users.isActive, false)
      );

    // Get recent logins (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentLoginsResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        conditions.length > 0 
          ? and(...conditions, gte(users.lastLoginAt, thirtyDaysAgo))
          : gte(users.lastLoginAt, thirtyDaysAgo)
      );

    const total = totalResult[0]?.count || 0;
    const active = activeResult[0]?.count || 0;
    const inactive = inactiveResult[0]?.count || 0;
    const recentLogins = recentLoginsResult[0]?.count || 0;

    // For role and employment type statistics, we'd need more sophisticated queries
    // This is a simplified version
    const byRole: Record<string, number> = {};
    const byEmploymentType: Record<string, number> = {};

    return {
      total,
      active,
      inactive,
      byRole,
      byEmploymentType,
      recentLogins
    };
  }

  async searchUsers(
    searchTerm: string, 
    tenantId?: string, 
    pagination?: PaginationOptions
  ): Promise<UserListResult> {
    const conditions = [
      eq(users.isActive, true),
      or(
        like(users.firstName, `%${searchTerm}%`),
        like(users.lastName, `%${searchTerm}%`),
        like(users.email, `%${searchTerm}%`),
        like(users.position, `%${searchTerm}%`)
      )
    ];

    if (tenantId) {
      conditions.push(eq(users.tenantId, tenantId));
    }

    // Count total results
    const totalResult = await db
      .select({ count: count() })
      .from(users)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    if (!pagination) {
      const userResults = await db
        .select()
        .from(users)
        .where(and(...conditions))
        .orderBy(asc(users.firstName));

      return {
        users: userResults.map(u => this.mapToUser(u)!),
        total,
        page: 1,
        totalPages: 1
      };
    }

    // Calculate offset
    const offset = (pagination.page - 1) * pagination.limit;

    // Fetch paginated results
    const userResults = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(asc(users.firstName))
      .limit(pagination.limit)
      .offset(offset);

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      users: userResults.map(u => this.mapToUser(u)!),
      total,
      page: pagination.page,
      totalPages
    };
  }

  async updateLoginStats(id: string, stats: { lastLoginAt: Date; loginCount: number }): Promise<void> {
    await db
      .update(users)
      .set({
        lastLoginAt: stats.lastLoginAt,
        loginCount: stats.loginCount,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async findByDepartment(department: string, tenantId: string): Promise<User[]> {
    // This would require a proper department table and relationship
    // For now, return empty array or implement based on your schema
    return [];
  }

  async bulkUpdate(ids: string[], updates: Partial<User>): Promise<User[]> {
    const updateData: any = {
      updatedAt: new Date()
    };

    // Map domain fields to schema fields (same as in update method)
    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    const result = await db
      .update(users)
      .set(updateData)
      .where(
        and(
          inArray(users.id, ids),
          eq(users.isActive, true)
        )
      )
      .returning();

    return result.map(u => this.mapToUser(u)!);
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const conditions = [eq(users.email, email)];
    
    if (excludeId) {
      conditions.push(eq(users.id, excludeId));
    }

    const result = await db
      .select({ count: count() })
      .from(users)
      .where(and(...conditions));

    return (result[0]?.count || 0) > 0;
  }

  async findUsersForNotification(tenantId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          eq(users.isActive, true)
          // Add email filter if needed
        )
      );

    return result.map(u => this.mapToUser(u)!);
  }

  async findTenantAdmins(tenantId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          eq(users.role, 'tenant_admin'),
          eq(users.isActive, true)
        )
      );

    return result.map(u => this.mapToUser(u)!);
  }

  async findSaasAdmins(): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, 'saas_admin'),
          eq(users.isActive, true)
        )
      );

    return result.map(u => this.mapToUser(u)!);
  }

  private mapToUser(dbUser: any): User | null {
    if (!dbUser) return null;

    return {
      id: dbUser.id,
      tenantId: dbUser.tenantId,
      email: dbUser.email,
      firstName: dbUser.firstName || '',
      lastName: dbUser.lastName || '',
      role: dbUser.role,
      employmentType: dbUser.employmentType,
      isActive: dbUser.isActive,
      
      // Profile information - mapping from schema columns
      phoneNumber: dbUser.phone,
      position: dbUser.position,
      department: undefined, // Would need department table lookup
      avatar: dbUser.profileImageUrl,
      
      // Preferences  
      language: 'pt-BR', // Would need additional schema column
      timezone: dbUser.timeZone || 'America/Sao_Paulo',
      theme: undefined, // Would need additional schema column
      
      // Authentication
      passwordHash: dbUser.passwordHash,
      lastLoginAt: dbUser.lastLoginAt,
      loginCount: dbUser.loginCount || 0,
      
      // Audit fields
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      createdById: undefined, // Would need additional schema column
      updatedById: undefined  // Would need additional schema column
    };
  }
}