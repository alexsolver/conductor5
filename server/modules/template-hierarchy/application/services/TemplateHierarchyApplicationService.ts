
import { ITemplateHierarchyRepository } from '../../domain/repositories/ITemplateHierarchyRepository';

export class TemplateHierarchyApplicationService {
  constructor(
    private templateHierarchyRepository: ITemplateHierarchyRepository
  ) {}

  async createHierarchy(tenantId: string, data: any) {
    return this.templateHierarchyRepository.create(tenantId, data);
  }

  async getHierarchies(tenantId: string) {
    return this.templateHierarchyRepository.findAll(tenantId);
  }
}
