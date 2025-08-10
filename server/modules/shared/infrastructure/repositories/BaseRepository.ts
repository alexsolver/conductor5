import { Pool } from 'pg';
import { IBaseRepository } from '../../domain/repositories/IBaseRepository';

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  constructor(protected readonly db: any) {} // Accept any database implementation

  abstract findById(id: string, tenantId: string): Promise<T | null>;
  abstract findAll(tenantId: string): Promise<T[]>;
  abstract create(entity: T): Promise<T>;
  abstract update(id: string, entity: Partial<T>, tenantId: string): Promise<T | null>;
  abstract delete(id: string, tenantId: string): Promise<boolean>;

  protected validateTenantId(tenantId: string): void {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
  }

  protected validateId(id: string): void {
    if (!id) {
      throw new Error('ID is required');
    }
  }
}