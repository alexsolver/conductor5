
import { UserSkill } from '../entities/UserSkill';

export interface IUserSkillRepository {
  findById(id: string, tenantId: string): Promise<UserSkill | null>;
  findByUserId(userId: string, tenantId: string): Promise<UserSkill[]>;
  findAll(tenantId: string): Promise<UserSkill[]>;
  create(entity: UserSkill): Promise<UserSkill>;
  update(id: string, entity: Partial<UserSkill>, tenantId: string): Promise<UserSkill | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
