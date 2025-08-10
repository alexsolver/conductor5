import { UserSkill } from '../entities/UserSkill';

export interface IUserSkillRepository {
  create(userSkill: UserSkill): Promise<UserSkill>;
  findById(id: string): Promise<UserSkill | null>;
  findByUserId(userId: string): Promise<UserSkill[]>;
  update(id: string, data: Partial<UserSkill>): Promise<UserSkill>;
  delete(id: string): Promise<void>;
  findAll(): Promise<UserSkill[]>;
}