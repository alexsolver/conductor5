/**
 * Field Layout Repository Interface
 * Clean Architecture - Domain Layer
 * 
 * @module IFieldLayoutRepository
 * @created 2025-08-12 - Phase 21 Clean Architecture Implementation
 */

import { FieldLayout, LayoutFeedback } from '../entities/FieldLayout';

export interface IFieldLayoutRepository {
  // Basic CRUD Operations
  create(layout: Omit<FieldLayout, 'id' | 'createdAt' | 'updatedAt'>): Promise<FieldLayout>;
  findById(id: string, tenantId: string): Promise<FieldLayout | null>;
  findByName(name: string, tenantId: string): Promise<FieldLayout | null>;
  update(id: string, tenantId: string, updates: Partial<FieldLayout>): Promise<FieldLayout | null>;
  delete(id: string, tenantId: string): Promise<boolean>;

  // Query Operations
  findAll(tenantId: string, filters?: {
    module?: string;
    status?: string;
    isDefault?: boolean;
    isSystem?: boolean;
    tags?: string[];
  }): Promise<FieldLayout[]>;

  findByModule(tenantId: string, module: string): Promise<FieldLayout[]>;
  findActive(tenantId: string): Promise<FieldLayout[]>;
  findDefault(tenantId: string, module?: string): Promise<FieldLayout[]>;
  findSystem(tenantId: string): Promise<FieldLayout[]>;

  // Search Operations
  search(tenantId: string, query: string, filters?: {
    module?: string;
    tags?: string[];
  }): Promise<FieldLayout[]>;

  searchByFields(tenantId: string, fieldNames: string[]): Promise<FieldLayout[]>;

  // Usage Operations
  incrementUsageCount(id: string, tenantId: string): Promise<boolean>;
  updateLastUsed(id: string, tenantId: string): Promise<boolean>;
  
  getUsageStatistics(tenantId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalUsage: number;
    popularLayouts: Array<{
      layout: FieldLayout;
      usageCount: number;
      lastUsed?: Date;
    }>;
    usageByModule: Record<string, number>;
    averageComplexity: number;
    performanceMetrics: {
      averageRenderTime: number;
      averageLoadTime: number;
      memoryUsage: number;
    };
  }>;

  getMostUsedLayouts(tenantId: string, limit?: number): Promise<FieldLayout[]>;
  getLeastUsedLayouts(tenantId: string, limit?: number): Promise<FieldLayout[]>;

  // Layout Analysis
  getLayoutAnalytics(layoutId: string, tenantId: string): Promise<{
    usageCount: number;
    averageRenderTime: number;
    averageLoadTime: number;
    userSatisfaction: number;
    commonIssues: string[];
    fieldUsageStats: Record<string, number>;
    sectionUsageStats: Record<string, number>;
    performanceIssues: string[];
  }>;

  getFieldAnalytics(tenantId: string): Promise<{
    mostUsedFields: Array<{ name: string; type: string; count: number }>;
    fieldTypeDistribution: Record<string, number>;
    validationUsage: Record<string, number>;
    conditionalLogicUsage: number;
    stylingUsage: Record<string, number>;
  }>;

  // Module Integration
  getModuleLayouts(tenantId: string, module: string, includeInactive?: boolean): Promise<FieldLayout[]>;
  getCompatibleLayouts(tenantId: string, moduleFields: string[]): Promise<Array<{
    layout: FieldLayout;
    compatibility: {
      compatible: boolean;
      missingFields: string[];
      unusedFields: string[];
    };
  }>>;

  // Layout Versions and History
  createVersion(layoutId: string, tenantId: string, versionData: {
    version: string;
    changes: string;
    changeType: 'major' | 'minor' | 'patch' | 'config';
    changedBy: string;
    affectedSections: string[];
    affectedFields: string[];
  }): Promise<boolean>;

  getVersionHistory(layoutId: string, tenantId: string): Promise<Array<{
    version: string;
    changes: string;
    changeType: string;
    changedBy: string;
    changedAt: Date;
    affectedSections: string[];
    affectedFields: string[];
    layoutData?: any;
  }>>;

  restoreVersion(layoutId: string, tenantId: string, version: string, restoredBy: string): Promise<boolean>;

  // Layout Cloning and Templates
  cloneLayout(sourceId: string, tenantId: string, cloneData: {
    name: string;
    module?: string;
    clonedBy: string;
    includeSettings?: boolean;
    includeStyling?: boolean;
  }): Promise<FieldLayout>;

  duplicateLayout(sourceId: string, tenantId: string, newName: string, duplicatedBy: string): Promise<FieldLayout>;

  // Layout Export/Import
  exportLayout(layoutId: string, tenantId: string): Promise<{
    layout: FieldLayout;
    metadata: {
      exportedAt: Date;
      exportedBy: string;
      version: string;
      compatibility: string[];
    };
  }>;

