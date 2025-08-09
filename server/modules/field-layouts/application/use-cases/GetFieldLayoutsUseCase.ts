
import { IFieldLayoutRepository } from '../../domain/repositories/IFieldLayoutRepository';

export class GetFieldLayoutsUseCase {
  constructor(private repository: IFieldLayoutRepository) {}

  async execute(tenantId: string) {
    return await this.repository.findByTenantId(tenantId);
  }
}
