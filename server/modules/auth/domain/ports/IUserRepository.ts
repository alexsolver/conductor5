/**
 * User Repository Interface (Port)
 * Clean Architecture - Domain Layer
 */

import { User } from '../entities/User';

export interface UserFilter {
  tenantId?: string;
  role?: string;
  active?: boolean;
  verified?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByIdAndTenant(id: string, tenantId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findMany(filter: UserFilter): Promise<User[]>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<boolean>;
  count(filter: Omit<UserFilter, 'limit' | 'offset'>): Promise<number>;
  findByTenant(tenantId: string): Promise<User[]>;
  findAdmins(): Promise<User[]>;
}