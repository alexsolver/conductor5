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
      let templates: TicketTemplate[] = [];
      let singleTemplate: TicketTemplate | null = null;

      // 1. Get specific template if ID provided
      if (request.templateId) {
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
      // 3. Get all templates with filters, including companyId
      else {
        templates = await this.ticketTemplateRepository.findAll(
          request.tenantId,
          request.filters,
          request.companyId // Pass companyId to findAll
        );
      }

      // 4. Filter templates based on permissions and company access
      const accessibleTemplates = templates.filter(template =>
        TicketTemplateDomainService.hasPermission(template, request.userRole, 'view') &&
        TicketTemplateDomainService.canUseTemplate(template, request.userRole, request.companyId) &&
        TicketTemplateDomainService.canBeUsedByCompany(template, request.companyId)
      );

      // 5. Generate analytics if requested
      let analytics;
      if (request.includeAnalytics) {
        analytics = TicketTemplateDomainService.generateUsageAnalytics(accessibleTemplates);
      }

      // 6. Get usage statistics if requested
      let usageStatistics;
      if (request.includeUsageStats) {
        usageStatistics = await this.ticketTemplateRepository.getUsageStatistics(request.tenantId);
      }

      // 7. Get field analytics if requested
      let fieldAnalytics;
      if (request.includeAnalytics) {
        fieldAnalytics = await this.ticketTemplateRepository.getFieldAnalytics(request.tenantId);
      }

      return {
        success: true,
        data: {
          templates: accessibleTemplates,
          template: singleTemplate || undefined,
          analytics,
          usageStatistics,
          fieldAnalytics
        }
      };

    } catch (error) {
      console.error('[GetTicketTemplatesUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }
}