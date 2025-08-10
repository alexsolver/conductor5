
import { User } from '../../domain/entities/User';

export interface IAuthApplicationRepository {
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  findById(id: string, tenantId: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(id: string, user: Partial<User>, tenantId: string): Promise<User | null>;
  validateCredentials(email: string, password: string, tenantId: string): Promise<User | null>;
}
