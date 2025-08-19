// ✅ 1QA.MD COMPLIANCE: USE CASE - CLEAN ARCHITECTURE
// Application layer use case for publication scheduling

import { Logger } from 'winston';
import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';

export interface SchedulePublicationRequest {
  articleId: string;
  scheduledAt: string;
  tenantId: string;
  userId: string;
}

export interface SchedulePublicationResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class SchedulePublicationUseCase {
  constructor(
    private repository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async execute(request: SchedulePublicationRequest): Promise<SchedulePublicationResponse> {
    try {
      this.logger.info('Scheduling publication', { 
        articleId: request.articleId,
        scheduledAt: request.scheduledAt,
        tenantId: request.tenantId 
      });

      // Validate required fields
      if (!request.articleId || !request.scheduledAt || !request.tenantId) {
        return {
          success: false,
          message: 'ID do artigo, data agendada e tenant são obrigatórios'
        };
      }

      // Check if article exists
      const article = await this.repository.findById(request.articleId, request.tenantId);
      if (!article) {
        return {
          success: false,
          message: 'Artigo não encontrado'
        };
      }

      // Validate scheduled date is in the future
      const scheduledDate = new Date(request.scheduledAt);
      if (scheduledDate <= new Date()) {
        return {
          success: false,
          message: 'A data agendada deve estar no futuro'
        };
      }

      // Update article with scheduled publication
      const updateData = {
        status: 'scheduled' as any,
        scheduledAt: request.scheduledAt
      };

      const updatedArticle = await this.repository.update(
        request.articleId, 
        updateData, 
        request.tenantId
      );

      this.logger.info('Publication scheduled successfully', { 
        articleId: request.articleId,
        scheduledAt: request.scheduledAt,
        tenantId: request.tenantId 
      });

      return {
        success: true,
        message: 'Publicação agendada com sucesso',
        data: {
          articleId: request.articleId,
          scheduledAt: request.scheduledAt,
          status: 'scheduled'
        }
      };

    } catch (error: any) {
      this.logger.error('Error scheduling publication', { 
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