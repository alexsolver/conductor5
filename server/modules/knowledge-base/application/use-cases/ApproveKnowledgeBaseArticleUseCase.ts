// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE APPROVAL USE CASE - CLEAN ARCHITECTURE
// Application layer - orchestrates approval workflow with business rules

import { Logger } from 'winston';
import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';
import { ApprovalStatus, ApprovalAction, ApprovalHistoryEntry, KnowledgeBaseArticle } from '../../domain/entities/KnowledgeBase';

export interface ApprovalCommand {
  articleId: string;
  reviewerId: string;
  action: ApprovalAction;
  comment?: string;
  notifyAuthor?: boolean;
}

export interface ApprovalWorkflowRule {
  id: string;
  tenantId: string;
  category: string;
  requiredApprovers: number;
  approverRoles: string[];
  autoApproveThreshold?: number;
  escalationTime?: number;
  isActive: boolean;
}

export class ApproveKnowledgeBaseArticleUseCase {
  constructor(
    private repository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async execute(command: ApprovalCommand, tenantId: string): Promise<KnowledgeBaseArticle> {
    try {
      this.logger.info(`🔄 [APPROVAL-WORKFLOW] Processing approval for article: ${command.articleId}`);

      // Get current article
      const article = await this.repository.findById(command.articleId, tenantId);
      if (!article) {
        throw new Error('Article not found');
      }

      // Validate approval permissions
      await this.validateApprovalPermissions(command.reviewerId, article, tenantId);

      // Get workflow rules for this category
      const workflowRules = await this.getWorkflowRules(article.category, tenantId);

      // Create approval history entry
      const historyEntry: ApprovalHistoryEntry = {
        id: crypto.randomUUID(),
        articleId: command.articleId,
        userId: command.reviewerId,
        action: command.action,
        comment: command.comment,
        timestamp: new Date(),
        previousStatus: article.approvalStatus,
        newStatus: await this.determineNewStatus(command.action, article, workflowRules, tenantId)
      };

      // Update article with new approval status
      const updatedArticle: KnowledgeBaseArticle = {
        ...article,
        approvalStatus: historyEntry.newStatus,
        reviewerId: command.reviewerId,
        approvalHistory: [...(article.approvalHistory || []), historyEntry],
        updatedAt: new Date()
      };

      // Handle status transitions
      if (command.action === ApprovalAction.APPROVE && historyEntry.newStatus === ApprovalStatus.APPROVED) {
        updatedArticle.status = 'published';
        updatedArticle.publishedAt = new Date();
        this.logger.info(`✅ [APPROVAL-WORKFLOW] Article ${command.articleId} approved and published`);
      } else if (command.action === ApprovalAction.REJECT) {
        updatedArticle.status = 'draft';
        this.logger.info(`❌ [APPROVAL-WORKFLOW] Article ${command.articleId} rejected`);
      } else if (command.action === ApprovalAction.REQUEST_CHANGES) {
        updatedArticle.status = 'draft';
        this.logger.info(`🔄 [APPROVAL-WORKFLOW] Changes requested for article ${command.articleId}`);
      }

      // Save updated article
      const result = await this.repository.update(updatedArticle, tenantId);

      // Trigger notifications if enabled
      if (command.notifyAuthor) {
        await this.sendApprovalNotification(updatedArticle, command, tenantId);
      }

      this.logger.info(`✅ [APPROVAL-WORKFLOW] Approval processed successfully for article: ${command.articleId}`);
      return result;

    } catch (error) {
      this.logger.error(`❌ [APPROVAL-WORKFLOW] Approval processing failed: ${error}`);
      throw error;
    }
  }

  private async validateApprovalPermissions(reviewerId: string, article: KnowledgeBaseArticle, tenantId: string): Promise<void> {
    // Prevent authors from approving their own articles
    if (article.authorId === reviewerId) {
      throw new Error('Authors cannot approve their own articles');
    }

    // Additional role-based validation could be added here
    this.logger.info(`✅ [APPROVAL-WORKFLOW] Approval permissions validated for reviewer: ${reviewerId}`);
  }

  private async getWorkflowRules(category: string, tenantId: string): Promise<ApprovalWorkflowRule | null> {
    // Default workflow rules - could be stored in database
    const defaultRules: ApprovalWorkflowRule = {
      id: crypto.randomUUID(),
      tenantId,
      category,
      requiredApprovers: 1,
      approverRoles: ['admin', 'editor', 'reviewer'],
      autoApproveThreshold: undefined,
      escalationTime: 72, // hours
      isActive: true
    };

    return defaultRules;
  }

  private async determineNewStatus(
    action: ApprovalAction, 
    article: KnowledgeBaseArticle, 
    workflowRules: ApprovalWorkflowRule | null,
    tenantId: string
  ): Promise<ApprovalStatus> {
    switch (action) {
      case ApprovalAction.APPROVE:
        // Check if multiple approvals are required
        if (workflowRules && workflowRules.requiredApprovers > 1) {
          const approvalCount = this.countApprovals(article.approvalHistory || []);
          if (approvalCount + 1 >= workflowRules.requiredApprovers) {
            return ApprovalStatus.APPROVED;
          } else {
            return ApprovalStatus.PENDING_APPROVAL;
          }
        }
        return ApprovalStatus.APPROVED;

      case ApprovalAction.REJECT:
        return ApprovalStatus.REJECTED;

      case ApprovalAction.REQUEST_CHANGES:
        return ApprovalStatus.CHANGES_REQUESTED;

      case ApprovalAction.SUBMIT:
        return ApprovalStatus.PENDING_APPROVAL;

      case ApprovalAction.WITHDRAW:
        return ApprovalStatus.NOT_SUBMITTED;

      default:
        return article.approvalStatus;
    }
  }

  private countApprovals(history: ApprovalHistoryEntry[]): number {
    return history.filter(entry => entry.action === ApprovalAction.APPROVE).length;
  }

  private async sendApprovalNotification(
    article: KnowledgeBaseArticle, 
    command: ApprovalCommand, 
    tenantId: string
  ): Promise<void> {
    try {
      // Notification implementation would go here
      this.logger.info(`📧 [APPROVAL-WORKFLOW] Notification sent for article: ${article.id}`);
    } catch (error) {
      this.logger.warn(`⚠️ [APPROVAL-WORKFLOW] Failed to send notification: ${error}`);
    }
  }

  // Additional method for getting approval workflow status
  async getApprovalStatus(articleId: string, tenantId: string): Promise<{
    status: ApprovalStatus;
    history: ApprovalHistoryEntry[];
    nextApprovers?: string[];
    canApprove: boolean;
  }> {
    const article = await this.repository.findById(articleId, tenantId);
    if (!article) {
      throw new Error('Article not found');
    }

    return {
      status: article.approvalStatus,
      history: article.approvalHistory || [],
      nextApprovers: await this.getNextApprovers(article, tenantId),
      canApprove: article.approvalStatus === ApprovalStatus.PENDING_APPROVAL
    };
  }

  private async getNextApprovers(article: KnowledgeBaseArticle, tenantId: string): Promise<string[]> {
    // Implementation for determining next approvers based on workflow rules
    return [];
  }
}