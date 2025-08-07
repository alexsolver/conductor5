
/**
 * Drizzle User Repository Implementation
 * Clean Architecture - Infrastructure Layer
 * Implements IUserRepository using Drizzle ORM
 */

import { eq, and, ilike, count, or, sql, desc } from 'drizzle-orm';
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { users } from '@shared/schema';
import { db } from '../../../../db';

interface UserFilter {
  tenantId?: string;
  role?: string;
  active?: boolean;
  verified?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export class DrizzleUserRepository implements IUserRepository {
  
  async findById(id: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomainEntity(result[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomainEntity(result[0]);
  }

  async findMany(filter: UserFilter): Promise<User[]> {
    const conditions = [];

    // Apply filters
    if (filter.tenantId) {
      conditions.push(eq(users.tenantId, filter.tenantId));
    }

    if (filter.role) {
      conditions.push(eq(users.role, filter.role));
    }

    if (filter.active !== undefined) {
      conditions.push(eq(users.active, filter.active));
    }

    if (filter.verified !== undefined) {
      conditions.push(eq(users.verified, filter.verified));
    }

    if (filter.search) {
      // Use parameterized search to prevent SQL injection
      const searchPattern = `%${filter.search.replace(/[%_]/g, '\\$&')}%`;
      conditions.push(
        or(
          ilike(users.email, searchPattern),
          ilike(users.firstName, searchPattern),
          ilike(users.lastName, searchPattern)
        )!
      );
    }

    let query = db
      .select()
      .from(users);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.offset(filter.offset);
    }

    const results = await query;
    return results.map(result => this.toDomainEntity(result));
  }

  async save(user: User): Promise<User> {
    const userData = this.toPersistenceData(user);

    // Check if user exists
    const existingUser = await this.findById(user.getId());

    if (existingUser) {
      // Update existing user
      const [updated] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.getId()))
        .returning();

      return this.toDomainEntity(updated);
    } else {
      // Insert new user
      const [inserted] = await db
        .insert(users)
        .values(userData)
        .returning();

      return this.toDomainEntity(inserted);
    }
  }

  async update(user: User): Promise<User> {
    return this.save(user); // Delegate to save method which handles update logic
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));

    return result.rowCount > 0;
  }

  async count(filter: Omit<UserFilter, 'limit' | 'offset'>): Promise<number> {
    const conditions = [];

    if (filter.tenantId) {
      conditions.push(eq(users.tenantId, filter.tenantId));
    }

    if (filter.role) {
      conditions.push(eq(users.role, filter.role));
    }

    if (filter.active !== undefined) {
      conditions.push(eq(users.active, filter.active));
    }

    if (filter.verified !== undefined) {
      conditions.push(eq(users.verified, filter.verified));
    }

    if (filter.search) {
      // Use parameterized search to prevent SQL injection
      const searchPattern = `%${filter.search.replace(/[%_]/g, '\\$&')}%`;
      conditions.push(
        or(
          ilike(users.email, searchPattern),
          ilike(users.firstName, searchPattern),
          ilike(users.lastName, searchPattern)
        )!
      );
    }

    let query = db
      .select({ count: count() })
      .from(users);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query;
    return result[0]?.count || 0;
  }

  async findByTenant(tenantId: string): Promise<User[]> {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.tenantId, tenantId));

    return results.map(result => this.toDomainEntity(result));
  }

  async findAdmins(): Promise<User[]> {
    const results = await db
      .select()
      .from(users)
      .where(or(
        eq(users.role, 'saas_admin'),
        eq(users.role, 'tenant_admin')
      )!);

    return results.map(result => this.toDomainEntity(result));
  }

  private toDomainEntity(data: any): User {
    return User.fromPersistence({
      id: data.id,
      email: data.email,
      password: data.passwordHash || data.password_hash, // Handle both field names
      firstName: data.firstName || data.first_name,
      lastName: data.lastName || data.last_name,
      role: data.role,
      tenantId: data.tenantId || data.tenant_id,
      active: data.isActive !== undefined ? data.isActive : (data.is_active !== undefined ? data.is_active : data.active),
      verified: data.verified || false,
      lastLogin: data.lastLoginAt || data.last_login_at || data.lastLogin,
      createdAt: data.createdAt || data.created_at || new Date(),
      updatedAt: data.updatedAt || data.updated_at || new Date()
    });
  }

  async findAll(options?: { page?: number; limit?: number }): Promise<User[]> {
    const limit = options?.limit || 50;
    const offset = options?.page ? (options.page - 1) * limit : 0;
    
    const results = await db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));

    return results.map(result => this.toDomainEntity(result));
  }

  async create(userData: { email: string; passwordHash: string; firstName?: string; lastName?: string; role: string; tenantId?: string }): Promise<User> {
    const user = User.fromPersistence({
      id: crypto.randomUUID(),
      email: userData.email,
      password: userData.passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      tenantId: userData.tenantId,
      active: true,
      verified: false,
      lastLogin: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return await this.save(user);
  }

  async countByTenant(tenantId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.tenantId, tenantId));
    
    return result[0]?.count || 0;
  }

  private toPersistenceData(user: User): any {
    return {
      id: user.getId(),
      email: user.getEmail(),
      passwordHash: user.getPasswordHash(), // Correct field name
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      role: user.getRole(),
      tenantId: user.getTenantId(),
      isActive: user.isActive(), // Correct field name
      verified: user.isVerified(),
      lastLoginAt: user.getLastLogin(), // Correct field name
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt()
    };
  }
}
