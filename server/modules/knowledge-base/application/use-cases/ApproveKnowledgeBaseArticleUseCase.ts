// ✅ 1QA.MD COMPLIANCE: APPROVE KNOWLEDGE BASE ARTICLE USE CASE - CLEAN ARCHITECTURE
// Application layer - orchestrates approval workflow logic

import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';
import { KnowledgeBaseArticle } from '../../domain/entities/KnowledgeBase';
import { Logger } from 'winston';

export interface ApproveKnowledgeBaseArticleCommand {
  articleId: string;
  reviewerId: string;
  action: 'approve' | 'reject' | 'request_changes';
  comment?: string;
}

export class ApproveKnowledgeBaseArticleUseCase {
  constructor(
    private repository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async execute(command: ApproveKnowledgeBaseArticleCommand, tenantId: string): Promise<KnowledgeBaseArticle> {
    try {
      this.logger.info(`Processing approval for article: ${command.articleId} by reviewer: ${command.reviewerId}`);

      // Check if article exists
      const article = await this.repository.findById(command.articleId, tenantId);
      if (!article) {
        throw new Error('Article not found');
      }

      // Validate approval action
      if (!['approve', 'reject', 'request_changes'].includes(command.action)) {
        throw new Error('Invalid approval action');
      }

      // Create approval history entry
      const approvalEntry = {
        articleId: command.articleId,
        userId: command.reviewerId,
        action: command.action as any,
        comment: command.comment,
        previousStatus: article.approvalStatus,
        newStatus: this.getNewApprovalStatus(command.action)
      };

      await this.repository.addApprovalEntry(approvalEntry, tenantId);

      // Update article status based on approval action
      const updates: Partial<KnowledgeBaseArticle> = {
        approvalStatus: this.getNewApprovalStatus(command.action),
        reviewerId: command.reviewerId
      };

      // If approved, publish the article
      if (command.action === 'approve') {
        updates.status = 'published';
        updates.publishedAt = new Date();
      }

      // Update article
      const updatedArticle = await this.repository.update(command.articleId, updates, tenantId);

      this.logger.info(`Article approval processed: ${command.articleId} - ${command.action}`);
      return updatedArticle;

    } catch (error) {
      this.logger.error(`Failed to process article approval: ${error}`);
      throw error;
    }
  }

  private getNewApprovalStatus(action: string): any {
    switch (action) {
      case 'approve':
        return 'approved';
      case 'reject':
        return 'rejected';
      case 'request_changes':
        return 'needs_revision';
      default:
        return 'pending_approval';
    }
  }
}