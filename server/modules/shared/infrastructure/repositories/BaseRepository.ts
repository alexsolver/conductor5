import { Pool } from 'pg';
import { IBaseRepository } from '../../domain/repositories/IBaseRepository';

// Interface abstrata para conexão com banco
interface IDatabaseConnection {
  // Interface abstrata para conexão com banco
}

export abstract class BaseEntityRepository<T> implements IBaseRepository<T> {
  // Repository focused only on data persistence
  // Business logic moved to domain services

  protected db: IDatabaseConnection;

  constructor(db: IDatabaseConnection) {
    this.db = db;
  }

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
  // Removed business logic - repositories should only handle data persistence
  // Validation logic moved to domain services
}
import { IBaseEntityRepository } from '../../domain/ports/IBaseEntityRepository';

export abstract class BaseRepository<T> implements IBaseEntityRepository<T> {
  protected abstract tableName: string;
  
  abstract create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  abstract findById(id: string, tenantId: string): Promise<T | null>;
  abstract findByTenant(tenantId: string, options?: any): Promise<T[]>;
  abstract update(id: string, tenantId: string, data: Partial<T>): Promise<T | null>;
  abstract delete(id: string, tenantId: string): Promise<boolean>;
  
  protected validateTenantId(tenantId: string): void {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Valid tenantId is required');
    }
  }
  
  protected generateId(): string {
    return crypto.randomUUID();
  }
}
