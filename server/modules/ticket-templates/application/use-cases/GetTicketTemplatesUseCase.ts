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
    try {
      console.log('🎯 [GET-TEMPLATES-UC] Executing with request:', request);

      // Validate required fields following 1qa.md standards
      if (!request.tenantId) {
        throw new Error('Tenant ID is required');
      }

      if (!request.userRole) {
        throw new Error('User role is required');
      }

      // Get templates based on request parameters
      let templates: TicketTemplate[] = [];

      if (request.templateId) {
        // Get single template
        const template = await this.ticketTemplateRepository.findById(request.templateId, request.tenantId);
        templates = template ? [template] : [];
      } else if (request.companyId && request.companyId !== 'all') {
        // Get templates by company
        templates = await this.ticketTemplateRepository.findByCompany(request.companyId, request.tenantId);
      } else {
        // Get all templates for tenant
        templates = await this.ticketTemplateRepository.findByTenant(request.tenantId);
      }

      // Apply filters if provided
      if (request.filters) {
        templates = this.applyFilters(templates, request.filters);
      }

      // Apply search if provided
      if (request.search) {
        templates = this.applySearch(templates, request.search);
      }

      console.log('✅ [GET-TEMPLATES-UC] Found templates:', templates.length);

      // Prepare analytics if requested
      let analytics = undefined;
      let usageStatistics = undefined;
      let fieldAnalytics = undefined;

      if (request.includeAnalytics) {
        analytics = this.generateAnalytics(templates);
      }

      if (request.includeUsageStats) {
        usageStatistics = this.generateUsageStats(templates);
      }

      const response = {
        success: true,
        data: {
          templates,
          ...(analytics && { analytics }),
          ...(usageStatistics && { usageStatistics }),
          ...(fieldAnalytics && { fieldAnalytics })
        }
      };

      console.log('🚀 [GET-TEMPLATES-UC] Response prepared successfully');
      return response;

    } catch (error) {
      console.error('❌ [GET-TEMPLATES-UC] Error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
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
      template.description.toLowerCase().includes(searchLower) ||
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

    const averageUsage = templates.reduce((sum, t) => sum + (t.usageCount || 0), 0) / totalTemplates || 0;
    const maxUsage = Math.max(...templates.map(t => t.usageCount || 0));

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

      return {
        success: true,
        data: {
          total_templates: templates.length,
          active_templates: templates.filter(t => t.status === 'active').length,
          avg_usage: templates.reduce((sum, t) => sum + (t.usageCount || 0), 0) / templates.length || 0,
          max_usage: Math.max(...templates.map(t => t.usageCount || 0))
        }
      };
    } catch (error) {
      console.error('❌ [GET-TEMPLATES-UC] getTemplateStatsByCompany error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}