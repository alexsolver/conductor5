import { ISaasConfigRepository } from '../../domain/ports/ISaasConfigRepository';

export class GetConfigsUseCase {
  constructor(
    private readonly configRepository: ISaasConfigRepository
  ) {}

  async execute(tenantId: string): Promise<any[]> {
    return await this.configRepository.findByTenantId(tenantId);
  }
}
import { SaasConfig } from '../../domain/entities/SaasConfig';
import { ISaasConfigRepository } from '../../domain/ports/ISaasConfigRepository';

export class GetConfigsUseCase {
  constructor(
    private readonly configRepository: ISaasConfigRepository
  ) {}

  async execute(tenantId: string): Promise<SaasConfig[]> {
    return await this.configRepository.findAll(tenantId);
  }
}
