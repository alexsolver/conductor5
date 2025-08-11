/**
 * Update User Skill Use Case
 * Clean Architecture - Application Layer
 * Pure business logic, no infrastructure or presentation concerns
 */

import { IUserSkillRepository } from '../../domain/repositories/IUserSkillRepository';
import { UserSkill } from '../../domain/entities/UserSkill';

export interface UpdateUserSkillRequest {
  tenantId: string;
  userSkillId: string;
  level?: number;
  certified?: boolean;
  certificationDate?: Date;
  notes?: string;
}

export class UpdateUserSkillUseCase {
  constructor(private userSkillRepository: IUserSkillRepository) {}

  async execute(request: UpdateUserSkillRequest): Promise<UserSkill> {
    // Find existing user skill
    const existingSkill = await this.userSkillRepository.findById(request.userSkillId, request.tenantId);
    
    if (!existingSkill) {
      throw new Error('User skill not found');
    }

    // Business rule validations
    if (request.level !== undefined && (request.level < 1 || request.level > 5)) {
      throw new Error('Skill level must be between 1 and 5');
    }

    // Update skill properties
    if (request.level !== undefined) {
      existingSkill.updateLevel(request.level);
    }

    if (request.certified !== undefined) {
      existingSkill.updateCertification(request.certified, request.certificationDate);
    }

    if (request.notes !== undefined) {
      existingSkill.updateNotes(request.notes);
    }

    return await this.userSkillRepository.save(existingSkill);
  }
}