// Domain Layer - Repository Port Interface for Template Audit
export interface IDrizzleTemplateAuditRepository {
  // Repository interface for Template Audit following Clean Architecture patterns
  // This interface will be implemented by infrastructure layer
  
  // Basic CRUD operations
  findById(id: string): Promise<any | null>;
  findAll(filters?: any): Promise<any[]>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  
  // Domain-specific operations for audit tracking
  findByTenantId(tenantId: string): Promise<any[]>;
  findByTemplateId(templateId: string): Promise<any[]>;
  findByActionType(actionType: string): Promise<any[]>;
  findByTimeRange(startDate: Date, endDate: Date): Promise<any[]>;
  findByUserId(userId: string): Promise<any[]>;
  
  // Audit-specific queries
  findRecentAudits(limit?: number): Promise<any[]>;
  findAuditsByStatus(status: string): Promise<any[]>;
}