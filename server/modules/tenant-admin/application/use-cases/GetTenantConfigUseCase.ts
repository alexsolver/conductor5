
import { ITenantConfigRepository } from '../../domain/repositories/ITenantConfigRepository';

export class GetTenantConfigUseCase {
  constructor(private repository: ITenantConfigRepository) {}

  async execute(tenantId: string) {
    return await this.repository.findByTenantId(tenantId);
  }
}
