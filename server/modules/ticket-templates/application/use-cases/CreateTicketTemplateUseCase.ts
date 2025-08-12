/**
 * Create Ticket Template Use Case
 * Clean Architecture - Application Layer
 * 
 * @module CreateTicketTemplateUseCase
 * @created 2025-08-12 - Phase 20 Clean Architecture Implementation
 */

import { ITicketTemplateRepository } from '../../domain/repositories/ITicketTemplateRepository';
import { TicketTemplate, TicketTemplateDomainService, TicketTemplateField, TicketTemplateAutomation, TicketTemplateWorkflow } from '../../domain/entities/TicketTemplate';

export interface CreateTicketTemplateRequest {
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  companyId?: string;
  departmentId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  templateType: 'standard' | 'quick' | 'escalation' | 'auto_response' | 'workflow';
  fields: TicketTemplateField[];
  automation?: TicketTemplateAutomation;
  workflow?: TicketTemplateWorkflow;
  tags?: string[];
  isDefault?: boolean;
  permissions?: Array<{
    roleId: string;
    roleName: string;
    permissions: string[];
  }>;
  createdBy: string;
  userRole: string;
}

export interface CreateTicketTemplateResponse {
  success: boolean;
  data?: TicketTemplate;
  errors?: string[];
}

export class CreateTicketTemplateUseCase {
  constructor(private ticketTemplateRepository: ITicketTemplateRepository) {}

  async execute(request: CreateTicketTemplateRequest): Promise<CreateTicketTemplateResponse> {
    try {
      // 1. Validate basic template data
      const validation = TicketTemplateDomainService.validateTemplate({
        name: request.name,
        category: request.category,
        tenantId: request.tenantId,
        templateType: request.templateType,
        fields: request.fields,
        workflow: request.workflow
      });

      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // 2. Check for name uniqueness within tenant
      const existingTemplate = await this.ticketTemplateRepository.findByName(
        request.name,
        request.tenantId
      );

      if (existingTemplate) {
        return {
          success: false,
          errors: ['Um template com este nome já existe']
        };
      }

      // 3. Validate automation rules if provided
      if (request.automation?.enabled) {
        const automationValidation = TicketTemplateDomainService.validateAutomationRules(request.automation);
        if (!automationValidation.isValid) {
          return {
            success: false,
            errors: automationValidation.errors
          };
        }
      }

      // 4. Set default automation if not provided
      const defaultAutomation: TicketTemplateAutomation = {
        enabled: false,
        autoAssign: {
          enabled: false,
          rules: []
        },
        autoTags: {
          enabled: false,
          tags: []
        },
        autoStatus: {
          enabled: false,
          status: 'open'
        },
        notifications: {
          enabled: false,
          recipients: []
        },
        escalation: {
          enabled: false,
          rules: []
        },
        sla: {
          enabled: false
        }
      };

      // 5. Set default workflow if not provided
      const defaultWorkflow: TicketTemplateWorkflow = {
        enabled: false,
        stages: [],
        approvals: [],
        conditions: [],
        transitions: []
      };

      // 6. Set default permissions if not provided
      const defaultPermissions = request.permissions?.map(p => ({
        id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roleId: p.roleId,
        roleName: p.roleName,
        permissions: p.permissions as any[],
        grantedBy: request.createdBy,
        grantedAt: new Date()
      })) || [
        {
          id: `perm_${Date.now()}_creator`,
          roleId: 'creator',
          roleName: request.userRole,
          permissions: ['view', 'use', 'edit', 'delete', 'manage'],
          grantedBy: request.createdBy,
          grantedAt: new Date()
        }
      ];

      // 7. Process and validate fields
      const processedFields = request.fields.map((field, index) => ({
        ...field,
        id: field.id || `field_${Date.now()}_${index}`,
        order: field.order || index + 1,
        required: field.required || false,
        readonly: field.readonly || false,
        hidden: field.hidden || false,
        customAttributes: field.customAttributes || {}
      }));

      // 8. Create template
      const templateToCreate: Omit<TicketTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId: request.tenantId,
        name: request.name,
        description: request.description,
        category: request.category,
        subcategory: request.subcategory,
        companyId: request.companyId,
        departmentId: request.departmentId,
        priority: request.priority,
        templateType: request.templateType,
        status: 'active',
        fields: processedFields,
        automation: request.automation || defaultAutomation,
        workflow: request.workflow || defaultWorkflow,
        permissions: defaultPermissions,
        metadata: {
          version: '1.0.0',
          author: request.createdBy,
          lastModifiedBy: request.createdBy,
          lastModifiedAt: new Date(),
          changeLog: [
            {
              id: `change_${Date.now()}`,
              version: '1.0.0',
              changes: 'Template criado',
              changedBy: request.createdBy,
              changedAt: new Date(),
              changeType: 'major'
            }
          ],
          usage: {
            totalUses: 0,
            lastMonth: 0
          },
          analytics: {
            popularFields: [],
            commonIssues: [],
            userFeedback: []
          },
          compliance: {
            gdprCompliant: true,
            auditRequired: false
          }
        },
        isDefault: request.isDefault || false,
        isSystem: false,
        usageCount: 0,
        tags: request.tags || [],
        createdBy: request.createdBy,
        isActive: true
      };

      const createdTemplate = await this.ticketTemplateRepository.create(templateToCreate);

      // 9. Create initial version
      await this.ticketTemplateRepository.createVersion(
        createdTemplate.id,
        request.tenantId,
        {
          version: '1.0.0',
          changes: 'Template criado',
          changeType: 'major',
          changedBy: request.createdBy
        }
      );

      return {
        success: true,
        data: createdTemplate
      };

    } catch (error) {
      console.error('[CreateTicketTemplateUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }
}