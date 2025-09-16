// ✅ 1QA.MD COMPLIANCE: USER REPOSITORY PADRONIZADO
import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { db, sql, users } from '@shared/schema';
import { eq, desc, count, and } from "drizzle-orm";
import { logError } from "../../utils/logger";

export class UserRepository implements IUserRepository {

  async findById(id: string): Promise<User | null> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Sempre incluir isActive check
      const [userData] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, id),
            eq(users.isActive, true)
          )
        );

      if (!userData) return null;

      // ✅ 1QA.MD COMPLIANCE: User entity creation with proper type safety and avatar mapping
      const user = new User(
        userData.id,
        userData.email!,
        userData.passwordHash!,
        userData.firstName || null,
        userData.lastName || null,
        userData.role as any,
        userData.tenantId,
        // ✅ Map both profileImageUrl and avatar fields for compatibility
        userData.profileImageUrl || userData.avatar || null,
        userData.isActive ?? true,
        userData.lastLoginAt || null,
        userData.createdAt || new Date(),
        userData.updatedAt || new Date(),
        userData.employmentType as 'clt' | 'autonomo' || 'clt'
      );

      return user;
    } catch (error) {
      logError('Error finding user by ID', error, { userId: id });
      return null;
    }
  }

  async findByIdAndTenant(id: string, tenantId: string | null): Promise<User | null> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Use tenant-aware method for authentication
      const whereConditions = [
        eq(users.id, id),
        eq(users.isActive, true)
      ];

      // Add tenant filter if tenantId is provided
      if (tenantId) {
        whereConditions.push(eq(users.tenantId, tenantId));
      }

      const [userData] = await db
        .select()
        .from(users)
        .where(and(...whereConditions));

      if (!userData) return null;

      const user = new User(
        userData.id,
        userData.email!,
        userData.passwordHash!,
        userData.firstName || null,
        userData.lastName || null,
        userData.role as any,
        userData.tenantId,
        userData.profileImageUrl || userData.avatar || null,
        userData.isActive ?? true,
        userData.lastLoginAt || null,
        userData.createdAt || new Date(),
        userData.updatedAt || new Date(),
        userData.employmentType as 'clt' | 'autonomo' || 'clt'
      );

      return user;
    } catch (error) {
      logError('Error finding user by ID and tenant', error, { userId: id, tenantId });
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()));

      if (!userData) return null;

      return new User(
        userData.id,
        userData.email!,
        userData.passwordHash!,
        userData.firstName,
        userData.lastName,
        userData.role as any,
        userData.tenantId,
        userData.profileImageUrl,
        userData.isActive ?? true,
        userData.lastLoginAt,
        userData.createdAt || new Date(),
        userData.updatedAt || new Date(),
        userData.employmentType as 'clt' | 'autonomo' || 'clt'
      );
    } catch (error) {
      logError('Error finding user by email', error, { email: email.toLowerCase() });
      return null;
    }
  }

  async findByEmailForAuth(email: string): Promise<User | null> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Special method for authentication - includes inactive users
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()));

      if (!userData) return null;

      return new User(
        userData.id,
        userData.email!,
        userData.passwordHash!,
        userData.firstName,
        userData.lastName,
        userData.role as any,
        userData.tenantId,
        userData.profileImageUrl,
        userData.isActive ?? true,
        userData.lastLoginAt,
        userData.createdAt || new Date(),
        userData.updatedAt || new Date(),
        userData.employmentType as 'clt' | 'autonomo' || 'clt'
      );
    } catch (error) {
      logError('Error finding user by email for auth', error, { email: email.toLowerCase() });
      return null;
    }
  }

  async findByTenant(tenantId: string, options?: { page?: number; limit?: number }): Promise<User[]> {
    const limit = options?.limit || 50;
    const offset = options?.page ? (options.page - 1) * limit : 0;
    try {
      const userData = await db
        .select()
        .from(users)
        .where(eq(users.tenantId, tenantId))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt));

      return userData.map(data => new User(
        data.id,
        data.email!,
        data.passwordHash!,
        data.firstName,
        data.lastName,
        data.role as any,
        data.tenantId,
        data.profileImageUrl,
        data.isActive ?? true,
        data.lastLoginAt,
        data.createdAt || new Date(),
        data.updatedAt || new Date(),
        data.employmentType as 'clt' | 'autonomo' || 'clt'
      ));
    } catch (error) {
      logError('Error finding users by tenant', error, { tenantId, limit, offset });
      return [];
    }
  }

  async save(user: User): Promise<User> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Correct insert schema without id
      const [savedData] = await db
        .insert(users)
        .values({
          email: user.email,
          passwordHash: user.passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
          profileImageUrl: user.profileImageUrl,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          employmentType: user.employmentType
        })
        .returning();

      return new User(
        savedData.id,
        savedData.email!,
        savedData.passwordHash!,
        savedData.firstName,
        savedData.lastName,
        savedData.role as any,
        savedData.tenantId,
        savedData.profileImageUrl,
        savedData.isActive ?? true,
        savedData.lastLoginAt,
        savedData.createdAt || new Date(),
        savedData.updatedAt || new Date(),
        savedData.employmentType as 'clt' | 'autonomo' || 'clt'
      );
    } catch (error) {
      logError('Error saving user', error, { userId: user.id, email: user.email });
      throw new Error('Failed to save user');
    }
  }

  async update(user: User): Promise<User> {
    try {
      // ✅ 1QA.MD COMPLIANCE: Correct update schema with proper null handling
      const [updatedData] = await db
        .update(users)
        .set({
          email: user.email,
          passwordHash: user.passwordHash,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          role: user.role,
          tenantId: user.tenantId,
          profileImageUrl: user.profileImageUrl || null,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt || null,
          employmentType: user.employmentType,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id))
        .returning();

      return new User(
        updatedData.id,
        updatedData.email!,
        updatedData.passwordHash!,
        updatedData.firstName,
        updatedData.lastName,
        updatedData.role as any,
        updatedData.tenantId,
        updatedData.profileImageUrl,
        updatedData.isActive ?? true,
        updatedData.lastLoginAt,
        updatedData.createdAt || new Date(),
        updatedData.updatedAt || new Date(),
        updatedData.employmentType as 'clt' | 'autonomo' || 'clt'
      );
    } catch (error) {
      logError('Error updating user', error, { userId: user.id });
      throw new Error('Failed to update user');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await db
        .delete(users)
        .where(eq(users.id, id));

      return true;
    } catch (error) {
      logError('Error deleting user', error, { userId: id });
      return false;
    }
  }

  async findAll(options?: { page?: number; limit?: number }): Promise<User[]> {
    const limit = options?.limit || 50;
    const offset = options?.page ? (options.page - 1) * limit : 0;

    try {
      const userData = await db
        .select()
        .from(users)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt));

      return userData.map(data => new User(
        data.id,
        data.email!,
        data.passwordHash!,
        data.firstName,
        data.lastName,
        data.role as any,
        data.tenantId,
        data.profileImageUrl,
        data.isActive ?? true,
        data.lastLoginAt,
        data.createdAt || new Date(),
        data.updatedAt || new Date(),
        data.employmentType as 'clt' | 'autonomo' || 'clt'
      ));
    } catch (error) {
      logError('Error finding all users', error, { limit, offset });
      return [];
    }
  }

  async create(userData: { email: string; passwordHash: string; firstName?: string; lastName?: string; role: string; tenantId?: string }): Promise<User> {
    try {
      const user = new User(
        crypto.randomUUID(),
        userData.email,
        userData.passwordHash,
        userData.firstName,
        userData.lastName,
        userData.role as any,
        userData.tenantId,
        undefined,
        true,
        undefined,
        new Date(),
        new Date()
      );

      return await this.save(user);
    } catch (error) {
      logError('Error creating user', error, { email: userData.email });
      throw new Error('Failed to create user');
    }
  }

  async countByTenant(tenantId: string): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.tenantId, tenantId));

      return result.count || 0;
    } catch (error) {
      logError('Error counting users by tenant', error, { tenantId });
      return 0;
    }
  }

  async findAllWithPagination(options: { limit: number; offset: number }): Promise<User[]> {
    const { limit, offset } = options;

    try {
      const userData = await db
        .select()
        .from(users)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt));

      return userData.map(data => new User(
        data.id,
        data.email!,
        data.passwordHash!,
        data.firstName,
        data.lastName,
        data.role as any,
        data.tenantId,
        data.profileImageUrl,
        data.isActive ?? true,
        data.lastLoginAt,
        data.createdAt || new Date(),
        data.updatedAt || new Date()
      ));
    } catch (error) {
      logError('Error finding users with pagination', error, { limit, offset });
      return [];
    }
  }

  async count(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(users);

      return result[0]?.count || 0;
    } catch (error) {
      logError('Error counting all users', error);
      return 0;
    }
  }

  async countActive(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.isActive, true));

      return result[0]?.count || 0;
    } catch (error) {
      logError('Error counting active users', error);
      return 0;
    }
  }
}