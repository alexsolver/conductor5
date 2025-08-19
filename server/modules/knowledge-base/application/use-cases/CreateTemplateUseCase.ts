// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - APPLICATION LAYER
// Use Case para criação de templates seguindo padrões Domain-Driven Design

import { IKnowledgeBaseRepository } from "../../domain/repositories/IKnowledgeBaseRepository";
import { Logger } from "winston";
import { InsertKnowledgeBaseTemplate } from "@shared/schema-knowledge-base";

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  content: string;
  category: string;
  fields?: any[];
  isActive?: boolean;
  isDefault?: boolean;
  tenantId: string;
  createdBy: string;
}

export interface CreateTemplateResponse {
  success: boolean;
  template?: any;
  message: string;
}

export class CreateTemplateUseCase {
  constructor(
    private knowledgeBaseRepository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async execute(request: CreateTemplateRequest): Promise<CreateTemplateResponse> {
    try {
      this.logger.info(`🎯 [CREATE-TEMPLATE-UC] Creating template: ${request.name}`, {
        tenantId: request.tenantId,
        createdBy: request.createdBy
      });

      // Domain validation
      if (!request.name?.trim()) {
        throw new Error('Template name is required');
      }

      if (!request.content?.trim()) {
        throw new Error('Template content is required');
      }

      // Check if template name already exists for tenant
      const existingTemplate = await this.knowledgeBaseRepository.findTemplateByName(
        request.name,
        request.tenantId
      );

      if (existingTemplate) {
        throw new Error('Template with this name already exists');
      }

      const templateData = {
        name: request.name.trim(),
        description: request.description?.trim(),
        content: request.content.trim(),
        category: request.category as any,
        fields: request.fields || [],
        isActive: request.isActive ?? true,
        isDefault: request.isDefault ?? false,
        createdBy: request.createdBy,
        tenantId: request.tenantId
      };

      const template = await this.knowledgeBaseRepository.createTemplate(templateData);

      this.logger.info(`✅ [CREATE-TEMPLATE-UC] Template created successfully`, {
        templateId: template.id,
        name: template.name,
        tenantId: request.tenantId
      });

      return {
        success: true,
        template,
        message: 'Template created successfully'
      };

    } catch (error: any) {
      this.logger.error(`❌ [CREATE-TEMPLATE-UC] Failed to create template`, {
        error: error.message,
        tenantId: request.tenantId,
        name: request.name
      });

      return {
        success: false,
        message: error.message || 'Failed to create template'
      };
    }
  }
}