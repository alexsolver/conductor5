
import { User } from '../entities/User';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  update(id: string, updates: Partial<User>): Promise<void>;
}
