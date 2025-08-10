// Domain Layer - Repository Port Interface for Timecard
export interface IDrizzleTimecardRepository {
  // Repository interface for Timecard following Clean Architecture patterns
  // This interface will be implemented by infrastructure layer
  
  // Basic CRUD operations
  findById(id: string): Promise<any | null>;
  findAll(filters?: any): Promise<any[]>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  
  // Domain-specific operations for timecard management
  findByTenantId(tenantId: string): Promise<any[]>;
  findByUserId(userId: string): Promise<any[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
  findByStatus(status: string): Promise<any[]>;
  findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<any[]>;
  
  // Timecard-specific queries
  findPendingApprovals(tenantId: string): Promise<any[]>;
  findTimecardsByWeek(userId: string, weekStart: Date): Promise<any[]>;
  calculateTotalHours(userId: string, startDate: Date, endDate: Date): Promise<number>;
}