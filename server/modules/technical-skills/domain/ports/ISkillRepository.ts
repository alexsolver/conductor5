
import { Skill } from '../entities/Skill';

export interface ISkillRepository {
  findById(id: string, tenantId: string): Promise<Skill | null>;
  findAll(tenantId: string): Promise<Skill[]>;
  create(skill: Skill): Promise<Skill>;
  update(id: string, skill: Partial<Skill>, tenantId: string): Promise<Skill | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
