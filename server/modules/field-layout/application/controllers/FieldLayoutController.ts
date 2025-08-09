import { CreateFieldLayoutUseCase, GetFieldLayoutsUseCase } from '../use-cases';

interface CreateFieldLayoutRequest {
  name: string;
  fields: any[];
  tenantId: string;
}

interface GetFieldLayoutsRequest {
  tenantId: string;
}

export class FieldLayoutController {
  constructor(
    private readonly createFieldLayoutUseCase: CreateFieldLayoutUseCase,
    private readonly getFieldLayoutsUseCase: GetFieldLayoutsUseCase
  ) {}

  async create(request: CreateFieldLayoutRequest) {
    return await this.createFieldLayoutUseCase.execute(request);
  }

  async getAll(request: GetFieldLayoutsRequest) {
    return await this.getFieldLayoutsUseCase.execute(request);
  }
}