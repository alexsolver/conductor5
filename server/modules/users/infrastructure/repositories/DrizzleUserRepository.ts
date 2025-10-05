/**
 * INFRASTRUCTURE LAYER - DRIZZLE USER REPOSITORY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { eq, and, or, like, gte, lte, inArray, desc, asc, count, isNull, sql } from 'drizzle-orm';
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
  
  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use findByIdAndTenant instead
  async findById(id: string): Promise<User | null> {
    throw new Error('1QA.MD VIOLATION: findById without tenant context is not allowed. Use findByIdAndTenant instead.');
  }

  // ✅ 1QA.MD: Find user by ID using tenant schema
  async findByIdAndTenant(id: string, tenantId: string): Promise<User | null> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[USER-REPOSITORY-QA] Finding user by ID for schema:', tenantSchema);

      const result = await db.execute(sql`
        SELECT 
          id, first_name as "firstName", last_name as "lastName", email, 
          password_hash as "passwordHash", role, position,
          department, phone, avatar_url as "avatarUrl", is_active as "isActive",
          employment_type as "employmentType",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt"
        FROM ${sql.identifier(tenantSchema)}.users
        WHERE id = ${id} AND tenant_id = ${tenantId} AND is_active = true
        LIMIT 1
      `);

      return result.rows[0] ? this.mapToUser(result.rows[0] as any) : null;
    } catch (error) {
      console.error('[USER-REPOSITORY-QA] Error finding user by ID:', error);
      throw error;
    }
  }

  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use findByEmailAndTenant instead
  async findByEmail(email: string): Promise<User | null> {
    throw new Error('1QA.MD VIOLATION: findByEmail without tenant context is not allowed. Use findByEmailAndTenant instead.');
  }

  // ✅ 1QA.MD: Special authentication method - Find user by email for login (searches across tenants)
  async findByEmailForAuth(email: string): Promise<User | null> {
    try {
      console.log('[USER-REPOSITORY-AUTH] Finding user by email for authentication:', email);
      
      // Use the public users table for authentication lookups
      const result = await db.execute(sql`
        SELECT 
          id, email, password_hash as "passwordHash", first_name as "firstName",
          last_name as "lastName", role, tenant_id as "tenantId", is_active as "isActive",
          employment_type as "employmentType", 
          last_login_at as "lastLoginAt", created_at as "createdAt", updated_at as "updatedAt"
        FROM users
        WHERE email = ${email.toLowerCase().trim()} AND is_active = true
        LIMIT 1
      `);

      return result.rows[0] ? this.mapToUser(result.rows[0] as any) : null;
    } catch (error) {
      console.error('[USER-REPOSITORY-AUTH] Error finding user by email for auth:', error);
      throw error;
    }
  }

  // ✅ 1QA.MD: Find user by email using tenant schema
  async findByEmailAndTenant(email: string, tenantId: string): Promise<User | null> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[USER-REPOSITORY-QA] Finding user by email for schema:', tenantSchema);

      const result = await db.execute(sql`
        SELECT 
          id, name, email, password_hash as "passwordHash", role, position,
          department, phone, avatar_url as "avatarUrl", is_active as "isActive",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt"
        FROM ${sql.identifier(tenantSchema)}.users
        WHERE email = ${email} AND tenant_id = ${tenantId} AND is_active = true
        LIMIT 1
      `);

      return result.rows[0] ? this.mapToUser(result.rows[0] as any) : null;
    } catch (error) {
      console.error('[USER-REPOSITORY-QA] Error finding user by email:', error);
      throw error;
    }
  }

  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use createWithTenant instead
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    throw new Error('1QA.MD VIOLATION: create without tenant context is not allowed. Use createWithTenant instead.');
  }

  // ✅ 1QA.MD: Create user using tenant schema
  async createWithTenant(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<User> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[USER-REPOSITORY-QA] Creating user for schema:', tenantSchema);

      const now = new Date();
      const result = await db.execute(sql`
        INSERT INTO ${sql.identifier(tenantSchema)}.users (
          tenant_id, name, email, password_hash, role, position,
          department, phone, avatar_url, is_active, created_at, updated_at
        )
        VALUES (
          ${tenantId}, ${userData.name || ''}, ${userData.email}, ${userData.passwordHash},
          ${userData.role}, ${userData.position || ''}, ${userData.department || ''},
          ${userData.phoneNumber || ''}, ${userData.avatar || ''}, 
          ${userData.isActive !== false}, ${now}, ${now}
        )
        RETURNING 
          id, name, email, password_hash as "passwordHash", role, position,
          department, phone, avatar_url as "avatarUrl", is_active as "isActive",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt"
      `);

      return this.mapToUser(result.rows[0] as any)!;
    } catch (error) {
      console.error('[USER-REPOSITORY-QA] Error creating user:', error);
      throw error;
    }
  }

  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use updateWithTenant instead
  async update(id: string, updates: Partial<User>): Promise<User> {
    throw new Error('1QA.MD VIOLATION: update without tenant context is not allowed. Use updateWithTenant instead.');
  }

  // ✅ 1QA.MD: Update user using tenant schema
  async updateWithTenant(id: string, updates: Partial<User>, tenantId: string): Promise<User> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[USER-REPOSITORY-QA] Updating user for schema:', tenantSchema);

      const now = new Date();
      const result = await db.execute(sql`
        UPDATE ${sql.identifier(tenantSchema)}.users
        SET 
          name = COALESCE(${updates.name}, name),
          email = COALESCE(${updates.email}, email),
          password_hash = COALESCE(${updates.passwordHash}, password_hash),
          role = COALESCE(${updates.role}, role),
          position = COALESCE(${updates.position}, position),
          department = COALESCE(${updates.department}, department),
          phone = COALESCE(${updates.phoneNumber}, phone),
          avatar_url = COALESCE(${updates.avatar}, avatar_url),
          is_active = COALESCE(${updates.isActive}, is_active),
          updated_at = ${now}
        WHERE id = ${id} AND tenant_id = ${tenantId}
        RETURNING 
          id, name, email, password_hash as "passwordHash", role, position,
          department, phone, avatar_url as "avatarUrl", is_active as "isActive",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt"
      `);

      if (!result.rows[0]) {
        throw new Error('User not found or already deleted');
      }

      return this.mapToUser(result.rows[0] as any)!;
    } catch (error) {
      console.error('[USER-REPOSITORY-QA] Error updating user:', error);
      throw error;
    }
  }

  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use deleteWithTenant instead
  async delete(id: string): Promise<void> {
    throw new Error('1QA.MD VIOLATION: delete without tenant context is not allowed. Use deleteWithTenant instead.');
  }

  // ✅ 1QA.MD: Delete user using tenant schema
  async deleteWithTenant(id: string, tenantId: string): Promise<void> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[USER-REPOSITORY-QA] Deleting user for schema:', tenantSchema);

      const now = new Date();
      const result = await db.execute(sql`
        UPDATE ${sql.identifier(tenantSchema)}.users
        SET is_active = false, updated_at = ${now}
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `);

      if (result.rowCount === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('[USER-REPOSITORY-QA] Error deleting user:', error);
      throw error;
    }
  }

  // ✅ 1QA.MD: Find users with filters using tenant schema
  async findByFilters(
    filters: UserFilters, 
    pagination: PaginationOptions, 
    tenantId: string
  ): Promise<UserListResult> {
    try {
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[USER-REPOSITORY-QA] Finding users with filters for schema:', tenantSchema);

      // Build search conditions
      let whereClause = 'WHERE tenant_id = $1 AND is_active = true';
      const params: any[] = [tenantId];
      let paramIndex = 2;

      if (filters.search) {
        whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR position ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      if (filters.role?.length) {
        whereClause += ` AND role = ANY($${paramIndex})`;
        params.push(filters.role);
        paramIndex++;
      }

      // Count total
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM ${sql.identifier(tenantSchema)}.users
        ${sql.raw(whereClause)}
      `);

      const total = parseInt(countResult.rows[0]?.count as string) || 0;
      const offset = (pagination.page - 1) * pagination.limit;
      const totalPages = Math.ceil(total / pagination.limit);

      // Fetch results
      const result = await db.execute(sql`
        SELECT 
          id, name, email, password_hash as "passwordHash", role, position,
          department, phone, avatar_url as "avatarUrl", is_active as "isActive",
          tenant_id as "tenantId", created_at as "createdAt", updated_at as "updatedAt"
        FROM ${sql.identifier(tenantSchema)}.users
        ${sql.raw(whereClause)}
        ORDER BY name
        LIMIT ${pagination.limit} OFFSET ${offset}
      `);

      return {
        users: result.rows.map(u => this.mapToUser(u as any)!),
        total,
        page: pagination.page,
        totalPages
      };
    } catch (error) {
      console.error('[USER-REPOSITORY] Error in findByFilters:', error);
      throw error;
    }
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
      loginCount: 0, // Login count not tracked in current schema
      
      // Audit fields
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      createdById: undefined, // Would need additional schema column
      updatedById: undefined  // Would need additional schema column
    };
  }
}