/**
 * Create User Skill Use Case
 * Clean Architecture - Application Layer
 * Pure business logic, no infrastructure or presentation concerns
 */

import { IUserSkillRepository } from '../../domain/repositories/IUserSkillRepository';
import { UserSkill } from '../../domain/entities/UserSkill';

export interface CreateUserSkillRequest {
  tenantId: string;
  userId: string;
  skillId: string;
  level: number;
  certified: boolean;
  certificationDate?: Date;
  notes?: string;
}

export class CreateUserSkillUseCase {
  constructor(private userSkillRepository: IUserSkillRepository) {}

  async execute(request: CreateUserSkillRequest): Promise<UserSkill> {
    // Business rule validations
    if (request.level < 1 || request.level > 5) {
      throw new Error('Skill level must be between 1 and 5');
    }

    // Check if user-skill combination already exists
    const existing = await this.userSkillRepository.findByUserAndSkill(
      request.userId,
      request.skillId
    );

    if (existing) {
      throw new Error('User already has this skill registered');
    }

    // Create new user skill
    const userSkill = new UserSkill(
      '', // ID will be generated
      request.tenantId,
      request.userId,
      request.skillId,
      request.level,
      request.certified,
      request.certificationDate,
      request.notes
    );

    return await this.userSkillRepository.save(userSkill);
  }
}