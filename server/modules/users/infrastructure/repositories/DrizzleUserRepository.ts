[
  {"file_path": "/home/runner/work/automacao-api/automacao-api/src/infra/repositories/DrizzleUserRepository.ts", "content": "/**\n * INFRASTRUCTURE LAYER - DRIZZLE USER REPOSITORY\n * Seguindo Clean Architecture - 1qa.md compliance\n */\n\nimport { eq, and, or, like, gte, lte, inArray, desc, asc, count, isNull, sql } from 'drizzle-orm';\nimport { db } from '../../../../db';\nimport { users as schema } from '@shared/schema'; // Renamed import to avoid conflict\nimport { User } from '../../domain/entities/User';\nimport { \n  IUserRepository, \n  UserFilters, \n  PaginationOptions, \n  UserListResult \n} from '../../domain/repositories/IUserRepository';\n\nexport class DrizzleUserRepository implements IUserRepository {\n\n  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use findByIdAndTenant instead\n  async findById(id: string): Promise<User | null> {\n    throw new Error('1QA.MD VIOLATION: findById without tenant context is not allowed. Use findByIdAndTenant instead.');\n  }\n\n  // ✅ 1QA.MD: Find user by ID using tenant schema\n  async findByIdAndTenant(id: string, tenantId: string): Promise<User | null> {\n    try {\n      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;\n      console.log('[USER-REPOSITORY-QA] Finding user by ID for schema:', tenantSchema);\n\n      const result = await db.execute(sql`\n        SELECT \n          id, name, email, password_hash as \"passwordHash\", role, position,\n          department, phone, avatar_url as \"avatarUrl\", is_active as \"isActive\",\n          tenant_id as \"tenantId\", created_at as \"createdAt\", updated_at as \"updatedAt\"\n        FROM ${sql.identifier(tenantSchema)}.users\n        WHERE id = ${id} AND tenant_id = ${tenantId} AND is_active = true\n        LIMIT 1\n      `);\n\n      return result.rows[0] ? this.mapToUser(result.rows[0] as any) : null;\n    } catch (error) {\n      console.error('[USER-REPOSITORY-QA] Error finding user by ID:', error);\n      throw error;\n    }\n  }\n\n  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use findByEmailAndTenant instead\n  async findByEmail(email: string): Promise<User | null> {\n    throw new Error('1QA.MD VIOLATION: findByEmail without tenant context is not allowed. Use findByEmailAndTenant instead.');\n  }\n\n  // ✅ 1QA.MD: Special authentication method - Find user by email for login (searches across tenants)\n  async findByEmailForAuth(email: string): Promise<User | null> {\n    try {\n      console.log('[USER-REPOSITORY-AUTH] Finding user by email for authentication:', email);\n\n      // Use the public users table for authentication lookups\n      const result = await db.execute(sql`\n        SELECT \n          id, email, password_hash as \"passwordHash\", first_name as \"firstName\",\n          last_name as \"lastName\", role, tenant_id as \"tenantId\", is_active as \"isActive\",\n          employment_type as \"employmentType\", \n          last_login_at as \"lastLoginAt\", created_at as \"createdAt\", updated_at as \"updatedAt\"\n        FROM users\n        WHERE email = ${email.toLowerCase().trim()} AND is_active = true\n        LIMIT 1\n      `);\n\n      return result.rows[0] ? this.mapToUser(result.rows[0] as any) : null;\n    } catch (error) {\n      console.error('[USER-REPOSITORY-AUTH] Error finding user by email for auth:', error);\n      throw error;\n    }\n  }\n\n  // ✅ 1QA.MD: Find user by email using tenant schema\n  async findByEmailAndTenant(email: string, tenantId: string): Promise<User | null> {\n    try {\n      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;\n      console.log('[USER-REPOSITORY-QA] Finding user by email for schema:', tenantSchema);\n\n      const result = await db.execute(sql`\n        SELECT \n          id, name, email, password_hash as \"passwordHash\", role, position,\n          department, phone, avatar_url as \"avatarUrl\", is_active as \"isActive\",\n          tenant_id as \"tenantId\", created_at as \"createdAt\", updated_at as \"updatedAt\"\n        FROM ${sql.identifier(tenantSchema)}.users\n        WHERE email = ${email} AND tenant_id = ${tenantId} AND is_active = true\n        LIMIT 1\n      `);\n\n      return result.rows[0] ? this.mapToUser(result.rows[0] as any) : null;\n    } catch (error) {\n      console.error('[USER-REPOSITORY-QA] Error finding user by email:', error);\n      throw error;\n    }\n  }\n\n  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use createWithTenant instead\n  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {\n    throw new Error('1QA.MD VIOLATION: create without tenant context is not allowed. Use createWithTenant instead.');\n  }\n\n  // ✅ 1QA.MD: Create user using tenant schema\n  async createWithTenant(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<User> {\n    try {\n      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;\n      console.log('[USER-REPOSITORY-QA] Creating user for schema:', tenantSchema);\n\n      const now = new Date();\n      const result = await db.execute(sql`\n        INSERT INTO ${sql.identifier(tenantSchema)}.users (\n          tenant_id, name, email, password_hash, role, position,\n          department, phone, avatar_url, is_active, created_at, updated_at\n        )\n        VALUES (\n          ${tenantId}, ${userData.name || ''}, ${userData.email}, ${userData.passwordHash},\n          ${userData.role}, ${userData.position || ''}, ${userData.department || ''},\n          ${userData.phoneNumber || ''}, ${userData.avatar || ''}, \n          ${userData.isActive !== false}, ${now}, ${now}\n        )\n        RETURNING \n          id, name, email, password_hash as \"passwordHash\", role, position,\n          department, phone, avatar_url as \"avatarUrl\", is_active as \"isActive\",\n          tenant_id as \"tenantId\", created_at as \"createdAt\", updated_at as \"updatedAt\"\n      `);\n\n      return this.mapToUser(result.rows[0] as any)!;\n    } catch (error) {\n      console.error('[USER-REPOSITORY-QA] Error creating user:', error);\n      throw error;\n    }\n  }\n\n  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use updateWithTenant instead\n  async update(id: string, updates: Partial<User>): Promise<User> {\n    throw new Error('1QA.MD VIOLATION: update without tenant context is not allowed. Use updateWithTenant instead.');\n  }\n\n  // ✅ 1QA.MD: Update user using tenant schema\n  async updateWithTenant(id: string, updates: Partial<User>, tenantId: string): Promise<User> {\n    try {\n      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;\n      console.log('[USER-REPOSITORY-QA] Updating user for schema:', tenantSchema);\n\n      const now = new Date();\n      const result = await db.execute(sql`\n        UPDATE ${sql.identifier(tenantSchema)}.users\n        SET \n          name = COALESCE(${updates.name}, name),\n          email = COALESCE(${updates.email}, email),\n          password_hash = COALESCE(${updates.passwordHash}, password_hash),\n          role = COALESCE(${updates.role}, role),\n          position = COALESCE(${updates.position}, position),\n          department = COALESCE(${updates.department}, department),\n          phone = COALESCE(${updates.phoneNumber}, phone),\n          avatar_url = COALESCE(${updates.avatar}, avatar_url),\n          is_active = COALESCE(${updates.isActive}, is_active),\n          updated_at = ${now}\n        WHERE id = ${id} AND tenant_id = ${tenantId}\n        RETURNING \n          id, name, email, password_hash as \"passwordHash\", role, position,\n          department, phone, avatar_url as \"avatarUrl\", is_active as \"isActive\",\n          tenant_id as \"tenantId\", created_at as \"createdAt\", updated_at as \"updatedAt\"\n      `);\n\n      if (!result.rows[0]) {\n        throw new Error('User not found or already deleted');\n      }\n\n      return this.mapToUser(result.rows[0] as any)!;\n    } catch (error) {\n      console.error('[USER-REPOSITORY-QA] Error updating user:', error);\n      throw error;\n    }\n  }\n\n  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use deleteWithTenant instead\n  async delete(id: string): Promise<void> {\n    throw new Error('1QA.MD VIOLATION: delete without tenant context is not allowed. Use deleteWithTenant instead.');\n  }\n\n  // ✅ 1QA.MD: Delete user using tenant schema\n  async deleteWithTenant(id: string, tenantId: string): Promise<void> {\n    try {\n      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;\n      console.log('[USER-REPOSITORY-QA] Deleting user for schema:', tenantSchema);\n\n      const now = new Date();\n      const result = await db.execute(sql`\n        UPDATE ${sql.identifier(tenantSchema)}.users\n        SET is_active = false, updated_at = ${now}\n        WHERE id = ${id} AND tenant_id = ${tenantId}\n      `);\n\n      if (result.rowCount === 0) {\n        throw new Error('User not found');\n      }\n    } catch (error) {\n      console.error('[USER-REPOSITORY-QA] Error deleting user:', error);\n      throw error;\n    }\n  }\n\n  // ✅ 1QA.MD: Find users with filters using tenant schema\n  async findByFilters(\n    filters: UserFilters, \n    pagination: PaginationOptions, \n    tenantId: string\n  ): Promise<UserListResult> {\n    try {\n      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;\n      console.log('[USER-REPOSITORY-QA] Finding users with filters for schema:', tenantSchema);\n\n      // Build search conditions\n      let whereClause = 'WHERE tenant_id = $1 AND is_active = true';\n      const params: any[] = [tenantId];\n      let paramIndex = 2;\n\n      if (filters.search) {\n        whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR position ILIKE $${paramIndex})`;\n        params.push(`%${filters.search}%`);\n        paramIndex++;\n      }\n\n      if (filters.role?.length) {\n        whereClause += ` AND role = ANY($${paramIndex})`;\n        params.push(filters.role);\n        paramIndex++;\n      }\n\n      // Count total\n      const countResult = await db.execute(sql`\n        SELECT COUNT(*) as count\n        FROM ${sql.identifier(tenantSchema)}.users\n        ${sql.raw(whereClause)}\n      `);\n\n      const total = parseInt(countResult.rows[0]?.count as string) || 0;\n      const offset = (pagination.page - 1) * pagination.limit;\n      const totalPages = Math.ceil(total / pagination.limit);\n\n      // Fetch results\n      const result = await db.execute(sql`\n        SELECT \n          id, name, email, password_hash as \"passwordHash\", role, position,\n          department, phone, avatar_url as \"avatarUrl\", is_active as \"isActive\",\n          tenant_id as \"tenantId\", created_at as \"createdAt\", updated_at as \"updatedAt\"\n        FROM ${sql.identifier(tenantSchema)}.users\n        ${sql.raw(whereClause)}\n        ORDER BY name\n        LIMIT ${pagination.limit} OFFSET ${offset}\n      `);\n\n      return {\n        users: result.rows.map(u => this.mapToUser(u as any)!),\n        total,\n        page: pagination.page,\n        totalPages\n      };\n    } catch (error) {\n      console.error('[USER-REPOSITORY] Error in findByFilters:', error);\n      throw error;\n    }\n  }\n\n  async findByTenantId(tenantId: string): Promise<User[]> {\n    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;\n\n    const users = await db\n      .select()\n      .from(schema.users)\n      .where(eq(schema.users.tenantId, tenantId));\n\n    return users.map(this.mapToEntity);\n  }\n\n  async findByEmail(email: string, tenantId: string): Promise<User | null> {\n    try {\n      const users = await db\n        .select()\n        .from(schema.users)\n        .where(\n          and(\n            eq(schema.users.email, email),\n            eq(schema.users.tenantId, tenantId)\n          )\n        )\n        .limit(1);\n\n      return users.length > 0 ? this.mapToEntity(users[0]) : null;\n    } catch (error) {\n      console.error('Error finding user by email:', error);\n      return null;\n    }\n  }\n\n  async findByRole(role: string, tenantId?: string): Promise<User[]> {\n    const conditions = [\n      eq(schema.users.role, role),\n      eq(schema.users.isActive, true)\n    ];\n\n    if (tenantId) {\n      conditions.push(eq(schema.users.tenantId, tenantId));\n    }\n\n    const result = await db\n      .select()\n      .from(schema.users)\n      .where(and(...conditions))\n      .orderBy(asc(schema.users.firstName));\n\n    return result.map(u => this.mapToUser(u)!);\n  }\n\n  async findByEmploymentType(employmentType: string, tenantId: string): Promise<User[]> {\n    const result = await db\n      .select()\n      .from(schema.users)\n      .where(\n        and(\n          eq(schema.users.employmentType, employmentType),\n          eq(schema.users.tenantId, tenantId),\n          eq(schema.users.isActive, true)\n        )\n      )\n      .orderBy(asc(schema.users.firstName));\n\n    return result.map(u => this.mapToUser(u)!);\n  }\n\n  async countByFilters(filters: UserFilters, tenantId?: string): Promise<number> {\n    const conditions = [eq(schema.users.isActive, true)];\n\n    if (tenantId) {\n      conditions.push(eq(schema.users.tenantId, tenantId));\n    }\n\n    // Apply same filters as findByFilters\n    if (filters.role?.length) {\n      conditions.push(inArray(schema.users.role, filters.role));\n    }\n\n    if (filters.employmentType?.length) {\n      conditions.push(inArray(schema.users.employmentType, filters.employmentType));\n    }\n\n    if (filters.isActive !== undefined) {\n      conditions[0] = eq(schema.users.isActive, filters.isActive);\n    }\n\n    if (filters.search) {\n      conditions.push(\n        or(\n          like(schema.users.firstName, `%${filters.search}%`),\n          like(schema.users.lastName, `%${filters.search}%`),\n          like(schema.users.email, `%${filters.search}%`)\n        )\n      );\n    }\n\n    const result = await db\n      .select({ count: count() })\n      .from(schema.users)\n      .where(and(...conditions));\n\n    return result[0]?.count || 0;\n  }\n\n  async getStatistics(tenantId?: string): Promise<{ \n    total: number;\n    active: number;\n    inactive: number;\n    byRole: Record<string, number>;\n    byEmploymentType: Record<string, number>;\n    recentLogins: number;\n  }> {\n    const conditions = [];\n    if (tenantId) {\n      conditions.push(eq(schema.users.tenantId, tenantId));\n    }\n\n    // Get basic statistics\n    const totalResult = await db\n      .select({ count: count() })\n      .from(schema.users)\n      .where(conditions.length > 0 ? and(...conditions) : undefined);\n\n    const activeResult = await db\n      .select({ count: count() })\n      .from(schema.users)\n      .where(\n        conditions.length > 0 \n          ? and(...conditions, eq(schema.users.isActive, true))\n          : eq(schema.users.isActive, true)\n      );\n\n    const inactiveResult = await db\n      .select({ count: count() })\n      .from(schema.users)\n      .where(\n        conditions.length > 0 \n          ? and(...conditions, eq(schema.users.isActive, false))\n          : eq(schema.users.isActive, false)\n      );\n\n    // Get recent logins (last 30 days)\n    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);\n    const recentLoginsResult = await db\n      .select({ count: count() })\n      .from(schema.users)\n      .where(\n        conditions.length > 0 \n          ? and(...conditions, gte(schema.users.lastLoginAt, thirtyDaysAgo))\n          : gte(schema.users.lastLoginAt, thirtyDaysAgo)\n      );\n\n    const total = totalResult[0]?.count || 0;\n    const active = activeResult[0]?.count || 0;\n    const inactive = inactiveResult[0]?.count || 0;\n    const recentLogins = recentLoginsResult[0]?.count || 0;\n\n    // For role and employment type statistics, we'd need more sophisticated queries\n    // This is a simplified version\n    const byRole: Record<string, number> = {};\n    const byEmploymentType: Record<string, number> = {};\n\n    return {\n      total,\n      active,\n      inactive,\n      byRole,\n      byEmploymentType,\n      recentLogins\n    };\n  }\n\n  async searchUsers(\n    searchTerm: string, \n    tenantId?: string, \n    pagination?: PaginationOptions\n  ): Promise<UserListResult> {\n    const conditions = [\n      eq(schema.users.isActive, true),\n      or(\n        like(schema.users.firstName, `%${searchTerm}%`),\n        like(schema.users.lastName, `%${searchTerm}%`),\n        like(schema.users.email, `%${searchTerm}%`),\n        like(schema.users.position, `%${searchTerm}%`)\n      )\n    ];\n\n    if (tenantId) {\n      conditions.push(eq(schema.users.tenantId, tenantId));\n    }\n\n    // Count total results\n    const totalResult = await db\n      .select({ count: count() })\n      .from(schema.users)\n      .where(and(...conditions));\n\n    const total = totalResult[0]?.count || 0;\n\n    if (!pagination) {\n      const userResults = await db\n        .select()\n        .from(schema.users)\n        .where(and(...conditions))\n        .orderBy(asc(schema.users.firstName));\n\n      return {\n        users: userResults.map(u => this.mapToUser(u)!),\n        total,\n        page: 1,\n        totalPages: 1\n      };\n    }\n\n    // Calculate offset\n    const offset = (pagination.page - 1) * pagination.limit;\n\n    // Fetch paginated results\n    const userResults = await db\n      .select()\n      .from(schema.users)\n      .where(and(...conditions))\n      .orderBy(asc(schema.users.firstName))\n      .limit(pagination.limit)\n      .offset(offset);\n\n    const totalPages = Math.ceil(total / pagination.limit);\n\n    return {\n      users: userResults.map(u => this.mapToUser(u)!),\n      total,\n      page: pagination.page,\n      totalPages\n    };\n  }\n\n  async updateLoginStats(id: string, stats: { lastLoginAt: Date; loginCount: number }): Promise<void> {\n    await db\n      .update(schema.users)\n      .set({\n        lastLoginAt: stats.lastLoginAt,\n        loginCount: stats.loginCount,\n        updatedAt: new Date()\n      })\n      .where(eq(schema.users.id, id));\n  }\n\n  async findByDepartment(department: string, tenantId: string): Promise<User[]> {\n    // This would require a proper department table and relationship\n    // For now, return empty array or implement based on your schema\n    return [];\n  }\n\n  async bulkUpdate(ids: string[], updates: Partial<User>): Promise<User[]> {\n    const updateData: any = {\n      updatedAt: new Date()\n    };\n\n    // Map domain fields to schema fields (same as in update method)\n    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;\n    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;\n    if (updates.role !== undefined) updateData.role = updates.role;\n    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;\n\n    const result = await db\n      .update(schema.users)\n      .set(updateData)\n      .where(\n        and(\n          inArray(schema.users.id, ids),\n          eq(schema.users.isActive, true)\n        )\n      )\n      .returning();\n\n    return result.map(u => this.mapToUser(u)!);\n  }\n\n  async emailExists(email: string, excludeId?: string): Promise<boolean> {\n    const conditions = [eq(schema.users.email, email)];\n\n    if (excludeId) {\n      conditions.push(eq(schema.users.id, excludeId));\n    }\n\n    const result = await db\n      .select({ count: count() })\n      .from(schema.users)\n      .where(and(...conditions));\n\n    return (result[0]?.count || 0) > 0;\n  }\n\n  async findUsersForNotification(tenantId: string): Promise<User[]> {\n    const result = await db\n      .select()\n      .from(schema.users)\n      .where(\n        and(\n          eq(schema.users.tenantId, tenantId),\n          eq(schema.users.isActive, true)\n          // Add email filter if needed\n        )\n      );\n\n    return result.map(u => this.mapToUser(u)!);\n  }\n\n  async findTenantAdmins(tenantId: string): Promise<User[]> {\n    const result = await db\n      .select()\n      .from(schema.users)\n      .where(\n        and(\n          eq(schema.users.tenantId, tenantId),\n          eq(schema.users.role, 'tenant_admin'),\n          eq(schema.users.isActive, true)\n        )\n      );\n\n    return result.map(u => this.mapToUser(u)!);\n  }\n\n  async findSaasAdmins(): Promise<User[]> {\n    const result = await db\n      .select()\n      .from(schema.users)\n      .where(\n        and(\n          eq(schema.users.role, 'saas_admin'),\n          eq(schema.users.isActive, true)\n        )\n      );\n\n    return result.map(u => this.mapToUser(u)!);\n  }\n\n  private mapToUser(dbUser: any): User | null {\n    if (!dbUser) return null;\n\n    return {\n      id: dbUser.id,\n      tenantId: dbUser.tenantId,\n      email: dbUser.email,\n      firstName: dbUser.firstName || '',\n      lastName: dbUser.lastName || '',\n      role: dbUser.role,\n      employmentType: dbUser.employmentType,\n      isActive: dbUser.isActive,\n\n      // Profile information - mapping from schema columns\n      phoneNumber: dbUser.phone,\n      position: dbUser.position,\n      department: undefined, // Would need department table lookup\n      avatar: dbUser.profileImageUrl,\n\n      // Preferences  \n      language: 'pt-BR', // Would need additional schema column\n      timezone: dbUser.timeZone || 'America/Sao_Paulo',\n      theme: undefined, // Would need additional schema column\n\n      // Authentication\n      passwordHash: dbUser.passwordHash,\n      lastLoginAt: dbUser.lastLoginAt,\n      loginCount: 0, // Login count not tracked in current schema\n\n      // Audit fields\n      createdAt: dbUser.createdAt,\n      updatedAt: dbUser.updatedAt,\n      createdById: undefined, // Would need additional schema column\n      updatedById: undefined  // Would need additional schema column\n    };\n  }\n}\n"}
]
```/**
 * INFRASTRUCTURE LAYER - DRIZZLE USER REPOSITORY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { eq, and, or, like, gte, lte, inArray, desc, asc, count, isNull, sql } from 'drizzle-orm';
import { db } from '../../../../db';
import { users as schema } from '@shared/schema'; // Renamed import to avoid conflict
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
          id, name, email, password_hash as "passwordHash", role, position,
          department, phone, avatar_url as "avatarUrl", is_active as "isActive",
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

  async findByTenantId(tenantId: string): Promise<User[]> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.tenantId, tenantId));

    return users.map(this.mapToEntity);
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    try {
      const users = await db
        .select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.email, email),
            eq(schema.users.tenantId, tenantId)
          )
        )
        .limit(1);

      return users.length > 0 ? this.mapToEntity(users[0]) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async findByRole(role: string, tenantId?: string): Promise<User[]> {
    const conditions = [
      eq(schema.users.role, role),
      eq(schema.users.isActive, true)
    ];

    if (tenantId) {
      conditions.push(eq(schema.users.tenantId, tenantId));
    }

    const result = await db
      .select()
      .from(schema.users)
      .where(and(...conditions))
      .orderBy(asc(schema.users.firstName));

    return result.map(u => this.mapToUser(u)!);
  }

  async findByEmploymentType(employmentType: string, tenantId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.employmentType, employmentType),
          eq(schema.users.tenantId, tenantId),
          eq(schema.users.isActive, true)
        )
      )
      .orderBy(asc(schema.users.firstName));

    return result.map(u => this.mapToUser(u)!);
  }

  async countByFilters(filters: UserFilters, tenantId?: string): Promise<number> {
    const conditions = [eq(schema.users.isActive, true)];

    if (tenantId) {
      conditions.push(eq(schema.users.tenantId, tenantId));
    }

    // Apply same filters as findByFilters
    if (filters.role?.length) {
      conditions.push(inArray(schema.users.role, filters.role));
    }

    if (filters.employmentType?.length) {
      conditions.push(inArray(schema.users.employmentType, filters.employmentType));
    }

    if (filters.isActive !== undefined) {
      conditions[0] = eq(schema.users.isActive, filters.isActive);
    }

    if (filters.search) {
      conditions.push(
        or(
          like(schema.users.firstName, `%${filters.search}%`),
          like(schema.users.lastName, `%${filters.search}%`),
          like(schema.users.email, `%${filters.search}%`)
        )
      );
    }

    const result = await db
      .select({ count: count() })
      .from(schema.users)
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
      conditions.push(eq(schema.users.tenantId, tenantId));
    }

    // Get basic statistics
    const totalResult = await db
      .select({ count: count() })
      .from(schema.users)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const activeResult = await db
      .select({ count: count() })
      .from(schema.users)
      .where(
        conditions.length > 0 
          ? and(...conditions, eq(schema.users.isActive, true))
          : eq(schema.users.isActive, true)
      );

    const inactiveResult = await db
      .select({ count: count() })
      .from(schema.users)
      .where(
        conditions.length > 0 
          ? and(...conditions, eq(schema.users.isActive, false))
          : eq(schema.users.isActive, false)
      );

    // Get recent logins (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentLoginsResult = await db
      .select({ count: count() })
      .from(schema.users)
      .where(
        conditions.length > 0 
          ? and(...conditions, gte(schema.users.lastLoginAt, thirtyDaysAgo))
          : gte(schema.users.lastLoginAt, thirtyDaysAgo)
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
      eq(schema.users.isActive, true),
      or(
        like(schema.users.firstName, `%${searchTerm}%`),
        like(schema.users.lastName, `%${searchTerm}%`),
        like(schema.users.email, `%${searchTerm}%`),
        like(schema.users.position, `%${searchTerm}%`)
      )
    ];

    if (tenantId) {
      conditions.push(eq(schema.users.tenantId, tenantId));
    }

    // Count total results
    const totalResult = await db
      .select({ count: count() })
      .from(schema.users)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    if (!pagination) {
      const userResults = await db
        .select()
        .from(schema.users)
        .where(and(...conditions))
        .orderBy(asc(schema.users.firstName));

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
      .from(schema.users)
      .where(and(...conditions))
      .orderBy(asc(schema.users.firstName))
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
      .update(schema.users)
      .set({
        lastLoginAt: stats.lastLoginAt,
        loginCount: stats.loginCount,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, id));
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
      .update(schema.users)
      .set(updateData)
      .where(
        and(
          inArray(schema.users.id, ids),
          eq(schema.users.isActive, true)
        )
      )
      .returning();

    return result.map(u => this.mapToUser(u)!);
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const conditions = [eq(schema.users.email, email)];

    if (excludeId) {
      conditions.push(eq(schema.users.id, excludeId));
    }

    const result = await db
      .select({ count: count() })
      .from(schema.users)
      .where(and(...conditions));

    return (result[0]?.count || 0) > 0;
  }

  async findUsersForNotification(tenantId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.tenantId, tenantId),
          eq(schema.users.isActive, true)
          // Add email filter if needed
        )
      );

    return result.map(u => this.mapToUser(u)!);
  }

  async findTenantAdmins(tenantId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.tenantId, tenantId),
          eq(schema.users.role, 'tenant_admin'),
          eq(schema.users.isActive, true)
        )
      );

    return result.map(u => this.mapToUser(u)!);
  }

  async findSaasAdmins(): Promise<User[]> {
    const result = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.role, 'saas_admin'),
          eq(schema.users.isActive, true)
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
[
  {"file_path": "/home/runner/work/automacao-api/automacao-api/src/infra/repositories/DrizzleUserRepository.ts", "content": "/**\n * INFRASTRUCTURE LAYER - DRIZZLE USER REPOSITORY\n * Seguindo Clean Architecture - 1qa.md compliance\n */\n\nimport { eq, and, or, like, gte, lte, inArray, desc, asc, count, isNull, sql } from 'drizzle-orm';\nimport { db } from '../../../../db';\nimport { users as schema } from '@shared/schema'; // Renamed import to avoid conflict\nimport { User } from '../../domain/entities/User';\nimport { \n  IUserRepository, \n  UserFilters, \n  PaginationOptions, \n  UserListResult \n} from '../../domain/repositories/IUserRepository';\n\nexport class DrizzleUserRepository implements IUserRepository {\n\n  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use findByIdAndTenant instead\n  async findById(id: string): Promise<User | null> {\n    throw new Error('1QA.MD VIOLATION: findById without tenant context is not allowed. Use findByIdAndTenant instead.');\n  }\n\n  // ✅ 1QA.MD: Find user by ID using tenant schema\n  async findByIdAndTenant(id: string, tenantId: string): Promise<User | null> {\n    try {\n      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;\n      console.log('[USER-REPOSITORY-QA] Finding user by ID for schema:', tenantSchema);\n\n      const result = await db.execute(sql`\n        SELECT \n          id, name, email, password_hash as \"passwordHash\", role, position,\n          department, phone, avatar_url as \"avatarUrl\", is_active as \"isActive\",\n          tenant_id as \"tenantId\", created_at as \"createdAt\", updated_at as \"updatedAt\"\n        FROM ${sql.identifier(tenantSchema)}.users\n        WHERE id = ${id} AND tenant_id = ${tenantId} AND is_active = true\n        LIMIT 1\n      `);\n\n      return result.rows[0] ? this.mapToUser(result.rows[0] as any) : null;\n    } catch (error) {\n      console.error('[USER-REPOSITORY-QA] Error finding user by ID:', error);\n      throw error;\n    }\n  }\n\n  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use findByEmailAndTenant instead\n  async findByEmail(email: string): Promise<User | null> {\n    throw new Error('1QA.MD VIOLATION: findByEmail without tenant context is not allowed. Use findByEmailAndTenant instead.');\n  }\n\n  // ✅ 1QA.MD: Special authentication method - Find user by email for login (searches across tenants)\n  async findByEmailForAuth(email: string): Promise<User | null> {\n    try {\n      console.log('[USER-REPOSITORY-AUTH] Finding user by email for authentication:', email);\n\n      // Use the public users table for authentication lookups\n      const result = await db.execute(sql`\n        SELECT \n          id, email, password_hash as \"passwordHash\", first_name as \"firstName\",\n          last_name as \"lastName\", role, tenant_id as \"tenantId\", is_active as \"isActive\",\n          employment_type as \"employmentType\", \n          last_login_at as \"lastLoginAt\", created_at as \"createdAt\", updated_at as \"updatedAt\"\n        FROM users\n        WHERE email = ${email.toLowerCase().trim()} AND is_active = true\n        LIMIT 1\n      `);\n\n      return result.rows[0] ? this.mapToUser(result.rows[0] as any) : null;\n    } catch (error) {\n      console.error('[USER-REPOSITORY-AUTH] Error finding user by email for auth:', error);\n      throw error;\n    }\n  }\n\n  // ✅ 1QA.MD: Find user by email using tenant schema\n  async findByEmailAndTenant(email: string, tenantId: string): Promise<User | null> {\n    try {\n      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;\n      console.log('[USER-REPOSITORY-QA] Finding user by email for schema:', tenantSchema);\n\n      const result = await db.execute(sql`\n        SELECT \n          id, name, email, password_hash as \"passwordHash\", role, position,\n          department, phone, avatar_url as \"avatarUrl\", is_active as \"isActive\",\n          tenant_id as \"tenantId\", created_at as \"createdAt\", updated_at as \"updatedAt\"\n        FROM ${sql.identifier(tenantSchema)}.users\n        WHERE email = ${email} AND tenant_id = ${tenantId} AND is_active = true\n        LIMIT 1\n      `);\n\n      return result.rows[0] ? this.mapToUser(result.rows[0] as any) : null;\n    } catch (error) {\n      console.error('[USER-REPOSITORY-QA] Error finding user by email:', error);\n      throw error;\n    }\n  }\n\n  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use createWithTenant instead\n  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {\n    throw new Error('1QA.MD VIOLATION: create without tenant context is not allowed. Use createWithTenant instead.');\n  }\n\n  // ✅ 1QA.MD: Create user using tenant schema\n  async createWithTenant(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<User> {\n    try {\n      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;\n      console.log('[USER-REPOSITORY-QA] Creating user for schema:', tenantSchema);\n\n      const now = new Date();\n      const result = await db.execute(sql`\n        INSERT INTO ${sql.identifier(tenantSchema)}.users (\n          tenant_id, name, email, password_hash, role, position,\n          department, phone, avatar_url, is_active, created_at, updated_at\n        )\n        VALUES (\n          ${tenantId}, ${userData.name || ''}, ${userData.email}, ${userData.passwordHash},\n          ${userData.role}, ${userData.position || ''}, ${userData.department || ''},\n          ${userData.phoneNumber || ''}, ${userData.avatar || ''}, \n          ${userData.isActive !== false}, ${now}, ${now}\n        )\n        RETURNING \n          id, name, email, password_hash as \"passwordHash\", role, position,\n          department, phone, avatar_url as \"avatarUrl\", is_active as \"isActive\",\n          tenant_id as \"tenantId\", created_at as \"createdAt\", updated_at as \"updatedAt\"\n      `);\n\n      return this.mapToUser(result.rows[0] as any)!;\n    } catch (error) {\n      console.error('[USER-REPOSITORY-QA] Error creating user:', error);\n      throw error;\n    }\n  }\n\n  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use updateWithTenant instead\n  async update(id: string, updates: Partial<User>): Promise<User> {\n    throw new Error('1QA.MD VIOLATION: update without tenant context is not allowed. Use updateWithTenant instead.');\n  }\n\n  // ✅ 1QA.MD: Update user using tenant schema\n  async updateWithTenant(id: string, updates: Partial<User>, tenantId: string): Promise<User> {\n    try {\n      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;\n      console.log('[USER-REPOSITORY-QA] Updating user for schema:', tenantSchema);\n\n      const now = new Date();\n      const result = await db.execute(sql`\n        UPDATE ${sql.identifier(tenantSchema)}.users\n        SET \n          name = COALESCE(${updates.name}, name),\n          email = COALESCE(${updates.email}, email),\n          password_hash = COALESCE(${updates.passwordHash}, password_hash),\n          role = COALESCE(${updates.role}, role),\n          position = COALESCE(${updates.position}, position),\n          department = COALESCE(${updates.department}, department),\n          phone = COALESCE(${updates.phoneNumber}, phone),\n          avatar_url = COALESCE(${updates.avatar}, avatar_url),\n          is_active = COALESCE(${updates.isActive}, is_active),\n          updated_at = ${now}\n        WHERE id = ${id} AND tenant_id = ${tenantId}\n        RETURNING \n          id, name, email, password_hash as \"passwordHash\", role, position,\n          department, phone, avatar_url as \"avatarUrl\", is_active as \"isActive\",\n          tenant_id as \"tenantId\", created_at as \"createdAt\", updated_at as \"updatedAt\"\n      `);\n\n      if (!result.rows[0]) {\n        throw new Error('User not found or already deleted');\n      }\n\n      return this.mapToUser(result.rows[0] as any)!;\n    } catch (error) {\n      console.error('[USER-REPOSITORY-QA] Error updating user:', error);\n      throw error;\n    }\n  }\n\n  // ❌ 1QA.MD VIOLATION - Method without tenant context - Use deleteWithTenant instead\n  async delete(id: string): Promise<void> {\n    throw new Error('1QA.MD VIOLATION: delete without tenant context is not allowed. Use deleteWithTenant instead.');\n  }\n\n  // ✅ 1QA.MD: Delete user using tenant schema\n  async deleteWithTenant(id: string, tenantId: string): Promise<void> {\n    try {\n      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;\n      console.log('[USER-REPOSITORY-QA] Deleting user for schema:', tenantSchema);\n\n      const now = new Date();\n      const result = await db.execute(sql`\n        UPDATE ${sql.identifier(tenantSchema)}.users\n        SET is_active = false, updated_at = ${now}\n        WHERE id = ${id} AND tenant_id = ${tenantId}\n      `);\n\n      if (result.rowCount === 0) {\n        throw new Error('User not found');\n      }\n    } catch (error) {\n      console.error('[USER-REPOSITORY-QA] Error deleting user:', error);\n      throw error;\n    }\n  }\n\n  // ✅ 1QA.MD: Find users with filters using tenant schema\n  async findByFilters(\n    filters: UserFilters, \n    pagination: PaginationOptions, \n    tenantId: string\n  ): Promise<UserListResult> {\n    try {\n      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;\n      console.log('[USER-REPOSITORY-QA] Finding users with filters for schema:', tenantSchema);\n\n      // Build search conditions\n      let whereClause = 'WHERE tenant_id = $1 AND is_active = true';\n      const params: any[] = [tenantId];\n      let paramIndex = 2;\n\n      if (filters.search) {\n        whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR position ILIKE $${paramIndex})`;\n        params.push(`%${filters.search}%`);\n        paramIndex++;\n      }\n\n      if (filters.role?.length) {\n        whereClause += ` AND role = ANY($${paramIndex})`;\n        params.push(filters.role);\n        paramIndex++;\n      }\n\n      // Count total\n      const countResult = await db.execute(sql`\n        SELECT COUNT(*) as count\n        FROM ${sql.identifier(tenantSchema)}.users\n        ${sql.raw(whereClause)}\n      `);\n\n      const total = parseInt(countResult.rows[0]?.count as string) || 0;\n      const offset = (pagination.page - 1) * pagination.limit;\n      const totalPages = Math.ceil(total / pagination.limit);\n\n      // Fetch results\n      const result = await db.execute(sql`\n        SELECT \n          id, name, email, password_hash as \"passwordHash\", role, position,\n          department, phone, avatar_url as \"avatarUrl\", is_active as \"isActive\",\n          tenant_id as \"tenantId\", created_at as \"createdAt\", updated_at as \"updatedAt\"\n        FROM ${sql.identifier(tenantSchema)}.users\n        ${sql.raw(whereClause)}\n        ORDER BY name\n        LIMIT ${pagination.limit} OFFSET ${offset}\n      `);\n\n      return {\n        users: result.rows.map(u => this.mapToUser(u as any)!),\n        total,\n        page: pagination.page,\n        totalPages\n      };\n    } catch (error) {\n      console.error('[USER-REPOSITORY] Error in findByFilters:', error);\n      throw error;\n    }\n  }\n\n  async findByTenantId(tenantId: string): Promise<User[]> {\n    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;\n\n    const users = await db\n      .select()\n      .from(schema.users)\n      .where(eq(schema.users.tenantId, tenantId));\n\n    return users.map(this.mapToEntity);\n  }\n\n  async findByEmail(email: string, tenantId: string): Promise<User | null> {\n    try {\n      const users = await db\n        .select()\n        .from(schema.users)\n        .where(\n          and(\n            eq(schema.users.email, email),\n            eq(schema.users.tenantId, tenantId)\n          )\n        )\n        .limit(1);\n\n      return users.length > 0 ? this.mapToEntity(users[0]) : null;\n    } catch (error) {\n      console.error('Error finding user by email:', error);\n      return null;\n    }\n  }\n\n  async findByRole(role: string, tenantId?: string): Promise<User[]> {\n    const conditions = [\n      eq(schema.users.role, role),\n      eq(schema.users.isActive, true)\n    ];\n\n    if (tenantId) {\n      conditions.push(eq(schema.users.tenantId, tenantId));\n    }\n\n    const result = await db\n      .select()\n      .from(schema.users)\n      .where(and(...conditions))\n      .orderBy(asc(schema.users.firstName));\n\n    return result.map(u => this.mapToUser(u)!);\n  }\n\n  async findByEmploymentType(employmentType: string, tenantId: string): Promise<User[]> {\n    const result = await db\n      .select()\n      .from(schema.users)\n      .where(\n        and(\n          eq(schema.users.employmentType, employmentType),\n          eq(schema.users.tenantId, tenantId),\n          eq(schema.users.isActive, true)\n        )\n      )\n      .orderBy(asc(schema.users.firstName));\n\n    return result.map(u => this.mapToUser(u)!);\n  }\n\n  async countByFilters(filters: UserFilters, tenantId?: string): Promise<number> {\n    const conditions = [eq(schema.users.isActive, true)];\n\n    if (tenantId) {\n      conditions.push(eq(schema.users.tenantId, tenantId));\n    }\n\n    // Apply same filters as findByFilters\n    if (filters.role?.length) {\n      conditions.push(inArray(schema.users.role, filters.role));\n    }\n\n    if (filters.employmentType?.length) {\n      conditions.push(inArray(schema.users.employmentType, filters.employmentType));\n    }\n\n    if (filters.isActive !== undefined) {\n      conditions[0] = eq(schema.users.isActive, filters.isActive);\n    }\n\n    if (filters.search) {\n      conditions.push(\n        or(\n          like(schema.users.firstName, `%${filters.search}%`),\n          like(schema.users.lastName, `%${filters.search}%`),\n          like(schema.users.email, `%${filters.search}%`)\n        )\n      );\n    }\n\n    const result = await db\n      .select({ count: count() })\n      .from(schema.users)\n      .where(and(...conditions));\n\n    return result[0]?.count || 0;\n  }\n\n  async getStatistics(tenantId?: string): Promise<{ \n    total: number;\n    active: number;\n    inactive: number;\n    byRole: Record<string, number>;\n    byEmploymentType: Record<string, number>;\n    recentLogins: number;\n  }> {\n    const conditions = [];\n    if (tenantId) {\n      conditions.push(eq(schema.users.tenantId, tenantId));\n    }\n\n    // Get basic statistics\n    const totalResult = await db\n      .select({ count: count() })\n      .from(schema.users)\n      .where(conditions.length > 0 ? and(...conditions) : undefined);\n\n    const activeResult = await db\n      .select({ count: count() })\n      .from(schema.users)\n      .where(\n        conditions.length > 0 \n          ? and(...conditions, eq(schema.users.isActive, true))\n          : eq(schema.users.isActive, true)\n      );\n\n    const inactiveResult = await db\n      .select({ count: count() })\n      .from(schema.users)\n      .where(\n        conditions.length > 0 \n          ? and(...conditions, eq(schema.users.isActive, false))\n          : eq(schema.users.isActive, false)\n      );\n\n    // Get recent logins (last 30 days)\n    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);\n    const recentLoginsResult = await db\n      .select({ count: count() })\n      .from(schema.users)\n      .where(\n        conditions.length > 0 \n          ? and(...conditions, gte(schema.users.lastLoginAt, thirtyDaysAgo))\n          : gte(schema.users.lastLoginAt, thirtyDaysAgo)\n      );\n\n    const total = totalResult[0]?.count || 0;\n    const active = activeResult[0]?.count || 0;\n    const inactive = inactiveResult[0]?.count || 0;\n    const recentLogins = recentLoginsResult[0]?.count || 0;\n\n    // For role and employment type statistics, we'd need more sophisticated queries\n    // This is a simplified version\n    const byRole: Record<string, number> = {};\n    const byEmploymentType: Record<string, number> = {};\n\n    return {\n      total,\n      active,\n      inactive,\n      byRole,\n      byEmploymentType,\n      recentLogins\n    };\n  }\n\n  async searchUsers(\n    searchTerm: string, \n    tenantId?: string, \n    pagination?: PaginationOptions\n  ): Promise<UserListResult> {\n    const conditions = [\n      eq(schema.users.isActive, true),\n      or(\n        like(schema.users.firstName, `%${searchTerm}%`),\n        like(schema.users.lastName, `%${searchTerm}%`),\n        like(schema.users.email, `%${searchTerm}%`),\n        like(schema.users.position, `%${searchTerm}%`)\n      )\n    ];\n\n    if (tenantId) {\n      conditions.push(eq(schema.users.tenantId, tenantId));\n    }\n\n    // Count total results\n    const totalResult = await db\n      .select({ count: count() })\n      .from(schema.users)\n      .where(and(...conditions));\n\n    const total = totalResult[0]?.count || 0;\n\n    if (!pagination) {\n      const userResults = await db\n        .select()\n        .from(schema.users)\n        .where(and(...conditions))\n        .orderBy(asc(schema.users.firstName));\n\n      return {\n        users: userResults.map(u => this.mapToUser(u)!),\n        total,\n        page: 1,\n        totalPages: 1\n      };\n    }\n\n    // Calculate offset\n    const offset = (pagination.page - 1) * pagination.limit;\n\n    // Fetch paginated results\n    const userResults = await db\n      .select()\n      .from(schema.users)\n      .where(and(...conditions))\n      .orderBy(asc(schema.users.firstName))\n      .limit(pagination.limit)\n      .offset(offset);\n\n    const totalPages = Math.ceil(total / pagination.limit);\n\n    return {\n      users: userResults.map(u => this.mapToUser(u)!),\n      total,\n      page: pagination.page,\n      totalPages\n    };\n  }\n\n  async updateLoginStats(id: string, stats: { lastLoginAt: Date; loginCount: number }): Promise<void> {\n    await db\n      .update(schema.users)\n      .set({\n        lastLoginAt: stats.lastLoginAt,\n        loginCount: stats.loginCount,\n        updatedAt: new Date()\n      })\n      .where(eq(schema.users.id, id));\n  }\n\n  async findByDepartment(department: string, tenantId: string): Promise<User[]> {\n    // This would require a proper department table and relationship\n    // For now, return empty array or implement based on your schema\n    return [];\n  }\n\n  async bulkUpdate(ids: string[], updates: Partial<User>): Promise<User[]> {\n    const updateData: any = {\n      updatedAt: new Date()\n    };\n\n    // Map domain fields to schema fields (same as in update method)\n    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;\n    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;\n    if (updates.role !== undefined) updateData.role = updates.role;\n    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;\n\n    const result = await db\n      .update(schema.users)\n      .set(updateData)\n      .where(\n        and(\n          inArray(schema.users.id, ids),\n          eq(schema.users.isActive, true)\n        )\n      )\n      .returning();\n\n    return result.map(u => this.mapToUser(u)!);\n  }\n\n  async emailExists(email: string, excludeId?: string): Promise<boolean> {\n    const conditions = [eq(schema.users.email, email)];\n\n    if (excludeId) {\n      conditions.push(eq(schema.users.id, excludeId));\n    }\n\n    const result = await db\n      .select({ count: count() })\n      .from(schema.users)\n      .where(and(...conditions));\n\n    return (result[0]?.count || 0) > 0;\n  }\n\n  async findUsersForNotification(tenantId: string): Promise<User[]> {\n    const result = await db\n      .select()\n      .from(schema.users)\n      .where(\n        and(\n          eq(schema.users.tenantId, tenantId),\n          eq(schema.users.isActive, true)\n          // Add email filter if needed\n        )\n      );\n\n    return result.map(u => this.mapToUser(u)!);\n  }\n\n  async findTenantAdmins(tenantId: string): Promise<User[]> {\n    const result = await db\n      .select()\n      .from(schema.users)\n      .where(\n        and(\n          eq(schema.users.tenantId, tenantId),\n          eq(schema.users.role, 'tenant_admin'),\n          eq(schema.users.isActive, true)\n        )\n      );\n\n    return result.map(u => this.mapToUser(u)!);\n  }\n\n  async findSaasAdmins(): Promise<User[]> {\n    const result = await db\n      .select()\n      .from(schema.users)\n      .where(\n        and(\n          eq(schema.users.role, 'saas_admin'),\n          eq(schema.users.isActive, true)\n        )\n      );\n\n    return result.map(u => this.mapToUser(u)!);\n  }\n\n  private mapToUser(dbUser: any): User | null {\n    if (!dbUser) return null;\n\n    return {\n      id: dbUser.id,\n      tenantId: dbUser.tenantId,\n      email: dbUser.email,\n      firstName: dbUser.firstName || '',\n      lastName: dbUser.lastName || '',\n      role: dbUser.role,\n      employmentType: dbUser.employmentType,\n      isActive: dbUser.isActive,\n\n      // Profile information - mapping from schema columns\n      phoneNumber: dbUser.phone,\n      position: dbUser.position,\n      department: undefined, // Would need department table lookup\n      avatar: dbUser.profileImageUrl,\n\n      // Preferences  \n      language: 'pt-BR', // Would need additional schema column\n      timezone: dbUser.timeZone || 'America/Sao_Paulo',\n      theme: undefined, // Would need additional schema column\n\n      // Authentication\n      passwordHash: dbUser.passwordHash,\n      lastLoginAt: dbUser.lastLoginAt,\n      loginCount: 0, // Login count not tracked in current schema\n\n      // Audit fields\n      createdAt: dbUser.createdAt,\n      updatedAt: dbUser.updatedAt,\n      createdById: undefined, // Would need additional schema column\n      updatedById: undefined  // Would need additional schema column\n    };\n  }\n}\n"}
]