/**
 * Create Ticket Template Use Case
 * Clean Architecture - Application Layer
 *
 * @module CreateTicketTemplateUseCase
 * @created 2025-08-12 - Phase 20 Clean Architecture Implementation
 */

import { ITicketTemplateRepository } from '../../domain/repositories/ITicketTemplateRepository';
import { TicketTemplate, TicketTemplateField, TicketTemplateAutomation, TicketTemplateWorkflow } from '../../domain/entities/TicketTemplate';
import { TicketTemplateDomainService } from '../../domain/services/TicketTemplateDomainService';

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
  templateData?: { // Adicionado para corresponder ao novo formato do request
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
  };
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
      console.log('🚀 [CREATE-TEMPLATE-USE-CASE] Starting execution with request:', {
        tenantId: request.tenantId,
        templateName: request.templateData?.name,
        userRole: request.userRole,
        hasTemplateData: !!request.templateData
      });

      // ✅ 1QA.MD: Rigorous input validation
      if (!request.tenantId || typeof request.tenantId !== 'string') {
        console.error('❌ [CREATE-TEMPLATE-USE-CASE] Invalid tenantId');
        return {
          success: false,
          errors: ['Tenant ID é obrigatório e deve ser uma string válida']
        };
      }

      if (!request.createdBy || typeof request.createdBy !== 'string') {
        console.error('❌ [CREATE-TEMPLATE-USE-CASE] Invalid createdBy');
        return {
          success: false,
          errors: ['Created By é obrigatório e deve ser uma string válida']
        };
      }

      if (!request.templateData) {
        console.error('❌ [CREATE-TEMPLATE-USE-CASE] Missing templateData');
        return {
          success: false,
          errors: ['Dados do template são obrigatórios']
        };
      }

      if (!request.templateData.name || typeof request.templateData.name !== 'string' || request.templateData.name.trim().length === 0) {
        console.error('❌ [CREATE-TEMPLATE-USE-CASE] Invalid template name');
        return {
          success: false,
          errors: ['Nome do template é obrigatório e deve ser uma string válida']
        };
      }

      if (!request.templateData.category || typeof request.templateData.category !== 'string' || request.templateData.category.trim().length === 0) {
        console.error('❌ [CREATE-TEMPLATE-USE-CASE] Invalid template category');
        return {
          success: false,
          errors: ['Categoria do template é obrigatória e deve ser uma string válida']
        };
      }

      // ✅ 1QA.MD: Domain validation - Check for duplicate names
      try {
        const existingTemplate = await this.ticketTemplateRepository.findByName(
          request.templateData.name.trim(),
          request.tenantId
        );

        if (existingTemplate) {
          console.log('❌ [CREATE-TEMPLATE-USE-CASE] Template name already exists:', request.templateData.name);
          return {
            success: false,
            errors: [`Um template com o nome "${request.templateData.name}" já existe`]
          };
        }
      } catch (error) {
        console.error('❌ [CREATE-TEMPLATE-USE-CASE] Error checking duplicate name:', error);
        return {
          success: false,
          errors: ['Erro ao verificar duplicação de nome']
        };
      }

      // ✅ 1QA.MD: Prepare clean template data
      const templateToCreate = {
        ...request.templateData,
        tenantId: request.tenantId,
        createdBy: request.createdBy,
        name: request.templateData.name.trim(),
        category: request.templateData.category.trim()
      };

      console.log('🔄 [CREATE-TEMPLATE-USE-CASE] Creating template with data:', {
        name: templateToCreate.name,
        category: templateToCreate.category,
        tenantId: templateToCreate.tenantId
      });

      // ✅ 1QA.MD: Repository execution with proper error handling
      let createdTemplate;
      try {
        createdTemplate = await this.ticketTemplateRepository.create(templateToCreate);
      } catch (repositoryError) {
        console.error('❌ [CREATE-TEMPLATE-USE-CASE] Repository error:', repositoryError);
        return {
          success: false,
          errors: ['Erro ao salvar template no banco de dados']
        };
      }

      if (!createdTemplate) {
        console.error('❌ [CREATE-TEMPLATE-USE-CASE] Repository returned null');
        return {
          success: false,
          errors: ['Falha ao criar template - nenhum resultado retornado']
        };
      }

      console.log('✅ [CREATE-TEMPLATE-USE-CASE] Template created successfully:', createdTemplate.id);

      return {
        success: true,
        data: createdTemplate
      };

    } catch (error) {
      console.error('❌ [CREATE-TEMPLATE-USE-CASE] Critical error:', error);
      console.error('❌ [CREATE-TEMPLATE-USE-CASE] Error stack:', error instanceof Error ? error.stack : 'No stack');

      return {
        success: false,
        errors: ['Erro crítico ao criar template: ' + (error instanceof Error ? error.message : 'Erro desconhecido')]
      };
    }
  }
}