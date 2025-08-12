/**
 * Get Field Layouts Use Case
 * Clean Architecture - Application Layer
 * 
 * @module GetFieldLayoutsUseCase
 * @created 2025-08-12 - Phase 21 Clean Architecture Implementation
 */

import { IFieldLayoutRepository } from '../../domain/repositories/IFieldLayoutRepository';
import { FieldLayout, FieldLayoutDomainService } from '../../domain/entities/FieldLayout';

export interface GetFieldLayoutsRequest {
  tenantId: string;
  layoutId?: string;
  userRole: string;
  filters?: {
    module?: string;
    status?: string;
    isDefault?: boolean;
    isSystem?: boolean;
    tags?: string[];
  };
  search?: string;
  includeAnalytics?: boolean;
  includePerformance?: boolean;
  includeAccessibility?: boolean;
}

export interface GetFieldLayoutsResponse {
  success: boolean;
  data?: {
    layouts: FieldLayout[];
    layout?: FieldLayout;
    analytics?: {
      totalLayouts: number;
      activeLayouts: number;
      averageComplexity: number;
      layoutsByModule: Record<string, number>;
      layoutsByStatus: Record<string, number>;
    };
    usageStatistics?: {
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
    };
    fieldAnalytics?: {
      mostUsedFields: Array<{ name: string; type: string; count: number }>;
      fieldTypeDistribution: Record<string, number>;
      validationUsage: Record<string, number>;
      conditionalLogicUsage: number;
      stylingUsage: Record<string, number>;
    };
    performanceReport?: any;
    accessibilityReport?: any;
  };
  errors?: string[];
}

export class GetFieldLayoutsUseCase {
  constructor(private fieldLayoutRepository: IFieldLayoutRepository) {}

  async execute(request: GetFieldLayoutsRequest): Promise<GetFieldLayoutsResponse> {
    try {
      let layouts: FieldLayout[] = [];
      let singleLayout: FieldLayout | null = null;

      // 1. Get specific layout if ID provided
      if (request.layoutId) {
        singleLayout = await this.fieldLayoutRepository.findById(
          request.layoutId,
          request.tenantId
        );

        if (!singleLayout) {
          return {
            success: false,
            errors: ['Layout not found']
          };
        }

        // Check permissions
        if (!FieldLayoutDomainService.hasLayoutPermission(singleLayout, request.userRole, 'view')) {
          return {
            success: false,
            errors: ['Insufficient permissions to view this layout']
          };
        }

        layouts = [singleLayout];
      }
      // 2. Search layouts if query provided
      else if (request.search) {
        layouts = await this.fieldLayoutRepository.search(
          request.tenantId,
          request.search,
          {
            module: request.filters?.module,
            tags: request.filters?.tags
          }
        );
      }
      // 3. Get all layouts with filters
      else {
        layouts = await this.fieldLayoutRepository.findAll(
          request.tenantId,
          request.filters
        );
      }

      // 4. Filter layouts based on permissions
      const accessibleLayouts = layouts.filter(layout =>
        FieldLayoutDomainService.hasLayoutPermission(layout, request.userRole, 'view')
      );

      // 5. Generate analytics if requested
      let analytics;
      if (request.includeAnalytics) {
        analytics = this.generateLayoutAnalytics(accessibleLayouts);
      }

      // 6. Get usage statistics if requested
      let usageStatistics;
      if (request.includeAnalytics) {
        usageStatistics = await this.fieldLayoutRepository.getUsageStatistics(request.tenantId);
      }

      // 7. Get field analytics if requested
      let fieldAnalytics;
      if (request.includeAnalytics) {
        fieldAnalytics = await this.fieldLayoutRepository.getFieldAnalytics(request.tenantId);
      }

      // 8. Get performance report for specific layout
      let performanceReport;
      if (request.includePerformance && request.layoutId) {
        performanceReport = await this.fieldLayoutRepository.getPerformanceMetrics(
          request.layoutId,
          request.tenantId
        );
      }

      // 9. Get accessibility report for specific layout
      let accessibilityReport;
      if (request.includeAccessibility && request.layoutId) {
        accessibilityReport = await this.fieldLayoutRepository.getAccessibilityReport(
          request.layoutId,
          request.tenantId
        );
      }

      return {
        success: true,
        data: {
          layouts: accessibleLayouts,
          layout: singleLayout,
          analytics,
          usageStatistics,
          fieldAnalytics,
          performanceReport,
          accessibilityReport
        }
      };

    } catch (error) {
      console.error('[GetFieldLayoutsUseCase] Error:', error);
      return {
        success: false,
        errors: ['Internal server error']
      };
    }
  }

  private generateLayoutAnalytics(layouts: FieldLayout[]): {
    totalLayouts: number;
    activeLayouts: number;
    averageComplexity: number;
    layoutsByModule: Record<string, number>;
    layoutsByStatus: Record<string, number>;
  } {
    const activeLayouts = layouts.filter(l => l.status === 'active');
    
    const totalComplexity = layouts.reduce((sum, layout) => 
      sum + FieldLayoutDomainService.calculateComplexityScore(layout), 0
    );
    const averageComplexity = layouts.length > 0 ? 
      Math.round((totalComplexity / layouts.length) * 100) / 100 : 0;

    const layoutsByModule = layouts.reduce((acc, layout) => {
      acc[layout.module] = (acc[layout.module] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const layoutsByStatus = layouts.reduce((acc, layout) => {
      acc[layout.status] = (acc[layout.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLayouts: layouts.length,
      activeLayouts: activeLayouts.length,
      averageComplexity,
      layoutsByModule,
      layoutsByStatus
    };
  }
}