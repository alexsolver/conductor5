import { UserSkill } from '../entities/UserSkill';

export interface IUserSkillRepository {
  // CRUD básico
  create(userSkill: UserSkill): Promise<UserSkill>;
  findById(id: string, tenantId: string): Promise<UserSkill | null>;
  findByUserId(userId: string, tenantId: string): Promise<UserSkill[]>;
  findBySkillId(skillId: string): Promise<UserSkill[]>;
  findByUserAndSkill(userId: string, skillId: string, tenantId: string): Promise<UserSkill | null>;
  update(id: string, data: { level?: number; notes?: string; tenantId: string }): Promise<UserSkill>;
  delete(id: string, tenantId: string): Promise<void>;

  // Operações de busca avançada
  findUsersWithSkill(skillId: string, tenantId: string, filters?: {
    minLevel?: number;
    validCertification?: boolean;
    location?: string;
    isActive?: boolean;
  }): Promise<UserSkill[]>;

  findUsersWithSkills(skillIds: string[], minLevel?: number): Promise<UserSkill[]>;

  // Relatórios e estatísticas
  getUserSkillsWithDetails(userId: string, tenantId: string): Promise<Array<UserSkill & {
    skillName: string;
    skillCategory: string;
    certificationName?: string;
  }>>;

  getExpiredCertifications(): Promise<UserSkill[]>;
  getExpiringCertifications(daysAhead: number): Promise<UserSkill[]>;

  getTopRatedTechnicians(skillId?: string, limit?: number): Promise<Array<UserSkill & {
    userName: string;
    skillName: string;
  }>>;

  getSkillGapAnalysis(): Promise<Array<{
    skillId: string;
    skillName: string;
    category: string;
    demandCount: number;
    availableTechnicians: number;
    gap: number;
  }>>;

  // Operações de avaliação
  updateRating(userSkillId: string, newRating: number, totalEvaluations: number, tenantId: string): Promise<void>;
}