  importLayout(layoutData: any, tenantId: string, importedBy: string, options?: {
    overwriteExisting?: boolean;
    preserveIds?: boolean;
    updateModule?: string;
  }): Promise<{
    imported: FieldLayout;
    warnings: string[];
    errors: string[];
  }>;

  // Bulk Operations
  bulkCreate(layouts: Omit<FieldLayout, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<FieldLayout[]>;
  bulkUpdate(updates: Array<{
    id: string;
    tenantId: string;
    updates: Partial<FieldLayout>;
  }>): Promise<FieldLayout[]>;

  bulkDelete(ids: string[], tenantId: string): Promise<boolean>;
  bulkChangeStatus(ids: string[], tenantId: string, status: string, changedBy: string): Promise<boolean>;

  // Layout Validation and Health
  validateLayout(layout: Partial<FieldLayout>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  getLayoutHealth(layoutId: string, tenantId: string): Promise<{
    status: 'healthy' | 'warning' | 'error';
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      section?: string;
      field?: string;
    }>;
    recommendations: string[];
    performanceScore: number;
    accessibilityScore: number;
  }>;

  // User Feedback
  addLayoutFeedback(layoutId: string, tenantId: string, feedback: {
    userId: string;
    userName: string;
    rating: number;
    comment?: string;
    category: 'usability' | 'performance' | 'design' | 'accessibility' | 'bugs';
  }): Promise<LayoutFeedback>;

  getLayoutFeedback(layoutId: string, tenantId: string, limit?: number): Promise<LayoutFeedback[]>;
  getAverageRating(layoutId: string, tenantId: string): Promise<number>;

  // Layout Recommendations
  getRecommendedLayouts(tenantId: string, criteria: {
    module?: string;
    userId?: string;
    complexity?: 'simple' | 'medium' | 'complex';
    features?: string[];
    limit?: number;
  }): Promise<FieldLayout[]>;

  getSimilarLayouts(layoutId: string, tenantId: string, limit?: number): Promise<FieldLayout[]>;

  // Performance and Optimization
  getPerformanceMetrics(layoutId: string, tenantId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    averageRenderTime: number;
    averageLoadTime: number;
    memoryUsage: number;
    errorRate: number;
    userSatisfaction: number;
    optimizationOpportunities: string[];
  }>;

  optimizeLayout(layoutId: string, tenantId: string): Promise<{
    optimizedLayout: FieldLayout;
    optimizations: string[];
    performanceGain: number;
  }>;

  // Accessibility and Compliance
  getAccessibilityReport(layoutId: string, tenantId: string): Promise<{
    score: number;
    level: 'A' | 'AA' | 'AAA' | 'Non-compliant';
    issues: string[];
    recommendations: string[];
    compliance: Record<string, boolean>;
  }>;

  validateAccessibility(layoutId: string, tenantId: string): Promise<{
    isCompliant: boolean;
    level: string;
    violations: Array<{
      rule: string;
      severity: 'error' | 'warning';
      element: string;
      suggestion: string;
    }>;
  }>;

  // Template Management
  createTemplate(layoutId: string, tenantId: string, templateData: {
    name: string;
    description?: string;
    category: string;
    tags: string[];
    isPublic: boolean;
    createdBy: string;
  }): Promise<{
    templateId: string;
    layout: FieldLayout;
  }>;

  getTemplates(tenantId: string, category?: string): Promise<Array<{
    templateId: string;
    layout: FieldLayout;
    category: string;
    isPublic: boolean;
    usageCount: number;
  }>>;

  // Layout Dependencies
  findDependencies(layoutId: string, tenantId: string): Promise<{
    usedByModules: string[];
    referencedFields: string[];
    dependentLayouts: string[];
  }>;

  // Cleanup and Maintenance
  cleanupUnusedLayouts(tenantId: string, daysUnused: number): Promise<{
    cleaned: number;
    layouts: string[];
  }>;

  archiveLayout(layoutId: string, tenantId: string, archivedBy: string, reason?: string): Promise<boolean>;
  restoreLayout(layoutId: string, tenantId: string, restoredBy: string): Promise<boolean>;

  // Responsive and Mobile
  getResponsiveConfig(layoutId: string, tenantId: string): Promise<{
    desktop: any;
    tablet: any;
    mobile: any;
    breakpoints: Record<string, string>;
  }>;

  updateResponsiveSettings(layoutId: string, tenantId: string, settings: {
    mobileLayout?: any;
    tabletLayout?: any;
    accessibility?: any;
  }): Promise<boolean>;

  // System Layouts
  getSystemLayouts(): Promise<FieldLayout[]>;
  createSystemLayout(layout: Omit<FieldLayout, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'isSystem'>): Promise<FieldLayout>;
  updateSystemLayout(id: string, updates: Partial<FieldLayout>): Promise<FieldLayout | null>;
}