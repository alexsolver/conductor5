// ✅ 1QA.MD COMPLIANCE: DOMAIN REPOSITORY INTERFACE - PURE ABSTRACTION
// Domain Layer - No implementation details, only contracts

import { Report, ReportFilters, ReportExecutionResult } from '../entities/Report';

export interface IReportsRepository {
  // CRUD Operations
  create(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report>;
  findById(id: string, tenantId: string): Promise<Report | null>;
  findAll(filters: ReportFilters, limit?: number, offset?: number): Promise<Report[]>;
  update(id: string, tenantId: string, updates: Partial<Report>): Promise<Report | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  
  // Query Operations
  findByOwner(ownerId: string, tenantId: string): Promise<Report[]>;
  findByCategory(category: string, tenantId: string): Promise<Report[]>;
  findByDataSource(dataSource: string, tenantId: string): Promise<Report[]>;
  findByStatus(status: Report['status'], tenantId: string): Promise<Report[]>;
  findPublicReports(tenantId: string): Promise<Report[]>;
  findTemplates(tenantId: string): Promise<Report[]>;
  
  // Search Operations
  search(searchTerm: string, tenantId: string, limit?: number): Promise<Report[]>;
  findByTags(tags: string[], tenantId: string): Promise<Report[]>;
  
  // Access Control Operations
  findAccessibleReports(userId: string, userRoles: string[], tenantId: string): Promise<Report[]>;
  checkUserAccess(reportId: string, userId: string, userRoles: string[], tenantId: string): Promise<boolean>;
  
  // Performance Operations
  findRecentlyExecuted(tenantId: string, limit?: number): Promise<Report[]>;
  findMostUsed(tenantId: string, limit?: number): Promise<Report[]>;
  findScheduledReports(tenantId: string): Promise<Report[]>;
  
  // Execution Operations
  recordExecution(reportId: string, tenantId: string, executionResult: ReportExecutionResult): Promise<void>;
  updateExecutionMetrics(reportId: string, tenantId: string, executionTime: number): Promise<void>;
  
  // Validation Operations
  isNameUnique(name: string, tenantId: string, excludeId?: string): Promise<boolean>;
  countByOwner(ownerId: string, tenantId: string): Promise<number>;
  countByCategory(category: string, tenantId: string): Promise<number>;
  
  // Maintenance Operations
  archiveOldReports(tenantId: string, daysOld: number): Promise<number>;
  cleanupExecutionLogs(tenantId: string, daysOld: number): Promise<number>;
  
  // Analytics Operations
  getUsageStatistics(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<{
    totalReports: number;
    totalExecutions: number;
    avgExecutionTime: number;
    mostUsedCategories: Array<{ category: string; count: number }>;
    topPerformers: Array<{ reportId: string; name: string; executionCount: number }>;
  }>;
}