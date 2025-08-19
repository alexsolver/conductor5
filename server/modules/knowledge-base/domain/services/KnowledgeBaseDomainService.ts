// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE DOMAIN SERVICE - CLEAN ARCHITECTURE
// Pure business logic - no infrastructure dependencies

import { 
  KnowledgeBaseArticle, 
  ArticleStatus, 
  ApprovalStatus,
  ApprovalAction,
  ApprovalHistoryEntry,
  KnowledgeBaseBusinessRules
} from '../entities/KnowledgeBase';

export class KnowledgeBaseDomainService {
  /**
   * Validates if an article can be published
   */
  static validateForPublication(article: KnowledgeBaseArticle): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!KnowledgeBaseBusinessRules.validateTitle(article.title)) {
      errors.push('Title must be between 3 and 200 characters');
    }

    if (!KnowledgeBaseBusinessRules.validateContent(article.content)) {
      errors.push('Content must be at least 10 characters long');
    }

    if (!article.category || article.category.trim().length === 0) {
      errors.push('Category is required');
    }

    if (article.approvalStatus !== ApprovalStatus.APPROVED && article.status === ArticleStatus.PUBLISHED) {
      errors.push('Article must be approved before publishing');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Processes approval workflow transition
   */
  static processApprovalTransition(
    article: KnowledgeBaseArticle,
    action: ApprovalAction,
    userId: string,
    comment?: string
  ): { 
    newStatus: ApprovalStatus; 
    newArticleStatus?: ArticleStatus;
    historyEntry: Omit<ApprovalHistoryEntry, 'id' | 'timestamp'>;
    isValid: boolean;
    error?: string;
  } {
    const previousStatus = article.approvalStatus;
    let newStatus = previousStatus;
    let newArticleStatus = article.status;

    // Validate transition
    switch (action) {
      case ApprovalAction.SUBMIT:
        if (previousStatus !== ApprovalStatus.NOT_SUBMITTED) {
          return { newStatus: previousStatus, historyEntry: null as any, isValid: false, error: 'Article already submitted' };
        }
        if (!KnowledgeBaseBusinessRules.canEdit(article, userId)) {
          return { newStatus: previousStatus, historyEntry: null as any, isValid: false, error: 'User cannot submit this article' };
        }
        newStatus = ApprovalStatus.PENDING_APPROVAL;
        newArticleStatus = ArticleStatus.PENDING_REVIEW;
        break;

      case ApprovalAction.APPROVE:
        if (previousStatus !== ApprovalStatus.PENDING_APPROVAL) {
          return { newStatus: previousStatus, historyEntry: null as any, isValid: false, error: 'Article is not pending approval' };
        }
        if (!KnowledgeBaseBusinessRules.canApprove(article, userId)) {
          return { newStatus: previousStatus, historyEntry: null as any, isValid: false, error: 'User cannot approve this article' };
        }
        newStatus = ApprovalStatus.APPROVED;
        newArticleStatus = ArticleStatus.PUBLISHED;
        break;

      case ApprovalAction.REJECT:
        if (previousStatus !== ApprovalStatus.PENDING_APPROVAL) {
          return { newStatus: previousStatus, historyEntry: null as any, isValid: false, error: 'Article is not pending approval' };
        }
        if (!KnowledgeBaseBusinessRules.canApprove(article, userId)) {
          return { newStatus: previousStatus, historyEntry: null as any, isValid: false, error: 'User cannot reject this article' };
        }
        newStatus = ApprovalStatus.REJECTED;
        newArticleStatus = ArticleStatus.REJECTED;
        break;

      case ApprovalAction.REQUEST_CHANGES:
        if (previousStatus !== ApprovalStatus.PENDING_APPROVAL) {
          return { newStatus: previousStatus, historyEntry: null as any, isValid: false, error: 'Article is not pending approval' };
        }
        if (!KnowledgeBaseBusinessRules.canApprove(article, userId)) {
          return { newStatus: previousStatus, historyEntry: null as any, isValid: false, error: 'User cannot request changes for this article' };
        }
        newStatus = ApprovalStatus.CHANGES_REQUESTED;
        newArticleStatus = ArticleStatus.DRAFT;
        break;

      case ApprovalAction.WITHDRAW:
        if (previousStatus !== ApprovalStatus.PENDING_APPROVAL) {
          return { newStatus: previousStatus, historyEntry: null as any, isValid: false, error: 'Article is not pending approval' };
        }
        if (!KnowledgeBaseBusinessRules.canEdit(article, userId)) {
          return { newStatus: previousStatus, historyEntry: null as any, isValid: false, error: 'User cannot withdraw this article' };
        }
        newStatus = ApprovalStatus.NOT_SUBMITTED;
        newArticleStatus = ArticleStatus.DRAFT;
        break;

      default:
        return { newStatus: previousStatus, historyEntry: null as any, isValid: false, error: 'Invalid approval action' };
    }

    const historyEntry: Omit<ApprovalHistoryEntry, 'id' | 'timestamp'> = {
      articleId: article.id,
      userId,
      action,
      comment,
      previousStatus,
      newStatus
    };

    return {
      newStatus,
      newArticleStatus,
      historyEntry,
      isValid: true
    };
  }

  /**
   * Calculates content similarity score between articles
   */
  static calculateSimilarity(article1: KnowledgeBaseArticle, article2: KnowledgeBaseArticle): number {
    // Simple similarity based on tags and category
    let score = 0;

    // Category match
    if (article1.category === article2.category) {
      score += 0.3;
    }

    // Tag intersection
    const tags1 = new Set(article1.tags);
    const tags2 = new Set(article2.tags);
    const intersection = new Set(Array.from(tags1).filter(tag => tags2.has(tag)));
    const union = new Set([...Array.from(tags1), ...Array.from(tags2)]);
    
    if (union.size > 0) {
      score += (intersection.size / union.size) * 0.7;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Generates suggested tags based on content
   */
  static generateSuggestedTags(title: string, content: string, existingTags: string[]): string[] {
    const words = `${title} ${content}`.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    const sortedWords = Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .map(([word]) => word)
      .filter(word => !existingTags.includes(word))
      .slice(0, 5);

    return sortedWords;
  }

  /**
   * Validates article update permissions
   */
  static validateUpdatePermissions(
    article: KnowledgeBaseArticle, 
    userId: string, 
    updates: Partial<KnowledgeBaseArticle>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if user can edit
    if (!KnowledgeBaseBusinessRules.canEdit(article, userId)) {
      errors.push('User does not have permission to edit this article');
    }

    // Validate specific field updates
    if (updates.status === ArticleStatus.PUBLISHED) {
      if (!KnowledgeBaseBusinessRules.canPublish(article, userId)) {
        errors.push('User cannot publish this article without approval');
      }
    }

    if (updates.title && !KnowledgeBaseBusinessRules.validateTitle(updates.title)) {
      errors.push('Invalid title length');
    }

    if (updates.content && !KnowledgeBaseBusinessRules.validateContent(updates.content)) {
      errors.push('Invalid content length');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Determines if article needs version increment
   */
  static shouldIncrementVersion(currentArticle: KnowledgeBaseArticle, updates: Partial<KnowledgeBaseArticle>): boolean {
    // Increment version for significant changes
    const significantFields = ['title', 'content', 'category'];
    return significantFields.some(field => updates[field as keyof KnowledgeBaseArticle] !== undefined);
  }
}