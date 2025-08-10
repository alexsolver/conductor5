// Domain Layer - Repository Port Interface
export interface IDrizzleSkillEntityRepository {
  // Repository interface for SkillEntity following Clean Architecture patterns
  // This interface will be implemented by infrastructure layer
  
  // Basic CRUD operations
  findById(id: string): Promise<any | null>;
  findAll(filters?: any): Promise<any[]>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  
  // Domain-specific operations
  findByTenantId(tenantId: string): Promise<any[]>;
  findByCategory(category: string): Promise<any[]>;
  findBySkillLevel(level: string): Promise<any[]>;
  findActiveSkills(tenantId: string): Promise<any[]>;
}