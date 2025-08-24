/**
 * Get Ticket Templates Use Case
 * Clean Architecture - Application Layer
 *
 * @module GetTicketTemplatesUseCase
 * @created 2025-08-12 - Phase 20 Clean Architecture Implementation
 */

import { ITicketTemplateRepository } from '../../domain/repositories/ITicketTemplateRepository';
import { TicketTemplate } from '../../domain/entities/TicketTemplate';

export interface GetTicketTemplatesRequest {
  tenantId: string;
  userRole: string;
  companyId?: string;
  templateId?: string;
  filters?: {
    category?: string;
    subcategory?: string;
    templateType?: string;
    status?: string;
    departmentId?: string;
    isDefault?: boolean;
    tags?: string[];
  };
  search?: string;
  includeAnalytics?: boolean;
  includeUsageStats?: boolean;
}

export interface GetTicketTemplatesResponse {
  success: boolean;
  data?: {
    templates: TicketTemplate[];
    analytics?: any;
    usageStatistics?: any;
    fieldAnalytics?: any;
  };
  errors?: string[];
}

export class GetTicketTemplatesUseCase {
  constructor(private ticketTemplateRepository: ITicketTemplateRepository) {}

  async execute(request: GetTicketTemplatesRequest): Promise<GetTicketTemplatesResponse> {
    console.log('🎯 [GET-TEMPLATES-USE-CASE] Starting execution with request:', {
      tenantId: request.tenantId,
      userRole: request.userRole,
      companyId: request.companyId,
      hasFilters: !!request.filters
    });

    try {
      // ✅ 1QA.MD: Validate request parameters
      if (!request.tenantId || !request.userRole) {
        console.log('❌ [GET-TEMPLATES-USE-CASE] Invalid request - missing tenantId or userRole');
        return {
          success: false,
          errors: ['Tenant ID and user role are required']
        };
      }

      // Get templates based on request parameters
      let allTemplates: TicketTemplate[] = [];

      if (request.templateId) {
        // Get single template
        const template = await this.ticketTemplateRepository.findById(request.templateId, request.tenantId);
        allTemplates = template ? [template] : [];
      } else if (request.companyId && request.companyId !== 'all') {
        // Get templates by company
        allTemplates = await this.ticketTemplateRepository.findByCompany(request.tenantId, request.companyId);
      } else {
        // Get all templates for tenant (using findAll without company filter)
        allTemplates = await this.ticketTemplateRepository.findAll(request.tenantId);
      }

      // Apply filters if provided
      if (request.filters) {
        allTemplates = this.applyFilters(allTemplates, request.filters);
      }

      // Apply search if provided
      if (request.search) {
        allTemplates = this.applySearch(allTemplates, request.search);
      }

      console.log('✅ [GET-TEMPLATES-USE-CASE] Templates retrieved successfully:', {
        count: allTemplates.length,
        templateIds: allTemplates.map(t => t.id),
        companyFilter: request.companyId
      });

      // Prepare analytics if requested
      let analytics = undefined;
      let usageStats = undefined; // Renamed from usageStatistics for consistency in scope
      let fieldAnalytics = undefined;

      if (request.includeAnalytics) {
        analytics = this.generateAnalytics(allTemplates);
      }

      if (request.includeUsageStats) {
        usageStats = this.generateUsageStats(allTemplates);
      }

      // ✅ 1QA.MD: Build response with consistent structure
      const responseData: any = {
        templates: allTemplates || [] // Always ensure array
      };

      if (request.includeAnalytics && analytics) {
        responseData.analytics = analytics;
      }

      if (request.includeUsageStats && usageStats) {
        responseData.usageStatistics = usageStats;
      }

      if (fieldAnalytics) {
        responseData.fieldAnalytics = fieldAnalytics;
      }

      console.log('📤 [GET-TEMPLATES-USE-CASE] Sending response with structure:', {
        hasTemplates: Array.isArray(responseData.templates),
        templatesCount: responseData.templates?.length || 0,
        hasAnalytics: !!responseData.analytics,
        hasUsageStats: !!responseData.usageStatistics,
        success: true
      });

      return {
        success: true,
        data: responseData
      };

    } catch (error) {
      console.error('❌ [GET-TEMPLATES-USE-CASE] Uncaught error during execution:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'An unexpected error occurred']
      };
    }
  }

  private applyFilters(templates: TicketTemplate[], filters: any): TicketTemplate[] {
    return templates.filter(template => {
      if (filters.category && template.category !== filters.category) return false;
      if (filters.subcategory && template.subcategory !== filters.subcategory) return false;
      if (filters.templateType && template.templateType !== filters.templateType) return false;
      if (filters.status && template.status !== filters.status) return false;
      if (filters.departmentId && template.departmentId !== filters.departmentId) return false;
      if (filters.isDefault !== undefined && template.isDefault !== filters.isDefault) return false;
      if (filters.tags && filters.tags.length > 0) {
        const templateTags = template.tags || [];
        const hasMatchingTag = filters.tags.some((tag: string) => templateTags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      return true;
    });
  }

  private applySearch(templates: TicketTemplate[], search: string): TicketTemplate[] {
    const searchLower = search.toLowerCase();
    return templates.filter(template =>
      template.name.toLowerCase().includes(searchLower) ||
      (template.description && template.description.toLowerCase().includes(searchLower)) ||
      (template.category && template.category.toLowerCase().includes(searchLower)) ||
      (template.subcategory && template.subcategory.toLowerCase().includes(searchLower))
    );
  }

  private generateAnalytics(templates: TicketTemplate[]): any {
    const totalTemplates = templates.length;
    const activeTemplates = templates.filter(t => t.status === 'active').length;

    const templatesByCategory = templates.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const usageCounts = templates.map(t => t.usageCount || 0);
    const averageUsage = totalTemplates > 0 ? usageCounts.reduce((sum, count) => sum + count, 0) / totalTemplates : 0;
    const maxUsage = totalTemplates > 0 ? Math.max(...usageCounts) : 0;

    return {
      totalTemplates,
      activeTemplates,
      templatesByCategory,
      averageUsage: Math.round(averageUsage * 100) / 100,
      maxUsage
    };
  }

  private generateUsageStats(templates: TicketTemplate[]): any {
    const popularTemplates = templates
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 10);

    return {
      popularTemplates,
      totalUsage: templates.reduce((sum, t) => sum + (t.usageCount || 0), 0)
    };
  }

  async getTemplateStatsByCompany(companyId: string, tenantId: string): Promise<any> {
    try {
      const templates = await this.ticketTemplateRepository.findByCompany(companyId, tenantId);

      const usageCounts = templates.map(t => t.usageCount || 0);
      const avgUsage = templates.length > 0 ? usageCounts.reduce((sum, count) => sum + count, 0) / templates.length : 0;
      const maxUsage = templates.length > 0 ? Math.max(...usageCounts) : 0;

      return {
        success: true,
        data: {
          total_templates: templates.length,
          active_templates: templates.filter(t => t.status === 'active').length,
          avg_usage: Math.round(avgUsage * 100) / 100,
          max_usage: maxUsage
        }
      };
    } catch (error) {
      console.error('❌ [GET-TEMPLATES-UC] getTemplateStatsByCompany error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'An unexpected error occurred']
      };
    }
  }
}