
import { CreateFieldLayoutUseCase } from '../use-cases/CreateFieldLayoutUseCase';
import { GetFieldLayoutsUseCase } from '../use-cases/GetFieldLayoutsUseCase';

export interface CreateFieldLayoutRequest {
  name: string;
  configuration: any;
  tenantId: string;
}

export interface FieldLayoutResponse {
  success: boolean;
  data: any;
  message?: string;
}

export class FieldLayoutController {
  constructor(
    private readonly createFieldLayoutUseCase: CreateFieldLayoutUseCase,
    private readonly getFieldLayoutsUseCase: GetFieldLayoutsUseCase
  ) {}

  async create(request: CreateFieldLayoutRequest): Promise<FieldLayoutResponse> {
    try {
      const result = await this.createFieldLayoutUseCase.execute(request);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to create field layout: ${error}`);
    }
  }

  async getAll(tenantId: string): Promise<FieldLayoutResponse> {
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
}
