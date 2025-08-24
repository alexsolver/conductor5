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
}

export interface CreateTicketTemplateResponse {
  success: boolean;
  data?: TicketTemplate;
  errors?: string[];
}

export class CreateTicketTemplateUseCase {
  constructor(private ticketTemplateRepository: ITicketTemplateRepository) {}

  async execute(templateData: any): Promise<any> {
    console.log('🚀 [CREATE-TEMPLATE-USE-CASE] Starting execution with data:', {
      tenantId: templateData.tenantId,
      name: templateData.name,
      category: templateData.category,
      companyId: templateData.companyId,
      hasFields: !!templateData.fields
    });

    try {
      // ✅ 1QA.MD: Comprehensive validation
      if (!templateData.tenantId) {
        console.log('❌ [CREATE-TEMPLATE-USE-CASE] Missing tenant ID');
        throw new Error('Tenant ID is required');
      }

      if (!templateData.name || templateData.name.trim().length === 0) {
        console.log('❌ [CREATE-TEMPLATE-USE-CASE] Missing template name');
        throw new Error('Template name is required');
      }

      if (!templateData.category || templateData.category.trim().length === 0) {
        console.log('❌ [CREATE-TEMPLATE-USE-CASE] Missing category');
        throw new Error('Template category is required');
      }

      // Prepare template data with proper defaults
      const templateToCreate = {
        ...templateData,
        id: templateData.id || crypto.randomUUID(),
        isActive: templateData.isActive !== false, // Default to true
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        defaultTags: templateData.defaultTags || '',
        customFields: templateData.customFields || null,
      };

      console.log('🔧 [CREATE-TEMPLATE-UC] Prepared template data:', templateToCreate);

      // Create the template
      const template = await this.ticketTemplateRepository.create(templateToCreate);

      console.log('✅ [CREATE-TEMPLATE-UC] Template created:', template.id);
      return template;
    } catch (error) {
      console.error('❌ [CREATE-TEMPLATE-UC] Error:', error);
      throw error;
    }
  }
}