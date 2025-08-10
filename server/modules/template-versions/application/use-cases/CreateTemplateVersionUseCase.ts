
import { ITemplateVersionRepository } from '../../domain/repositories/ITemplateVersionRepository';

export class CreateTemplateVersionUseCase {
  constructor(
    private templateVersionRepository: ITemplateVersionRepository
  ) {}

  async execute(tenantId: string, data: any) {
    return this.templateVersionRepository.create(tenantId, data);
  }
}
