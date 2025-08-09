
import { CreateTenantConfigDTO, UpdateTenantConfigDTO } from '../dto';
import { TenantConfigDomainService } from '../../domain/services/TenantConfigDomainService';
import { ITenantConfigRepository } from '../../domain/repositories/ITenantConfigRepository';

export class TenantAdminApplicationService {
  constructor(
    private repository: ITenantConfigRepository,
    private domainService: TenantConfigDomainService
  ) {}

  async createTenantConfig(dto: CreateTenantConfigDTO) {
    if (!this.domainService.validateConfig(dto.config)) {
      throw new Error('Invalid tenant configuration');
    }

    const tenantConfig = {
      id: crypto.randomUUID(),
      tenantId: dto.tenantId,
      config: dto.config,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.repository.create(tenantConfig);
  }

  async updateTenantConfig(dto: UpdateTenantConfigDTO) {
    if (!this.domainService.validateConfig(dto.config)) {
      throw new Error('Invalid tenant configuration');
    }

    return await this.repository.update(dto.id, {
      config: dto.config,
      updatedAt: new Date()
    });
  }
}
