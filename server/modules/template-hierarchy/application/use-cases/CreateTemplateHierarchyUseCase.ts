
import { ITemplateHierarchyRepository } from '../../domain/repositories/ITemplateHierarchyRepository';

export class CreateTemplateHierarchyUseCase {
  constructor(
    private templateHierarchyRepository: ITemplateHierarchyRepository
  ) {}

  async execute(tenantId: string, data: any) {
    return this.templateHierarchyRepository.create(tenantId, data);
  }
}
