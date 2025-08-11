/**
 * Get User Skills Use Case
 * Clean Architecture - Application Layer
 * Pure business logic, no infrastructure or presentation concerns
 */

import { IUserSkillRepository } from '../../domain/repositories/IUserSkillRepository';
import { UserSkill } from '../../domain/entities/UserSkill';

export interface GetUserSkillsRequest {
  tenantId: string;
  userId?: string;
  skillId?: string;
  minLevel?: number;
  validCertification?: boolean;
}

export interface GetUserSkillsResponse {
  userSkills: UserSkill[];
  count: number;
}

export class GetUserSkillsUseCase {
  constructor(private userSkillRepository: IUserSkillRepository) {}

  async execute(request: GetUserSkillsRequest): Promise<GetUserSkillsResponse> {
    // Business rule validation
    if (!request.userId && !request.skillId) {
      throw new Error('Either userId or skillId must be provided');
    }

    let userSkills: UserSkill[] = [];

    if (request.userId && request.skillId) {
      // Find specific user-skill combination
      const userSkill = await this.userSkillRepository.findByUserAndSkill(
        request.userId, 
        request.skillId
      );
      userSkills = userSkill ? [userSkill] : [];
    } else if (request.userId) {
      // Find all skills for user
      userSkills = await this.userSkillRepository.findByUserId(request.userId);
    } else if (request.skillId) {
      // Find all users with skill, applying filters
      const filters = {
        minLevel: request.minLevel,
        validCertification: request.validCertification
      };
      userSkills = await this.userSkillRepository.findUsersWithSkill(request.skillId, filters);
    }

    return {
      userSkills,
      count: userSkills.length
    };
  }
}