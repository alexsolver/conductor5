/**
 * Get Ticket Templates Use Case
 * Clean Architecture - Application Layer
 *
 * @module GetTicketTemplatesUseCase
 * @created 2025-08-12 - Phase 20 Clean Architecture Implementation
 */

import { ITicketTemplateRepository } from '../../domain/repositories/ITicketTemplateRepository';
import { TicketTemplate, TicketTemplateDomainService } from '../../domain/entities/TicketTemplate';

export interface GetTicketTemplatesRequest {
  tenantId: string;
  templateId?: string;
  userRole: string;
  companyId?: string;
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
    template?: TicketTemplate;
    analytics?: {
      totalTemplates: number;
      activeTemplates: number;
      mostUsedTemplate: TicketTemplate | null;
      averageComplexity: number;
      templatesByCategory: Record<string, number>;
      templatesByType: Record<string, number>;
    };
    usageStatistics?: {
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
    };
    fieldAnalytics?: {
      mostUsedFields: Array<{ name: string; type: string; count: number }>;
      fieldTypeDistribution: Record<string, number>;
      validationUsage: Record<string, number>;
      conditionalLogicUsage: number;
    };
  };
  errors?: string[];
}

export class GetTicketTemplatesUseCase {
  constructor(private ticketTemplateRepository: ITicketTemplateRepository) {}

  async execute(request: GetTicketTemplatesRequest): Promise<GetTicketTemplatesResponse> {
    try {
      console.log('🔍 [GET-TICKET-TEMPLATES-USE-CASE] Executing with request:', {
        tenantId: request.tenantId,
        templateId: request.templateId,
        userRole: request.userRole,
        companyId: request.companyId,
        hasFilters: !!request.filters,
        search: request.search
      });

      let templates: TicketTemplate[] = [];
      let singleTemplate: TicketTemplate | null = null;

      // 1. Get specific template if ID provided
      if (request.templateId) {
        console.log('📄 [GET-TICKET-TEMPLATES-USE-CASE] Getting single template:', request.templateId);
        singleTemplate = await this.ticketTemplateRepository.findById(
          request.templateId,
          request.tenantId
        );

        if (!singleTemplate) {
          return {
            success: false,
            errors: ['Template não encontrado']
          };
        }

        // Check permissions
        if (!TicketTemplateDomainService.hasPermission(singleTemplate, request.userRole, 'view')) {
          return {
            success: false,
            errors: ['Permissão insuficiente para visualizar este template']
          };
        }

        templates = [singleTemplate];
      }
      // 2. Search templates if query provided
      else if (request.search) {
        console.log('🔍 [GET-TICKET-TEMPLATES-USE-CASE] Searching templates with query:', request.search);
        templates = await this.ticketTemplateRepository.search(
          request.tenantId,
          request.search,
          {
            category: request.filters?.category,
            templateType: request.filters?.templateType,
            tags: request.filters?.tags
          }
        );
      }
      // 3. Get templates by company
      else if (request.companyId) {
        console.log('🏢 [GET-TICKET-TEMPLATES-USE-CASE] Getting templates by company:', request.companyId);
        templates = await this.getTemplatesByCompany(request.companyId, request.tenantId);
      }
      // 4. Get all templates with filters
      else {
        console.log('📋 [GET-TICKET-TEMPLATES-USE-CASE] Getting all templates with filters');
        templates = await this.ticketTemplateRepository.findAll(
          request.tenantId,
          request.filters
        );
      }

      console.log('📊 [GET-TICKET-TEMPLATES-USE-CASE] Raw templates found:', templates.length);

      // 5. Filter templates based on permissions and company access
      const accessibleTemplates = templates.filter(template =>
        TicketTemplateDomainService.hasPermission(template, request.userRole, 'view') &&
        TicketTemplateDomainService.canUseTemplate(template, request.userRole, request.companyId)
      );

      console.log('✅ [GET-TICKET-TEMPLATES-USE-CASE] Accessible templates:', accessibleTemplates.length);

      // 6. Generate analytics if requested
      let analytics;
      if (request.includeAnalytics) {
        analytics = TicketTemplateDomainService.generateUsageAnalytics(accessibleTemplates);
      }

      // 7. Get usage statistics if requested
      let usageStatistics;
      if (request.includeUsageStats) {
        usageStatistics = await this.ticketTemplateRepository.getUsageStatistics(request.tenantId);
      }

      // 8. Get field analytics if requested
      let fieldAnalytics;
      if (request.includeAnalytics) {
        fieldAnalytics = await this.ticketTemplateRepository.getFieldAnalytics(request.tenantId);
      }

      const responseData = {
        templates: accessibleTemplates,
        template: singleTemplate || undefined,
        analytics,
        usageStatistics,
        fieldAnalytics
      };

      console.log('✅ [GET-TICKET-TEMPLATES-USE-CASE] Returning response with:', {
        templatesCount: responseData.templates.length,
        hasAnalytics: !!responseData.analytics,
        hasUsageStats: !!responseData.usageStatistics,
        hasFieldAnalytics: !!responseData.fieldAnalytics
      });

      return {
        success: true,
        data: responseData
      };

    } catch (error) {
      console.error('[GetTicketTemplatesUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }

  async getTemplateStatsByCompany(companyId: string, tenantId: string): Promise<any> {
    try {
      console.log(`🔍 [GET-TEMPLATE-STATS] Getting stats for company ${companyId}, tenant ${tenantId}`);

      const stats = await this.ticketTemplateRepository.getTemplateStatsByCompany(companyId, tenantId);

      console.log(`✅ [GET-TEMPLATE-STATS] Retrieved stats:`, stats);
      return stats;
    } catch (error) {
      console.error(`❌ [GET-TEMPLATE-STATS] Error:`, error);
      throw new Error(`Failed to get template statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTemplatesByCompany(companyId: string, tenantId: string): Promise<TicketTemplate[]> {
    try {
      console.log(`🔍 [GET-TEMPLATES-BY-COMPANY] Getting templates for company ${companyId}, tenant ${tenantId}`);

      if (companyId === 'all') {
        // Assuming a method to get all templates, if not available, this needs to be implemented or handled.
        // For now, let's assume it exists or fall back to fetching all without company filter if appropriate.
        // If ticketTemplateRepository.findAll is intended for all, use that.
        return await this.ticketTemplateRepository.findAll(tenantId); // Adjust if findAll requires filters
      }

      const templates = await this.ticketTemplateRepository.findByCompanyId(companyId, tenantId);

      console.log(`✅ [GET-TEMPLATES-BY-COMPANY] Found ${templates.length} templates`);
      return templates;
    } catch (error) {
      console.error(`❌ [GET-TEMPLATES-BY-COMPANY] Error:`, error);
      throw new Error(`Failed to get templates by company: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}