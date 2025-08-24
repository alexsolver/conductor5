/**
 * Update Ticket Template Use Case
 * Clean Architecture - Application Layer
 * 
 * @module UpdateTicketTemplateUseCase
 * @created 2025-08-12 - Phase 20 Clean Architecture Implementation
 */

import { ITicketTemplateRepository } from '../../domain/repositories/ITicketTemplateRepository';
import { TicketTemplate } from '../../domain/entities/TicketTemplate';
import { TicketTemplateDomainService } from '../../domain/services/TicketTemplateDomainService';

export interface UpdateTicketTemplateRequest {
  tenantId: string;
  templateId: string;
  updates: Partial<TicketTemplate>;
  updatedBy: string;
  userRole: string;
  versionInfo?: {
    changes: string;
    changeType: 'major' | 'minor' | 'patch' | 'hotfix';
  };
}

export interface UpdateTicketTemplateResponse {
  success: boolean;
  data?: TicketTemplate;
  errors?: string[];
}

export class UpdateTicketTemplateUseCase {
  constructor(
    private ticketTemplateRepository: ITicketTemplateRepository
  ) {}

  async execute(request: UpdateTicketTemplateRequest): Promise<UpdateTicketTemplateResponse> {
    try {
      console.log('🎯 [UPDATE-TEMPLATE-USE-CASE] Executing update:', {
        templateId: request.templateId,
        tenantId: request.tenantId,
        hasUpdates: !!request.updates
      });

      // 1. Retrieve existing template
      const existingTemplate = await this.ticketTemplateRepository.findById(
        request.templateId, 
        request.tenantId
      );

      if (!existingTemplate) {
        console.log('❌ [UPDATE-TEMPLATE-USE-CASE] Template not found:', request.templateId);
        return {
          success: false,
          errors: ['Template não encontrado']
        };
      }

      // 2. Check permissions
      const hasPermission = this.checkPermission(existingTemplate, request.userRole, 'edit');
      if (!hasPermission) {
        return {
          success: false,
          errors: ['Permissão insuficiente para editar este template']
        };
      }

      // 3. Validate updates if name is being changed
      if (request.updates.name && request.updates.name !== existingTemplate.name) {
        const duplicateTemplate = await this.ticketTemplateRepository.findByName(
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

      // 4. Validate template data if fields or other critical data is being updated
      if (request.updates.fields || request.updates.workflow || request.updates.name || request.updates.category) {
        const templateToValidate = {
          ...existingTemplate,
          ...request.updates
        };

        const validation = this.validateTemplate(templateToValidate);
        if (!validation.isValid) {
          return {
            success: false,
            errors: validation.errors
          };
        }
      }

      // 5. Validate automation rules if being updated
      if (request.updates.automation?.enabled) {
        // TODO: Implement validateAutomationRules method in TicketTemplateDomainService
        // For now, just log that automation is being enabled
        console.log('[UpdateTicketTemplate] Automation rules will be validated when method is implemented');
      }

      // 6. Calculate new version if significant changes
      let newVersion = existingTemplate.metadata.version;
      if (request.versionInfo || this.hasSignificantChanges(existingTemplate, request.updates)) {
        newVersion = this.incrementVersion(existingTemplate.metadata.version, request.versionInfo?.changeType || 'minor');
      }

      // 7. Prepare updates with metadata
      const updatesToApply = {
        ...request.updates,
        metadata: {
          ...existingTemplate.metadata,
          version: newVersion,
          lastModifiedBy: request.updatedBy,
          lastModifiedAt: new Date(),
          changeLog: [
            ...existingTemplate.metadata.changeLog,
            {
              id: `change_${Date.now()}`,
              version: newVersion,
              changes: request.versionInfo?.changes || 'Template atualizado',
              changedBy: request.updatedBy,
              changedAt: new Date(),
              changeType: request.versionInfo?.changeType || 'minor'
            }
          ]
        }
      };

      // 8. Apply updates
      const updatedTemplate = await this.ticketTemplateRepository.update(
        request.templateId,
        {
          ...request.updates,
          updatedBy: request.updatedBy,
          updatedAt: new Date()
        },
        request.tenantId
      );

      if (!updatedTemplate) {
        return {
          success: false,
          errors: ['Falha ao atualizar template']
        };
      }

      // 9. Create version if significant changes
      if (newVersion !== existingTemplate.metadata.version) {
        await this.ticketTemplateRepository.createVersion(
          request.templateId,
          request.tenantId,
          {
            version: newVersion,
            changes: request.versionInfo?.changes || 'Template atualizado',
            changeType: request.versionInfo?.changeType || 'minor',
            changedBy: request.updatedBy
          }
        );
      }

      console.log('✅ [UPDATE-TEMPLATE-USE-CASE] Template updated successfully:', updatedTemplate.id);

      return {
        success: true,
        data: {
          template: updatedTemplate
        }
      };

    } catch (error) {
      console.error('❌ [UPDATE-TEMPLATE-USE-CASE] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }

  // ✅ 1QA.MD: Helper methods for validation
  private checkPermission(template: any, userRole: string, action: string): boolean {
    // Basic permission check - can be expanded
    if (userRole === 'admin') return true;
    if (userRole === 'manager' && action === 'edit') return true;
    return false;
  }

  private validateTemplate(template: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Nome do template é obrigatório');
    }

    if (!template.category || template.category.trim().length === 0) {
      errors.push('Categoria é obrigatória');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private hasSignificantChanges(original: TicketTemplate, updates: Partial<TicketTemplate>): boolean {
    // Check for significant changes that warrant a version bump
    const significantFields = ['name', 'fields', 'automation', 'workflow', 'permissions'];

    return significantFields.some(field => {
      if (updates[field as keyof TicketTemplate] !== undefined) {
        const originalValue = JSON.stringify(original[field as keyof TicketTemplate]);
        const updatedValue = JSON.stringify(updates[field as keyof TicketTemplate]);
        return originalValue !== updatedValue;
      }
      return false;
    });
  }

  private incrementVersion(currentVersion: string, changeType: 'major' | 'minor' | 'patch' | 'hotfix'): string {
    const parts = currentVersion.split('.').map(p => parseInt(p) || 0);
    let [major, minor, patch] = parts;

    switch (changeType) {
      case 'major':
        major += 1;
        minor = 0;
        patch = 0;
        break;
      case 'minor':
        minor += 1;
        patch = 0;
        break;
      case 'patch':
      case 'hotfix':
        patch += 1;
        break;
    }

    return `${major}.${minor}.${patch}`;
  }
}
/**
 * ✅ 1QA.MD COMPLIANCE: UPDATE TICKET TEMPLATE USE CASE
 * Clean Architecture - Application Layer
 * 
 * @module UpdateTicketTemplateUseCase
 * @compliance 1qa.md - Application Layer Use Case
 * @created 2025-08-24 - Phase 20 Clean Architecture Implementation
 */

import { ITicketTemplateRepository } from '../../domain/repositories/ITicketTemplateRepository';
import { TicketTemplate } from '../../domain/entities/TicketTemplate';

export interface UpdateTicketTemplateRequest {
  tenantId: string;
  templateId: string;
  updates: Partial<TicketTemplate>;
  updatedBy: string;
  userRole: string;
  versionInfo?: {
    version: string;
    changes: string;
    changeType: 'major' | 'minor' | 'patch' | 'hotfix';
  };
}

export interface UpdateTicketTemplateResponse {
  success: boolean;
  data?: TicketTemplate;
  errors?: string[];
}

export class UpdateTicketTemplateUseCase {
  constructor(
    private ticketTemplateRepository: ITicketTemplateRepository
  ) {}

  async execute(request: UpdateTicketTemplateRequest): Promise<UpdateTicketTemplateResponse> {
    try {
      console.log('🚀 [UPDATE-TEMPLATE-USE-CASE] Starting execution with request:', {
        tenantId: request.tenantId,
        templateId: request.templateId,
        userRole: request.userRole
      });

      // ✅ 1QA.MD: Input validation
      if (!request.tenantId || !request.templateId || !request.updatedBy) {
        return {
          success: false,
          errors: ['Missing required fields: tenantId, templateId, or updatedBy']
        };
      }

      // ✅ 1QA.MD: Check if template exists
      const existingTemplate = await this.ticketTemplateRepository.findById(
        request.templateId,
        request.tenantId
      );

      if (!existingTemplate) {
        return {
          success: false,
          errors: ['Template not found']
        };
      }

      // ✅ 1QA.MD: Prepare update data
      const updateData = {
        ...request.updates,
        updatedBy: request.updatedBy,
        updatedAt: new Date()
      };

      // ✅ 1QA.MD: Execute update
      const updatedTemplate = await this.ticketTemplateRepository.update(
        request.templateId,
        request.tenantId,
        updateData
      );

      if (!updatedTemplate) {
        return {
          success: false,
          errors: ['Failed to update template']
        };
      }

      console.log('✅ [UPDATE-TEMPLATE-USE-CASE] Template updated successfully:', updatedTemplate.id);

      return {
        success: true,
        data: updatedTemplate
      };

    } catch (error) {
      console.error('❌ [UPDATE-TEMPLATE-USE-CASE] Error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }
}
