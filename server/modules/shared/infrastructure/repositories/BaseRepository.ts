/**
 * Clean Architecture Base Repository
 * Infrastructure Layer - Only handles data persistence
 * No business logic, no domain knowledge
 */

import { IBaseEntityRepository } from '../../domain/ports/IBaseEntityRepository';

export abstract class BaseRepository<T> implements IBaseEntityRepository<T> {
  protected abstract tableName: string;
  
  // Clean Architecture: Repository interface defines contracts only
  abstract create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  abstract findById(id: string, tenantId: string): Promise<T | null>;
  abstract findByTenant(tenantId: string, options?: any): Promise<T[]>;
  abstract update(id: string, tenantId: string, data: Partial<T>): Promise<T | null>;
  abstract delete(id: string, tenantId: string): Promise<boolean>;
  
  // Infrastructure concern: Basic parameter validation only
  protected validateTenantId(tenantId: string): void {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Valid tenantId is required');
    }
  }
  
  // Infrastructure utility: ID generation
  protected generateId(): string {
    return crypto.randomUUID();
  }
}
