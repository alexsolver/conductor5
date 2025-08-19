// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - APPLICATION LAYER
// Use Case para agendamento de publicações seguindo padrões Domain-Driven Design

import { IKnowledgeBaseRepository } from "../../domain/repositories/IKnowledgeBaseRepository";
import { Logger } from "winston";
import { InsertKnowledgeBaseScheduledPublication } from "@shared/schema-knowledge-base";

export interface SchedulePublicationRequest {
  articleId: string;
  scheduledFor: Date;
  autoPublish?: boolean;
  notifyUsers?: boolean;
  scheduledBy: string;
  tenantId: string;
}

export interface SchedulePublicationResponse {
  success: boolean;
  scheduledPublication?: any;
  message: string;
}

export class SchedulePublicationUseCase {
  constructor(
    private knowledgeBaseRepository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async execute(request: SchedulePublicationRequest): Promise<SchedulePublicationResponse> {
    try {
      this.logger.info(`📅 [SCHEDULE-PUBLICATION-UC] Scheduling publication for article: ${request.articleId}`, {
        tenantId: request.tenantId,
        scheduledFor: request.scheduledFor,
        scheduledBy: request.scheduledBy
      });

      // Domain validation
      if (!request.articleId) {
        throw new Error('Article ID is required');
      }

      if (!request.scheduledFor) {
        throw new Error('Scheduled date is required');
      }

      if (request.scheduledFor <= new Date()) {
        throw new Error('Scheduled date must be in the future');
      }

      if (!request.scheduledBy) {
        throw new Error('Scheduler user ID is required');
      }

      // Verify article exists and is in appropriate state
      const article = await this.knowledgeBaseRepository.findById(
        request.articleId,
        request.tenantId
      );

      if (!article) {
        throw new Error('Article not found');
      }

      if (article.status === 'published') {
        throw new Error('Article is already published');
      }

      if (article.status !== 'approved' && article.status !== 'draft') {
        throw new Error('Article must be approved or in draft status to be scheduled');
      }

      // Check if there's already a scheduled publication for this article
      const existingSchedule = await this.knowledgeBaseRepository.findScheduledPublicationByArticle(
        request.articleId,
        request.tenantId
      );

      if (existingSchedule && existingSchedule.status === 'scheduled') {
        throw new Error('Article already has a scheduled publication');
      }

      const scheduleData = {
        articleId: request.articleId,
        scheduledFor: request.scheduledFor,
        autoPublish: request.autoPublish ?? true,
        notifyUsers: request.notifyUsers ?? false,
        scheduledBy: request.scheduledBy,
        tenantId: request.tenantId,
        status: 'scheduled'
      };

      const scheduledPublication = await this.knowledgeBaseRepository.createScheduledPublication(scheduleData);

      this.logger.info(`✅ [SCHEDULE-PUBLICATION-UC] Publication scheduled successfully`, {
        scheduleId: scheduledPublication.id,
        articleId: request.articleId,
        scheduledFor: request.scheduledFor,
        tenantId: request.tenantId
      });

      return {
        success: true,
        scheduledPublication,
        message: 'Publication scheduled successfully'
      };

    } catch (error: any) {
      this.logger.error(`❌ [SCHEDULE-PUBLICATION-UC] Failed to schedule publication`, {
        error: error.message,
        tenantId: request.tenantId,
        articleId: request.articleId,
        scheduledFor: request.scheduledFor
      });

      return {
        success: false,
        message: error.message || 'Failed to schedule publication'
      };
    }
  }
}