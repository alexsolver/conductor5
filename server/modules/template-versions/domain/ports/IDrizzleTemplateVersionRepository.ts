// Clean Architecture Domain Layer - Repository Port Interface
export interface IDrizzleTemplateVersionRepository {
  // Interface for Template Version repository following repository pattern
  // This interface will be implemented by infrastructure layer repositories
  
  // Basic CRUD operations
  findById(id: string): Promise<any | null>;
  findAll(filters?: any): Promise<any[]>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  
  // Domain-specific queries
  findByTemplateId(templateId: string): Promise<any[]>;
  findByTenantId(tenantId: string): Promise<any[]>;
  findLatestVersion(templateId: string): Promise<any | null>;
  findByVersionNumber(templateId: string, version: number): Promise<any | null>;
}