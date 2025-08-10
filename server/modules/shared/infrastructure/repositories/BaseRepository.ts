import { Pool } from 'pg';
import { IBaseRepository } from '../../domain/repositories/IBaseRepository';

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  // Repository should only handle data persistence, not business logic

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
}