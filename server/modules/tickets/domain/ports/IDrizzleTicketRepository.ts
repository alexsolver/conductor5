// Clean Architecture Domain Layer - Repository Port Interface
export interface IDrizzleTicketRepository {
  // Interface for Ticket repository following repository pattern
  // This interface will be implemented by infrastructure layer repositories
  
  // Basic CRUD operations
  findById(id: string): Promise<any | null>;
  findAll(filters?: any): Promise<any[]>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  
  // Domain-specific queries
  findByTenantId(tenantId: string): Promise<any[]>;
  findByCustomerId(customerId: string): Promise<any[]>;
  findByStatus(status: string): Promise<any[]>;
  findByPriority(priority: string): Promise<any[]>;
  findByAssignee(assigneeId: string): Promise<any[]>;
}