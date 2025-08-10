
export interface IUserSkillRepository {
  create(userSkill: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  findByUserId(userId: string): Promise<any[]>;
  findBySkillId(skillId: string): Promise<any[]>;
  update(id: string, userSkill: any): Promise<any>;
  delete(id: string): Promise<void>;
  addSkillToUser(userId: string, skillId: string, level: number): Promise<any>;
  removeSkillFromUser(userId: string, skillId: string): Promise<void>;
}
