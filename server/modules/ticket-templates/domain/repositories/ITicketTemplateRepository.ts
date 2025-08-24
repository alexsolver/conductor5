/**
 * Ticket Template Repository Interface
 * Clean Architecture - Domain Layer
 * 
 * @module ITicketTemplateRepository
 * @created 2025-08-12 - Phase 20 Clean Architecture Implementation
 */

import { TicketTemplate, TicketTemplateMetadata, UserFeedback } from '../entities/TicketTemplate';

export interface ITicketTemplateRepository {
  // Basic CRUD Operations
  create(template: Omit<TicketTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TicketTemplate>;
  findById(id: string, tenantId: string): Promise<TicketTemplate | null>;
  findByName(name: string, tenantId: string): Promise<TicketTemplate | null>;
  update(id: string, tenantId: string, updates: Partial<TicketTemplate>): Promise<TicketTemplate | null>;
  delete(id: string, tenantId: string): Promise<boolean>;

  // Query Operations
  findAll(tenantId: string, filters?: {
    category?: string;
    subcategory?: string;
    templateType?: string;
    status?: string;
    companyId?: string;
    departmentId?: string;
    isDefault?: boolean;
    isSystem?: boolean;
    tags?: string[];
  }): Promise<TicketTemplate[]>;

  findByCategory(tenantId: string, category: string, subcategory?: string): Promise<TicketTemplate[]>;
  findByType(tenantId: string, templateType: string): Promise<TicketTemplate[]>;
  findByCompany(tenantId: string, companyId: string): Promise<TicketTemplate[]>;
  findActive(tenantId: string): Promise<TicketTemplate[]>;
  findDefault(tenantId: string): Promise<TicketTemplate[]>;

  // Search Operations
  search(tenantId: string, query: string, filters?: {
    category?: string;
    templateType?: string;
    tags?: string[];
  }): Promise<TicketTemplate[]>;

  searchByFields(tenantId: string, fieldCriteria: {
    fieldName?: string;
    fieldType?: string;
    hasValidation?: boolean;
    hasConditionalLogic?: boolean;
  }): Promise<TicketTemplate[]>;

  // Usage Operations
  incrementUsageCount(id: string, tenantId: string): Promise<boolean>;
  updateLastUsed(id: string, tenantId: string): Promise<boolean>;
  
  getUsageStatistics(tenantId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalUsage: number;
    popularTemplates: Array<{
      template: TicketTemplate;
      usageCount: number;
      lastUsed?: Date;
    }>;
    usageByCategory: Record<string, number>;
    usageByType: Record<string, number>;
    usageByCompany: Record<string, number>;
    averageFieldCount: number;
    complexityDistribution: Record<string, number>;
  }>;

  getMostUsedTemplates(tenantId: string, limit?: number): Promise<TicketTemplate[]>;
  getLeastUsedTemplates(tenantId: string, limit?: number): Promise<TicketTemplate[]>;

  // Template Analysis
  getTemplateAnalytics(templateId: string, tenantId: string): Promise<{
    usageCount: number;
    avgResponseTime?: number;
    avgResolutionTime?: number;
    successRate?: number;
    userSatisfaction?: number;
    commonIssues: string[];
    fieldUsageStats: Record<string, number>;
  }>;

  getFieldAnalytics(tenantId: string): Promise<{
    mostUsedFields: Array<{ name: string; type: string; count: number }>;
    fieldTypeDistribution: Record<string, number>;
    validationUsage: Record<string, number>;
    conditionalLogicUsage: number;
  }>;

  // Permission Management
  updatePermissions(templateId: string, tenantId: string, permissions: Array<{
    roleId: string;
    roleName: string;
    permissions: string[];
    grantedBy: string;
  }>): Promise<boolean>;

  checkPermission(templateId: string, tenantId: string, userRole: string, permission: string): Promise<boolean>;
  getTemplatesForRole(tenantId: string, userRole: string, permission?: string): Promise<TicketTemplate[]>;

  // Template Versions and History
  createVersion(templateId: string, tenantId: string, versionData: {
    version: string;
    changes: string;
    changeType: 'major' | 'minor' | 'patch' | 'hotfix';
    changedBy: string;
  }): Promise<boolean>;

  getVersionHistory(templateId: string, tenantId: string): Promise<Array<{
    version: string;
    changes: string;
    changeType: string;
    changedBy: string;
    changedAt: Date;
    templateData?: any;
  }>>;

  restoreVersion(templateId: string, tenantId: string, version: string, restoredBy: string): Promise<boolean>;

  // Template Cloning and Duplication
  cloneTemplate(sourceId: string, tenantId: string, cloneData: {
    name: string;
    companyId?: string;
    clonedBy: string;
    includeAutomation?: boolean;
    includeWorkflow?: boolean;
  }): Promise<TicketTemplate>;

  duplicateTemplate(sourceId: string, tenantId: string, newName: string, duplicatedBy: string): Promise<TicketTemplate>;

  // Template Export/Import
  exportTemplate(templateId: string, tenantId: string): Promise<{
    template: TicketTemplate;
    metadata: {
      exportedAt: Date;
      exportedBy: string;
      version: string;
    };
  }>;

  importTemplate(templateData: any, tenantId: string, importedBy: string, options?: {
    overwriteExisting?: boolean;
    preserveIds?: boolean;
    updateMetadata?: boolean;
  }): Promise<{
    imported: TicketTemplate;
    warnings: string[];
    errors: string[];
  }>;

  // Bulk Operations
  bulkCreate(templates: Omit<TicketTemplate, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TicketTemplate[]>;
  bulkUpdate(updates: Array<{
    id: string;
    tenantId: string;
    updates: Partial<TicketTemplate>;
  }>): Promise<TicketTemplate[]>;

  bulkDelete(ids: string[], tenantId: string): Promise<boolean>;
  bulkChangeStatus(ids: string[], tenantId: string, status: string, changedBy: string): Promise<boolean>;

  // Template Validation and Health
  validateTemplate(template: Partial<TicketTemplate>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  getTemplateHealth(templateId: string, tenantId: string): Promise<{
    status: 'healthy' | 'warning' | 'error';
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      field?: string;
    }>;
    recommendations: string[];
  }>;

  // User Feedback
  addUserFeedback(templateId: string, tenantId: string, feedback: {
    userId: string;
    userName: string;
    rating: number;
    comment?: string;
  }): Promise<UserFeedback>;

  getUserFeedback(templateId: string, tenantId: string, limit?: number): Promise<UserFeedback[]>;
  getAverageRating(templateId: string, tenantId: string): Promise<number>;

  // Template Recommendations
  getRecommendedTemplates(tenantId: string, criteria: {
    userId?: string;
    category?: string;
    companyId?: string;
    previousTickets?: string[];
    limit?: number;
  }): Promise<TicketTemplate[]>;

  getSimilarTemplates(templateId: string, tenantId: string, limit?: number): Promise<TicketTemplate[]>;

  // Automation and Workflow Analysis
  getAutomationUsage(tenantId: string): Promise<{
    templatesWithAutomation: number;
    autoAssignmentUsage: number;
    escalationUsage: number;
    slaUsage: number;
    notificationUsage: number;
  }>;

  getWorkflowAnalytics(tenantId: string): Promise<{
    templatesWithWorkflow: number;
    averageStages: number;
    approvalUsage: number;
    automationIntegration: number;
  }>;

  // Performance Metrics
  getPerformanceMetrics(templateId: string, tenantId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    avgCreationTime: number;
    avgFirstResponseTime: number;
    avgResolutionTime: number;
    completionRate: number;
    customerSatisfaction: number;
    escalationRate: number;
  }>;

  // Template Dependencies
  findDependencies(templateId: string, tenantId: string): Promise<{
    usedByWorkflows: string[];
    referencedByAutomation: string[];
    linkedTemplates: string[];
  }>;

  // Cleanup and Maintenance
  cleanupUnusedTemplates(tenantId: string, daysUnused: number): Promise<{
    cleaned: number;
    templates: string[];
  }>;

  archiveTemplate(templateId: string, tenantId: string, archivedBy: string, reason?: string): Promise<boolean>;
  restoreTemplate(templateId: string, tenantId: string, restoredBy: string): Promise<boolean>;

  // System Templates
  getSystemTemplates(): Promise<TicketTemplate[]>;
  createSystemTemplate(template: Omit<TicketTemplate, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'isSystem'>): Promise<TicketTemplate>;
  updateSystemTemplate(id: string, updates: Partial<TicketTemplate>): Promise<TicketTemplate | null>;
}