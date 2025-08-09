
import { CreateTenantConfigUseCase } from '../use-cases/CreateTenantConfigUseCase';
import { GetTenantConfigUseCase } from '../use-cases/GetTenantConfigUseCase';
import { UpdateTenantConfigUseCase } from '../use-cases/UpdateTenantConfigUseCase';

export interface TenantAdminControllerRequest {
  tenantId: string;
  configKey?: string;
  configValue?: any;
  id?: string;
}

export interface TenantAdminControllerResponse {
  success: boolean;
  data: any;
  message?: string;
}

export class TenantAdminController {
  constructor(
    private readonly createTenantConfigUseCase: CreateTenantConfigUseCase,
    private readonly getTenantConfigUseCase: GetTenantConfigUseCase,
    private readonly updateTenantConfigUseCase: UpdateTenantConfigUseCase
  ) {}

  async createConfig(request: TenantAdminControllerRequest): Promise<TenantAdminControllerResponse> {
    try {
      const result = await this.createTenantConfigUseCase.execute({
        tenantId: request.tenantId,
        configKey: request.configKey!,
        configValue: request.configValue!
      });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to create tenant config: ${error}`);
    }
  }

  async getConfig(tenantId: string): Promise<TenantAdminControllerResponse> {
    try {
      const result = await this.getTenantConfigUseCase.execute({ tenantId });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to get tenant config: ${error}`);
    }
  }

  async updateConfig(request: TenantAdminControllerRequest): Promise<TenantAdminControllerResponse> {
    try {
      const result = await this.updateTenantConfigUseCase.execute({
        id: request.id!,
        tenantId: request.tenantId,
        configKey: request.configKey,
        configValue: request.configValue
      });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to update tenant config: ${error}`);
    }
  }
}
