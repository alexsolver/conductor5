/**
 * Shared Repository Interfaces
 * Clean Architecture - Application Layer
 * Common repository contracts used across multiple bounded contexts
 */

export interface IBaseRepository<T, ID> {
  findById(id: ID, tenantId: string): Promise<T | null>;
  findAll(tenantId: string): Promise<T[]>;
  save(entity: T, tenantId: string): Promise<T>;
  update(id: ID, entity: Partial<T>, tenantId: string): Promise<T | null>;
  delete(id: ID, tenantId: string): Promise<boolean>;
}

export interface ITenantAwareRepository<T, ID> extends IBaseRepository<T, ID> {
  findByTenant(tenantId: string, filters?: Record<string, any>): Promise<T[]>;
  countByTenant(tenantId: string): Promise<number>;
}

export interface IAuditableRepository<T, ID> extends ITenantAwareRepository<T, ID> {
  findWithAuditTrail(id: ID, tenantId: string): Promise<{ entity: T; auditTrail: any[] } | null>;
  getAuditHistory(id: ID, tenantId: string): Promise<any[]>;
}

export interface ISoftDeleteRepository<T, ID> extends ITenantAwareRepository<T, ID> {
  softDelete(id: ID, tenantId: string): Promise<boolean>;
  restore(id: ID, tenantId: string): Promise<boolean>;
  findActive(tenantId: string): Promise<T[]>;
  findDeleted(tenantId: string): Promise<T[]>;
}