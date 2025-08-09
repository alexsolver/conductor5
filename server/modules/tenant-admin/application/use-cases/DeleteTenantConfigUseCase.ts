
import { ITenantConfigRepository } from '../../domain/repositories/ITenantConfigRepository';

export class DeleteTenantConfigUseCase {
  constructor(
    private readonly tenantConfigRepository: ITenantConfigRepository
  ) {}

  async execute(id: string): Promise<boolean> {
    const exists = await this.tenantConfigRepository.findById(id);
    if (!exists) {
      return false;
    }
    
    return await this.tenantConfigRepository.delete(id);
  }
}
