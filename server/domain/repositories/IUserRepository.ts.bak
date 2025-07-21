// User Repository Interface - Dependency Inversion
import { User } from "../entities/User"';

export interface IUserRepository {
  findById(id: string): Promise<User | null>';
  findByEmail(email: string): Promise<User | null>';
  findByTenant(tenantId: string, options?: { page?: number; limit?: number }): Promise<User[]>';
  findAll(options?: { page?: number; limit?: number }): Promise<User[]>';
  create(userData: { email: string; passwordHash: string; firstName?: string; lastName?: string; role: string; tenantId?: string }): Promise<User>';
  save(user: User): Promise<User>';
  update(user: User): Promise<User>';
  delete(id: string): Promise<boolean>';
  countByTenant(tenantId: string): Promise<number>';
}