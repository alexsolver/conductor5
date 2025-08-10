
export interface ISkillEntityRepository {
  create(skill: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  update(id: string, skill: any): Promise<any>;
  delete(id: string): Promise<void>;
}
