// ✅ 1QA.MD COMPLIANCE: DOMAIN REPOSITORY INTERFACE - PURE ABSTRACTION
// Domain Layer - No implementation details, only contracts

import { ReportTemplate, ReportTemplateFilters, ReportSchedule, ReportNotification } from '../entities/ReportTemplate';

export interface IReportTemplatesRepository {
  // Template CRUD Operations
  create(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate>;
  findById(id: string, tenantId: string): Promise<ReportTemplate | null>;
  findAll(filters: ReportTemplateFilters, limit?: number, offset?: number): Promise<ReportTemplate[]>;
  update(id: string, tenantId: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  
  // Template Query Operations
  findByCategory(category: string, tenantId: string): Promise<ReportTemplate[]>;
  findByModuleType(moduleType: string, tenantId: string): Promise<ReportTemplate[]>;
  findPublicTemplates(tenantId: string): Promise<ReportTemplate[]>;
  findSystemTemplates(tenantId: string): Promise<ReportTemplate[]>;
  findByCreator(createdBy: string, tenantId: string): Promise<ReportTemplate[]>;
  
  // Template Search Operations
  search(searchTerm: string, tenantId: string, limit?: number): Promise<ReportTemplate[]>;
  findByRating(minRating: number, tenantId: string): Promise<ReportTemplate[]>;
  findMostUsed(tenantId: string, limit?: number): Promise<ReportTemplate[]>;
  findMostRated(tenantId: string, limit?: number): Promise<ReportTemplate[]>;
  
  // Template Access Control
  findAccessibleTemplates(userId: string, userRoles: string[], tenantId: string): Promise<ReportTemplate[]>;
  checkUserAccess(templateId: string, userId: string, userRoles: string[], tenantId: string): Promise<boolean>;
  
  // Template Usage Operations
  incrementUsageCount(id: string, tenantId: string): Promise<void>;
  updateRating(id: string, tenantId: string, rating: number): Promise<void>;
  addRating(id: string, tenantId: string, rating: number, userId: string): Promise<void>;
  
  // Template Versioning
  findVersions(parentTemplateId: string, tenantId: string): Promise<ReportTemplate[]>;
  findLatestVersion(parentTemplateId: string, tenantId: string): Promise<ReportTemplate | null>;
  markAsLatestVersion(id: string, tenantId: string): Promise<void>;
  
  // Validation Operations
  isNameUnique(name: string, tenantId: string, excludeId?: string): Promise<boolean>;
  validateTemplateConfig(templateConfig: Record<string, any>): Promise<boolean>;
  
  // Schedule CRUD Operations
  createSchedule(schedule: Omit<ReportSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportSchedule>;
  findScheduleById(id: string, tenantId: string): Promise<ReportSchedule | null>;
  findSchedulesByReport(reportId: string, tenantId: string): Promise<ReportSchedule[]>;
  findAllSchedules(tenantId: string, filters?: { isActive?: boolean; type?: string }): Promise<ReportSchedule[]>;
  updateSchedule(id: string, tenantId: string, updates: Partial<ReportSchedule>): Promise<ReportSchedule | null>;
  deleteSchedule(id: string, tenantId: string): Promise<boolean>;
  
  // Schedule Query Operations
  findActiveSchedules(tenantId: string): Promise<ReportSchedule[]>;
  findSchedulesDueForExecution(tenantId: string, beforeDate?: Date): Promise<ReportSchedule[]>;
  findSchedulesByType(type: ReportSchedule['type'], tenantId: string): Promise<ReportSchedule[]>;
  
  // Schedule Execution Operations
  updateScheduleExecution(id: string, tenantId: string, result: {
    lastExecutedAt: Date;
    nextExecutionAt?: Date;
    executionCount: number;
    successCount: number;
    failureCount: number;
    lastError?: string;
  }): Promise<void>;
  
  // Notification CRUD Operations
  createNotification(notification: Omit<ReportNotification, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportNotification>;
  findNotificationById(id: string, tenantId: string): Promise<ReportNotification | null>;
  findNotificationsByReport(reportId: string, tenantId: string): Promise<ReportNotification[]>;
  findAllNotifications(tenantId: string, filters?: { isActive?: boolean; triggerType?: string }): Promise<ReportNotification[]>;
  updateNotification(id: string, tenantId: string, updates: Partial<ReportNotification>): Promise<ReportNotification | null>;
  deleteNotification(id: string, tenantId: string): Promise<boolean>;
  
  // Notification Query Operations
  findActiveNotifications(tenantId: string): Promise<ReportNotification[]>;
  findNotificationsByTriggerType(triggerType: string, tenantId: string): Promise<ReportNotification[]>;
  findNotificationsByChannel(channel: string, tenantId: string): Promise<ReportNotification[]>;
  
  // Notification Execution Operations
  updateNotificationExecution(id: string, tenantId: string, result: {
    lastTriggeredAt?: Date;
    triggerCount: number;
    lastNotificationSent?: Date;
    notificationCount: number;
  }): Promise<void>;
  
  // Template Analytics
  getTemplateStatistics(tenantId: string): Promise<{
    totalTemplates: number;
    totalUsage: number;
    avgRating: number;
    categoriesCount: Array<{ category: string; count: number }>;
    moduleTypesCount: Array<{ moduleType: string; count: number }>;
    topTemplates: Array<{ templateId: string; name: string; usageCount: number; rating: number }>;
  }>;
  
  // Maintenance Operations
  cleanupOldVersions(tenantId: string, keepVersionsCount: number): Promise<number>;
  archiveUnusedTemplates(tenantId: string, unusedDays: number): Promise<number>;
}