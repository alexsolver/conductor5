
import { UserSkill } from '../entities/UserSkill';

import { UserSkill } from '../entities/UserSkill';

export interface IUserSkillRepository {
  create(userSkill: UserSkill): Promise<UserSkill>;
  findById(id: string): Promise<UserSkill | null>;
  findByUserId(userId: string): Promise<UserSkill[]>;
  update(id: string, data: Partial<UserSkill>): Promise<UserSkill>;
  delete(id: string): Promise<void>;
  findAll(): Promise<UserSkill[]>;
}
  findById(id: string, tenantId: string): Promise<UserSkill | null>;
  findByUserId(userId: string, tenantId: string): Promise<UserSkill[]>;
  findAll(tenantId: string): Promise<UserSkill[]>;
  create(entity: UserSkill): Promise<UserSkill>;
  update(id: string, entity: Partial<UserSkill>, tenantId: string): Promise<UserSkill | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
