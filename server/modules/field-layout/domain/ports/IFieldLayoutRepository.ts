import { FieldLayout } from '../entities/FieldLayout';

export interface IFieldLayoutRepository {
  findById(id: string, tenantId: string): Promise<FieldLayout | null>;
  findAll(tenantId: string): Promise<FieldLayout[]>;
  create(entity: FieldLayout): Promise<FieldLayout>;
  update(id: string, entity: Partial<FieldLayout>, tenantId: string): Promise<FieldLayout | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
