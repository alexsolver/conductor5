/**
 * Update Template Hierarchy Use Case
 * Clean Architecture - Application Layer
 * 
 * @module UpdateTemplateHierarchyUseCase
 * @created 2025-08-12 - Phase 19 Clean Architecture Implementation
 */

import { ITemplateHierarchyRepository } from '../../domain/repositories/ITemplateHierarchyRepository';
import { TemplateHierarchy, TemplateHierarchyDomainService } from '../../domain/entities/TemplateHierarchy';

export interface UpdateTemplateHierarchyRequest {
  tenantId: string;
  templateId: string;
  updates: Partial<TemplateHierarchy>;
  updatedBy: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UpdateTemplateHierarchyResponse {
  success: boolean;
  data?: TemplateHierarchy;
  errors?: string[];
}

export class UpdateTemplateHierarchyUseCase {
  constructor(private templateHierarchyRepository: ITemplateHierarchyRepository) {}

  async execute(request: UpdateTemplateHierarchyRequest): Promise<UpdateTemplateHierarchyResponse> {
    try {
      // 1. Get existing template
      const existingTemplate = await this.templateHierarchyRepository.findById(
        request.templateId,
        request.tenantId
      );

      if (!existingTemplate) {
        return {
          success: false,
          errors: ['Template não encontrado']
        };
      }

      // 2. Check permissions
      if (!TemplateHierarchyDomainService.hasPermission(existingTemplate, request.userRole, 'edit')) {
        return {
          success: false,
          errors: ['Permissão insuficiente para editar este template']
        };
      }

      // 3. Validate updates if name is being changed
      if (request.updates.name && request.updates.name !== existingTemplate.name) {
        const duplicateTemplate = await this.templateHierarchyRepository.findByName(
          request.updates.name,
          request.tenantId
        );

        if (duplicateTemplate && duplicateTemplate.id !== request.templateId) {
          return {
            success: false,
            errors: ['Um template com este nome já existe']
          };
        }
      }

      // 4. Handle parent change (reparenting)
      if (request.updates.parentTemplateId !== undefined && 
          request.updates.parentTemplateId !== existingTemplate.parentTemplateId) {
        
        const reparentingResult = await this.handleReparenting(
          existingTemplate,
          request.updates.parentTemplateId,
          request.tenantId,
          request.userRole
        );

        if (!reparentingResult.success) {
          return reparentingResult;
        }

        // Update path and level based on new parent
        if (request.updates.parentTemplateId) {
          const newParent = await this.templateHierarchyRepository.findById(
            request.updates.parentTemplateId,
            request.tenantId
          );
          
          if (newParent) {
            request.updates.level = TemplateHierarchyDomainService.calculateLevel(newParent.level);
            request.updates.path = TemplateHierarchyDomainService.generateHierarchyPath(
              newParent.path,
              request.updates.name || existingTemplate.name
            );
          }
        } else {
          // Moving to root level
          request.updates.level = 0;
          request.updates.path = request.updates.name || existingTemplate.name;
        }
      }

      // 5. Validate template structure if templateData is being updated
      if (request.updates.templateData) {
        const structureValidation = TemplateHierarchyDomainService.validateTemplateStructure(
          request.updates.templateData as any
        );

        if (!structureValidation.isValid) {
          return {
            success: false,
            errors: structureValidation.errors
          };
        }
      }

      // 6. Prepare updates with metadata
      const updatesToApply = {
        ...request.updates,
        metadata: {
          ...existingTemplate.metadata,
          lastModifiedBy: request.updatedBy,
          lastModifiedAt: new Date(),
          version: this.incrementVersion(existingTemplate.metadata.version)
        }
      };

      // 7. Apply updates
      const updatedTemplate = await this.templateHierarchyRepository.update(
        request.templateId,
        request.tenantId,
        updatesToApply
      );

      if (!updatedTemplate) {
        return {
          success: false,
          errors: ['Falha ao atualizar template']
        };
      }

      // 8. Update children paths if name or parent changed
      if (request.updates.name || request.updates.parentTemplateId !== undefined) {
        await this.updateChildrenPaths(updatedTemplate, request.tenantId);
      }

      // 9. Create audit entry
      await this.templateHierarchyRepository.addAuditEntry(
        request.templateId,
        request.tenantId,
        {
          action: 'updated',
          userId: request.updatedBy,
          userName: request.updatedBy,
          changes: this.calculateChanges(existingTemplate, updatedTemplate),
          ipAddress: request.ipAddress || 'unknown',
          userAgent: request.userAgent || 'unknown'
        }
      );

      return {
        success: true,
        data: updatedTemplate
      };

    } catch (error) {
      console.error('[UpdateTemplateHierarchyUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }

  private async handleReparenting(
    template: TemplateHierarchy,
    newParentId: string | null,
    tenantId: string,
    userRole: string
  ): Promise<{ success: boolean; errors?: string[] }> {
    // Remove from old parent's children
    if (template.parentTemplateId) {
      const oldParent = await this.templateHierarchyRepository.findById(
        template.parentTemplateId,
        tenantId
      );
      
      if (oldParent) {
        const updatedChildren = oldParent.children.filter(id => id !== template.id);
        await this.templateHierarchyRepository.update(
          oldParent.id,
          tenantId,
          { children: updatedChildren }
        );
      }
    }

    // Add to new parent's children
    if (newParentId) {
      const newParent = await this.templateHierarchyRepository.findById(newParentId, tenantId);
      
      if (!newParent) {
        return {
          success: false,
          errors: ['Novo template pai não encontrado']
        };
      }

      // Check if new parent can have children
      if (!TemplateHierarchyDomainService.canHaveChildren(newParent)) {
        return {
          success: false,
          errors: ['Novo template pai não permite filhos']
        };
      }

      // Check permissions
      if (!TemplateHierarchyDomainService.hasPermission(newParent, userRole, 'create_child')) {
        return {
          success: false,
          errors: ['Permissão insuficiente para mover template para este pai']
        };
      }

      // Check for circular dependency
      if (await this.wouldCreateCircularDependency(template.id, newParentId, tenantId)) {
        return {
          success: false,
          errors: ['Esta operação criaria uma dependência circular']
        };
      }

      const updatedChildren = [...newParent.children, template.id];
      await this.templateHierarchyRepository.update(
        newParent.id,
        tenantId,
        { children: updatedChildren }
      );
    }

    return { success: true };
  }

  private async wouldCreateCircularDependency(
    templateId: string,
    newParentId: string,
    tenantId: string
  ): Promise<boolean> {
    // Check if newParentId is a descendant of templateId
    const hierarchy = await this.templateHierarchyRepository.getFullHierarchy(templateId, tenantId);
    const descendantIds = hierarchy.descendants.map(d => d.id);
    
    return descendantIds.includes(newParentId);
  }

  private async updateChildrenPaths(template: TemplateHierarchy, tenantId: string): Promise<void> {
    const children = await this.templateHierarchyRepository.findChildren(template.id, tenantId);
    
    for (const child of children) {
      const newPath = TemplateHierarchyDomainService.generateHierarchyPath(template.path, child.name);
      const newLevel = TemplateHierarchyDomainService.calculateLevel(template.level);
      
      await this.templateHierarchyRepository.update(child.id, tenantId, {
        path: newPath,
        level: newLevel
      });

      // Recursively update grandchildren
      await this.updateChildrenPaths(child, tenantId);
    }
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0] || '1'}.${parts[1] || '0'}.${patch}`;
  }

  private calculateChanges(
    oldTemplate: TemplateHierarchy,
    newTemplate: TemplateHierarchy
  ): Array<{ field: string; oldValue: any; newValue: any }> {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    const fieldsToCheck = ['name', 'category', 'parentTemplateId', 'companyId', 'templateData', 'inheritanceRules'];

    fieldsToCheck.forEach(field => {
      const oldValue = (oldTemplate as any)[field];
      const newValue = (newTemplate as any)[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field,
          oldValue,
          newValue
        });
      }
    });

    return changes;
  }
}