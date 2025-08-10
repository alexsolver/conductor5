// Clean Architecture Domain Layer - Repository Port Interface
export interface IDrizzleTicketHistoryRepository {
  // Interface for Ticket History repository following repository pattern
  // This interface will be implemented by infrastructure layer repositories
  
  // Basic CRUD operations
  findById(id: string): Promise<any | null>;
  findAll(filters?: any): Promise<any[]>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  
  // Domain-specific queries
  findByTicketId(ticketId: string): Promise<any[]>;
  findByTenantId(tenantId: string): Promise<any[]>;
  findByActionType(actionType: string): Promise<any[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
}