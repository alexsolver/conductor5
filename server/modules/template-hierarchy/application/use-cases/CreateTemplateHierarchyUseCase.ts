/**
 * Create Template Hierarchy Use Case
 * Clean Architecture - Application Layer
 * 
 * @module CreateTemplateHierarchyUseCase
 * @created 2025-08-12 - Phase 19 Clean Architecture Implementation
 */

import { ITemplateHierarchyRepository } from '../../domain/repositories/ITemplateHierarchyRepository';
import { TemplateHierarchy, TemplateHierarchyDomainService, InheritanceRules } from '../../domain/entities/TemplateHierarchy';

export interface CreateTemplateHierarchyRequest {
  tenantId: string;
  name: string;
  category: string;
  parentTemplateId?: string;
  companyId?: string;
  roleIds?: string[];
  templateData?: Record<string, any>;
  inheritanceRules?: Partial<InheritanceRules>;
  description?: string;
  tags?: string[];
  createdBy: string;
  userRole: string;
}

export interface CreateTemplateHierarchyResponse {
  success: boolean;
  data?: TemplateHierarchy;
  errors?: string[];
}

export class CreateTemplateHierarchyUseCase {
  constructor(private templateHierarchyRepository: ITemplateHierarchyRepository) {}

  async execute(request: CreateTemplateHierarchyRequest): Promise<CreateTemplateHierarchyResponse> {
    try {
      // 1. Validate basic template data
      const validation = TemplateHierarchyDomainService.validateHierarchy({
        name: request.name,
        category: request.category,
        tenantId: request.tenantId,
        inheritanceRules: request.inheritanceRules as InheritanceRules
      });

      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // 2. Check for name uniqueness within tenant
      const existingTemplate = await this.templateHierarchyRepository.findByName(
        request.name,
        request.tenantId
      );

      if (existingTemplate) {
        return {
          success: false,
          errors: ['Um template com este nome já existe']
        };
      }

      // 3. Handle parent template if specified
      let parentTemplate: TemplateHierarchy | null = null;
      let level = 0;
      let path = request.name;

      if (request.parentTemplateId) {
        parentTemplate = await this.templateHierarchyRepository.findById(
          request.parentTemplateId,
          request.tenantId
        );

        if (!parentTemplate) {
          return {
            success: false,
            errors: ['Template pai não encontrado']
          };
        }

        // Check if parent can have children
        if (!TemplateHierarchyDomainService.canHaveChildren(parentTemplate)) {
          return {
            success: false,
            errors: ['Template pai não permite criação de filhos']
          };
        }

        // Check permissions for parent template
        if (!TemplateHierarchyDomainService.hasPermission(parentTemplate, request.userRole, 'create_child')) {
          return {
            success: false,
            errors: ['Permissão insuficiente para criar template filho']
          };
        }

        level = TemplateHierarchyDomainService.calculateLevel(parentTemplate.level);
        path = TemplateHierarchyDomainService.generateHierarchyPath(parentTemplate.path, request.name);
      }

      // 4. Set default inheritance rules
      const defaultInheritanceRules: InheritanceRules = {
        inheritFields: true,
        inheritValidations: true,
        inheritStyles: false,
        inheritPermissions: false,
        overrideMode: 'merge',
        lockedFields: [],
        requiredFields: [],
        allowChildCreation: true,
        maxDepth: 5,
        ...request.inheritanceRules
      };

      // 5. Merge template data with inheritance
      const resolvedTemplateData = TemplateHierarchyDomainService.mergeWithInheritance(
        parentTemplate,
        {
          templateData: request.templateData || {},
          inheritanceRules: defaultInheritanceRules
        }
      );

      // 6. Create template hierarchy
      const templateToCreate: Omit<TemplateHierarchy, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId: request.tenantId,
        name: request.name,
        category: request.category,
        parentTemplateId: request.parentTemplateId,
        level,
        path,
        companyId: request.companyId,
        roleIds: request.roleIds || [],
        templateData: resolvedTemplateData,
        inheritanceRules: defaultInheritanceRules,
        metadata: {
          description: request.description,
          tags: request.tags || [],
          version: '1.0.0',
          author: request.createdBy,
          lastModifiedBy: request.createdBy,
          lastModifiedAt: new Date(),
          usageCount: 0,
          isSystem: false,
          permissions: [{
            id: `perm_${Date.now()}`,
            roleId: 'creator',
            roleName: request.userRole,
            permissions: ['view', 'edit', 'delete', 'create_child', 'manage_permissions'],
            grantedBy: request.createdBy,
            grantedAt: new Date()
          }],
          auditTrail: []
        },
        children: [],
        isActive: true,
        createdBy: request.createdBy
      };

      const createdTemplate = await this.templateHierarchyRepository.create(templateToCreate);

      // 7. Update parent's children array if applicable
      if (parentTemplate) {
        const updatedChildren = [...parentTemplate.children, createdTemplate.id];
        await this.templateHierarchyRepository.update(
          parentTemplate.id,
          request.tenantId,
          { children: updatedChildren }
        );
      }

      // 8. Add audit entry
      await this.templateHierarchyRepository.addAuditEntry(
        createdTemplate.id,
        request.tenantId,
        {
          action: 'created',
          userId: request.createdBy,
          userName: request.createdBy,
          ipAddress: 'system',
          userAgent: 'system'
        }
      );

      return {
        success: true,
        data: createdTemplate
      };

    } catch (error) {
      console.error('[CreateTemplateHierarchyUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }
}