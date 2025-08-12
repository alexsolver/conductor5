/**
 * Get Template Hierarchy Use Case
 * Clean Architecture - Application Layer
 * 
 * @module GetTemplateHierarchyUseCase
 * @created 2025-08-12 - Phase 19 Clean Architecture Implementation
 */

import { ITemplateHierarchyRepository } from '../../domain/repositories/ITemplateHierarchyRepository';
import { TemplateHierarchy, TemplateHierarchyDomainService } from '../../domain/entities/TemplateHierarchy';

export interface GetTemplateHierarchyRequest {
  tenantId: string;
  templateId?: string;
  category?: string;
  includeResolved?: boolean;
  userRole: string;
  filters?: {
    parentId?: string;
    level?: number;
    companyId?: string;
    roleId?: string;
    isActive?: boolean;
  };
}

export interface GetTemplateHierarchyResponse {
  success: boolean;
  data?: {
    templates: TemplateHierarchy[];
    hierarchy?: {
      template: TemplateHierarchy;
      ancestors: TemplateHierarchy[];
      descendants: TemplateHierarchy[];
      siblings: TemplateHierarchy[];
    };
    resolvedTemplate?: {
      template: TemplateHierarchy;
      resolvedStructure: any;
      inheritanceChain: TemplateHierarchy[];
    };
    statistics?: {
      totalTemplates: number;
      rootTemplates: number;
      averageDepth: number;
      templatesByCategory: Record<string, number>;
    };
  };
  errors?: string[];
}

export class GetTemplateHierarchyUseCase {
  constructor(private templateHierarchyRepository: ITemplateHierarchyRepository) {}

  async execute(request: GetTemplateHierarchyRequest): Promise<GetTemplateHierarchyResponse> {
    try {
      let templates: TemplateHierarchy[] = [];
      let hierarchy: any = null;
      let resolvedTemplate: any = null;

      // 1. Get specific template with full hierarchy
      if (request.templateId) {
        const template = await this.templateHierarchyRepository.findById(
          request.templateId,
          request.tenantId
        );

        if (!template) {
          return {
            success: false,
            errors: ['Template não encontrado']
          };
        }

        // Check permissions
        if (!TemplateHierarchyDomainService.hasPermission(template, request.userRole, 'view')) {
          return {
            success: false,
            errors: ['Permissão insuficiente para visualizar este template']
          };
        }

        // Get full hierarchy
        hierarchy = await this.templateHierarchyRepository.getFullHierarchy(
          request.templateId,
          request.tenantId
        );

        // Get resolved template if requested
        if (request.includeResolved) {
          resolvedTemplate = await this.templateHierarchyRepository.getResolvedTemplate(
            request.templateId,
            request.tenantId
          );
        }

        templates = [template];
      }
      // 2. Get templates by category
      else if (request.category) {
        templates = await this.templateHierarchyRepository.findByCategory(
          request.tenantId,
          request.category,
          {
            companyId: request.filters?.companyId,
            roleId: request.filters?.roleId
          }
        );
      }
      // 3. Get all templates with filters
      else {
        templates = await this.templateHierarchyRepository.findAll(
          request.tenantId,
          request.filters
        );
      }

      // Filter templates based on permissions
      const accessibleTemplates = templates.filter(template =>
        TemplateHierarchyDomainService.hasPermission(template, request.userRole, 'view')
      );

      // Calculate statistics
      const statistics = TemplateHierarchyDomainService.calculateUsageStats(accessibleTemplates);

      return {
        success: true,
        data: {
          templates: accessibleTemplates,
          hierarchy,
          resolvedTemplate,
          statistics
        }
      };

    } catch (error) {
      console.error('[GetTemplateHierarchyUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }
}