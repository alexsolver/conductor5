
import { FieldLayout } from '../../domain/entities/FieldLayout';
import { IFieldLayoutRepository } from '../../domain/repositories/IFieldLayoutRepository';

export interface GetFieldLayoutsQuery {
  tenantId: string;
}

export class GetFieldLayoutsUseCase {
  constructor(private fieldLayoutRepository: IFieldLayoutRepository) {}

  async execute(query: GetFieldLayoutsQuery): Promise<FieldLayout[]> {
    const { tenantId } = query;
    return await this.fieldLayoutRepository.findByTenantId(tenantId);
  }
}
