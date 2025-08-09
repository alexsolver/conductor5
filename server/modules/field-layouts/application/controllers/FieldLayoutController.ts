import { CreateFieldLayoutUseCase } from '../use-cases/CreateFieldLayoutUseCase';
import { GetFieldLayoutsUseCase } from '../use-cases/GetFieldLayoutsUseCase';
import { UpdateFieldLayoutUseCase } from '../use-cases/UpdateFieldLayoutUseCase';

export interface FieldLayoutControllerRequest {
  name?: string;
  configuration?: any;
  tenantId: string;
  id?: string;
}

export interface FieldLayoutControllerResponse {
  success: boolean;
  data: any;
  message?: string;
}

export class FieldLayoutController {
  constructor(
    private readonly createFieldLayoutUseCase: CreateFieldLayoutUseCase,
    private readonly getFieldLayoutsUseCase: GetFieldLayoutsUseCase,
    private readonly updateFieldLayoutUseCase: UpdateFieldLayoutUseCase
  ) {}

  async create(request: FieldLayoutControllerRequest): Promise<FieldLayoutControllerResponse> {
    try {
      const result = await this.createFieldLayoutUseCase.execute({
        name: request.name!,
        configuration: request.configuration!,
        tenantId: request.tenantId
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to create field layout: ${error}`);
    }
  }

  async getAll(tenantId: string): Promise<FieldLayoutControllerResponse> {
    try {
      const result = await this.getFieldLayoutsUseCase.execute({ tenantId });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to get field layouts: ${error}`);
    }
  }

  async update(request: FieldLayoutControllerRequest): Promise<FieldLayoutControllerResponse> {
    try {
      const result = await this.updateFieldLayoutUseCase.execute({
        id: request.id!,
        name: request.name,
        configuration: request.configuration,
        tenantId: request.tenantId
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to update field layout: ${error}`);
    }
  }
}