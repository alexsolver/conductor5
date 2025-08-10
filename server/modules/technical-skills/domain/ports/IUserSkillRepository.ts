export interface IUserSkillRepository {
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  create(userSkill: any): Promise<any>;
  update(id: string, userSkill: any): Promise<any>;
  delete(id: string): Promise<void>;
  findByUser(userId: string): Promise<any[]>;
  findBySkill(skillId: string): Promise<any[]>;
}