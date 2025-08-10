// Clean Architecture Domain Layer - Repository Port Interface
export interface IDrizzleTicketTemplateRepository {
  // Interface for Ticket Template repository following repository pattern
  // This interface will be implemented by infrastructure layer repositories
  
  // Basic CRUD operations
  findById(id: string): Promise<any | null>;
  findAll(filters?: any): Promise<any[]>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  
  // Domain-specific queries
  findByTenantId(tenantId: string): Promise<any[]>;
  findByCategory(category: string): Promise<any[]>;
  findActive(): Promise<any[]>;
}