// Domain Layer - Repository Port Interface for Tenant Admin
export interface IDrizzleTenantAdminRepository {
  // Repository interface for Tenant Admin following Clean Architecture patterns
  // This interface will be implemented by infrastructure layer
  
  // Basic CRUD operations
  findById(id: string): Promise<any | null>;
  findAll(filters?: any): Promise<any[]>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  
  // Domain-specific operations for tenant management
  findByTenantId(tenantId: string): Promise<any[]>;
  findTenantConfig(tenantId: string): Promise<any | null>;
  updateTenantConfig(tenantId: string, config: any): Promise<any>;
  findActiveTenants(): Promise<any[]>;
  findTenantsByStatus(status: string): Promise<any[]>;
  
  // Admin-specific queries
  findTenantUsers(tenantId: string): Promise<any[]>;
  findTenantSettings(tenantId: string): Promise<any[]>;
}