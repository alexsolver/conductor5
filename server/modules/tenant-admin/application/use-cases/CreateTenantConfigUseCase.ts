
import { CreateTenantConfigDTO } from '../dto/CreateTenantConfigDTO';
import { TenantAdminApplicationService } from '../services/TenantAdminApplicationService';

export class CreateTenantConfigUseCase {
  constructor(private applicationService: TenantAdminApplicationService) {}

  async execute(dto: CreateTenantConfigDTO) {
    return await this.applicationService.createTenantConfig(dto);
  }
}
