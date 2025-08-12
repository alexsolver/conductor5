/**
 * Template Hierarchy Repository Interface
 * Clean Architecture - Domain Layer
 * 
 * @module ITemplateHierarchyRepository
 * @created 2025-08-12 - Phase 19 Clean Architecture Implementation
 */

import { TemplateHierarchy, TemplateStructure, TemplateAuditEntry } from '../entities/TemplateHierarchy';

export interface ITemplateHierarchyRepository {
  // Basic CRUD Operations
  create(template: Omit<TemplateHierarchy, 'id' | 'createdAt' | 'updatedAt'>): Promise<TemplateHierarchy>;
  findById(id: string, tenantId: string): Promise<TemplateHierarchy | null>;
  findByName(name: string, tenantId: string): Promise<TemplateHierarchy | null>;
  update(id: string, tenantId: string, updates: Partial<TemplateHierarchy>): Promise<TemplateHierarchy | null>;
  delete(id: string, tenantId: string): Promise<boolean>;

  // Hierarchy Operations
  findAll(tenantId: string, filters?: {
    category?: string;
    parentId?: string;
    level?: number;
    companyId?: string;
    roleId?: string;
    isActive?: boolean;
  }): Promise<TemplateHierarchy[]>;

  findByCategory(tenantId: string, category: string, filters?: {
    companyId?: string;
    roleId?: string;
  }): Promise<TemplateHierarchy[]>;

  findChildren(parentId: string, tenantId: string): Promise<TemplateHierarchy[]>;
  findParent(childId: string, tenantId: string): Promise<TemplateHierarchy | null>;
  findRootTemplates(tenantId: string): Promise<TemplateHierarchy[]>;

  // Hierarchy Tree Operations
  getFullHierarchy(templateId: string, tenantId: string): Promise<{
    template: TemplateHierarchy;
    ancestors: TemplateHierarchy[];
    descendants: TemplateHierarchy[];
    siblings: TemplateHierarchy[];
  }>;

  getHierarchyPath(templateId: string, tenantId: string): Promise<TemplateHierarchy[]>;
  
  // Template Structure with Inheritance
  getResolvedTemplate(templateId: string, tenantId: string): Promise<{
    template: TemplateHierarchy;
    resolvedStructure: TemplateStructure;
    inheritanceChain: TemplateHierarchy[];
  }>;

  // Search and Filtering
  search(tenantId: string, query: string, filters?: {
    category?: string;
    tags?: string[];
    author?: string;
    level?: number;
  }): Promise<TemplateHierarchy[]>;

  findByPath(path: string, tenantId: string): Promise<TemplateHierarchy | null>;

  // Permission Management
  updatePermissions(templateId: string, tenantId: string, permissions: {
    roleId: string;
    permissions: string[];
    grantedBy: string;
  }[]): Promise<boolean>;

  checkPermission(templateId: string, tenantId: string, roleId: string, permission: string): Promise<boolean>;

  // Template Usage and Analytics
  incrementUsageCount(templateId: string, tenantId: string): Promise<boolean>;
  getUsageStatistics(tenantId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalUsage: number;
    popularTemplates: Array<{
      template: TemplateHierarchy;
      usageCount: number;
    }>;
    usageByCategory: Record<string, number>;
    usageByLevel: Record<number, number>;
  }>;

  // Template Versioning
  createVersion(templateId: string, tenantId: string, versionData: {
    version: string;
    changes: string;
    createdBy: string;
  }): Promise<boolean>;

  getVersionHistory(templateId: string, tenantId: string): Promise<Array<{
    version: string;
    changes: string;
    createdBy: string;
    createdAt: Date;
    templateData: TemplateStructure;
  }>>;

  restoreVersion(templateId: string, tenantId: string, version: string, restoredBy: string): Promise<boolean>;

  // Audit Trail
  addAuditEntry(templateId: string, tenantId: string, entry: Omit<TemplateAuditEntry, 'id' | 'timestamp'>): Promise<TemplateAuditEntry>;
  getAuditTrail(templateId: string, tenantId: string, limit?: number): Promise<TemplateAuditEntry[]>;

  // Bulk Operations
  bulkCreate(templates: Omit<TemplateHierarchy, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TemplateHierarchy[]>;
  bulkUpdate(updates: Array<{
    id: string;
    tenantId: string;
    updates: Partial<TemplateHierarchy>;
  }>): Promise<TemplateHierarchy[]>;

  bulkDelete(ids: string[], tenantId: string): Promise<boolean>;

  // Template Validation
  validateHierarchyIntegrity(tenantId: string): Promise<{
    isValid: boolean;
    issues: Array<{
      templateId: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  }>;

  // Template Import/Export
  exportTemplate(templateId: string, tenantId: string, includeChildren?: boolean): Promise<{
    template: TemplateHierarchy;
    children?: TemplateHierarchy[];
    metadata: {
      exportedAt: Date;
      exportedBy: string;
      version: string;
    };
  }>;

  importTemplate(templateData: any, tenantId: string, importedBy: string, options?: {
    preserveIds?: boolean;
    updateExisting?: boolean;
    createHierarchy?: boolean;
  }): Promise<{
    imported: TemplateHierarchy[];
    skipped: string[];
    errors: string[];
  }>;

  // Template Cloning
  cloneTemplate(sourceId: string, tenantId: string, cloneOptions: {
    newName: string;
    parentId?: string;
    includeChildren?: boolean;
    clonedBy: string;
  }): Promise<TemplateHierarchy>;

  // Advanced Queries
  findTemplatesWithField(fieldName: string, tenantId: string): Promise<TemplateHierarchy[]>;
  findTemplatesUsingValidation(validationType: string, tenantId: string): Promise<TemplateHierarchy[]>;
  findOrphanedTemplates(tenantId: string): Promise<TemplateHierarchy[]>;

  // Performance Optimization
  preloadHierarchy(rootTemplateIds: string[], tenantId: string): Promise<Map<string, TemplateHierarchy[]>>;
  cacheResolvedTemplate(templateId: string, tenantId: string, resolvedStructure: TemplateStructure): Promise<boolean>;
  getCachedResolvedTemplate(templateId: string, tenantId: string): Promise<TemplateStructure | null>;
}