
import { ITemplateVersionRepository } from '../../domain/repositories/ITemplateVersionRepository';

export class TemplateVersionApplicationService {
  constructor(
    private templateVersionRepository: ITemplateVersionRepository
  ) {}

  async createVersion(tenantId: string, data: any) {
    return this.templateVersionRepository.create(tenantId, data);
  }

  async getVersions(tenantId: string) {
    return this.templateVersionRepository.findAll(tenantId);
  }
}
