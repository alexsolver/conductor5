// User Repository Implementation
import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { db } from "../../db";
import { users } from "../../../shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export class UserRepository implements IUserRepository {
  
  async findById(id: string): Promise<User | null> {
    try {
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));

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
        userData.updatedAt || new Date()
      );
    } catch (error) {
      console.error('Error finding user by ID:', error);
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
        userData.updatedAt || new Date()
      );
    } catch (error) {
      console.error('Error finding user by email:', error);
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
        data.updatedAt || new Date()
      ));
    } catch (error) {
      console.error('Error finding users by tenant:', error);
      return [];
    }
  }

  async save(user: User): Promise<User> {
    try {
      const [savedData] = await db
        .insert(users)
        .values({
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
          profileImageUrl: user.profileImageUrl,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
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
        savedData.updatedAt || new Date()
      );
    } catch (error) {
      console.error('Error saving user:', error);
      throw new Error('Failed to save user');
    }
  }

  async update(user: User): Promise<User> {
    try {
      const [updatedData] = await db
        .update(users)
        .set({
          email: user.email,
          passwordHash: user.passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
          profileImageUrl: user.profileImageUrl,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
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
        updatedData.updatedAt || new Date()
      );
    } catch (error) {
      console.error('Error updating user:', error);
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
      console.error('Error deleting user:', error);
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
        data.updatedAt || new Date()
      ));
    } catch (error) {
      console.error('Error finding all users:', error);
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
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async countByTenant(tenantId: string): Promise<number> {
    try {
      const [result] = await db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(eq(users.tenantId, tenantId));

      return parseInt(result.count as string) || 0;
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }
}