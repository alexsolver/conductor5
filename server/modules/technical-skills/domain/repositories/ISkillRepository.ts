import { Skill } from '../entities/Skill';

export interface ISkillRepository {
  // CRUD básico
  create(skill: Skill): Promise<Skill>;
  findById(id: string): Promise<Skill | null>;
  findAll(filters?: {
    category?: string;
    isActive?: boolean;
    search?: string;
    tenantId?: string;
  }): Promise<Skill[]>;
  update(skill: Skill): Promise<Skill>;
  updateDirect(data: {
    id: string;
    name?: string;
    category?: string;
    description?: string;
    tenantId?: string;
    updatedBy?: string;
  }): Promise<Skill>;
  delete(id: string): Promise<void>;
  
  // Operações específicas
  findByCategory(category: string): Promise<Skill[]>;
  findByNamePattern(pattern: string): Promise<Skill[]>;
  getCategories(): Promise<string[]>;
  
  // Estatísticas
  countByCategory(): Promise<{ category: string; count: number }[]>;
  getMostDemandedSkills(limit?: number): Promise<{ skill: Skill; demandCount: number }[]>;
}