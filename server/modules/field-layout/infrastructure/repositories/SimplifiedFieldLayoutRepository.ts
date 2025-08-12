/**
 * Simplified Field Layout Repository
 * Clean Architecture - Infrastructure Layer
 * 
 * @module SimplifiedFieldLayoutRepository
 * @created 2025-08-12 - Phase 21 Clean Architecture Implementation
 */

import { IFieldLayoutRepository } from '../../domain/repositories/IFieldLayoutRepository';
import { FieldLayout, LayoutFeedback, FieldLayoutDomainService } from '../../domain/entities/FieldLayout';

export class SimplifiedFieldLayoutRepository implements IFieldLayoutRepository {
  private layouts: Map<string, FieldLayout> = new Map();
  private feedback: Map<string, LayoutFeedback[]> = new Map();

  constructor() {
    this.initializeWithMockData();
  }

  // Basic CRUD Operations
  async create(layout: Omit<FieldLayout, 'id' | 'createdAt' | 'updatedAt'>): Promise<FieldLayout> {
    const id = `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newLayout: FieldLayout = {
      ...layout,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.layouts.set(id, newLayout);
    return newLayout;
  }

  async findById(id: string, tenantId: string): Promise<FieldLayout | null> {
    const layout = this.layouts.get(id);
    return layout && layout.tenantId === tenantId ? layout : null;
  }

  async findByName(name: string, tenantId: string): Promise<FieldLayout | null> {
    for (const layout of this.layouts.values()) {
      if (layout.name === name && layout.tenantId === tenantId) {
        return layout;
      }
    }
    return null;
  }

  async update(id: string, tenantId: string, updates: Partial<FieldLayout>): Promise<FieldLayout | null> {
    const layout = await this.findById(id, tenantId);
    if (!layout) return null;

    const updatedLayout = {
      ...layout,
      ...updates,
      id: layout.id, // Preserve ID
      createdAt: layout.createdAt, // Preserve creation date
      updatedAt: new Date()
    };

    this.layouts.set(id, updatedLayout);
    return updatedLayout;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const layout = await this.findById(id, tenantId);
    if (!layout) return false;

    this.layouts.delete(id);
    this.feedback.delete(id);
    return true;
  }

  // Query Operations
  async findAll(tenantId: string, filters?: {
    module?: string;
    status?: string;
    isDefault?: boolean;
    isSystem?: boolean;
    tags?: string[];
  }): Promise<FieldLayout[]> {
    let results = Array.from(this.layouts.values())
      .filter(layout => layout.tenantId === tenantId);

    if (filters) {
      if (filters.module) {
        results = results.filter(layout => layout.module === filters.module);
      }
      if (filters.status) {
        results = results.filter(layout => layout.status === filters.status);
      }
      if (filters.isDefault !== undefined) {
        results = results.filter(layout => layout.isDefault === filters.isDefault);
      }
      if (filters.isSystem !== undefined) {
        results = results.filter(layout => layout.isSystem === filters.isSystem);
      }
      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(layout => 
          filters.tags!.some(tag => layout.tags.includes(tag))
        );
      }
    }

    return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async findByModule(tenantId: string, module: string): Promise<FieldLayout[]> {
    return this.findAll(tenantId, { module });
  }

  async findActive(tenantId: string): Promise<FieldLayout[]> {
    return this.findAll(tenantId, { status: 'active' });
  }

  async findDefault(tenantId: string, module?: string): Promise<FieldLayout[]> {
    return this.findAll(tenantId, { isDefault: true, module });
  }

  async findSystem(tenantId: string): Promise<FieldLayout[]> {
    return this.findAll(tenantId, { isSystem: true });
  }

  // Search Operations
  async search(tenantId: string, query: string, filters?: {
    module?: string;
    tags?: string[];
  }): Promise<FieldLayout[]> {
    const lowerQuery = query.toLowerCase();
    let results = Array.from(this.layouts.values())
      .filter(layout => 
        layout.tenantId === tenantId &&
        (layout.name.toLowerCase().includes(lowerQuery) ||
         layout.description?.toLowerCase().includes(lowerQuery) ||
         layout.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      );

    if (filters) {
      if (filters.module) {
        results = results.filter(layout => layout.module === filters.module);
      }
      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(layout => 
          filters.tags!.some(tag => layout.tags.includes(tag))
        );
      }
    }

    return results;
  }

  async searchByFields(tenantId: string, fieldNames: string[]): Promise<FieldLayout[]> {
    return Array.from(this.layouts.values())
      .filter(layout => 
        layout.tenantId === tenantId &&
        layout.sections.some(section =>
          section.fields.some(field =>
            fieldNames.includes(field.fieldName)
          )
        )
      );
  }

  // Usage Operations
  async incrementUsageCount(id: string, tenantId: string): Promise<boolean> {
    const layout = await this.findById(id, tenantId);
    if (!layout) return false;

    layout.metadata.usage.usageCount++;
    layout.metadata.usage.lastUsed = new Date();
    
    await this.update(id, tenantId, { metadata: layout.metadata });
    return true;
  }

  async updateLastUsed(id: string, tenantId: string): Promise<boolean> {
    const layout = await this.findById(id, tenantId);
    if (!layout) return false;

    layout.metadata.usage.lastUsed = new Date();
    await this.update(id, tenantId, { metadata: layout.metadata });
    return true;
  }

  async getUsageStatistics(tenantId: string, timeRange?: {
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
  }> {
    const layouts = await this.findAll(tenantId);
    
    const totalUsage = layouts.reduce((sum, layout) => 
      sum + layout.metadata.usage.usageCount, 0
    );

    const popularLayouts = layouts
      .map(layout => ({
        layout,
        usageCount: layout.metadata.usage.usageCount,
        lastUsed: layout.metadata.usage.lastUsed
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    const usageByModule = layouts.reduce((acc, layout) => {
      acc[layout.module] = (acc[layout.module] || 0) + layout.metadata.usage.usageCount;
      return acc;
    }, {} as Record<string, number>);

    const totalComplexity = layouts.reduce((sum, layout) => 
      sum + layout.metadata.performance.complexityScore, 0
    );
    const averageComplexity = layouts.length > 0 ? totalComplexity / layouts.length : 0;

    const performanceMetrics = {
      averageRenderTime: layouts.reduce((sum, layout) => 
        sum + layout.metadata.performance.averageRenderTime, 0) / layouts.length || 0,
      averageLoadTime: layouts.reduce((sum, layout) => 
        sum + layout.metadata.performance.averageLoadTime, 0) / layouts.length || 0,
      memoryUsage: layouts.reduce((sum, layout) => 
        sum + layout.metadata.performance.memoryUsage, 0) / layouts.length || 0
    };

    return {
      totalUsage,
      popularLayouts,
      usageByModule,
      averageComplexity,
      performanceMetrics
    };
  }

  async getMostUsedLayouts(tenantId: string, limit: number = 10): Promise<FieldLayout[]> {
    const layouts = await this.findAll(tenantId);
    return layouts
      .sort((a, b) => b.metadata.usage.usageCount - a.metadata.usage.usageCount)
      .slice(0, limit);
  }

  async getLeastUsedLayouts(tenantId: string, limit: number = 10): Promise<FieldLayout[]> {
    const layouts = await this.findAll(tenantId);
    return layouts
      .sort((a, b) => a.metadata.usage.usageCount - b.metadata.usage.usageCount)
      .slice(0, limit);
  }

  // Layout Analysis
  async getLayoutAnalytics(layoutId: string, tenantId: string): Promise<{
    usageCount: number;
    averageRenderTime: number;
    averageLoadTime: number;
    userSatisfaction: number;
    commonIssues: string[];
    fieldUsageStats: Record<string, number>;
    sectionUsageStats: Record<string, number>;
    performanceIssues: string[];
  }> {
    const layout = await this.findById(layoutId, tenantId);
    if (!layout) throw new Error('Layout not found');

    const feedback = this.feedback.get(layoutId) || [];
    const averageRating = feedback.length > 0 ? 
      feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0;

    const fieldUsageStats = layout.sections.reduce((acc, section) => {
      section.fields.forEach(field => {
        acc[field.fieldName] = (acc[field.fieldName] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const sectionUsageStats = layout.sections.reduce((acc, section) => {
      acc[section.name] = 1; // Mock usage count
      return acc;
    }, {} as Record<string, number>);

    return {
      usageCount: layout.metadata.usage.usageCount,
      averageRenderTime: layout.metadata.performance.averageRenderTime,
      averageLoadTime: layout.metadata.performance.averageLoadTime,
      userSatisfaction: averageRating,
      commonIssues: layout.metadata.usage.performanceIssues,
      fieldUsageStats,
      sectionUsageStats,
      performanceIssues: layout.metadata.usage.performanceIssues
    };
  }

  async getFieldAnalytics(tenantId: string): Promise<{
    mostUsedFields: Array<{ name: string; type: string; count: number }>;
    fieldTypeDistribution: Record<string, number>;
    validationUsage: Record<string, number>;
    conditionalLogicUsage: number;
    stylingUsage: Record<string, number>;
  }> {
    const layouts = await this.findAll(tenantId);
    const fieldUsage = new Map<string, { type: string; count: number }>();
    const fieldTypeDistribution: Record<string, number> = {};
    const validationUsage: Record<string, number> = {};
    const stylingUsage: Record<string, number> = {};
    let conditionalLogicUsage = 0;

    layouts.forEach(layout => {
      layout.sections.forEach(section => {
        section.fields.forEach(field => {
          // Field usage
          const key = `${field.fieldName}_${field.fieldType}`;
          const existing = fieldUsage.get(key);
          if (existing) {
            existing.count++;
          } else {
            fieldUsage.set(key, { type: field.fieldType, count: 1 });
          }

          // Field type distribution
          fieldTypeDistribution[field.fieldType] = 
            (fieldTypeDistribution[field.fieldType] || 0) + 1;

          // Validation usage
          if (field.validation?.rules) {
            field.validation.rules.forEach(rule => {
              validationUsage[rule.type] = (validationUsage[rule.type] || 0) + 1;
            });
          }

          // Conditional logic usage
          if (field.conditional) {
            conditionalLogicUsage++;
          }

          // Styling usage
          if (field.styling?.customCss) {
            stylingUsage['customCss'] = (stylingUsage['customCss'] || 0) + 1;
          }
          if (field.styling?.className) {
            stylingUsage['className'] = (stylingUsage['className'] || 0) + 1;
          }
        });
      });
    });

    const mostUsedFields = Array.from(fieldUsage.entries())
      .map(([key, value]) => ({
        name: key.split('_')[0],
        type: value.type,
        count: value.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      mostUsedFields,
      fieldTypeDistribution,
      validationUsage,
      conditionalLogicUsage,
      stylingUsage
    };
  }

  // Module Integration (simplified implementations)
  async getModuleLayouts(tenantId: string, module: string, includeInactive: boolean = false): Promise<FieldLayout[]> {
    const filters: any = { module };
    if (!includeInactive) {
      filters.status = 'active';
    }
    return this.findAll(tenantId, filters);
  }

  async getCompatibleLayouts(tenantId: string, moduleFields: string[]): Promise<Array<{
    layout: FieldLayout;
    compatibility: {
      compatible: boolean;
      missingFields: string[];
      unusedFields: string[];
    };
  }>> {
    const layouts = await this.findAll(tenantId);
    return layouts.map(layout => ({
      layout,
      compatibility: FieldLayoutDomainService.isCompatibleWithModule(layout, moduleFields)
    }));
  }

  // Simplified implementations for other methods
  async createVersion(): Promise<boolean> { return true; }
  async getVersionHistory(): Promise<any[]> { return []; }
  async restoreVersion(): Promise<boolean> { return true; }
  async cloneLayout(sourceId: string, tenantId: string, cloneData: any): Promise<FieldLayout> {
    const source = await this.findById(sourceId, tenantId);
    if (!source) throw new Error('Source layout not found');
    
    const cloned = await this.create({
      ...source,
      name: cloneData.name,
      module: cloneData.module || source.module,
      createdBy: cloneData.clonedBy,
      metadata: {
        ...source.metadata,
        author: cloneData.clonedBy,
        lastModifiedBy: cloneData.clonedBy,
        lastModifiedAt: new Date(),
        usage: {
          usageCount: 0,
          popularSections: [],
          problematicFields: [],
          userFeedback: [],
          performanceIssues: []
        }
      }
    });
    
    return cloned;
  }

  async duplicateLayout(sourceId: string, tenantId: string, newName: string, duplicatedBy: string): Promise<FieldLayout> {
    return this.cloneLayout(sourceId, tenantId, { name: newName, clonedBy: duplicatedBy });
  }

  async exportLayout(layoutId: string, tenantId: string): Promise<any> {
    const layout = await this.findById(layoutId, tenantId);
    if (!layout) throw new Error('Layout not found');
    
    return {
      layout,
      metadata: {
        exportedAt: new Date(),
        exportedBy: 'system',
        version: layout.version,
        compatibility: ['v1.0+']
      }
    };
  }

  async importLayout(layoutData: any, tenantId: string, importedBy: string): Promise<any> {
    const imported = await this.create({
      ...layoutData.layout,
      tenantId,
      createdBy: importedBy
    });
    
    return {
      imported,
      warnings: [],
      errors: []
    };
  }

  async bulkCreate(layouts: Omit<FieldLayout, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<FieldLayout[]> {
    const results = [];
    for (const layout of layouts) {
      results.push(await this.create(layout));
    }
    return results;
  }

  async bulkUpdate(updates: Array<{ id: string; tenantId: string; updates: Partial<FieldLayout> }>): Promise<FieldLayout[]> {
    const results = [];
    for (const update of updates) {
      const result = await this.update(update.id, update.tenantId, update.updates);
      if (result) results.push(result);
    }
    return results;
  }

  async bulkDelete(ids: string[], tenantId: string): Promise<boolean> {
    for (const id of ids) {
      await this.delete(id, tenantId);
    }
    return true;
  }

  async bulkChangeStatus(ids: string[], tenantId: string, status: string): Promise<boolean> {
    for (const id of ids) {
      await this.update(id, tenantId, { status: status as any });
    }
    return true;
  }

  async validateLayout(layout: Partial<FieldLayout>): Promise<any> {
    return FieldLayoutDomainService.validateLayout(layout);
  }

  async getLayoutHealth(layoutId: string, tenantId: string): Promise<any> {
    const layout = await this.findById(layoutId, tenantId);
    if (!layout) throw new Error('Layout not found');

    const accessibilityReport = FieldLayoutDomainService.generateAccessibilityReport(layout);
    const complexityScore = FieldLayoutDomainService.calculateComplexityScore(layout);

    return {
      status: complexityScore < 70 ? 'healthy' : 'warning',
      issues: accessibilityReport.issues.map(issue => ({
        type: 'warning',
        message: issue
      })),
      recommendations: accessibilityReport.recommendations,
      performanceScore: Math.max(0, 100 - complexityScore),
      accessibilityScore: accessibilityReport.score
    };
  }

  async addLayoutFeedback(layoutId: string, tenantId: string, feedback: any): Promise<LayoutFeedback> {
    const newFeedback: LayoutFeedback = {
      id: `feedback_${Date.now()}`,
      userId: feedback.userId,
      userName: feedback.userName,
      rating: feedback.rating,
      comment: feedback.comment,
      category: feedback.category,
      submittedAt: new Date(),
      resolved: false
    };

    const existingFeedback = this.feedback.get(layoutId) || [];
    existingFeedback.push(newFeedback);
    this.feedback.set(layoutId, existingFeedback);

    return newFeedback;
  }

  async getLayoutFeedback(layoutId: string, tenantId: string, limit: number = 50): Promise<LayoutFeedback[]> {
    const feedback = this.feedback.get(layoutId) || [];
    return feedback.slice(0, limit);
  }

  async getAverageRating(layoutId: string, tenantId: string): Promise<number> {
    const feedback = this.feedback.get(layoutId) || [];
    if (feedback.length === 0) return 0;
    
    const total = feedback.reduce((sum, f) => sum + f.rating, 0);
    return total / feedback.length;
  }

  // Simplified implementations for remaining methods
  async getRecommendedLayouts(): Promise<FieldLayout[]> { return []; }
  async getSimilarLayouts(): Promise<FieldLayout[]> { return []; }
  async getPerformanceMetrics(): Promise<any> { return {}; }
  async optimizeLayout(): Promise<any> { return {}; }
  async getAccessibilityReport(layoutId: string, tenantId: string): Promise<any> {
    const layout = await this.findById(layoutId, tenantId);
    if (!layout) throw new Error('Layout not found');
    
    return FieldLayoutDomainService.generateAccessibilityReport(layout);
  }
  async validateAccessibility(): Promise<any> { return {}; }
  async createTemplate(): Promise<any> { return {}; }
  async getTemplates(): Promise<any[]> { return []; }
  async findDependencies(): Promise<any> { return {}; }
  async cleanupUnusedLayouts(): Promise<any> { return {}; }
  async archiveLayout(): Promise<boolean> { return true; }
  async restoreLayout(): Promise<boolean> { return true; }
  async getResponsiveConfig(layoutId: string, tenantId: string): Promise<any> {
    const layout = await this.findById(layoutId, tenantId);
    if (!layout) throw new Error('Layout not found');
    
    return FieldLayoutDomainService.generateResponsiveConfig(layout);
  }
  async updateResponsiveSettings(): Promise<boolean> { return true; }
  async getSystemLayouts(): Promise<FieldLayout[]> { return []; }
  async createSystemLayout(): Promise<FieldLayout> { throw new Error('Not implemented'); }
  async updateSystemLayout(): Promise<FieldLayout | null> { return null; }

  private initializeWithMockData(): void {
    const mockLayouts = this.generateMockLayouts();
    mockLayouts.forEach(layout => {
      this.layouts.set(layout.id, layout);
    });
  }

  private generateMockLayouts(): FieldLayout[] {
    const tenantId = "3f99462f-3621-4b1b-bea8-782acc50d62e";
    const now = new Date();

    return [
      {
        id: "layout_tickets_default",
        tenantId,
        name: "Default Ticket Layout",
        description: "Standard layout for ticket forms",
        module: "tickets",
        sections: [
          {
            id: "section_basic",
            name: "basic_info",
            label: "Basic Information",
            description: "Essential ticket information",
            order: 1,
            columns: 2,
            collapsible: false,
            collapsed: false,
            styling: {},
            permissions: [],
            fields: [
              {
                id: "field_title",
                fieldId: "title",
                fieldName: "title",
                fieldType: "text",
                position: { section: "basic_info", row: 1, column: 1, colspan: 2, order: 1 },
                sizing: { width: "full", height: "auto" },
                styling: { labelPosition: "top" },
                behavior: { required: true, readonly: false, disabled: false, hidden: false, focusable: true, autoFocus: false, clearable: false, searchable: false },
                placeholder: "Enter ticket title"
              },
              {
                id: "field_description",
                fieldId: "description",
                fieldName: "description",
                fieldType: "textarea",
                position: { section: "basic_info", row: 2, column: 1, colspan: 2, order: 2 },
                sizing: { width: "full", height: "medium" },
                styling: { labelPosition: "top" },
                behavior: { required: true, readonly: false, disabled: false, hidden: false, focusable: true, autoFocus: false, clearable: false, searchable: false },
                placeholder: "Describe the issue"
              }
            ]
          }
        ],
        settings: {
          responsive: true,
          mobileLayout: {
            stackSections: true,
            columnsToSingle: true,
            hiddenFields: [],
            collapseSections: false,
            showLabelsInline: false
          },
          tabletLayout: {
            maxColumns: 2,
            adaptiveSpacing: true,
            adjustFontSize: false,
            compactMode: false
          },
          accessibility: {
            highContrast: false,
            largeText: false,
            keyboardNavigation: true,
            screenReaderOptimized: true,
            ariaLabels: true,
            focusIndicators: true
          },
          performance: {
            lazyLoading: false,
            virtualScrolling: false,
            deferredRendering: false,
            cacheLayout: true,
            optimizeImages: true
          },
          validation: {
            validateOnMount: false,
            showValidationSummary: true,
            groupValidationErrors: true,
            highlightInvalidFields: true,
            scrollToFirstError: true
          }
        },
        metadata: {
          version: "1.0.0",
          author: "system",
          lastModifiedBy: "system",
          lastModifiedAt: now,
          changeLog: [],
          usage: {
            usageCount: 156,
            popularSections: ["basic_info"],
            problematicFields: [],
            userFeedback: [],
            performanceIssues: []
          },
          performance: {
            averageRenderTime: 45,
            averageLoadTime: 120,
            memoryUsage: 2.1,
            fieldCount: 2,
            sectionCount: 1,
            complexityScore: 25
          },
          compatibility: {
            browserSupport: ["Chrome", "Firefox", "Safari", "Edge"],
            mobileSupport: true,
            accessibilityLevel: "AA",
            supportedThemes: ["default", "dark"],
            requiredFeatures: []
          }
        },
        isDefault: true,
        isSystem: true,
        status: "active",
        version: "1.0.0",
        tags: ["tickets", "default", "basic"],
        createdBy: "system",
        createdAt: now,
        updatedAt: now,
        isActive: true
      },
      {
        id: "layout_customers_advanced",
        tenantId,
        name: "Advanced Customer Layout",
        description: "Comprehensive customer data entry form",
        module: "customers",
        sections: [
          {
            id: "section_personal",
            name: "personal_info",
            label: "Personal Information",
            order: 1,
            columns: 3,
            collapsible: false,
            collapsed: false,
            styling: {},
            permissions: [],
            fields: [
              {
                id: "field_name",
                fieldId: "name",
                fieldName: "name",
                fieldType: "text",
                position: { section: "personal_info", row: 1, column: 1, colspan: 1, order: 1 },
                sizing: { width: "auto", height: "auto" },
                styling: { labelPosition: "top" },
                behavior: { required: true, readonly: false, disabled: false, hidden: false, focusable: true, autoFocus: true, clearable: false, searchable: false }
              },
              {
                id: "field_email",
                fieldId: "email",
                fieldName: "email",
                fieldType: "email",
                position: { section: "personal_info", row: 1, column: 2, colspan: 1, order: 2 },
                sizing: { width: "auto", height: "auto" },
                styling: { labelPosition: "top" },
                behavior: { required: true, readonly: false, disabled: false, hidden: false, focusable: true, autoFocus: false, clearable: true, searchable: false }
              },
              {
                id: "field_phone",
                fieldId: "phone",
                fieldName: "phone",
                fieldType: "phone",
                position: { section: "personal_info", row: 1, column: 3, colspan: 1, order: 3 },
                sizing: { width: "auto", height: "auto" },
                styling: { labelPosition: "top" },
                behavior: { required: false, readonly: false, disabled: false, hidden: false, focusable: true, autoFocus: false, clearable: true, searchable: false }
              }
            ]
          }
        ],
        settings: {
          responsive: true,
          mobileLayout: {
            stackSections: true,
            columnsToSingle: true,
            hiddenFields: [],
            collapseSections: true,
            showLabelsInline: false
          },
          tabletLayout: {
            maxColumns: 2,
            adaptiveSpacing: true,
            adjustFontSize: false,
            compactMode: false
          },
          accessibility: {
            highContrast: false,
            largeText: false,
            keyboardNavigation: true,
            screenReaderOptimized: true,
            ariaLabels: true,
            focusIndicators: true
          },
          performance: {
            lazyLoading: false,
            virtualScrolling: false,
            deferredRendering: false,
            cacheLayout: true,
            optimizeImages: true
          },
          validation: {
            validateOnMount: false,
            showValidationSummary: true,
            groupValidationErrors: true,
            highlightInvalidFields: true,
            scrollToFirstError: true
          }
        },
        metadata: {
          version: "1.2.0",
          author: "admin",
          lastModifiedBy: "admin",
          lastModifiedAt: now,
          changeLog: [],
          usage: {
            usageCount: 89,
            popularSections: ["personal_info"],
            problematicFields: [],
            userFeedback: [],
            performanceIssues: []
          },
          performance: {
            averageRenderTime: 52,
            averageLoadTime: 98,
            memoryUsage: 1.8,
            fieldCount: 3,
            sectionCount: 1,
            complexityScore: 35
          },
          compatibility: {
            browserSupport: ["Chrome", "Firefox", "Safari", "Edge"],
            mobileSupport: true,
            accessibilityLevel: "AAA",
            supportedThemes: ["default", "dark", "light"],
            requiredFeatures: []
          }
        },
        isDefault: false,
        isSystem: false,
        status: "active",
        version: "1.2.0",
        tags: ["customers", "advanced", "comprehensive"],
        createdBy: "550e8400-e29b-41d4-a716-446655440001",
        createdAt: now,
        updatedAt: now,
        isActive: true
      }
    ];
  }
}