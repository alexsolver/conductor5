// ✅ 1QA.MD COMPLIANCE: USE CASE - CLEAN ARCHITECTURE
// Application layer use case for template creation

import { Logger } from 'winston';
import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';

export interface CreateTemplateRequest {
  name: string;
  description: string;
  category: string;
  defaultTags: string[];
  structure?: any[];
  tenantId: string;
  createdBy: string;
}

export interface CreateTemplateResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class CreateTemplateUseCase {
  constructor(
    private repository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async execute(request: CreateTemplateRequest): Promise<CreateTemplateResponse> {
    try {
      this.logger.info('Creating template', { 
        name: request.name,
        tenantId: request.tenantId 
      });

      // Validate required fields
      if (!request.name || !request.category || !request.tenantId) {
        return {
          success: false,
          message: 'Nome, categoria e tenant são obrigatórios'
        };
      }

      // Create template with default structure
      const templateData = {
        name: request.name,
        description: request.description || '',
        category: request.category,
        defaultTags: request.defaultTags || [],
        structure: request.structure || [
          { type: 'heading', content: 'Título' },
          { type: 'text', content: 'Conteúdo aqui...' }
        ],
        createdBy: request.createdBy
      };

      const template = await this.repository.createTemplate(templateData, request.tenantId);

      this.logger.info('Template created successfully', { 
        templateId: template.id,
        tenantId: request.tenantId 
      });

      return {
        success: true,
        message: 'Template criado com sucesso',
        data: template
      };

    } catch (error: any) {
      this.logger.error('Error creating template', { 
        error: error.message,
        tenantId: request.tenantId 
      });

      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }
}