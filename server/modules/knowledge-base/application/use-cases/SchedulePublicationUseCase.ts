
// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE SCHEDULE PUBLICATION USE CASE - CLEAN ARCHITECTURE
// Application layer - manages scheduled publication of articles

import { Logger } from 'winston';
import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';
import { KnowledgeBaseArticle } from '../../domain/entities/KnowledgeBase';

export interface SchedulePublicationCommand {
  articleId: string;
  scheduledAt: Date;
  userId: string;
  publishSettings?: {
    notifySubscribers?: boolean;
    socialMediaShare?: boolean;
    emailNotification?: boolean;
    categories?: string[];
  };
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[]; // For weekly recurrence
    dayOfMonth?: number; // For monthly recurrence
  };
}

export interface ScheduledPublication {
  id: string;
  articleId: string;
  scheduledAt: Date;
  status: 'pending' | 'published' | 'failed' | 'cancelled';
  userId: string;
  publishSettings: SchedulePublicationCommand['publishSettings'];
  recurrence?: SchedulePublicationCommand['recurrence'];
  attempts: number;
  lastAttempt?: Date;
  errorMessage?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export interface PublicationQueue {
  upcoming: ScheduledPublication[];
  processing: ScheduledPublication[];
  completed: ScheduledPublication[];
  failed: ScheduledPublication[];
}

export class SchedulePublicationUseCase {
  constructor(
    private repository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async schedulePublication(
    command: SchedulePublicationCommand,
    tenantId: string
  ): Promise<ScheduledPublication> {
    try {
      this.logger.info(`⏰ [SCHEDULE] Scheduling publication for article: ${command.articleId}`);

      // Validate article exists and can be scheduled
      const article = await this.repository.findById(command.articleId, tenantId);
      if (!article) {
        throw new Error('Article not found');
      }

      if (article.status === 'published') {
        throw new Error('Article is already published');
      }

      // Validate scheduled time is in the future
      if (command.scheduledAt <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      // Create scheduled publication
      const scheduledPublication: ScheduledPublication = {
        id: crypto.randomUUID(),
        articleId: command.articleId,
        scheduledAt: command.scheduledAt,
        status: 'pending',
        userId: command.userId,
        publishSettings: command.publishSettings || {
          notifySubscribers: false,
          socialMediaShare: false,
          emailNotification: false
        },
        recurrence: command.recurrence,
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId
      };

      // Store scheduled publication
      await this.storeScheduledPublication(scheduledPublication, tenantId);

      // Update article with scheduled publication info
      const updatedArticle: KnowledgeBaseArticle = {
        ...article,
        status: 'scheduled' as any,
        scheduledPublishAt: command.scheduledAt,
        updatedAt: new Date()
      };

      await this.repository.update(updatedArticle, tenantId);

      // Schedule background job
      await this.scheduleBackgroundJob(scheduledPublication, tenantId);

      this.logger.info(`✅ [SCHEDULE] Publication scheduled successfully: ${scheduledPublication.id}`);
      return scheduledPublication;

    } catch (error) {
      this.logger.error(`❌ [SCHEDULE] Failed to schedule publication: ${error}`);
      throw error;
    }
  }

  async cancelScheduledPublication(
    scheduleId: string,
    userId: string,
    tenantId: string
  ): Promise<void> {
    try {
      this.logger.info(`🚫 [SCHEDULE] Cancelling scheduled publication: ${scheduleId}`);

      const scheduledPublication = await this.getScheduledPublication(scheduleId, tenantId);
      
      if (scheduledPublication.status !== 'pending') {
        throw new Error('Can only cancel pending scheduled publications');
      }

      // Update scheduled publication status
      scheduledPublication.status = 'cancelled';
      scheduledPublication.updatedAt = new Date();
      await this.updateScheduledPublication(scheduledPublication, tenantId);

      // Update article status back to draft
      const article = await this.repository.findById(scheduledPublication.articleId, tenantId);
      if (article) {
        const updatedArticle: KnowledgeBaseArticle = {
          ...article,
          status: 'draft',
          scheduledPublishAt: undefined,
          updatedAt: new Date()
        };
        await this.repository.update(updatedArticle, tenantId);
      }

      // Cancel background job
      await this.cancelBackgroundJob(scheduleId, tenantId);

      this.logger.info(`✅ [SCHEDULE] Scheduled publication cancelled: ${scheduleId}`);

    } catch (error) {
      this.logger.error(`❌ [SCHEDULE] Failed to cancel scheduled publication: ${error}`);
      throw error;
    }
  }

  async processScheduledPublications(tenantId: string): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: Array<{ scheduleId: string; error: string }>;
  }> {
    try {
      this.logger.info(`🔄 [SCHEDULE] Processing scheduled publications for tenant: ${tenantId}`);

      const duePublications = await this.getDuePublications(tenantId);
      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [] as Array<{ scheduleId: string; error: string }>
      };

      for (const publication of duePublications) {
        try {
          results.processed++;
          await this.processPublication(publication, tenantId);
          results.successful++;
          
          this.logger.info(`✅ [SCHEDULE] Successfully published: ${publication.articleId}`);

        } catch (error) {
          results.failed++;
          results.errors.push({
            scheduleId: publication.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          // Update publication with error
          publication.status = 'failed';
          publication.errorMessage = error instanceof Error ? error.message : 'Unknown error';
          publication.attempts++;
          publication.lastAttempt = new Date();
          publication.updatedAt = new Date();
          
          await this.updateScheduledPublication(publication, tenantId);

          this.logger.error(`❌ [SCHEDULE] Failed to publish: ${publication.articleId} - ${error}`);
        }
      }

      this.logger.info(`📊 [SCHEDULE] Processing complete: ${results.successful}/${results.processed} successful`);
      return results;

    } catch (error) {
      this.logger.error(`❌ [SCHEDULE] Failed to process scheduled publications: ${error}`);
      throw error;
    }
  }

  async getPublicationQueue(tenantId: string): Promise<PublicationQueue> {
    try {
      this.logger.info(`📋 [SCHEDULE] Retrieving publication queue for tenant: ${tenantId}`);

      const allScheduled = await this.getAllScheduledPublications(tenantId);

      return {
        upcoming: allScheduled.filter(p => p.status === 'pending' && p.scheduledAt > new Date()),
        processing: allScheduled.filter(p => p.status === 'pending' && p.scheduledAt <= new Date()),
        completed: allScheduled.filter(p => p.status === 'published'),
        failed: allScheduled.filter(p => p.status === 'failed')
      };

    } catch (error) {
      this.logger.error(`❌ [SCHEDULE] Failed to get publication queue: ${error}`);
      throw error;
    }
  }

  async reschedulePublication(
    scheduleId: string,
    newScheduledAt: Date,
    userId: string,
    tenantId: string
  ): Promise<ScheduledPublication> {
    try {
      this.logger.info(`🔄 [SCHEDULE] Rescheduling publication: ${scheduleId}`);

      const scheduledPublication = await this.getScheduledPublication(scheduleId, tenantId);
      
      if (scheduledPublication.status !== 'pending' && scheduledPublication.status !== 'failed') {
        throw new Error('Can only reschedule pending or failed publications');
      }

      if (newScheduledAt <= new Date()) {
        throw new Error('New scheduled time must be in the future');
      }

      // Update scheduled publication
      scheduledPublication.scheduledAt = newScheduledAt;
      scheduledPublication.status = 'pending';
      scheduledPublication.errorMessage = undefined;
      scheduledPublication.updatedAt = new Date();

      await this.updateScheduledPublication(scheduledPublication, tenantId);

      // Reschedule background job
      await this.scheduleBackgroundJob(scheduledPublication, tenantId);

      this.logger.info(`✅ [SCHEDULE] Publication rescheduled: ${scheduleId}`);
      return scheduledPublication;

    } catch (error) {
      this.logger.error(`❌ [SCHEDULE] Failed to reschedule publication: ${error}`);
      throw error;
    }
  }

  private async processPublication(publication: ScheduledPublication, tenantId: string): Promise<void> {
    // Get article
    const article = await this.repository.findById(publication.articleId, tenantId);
    if (!article) {
      throw new Error('Article not found');
    }

    // Publish article
    const updatedArticle: KnowledgeBaseArticle = {
      ...article,
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date()
    };

    await this.repository.update(updatedArticle, tenantId);

    // Update scheduled publication
    publication.status = 'published';
    publication.publishedAt = new Date();
    publication.updatedAt = new Date();
    await this.updateScheduledPublication(publication, tenantId);

    // Handle post-publication actions
    await this.handlePostPublicationActions(publication, updatedArticle, tenantId);

    // Handle recurrence
    if (publication.recurrence) {
      await this.handleRecurrence(publication, tenantId);
    }
  }

  private async handlePostPublicationActions(
    publication: ScheduledPublication,
    article: KnowledgeBaseArticle,
    tenantId: string
  ): Promise<void> {
    const settings = publication.publishSettings;

    if (settings?.notifySubscribers) {
      await this.notifySubscribers(article, tenantId);
    }

    if (settings?.emailNotification) {
      await this.sendEmailNotification(article, publication.userId, tenantId);
    }

    if (settings?.socialMediaShare) {
      await this.shareOnSocialMedia(article, tenantId);
    }
  }

  private async handleRecurrence(publication: ScheduledPublication, tenantId: string): Promise<void> {
    if (!publication.recurrence) return;

    const nextScheduledAt = this.calculateNextRecurrence(publication.scheduledAt, publication.recurrence);
    
    if (publication.recurrence.endDate && nextScheduledAt > publication.recurrence.endDate) {
      return; // Recurrence has ended
    }

    // Create new scheduled publication for recurrence
    const nextPublication: ScheduledPublication = {
      ...publication,
      id: crypto.randomUUID(),
      scheduledAt: nextScheduledAt,
      status: 'pending',
      attempts: 0,
      lastAttempt: undefined,
      errorMessage: undefined,
      publishedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storeScheduledPublication(nextPublication, tenantId);
    await this.scheduleBackgroundJob(nextPublication, tenantId);
  }

  private calculateNextRecurrence(currentDate: Date, recurrence: NonNullable<SchedulePublicationCommand['recurrence']>): Date {
    const next = new Date(currentDate);

    switch (recurrence.type) {
      case 'daily':
        next.setDate(next.getDate() + recurrence.interval);
        break;
      case 'weekly':
        next.setDate(next.getDate() + (7 * recurrence.interval));
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + recurrence.interval);
        if (recurrence.dayOfMonth) {
          next.setDate(recurrence.dayOfMonth);
        }
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + recurrence.interval);
        break;
    }

    return next;
  }

  // Mock implementation methods - in real app, these would be properly implemented
  private async storeScheduledPublication(publication: ScheduledPublication, tenantId: string): Promise<void> {
    this.logger.info(`💾 [SCHEDULE] Storing scheduled publication: ${publication.id}`);
  }

  private async getScheduledPublication(scheduleId: string, tenantId: string): Promise<ScheduledPublication> {
    // Mock implementation
    throw new Error('Scheduled publication not found');
  }

  private async updateScheduledPublication(publication: ScheduledPublication, tenantId: string): Promise<void> {
    this.logger.info(`🔄 [SCHEDULE] Updating scheduled publication: ${publication.id}`);
  }

  private async getDuePublications(tenantId: string): Promise<ScheduledPublication[]> {
    // Mock implementation - would query database for due publications
    return [];
  }

  private async getAllScheduledPublications(tenantId: string): Promise<ScheduledPublication[]> {
    // Mock implementation
    return [];
  }

  private async scheduleBackgroundJob(publication: ScheduledPublication, tenantId: string): Promise<void> {
    this.logger.info(`⏰ [SCHEDULE] Background job scheduled for: ${publication.scheduledAt}`);
  }

  private async cancelBackgroundJob(scheduleId: string, tenantId: string): Promise<void> {
    this.logger.info(`🚫 [SCHEDULE] Background job cancelled for: ${scheduleId}`);
  }

  private async notifySubscribers(article: KnowledgeBaseArticle, tenantId: string): Promise<void> {
    this.logger.info(`📢 [SCHEDULE] Notifying subscribers about: ${article.title}`);
  }

  private async sendEmailNotification(article: KnowledgeBaseArticle, userId: string, tenantId: string): Promise<void> {
    this.logger.info(`📧 [SCHEDULE] Sending email notification for: ${article.title}`);
  }

  private async shareOnSocialMedia(article: KnowledgeBaseArticle, tenantId: string): Promise<void> {
    this.logger.info(`📱 [SCHEDULE] Sharing on social media: ${article.title}`);
  }
}
