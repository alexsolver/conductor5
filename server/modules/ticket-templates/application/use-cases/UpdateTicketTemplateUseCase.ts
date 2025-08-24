
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
