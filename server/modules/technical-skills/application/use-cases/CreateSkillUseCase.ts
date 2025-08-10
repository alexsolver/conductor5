import { ISkillRepository } from '../../domain/ports/ISkillRepository';

export class CreateSkillUseCase {
  constructor(private skillRepository: ISkillRepository) {}

  async execute(skillData: any): Promise<any> {
    return await this.skillRepository.create(skillData);
  }
}