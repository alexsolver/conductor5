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
  constructor(private ticketTemplateRepository: ITicketTemplateRepository) {}

  async execute(request: UpdateTicketTemplateRequest): Promise<UpdateTicketTemplateResponse> {
    try {
      // 1. Get existing template
      const existingTemplate = await this.ticketTemplateRepository.findById(
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
      if (!TicketTemplateDomainService.hasPermission(existingTemplate, request.userRole, 'edit')) {
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

        const validation = TicketTemplateDomainService.validateTemplate(templateToValidate);
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
        request.tenantId,
        updatesToApply
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

      return {
        success: true,
        data: updatedTemplate
      };

    } catch (error) {
      console.error('[UpdateTicketTemplateUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
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