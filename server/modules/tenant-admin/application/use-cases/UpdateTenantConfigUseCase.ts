
import { UpdateTenantConfigDTO } from '../dto/UpdateTenantConfigDTO';
import { TenantAdminApplicationService } from '../services/TenantAdminApplicationService';

export class UpdateTenantConfigUseCase {
  constructor(private applicationService: TenantAdminApplicationService) {}

  async execute(dto: UpdateTenantConfigDTO) {
    return await this.applicationService.updateTenantConfig(dto);
  }
}
