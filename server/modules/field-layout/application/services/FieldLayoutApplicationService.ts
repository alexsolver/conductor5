
import { IFieldLayoutRepository } from '../../domain/repositories/IFieldLayoutRepository';

export class FieldLayoutApplicationService {
  constructor(
    private fieldLayoutRepository: IFieldLayoutRepository
  ) {}

  async createLayout(tenantId: string, data: any) {
    return this.fieldLayoutRepository.create(tenantId, data);
  }

  async getLayouts(tenantId: string) {
    return this.fieldLayoutRepository.findAll(tenantId);
  }
}
