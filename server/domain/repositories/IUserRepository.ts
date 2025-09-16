// User Repository Interface - Dependency Inversion
import { User } from "../entities/User";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByIdAndTenant(id: string, tenantId: string | null): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailForAuth(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(): Promise<User[]>;
}