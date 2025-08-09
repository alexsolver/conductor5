
import { CreateSaasConfigDTO } from '../dto/CreateSaasConfigDTO';
import { SaasAdminDomainService } from '../../domain/services/SaasAdminDomainService';

export class SaasAdminApplicationService {
  constructor(
    private saasAdminDomainService: SaasAdminDomainService
  ) {}

  async createConfig(dto: CreateSaasConfigDTO) {
    return await this.saasAdminDomainService.createConfig(dto);
  }

  async getConfigs(tenantId: string) {
    return await this.saasAdminDomainService.getConfigs(tenantId);
  }
}
