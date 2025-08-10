
import { Skill } from '../entities/Skill';

export interface ISkillRepository {
  findById(id: string, tenantId: string): Promise<Skill | null>;
  findAll(tenantId: string): Promise<Skill[]>;
  create(skill: Skill): Promise<Skill>;
  update(id: string, skill: Partial<Skill>, tenantId: string): Promise<Skill | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
import { Skill } from '../entities/Skill';

export interface ISkillRepository {
  findById(id: string, tenantId: string): Promise<Skill | null>;
  findAll(tenantId: string): Promise<Skill[]>;
  findByCategory(category: string, tenantId: string): Promise<Skill[]>;
  create(skill: Skill): Promise<Skill>;
  update(id: string, skill: Partial<Skill>, tenantId: string): Promise<Skill | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
import { SkillEntity } from '../entities/SkillEntity';

export interface ISkillRepository {
  findById(id: string, tenantId: string): Promise<SkillEntity | null>;
  findAll(tenantId: string): Promise<SkillEntity[]>;
  create(skill: SkillEntity): Promise<SkillEntity>;
  update(id: string, skill: Partial<SkillEntity>, tenantId: string): Promise<SkillEntity | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByCategory(category: string, tenantId: string): Promise<SkillEntity[]>;
}
