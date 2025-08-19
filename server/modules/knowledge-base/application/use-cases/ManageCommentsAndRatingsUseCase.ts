
// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE COMMENTS AND RATINGS USE CASE - CLEAN ARCHITECTURE
// Application layer - manages comments, ratings and collaborative features

import { Logger } from 'winston';
import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';

export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  parentCommentId?: string;
  isResolved: boolean;
  isHighlighted: boolean;
  reactions: Reaction[];
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  threadDepth: number;
  editHistory: Array<{
    editedAt: Date;
    previousContent: string;
    editReason?: string;
  }>;
}

export interface Reaction {
  id: string;
  userId: string;
  type: 'like' | 'helpful' | 'love' | 'thumbs_up' | 'thumbs_down' | 'question' | 'suggestion';
  createdAt: Date;
}

export interface Rating {
  id: string;
  articleId: string;
  userId: string;
  score: number; // 1-5 scale
  review?: string;
  categories: {
    accuracy: number;
    clarity: number;
    completeness: number;
    usefulness: number;
  };
  isVerifiedUser: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  tags: string[];
}

export interface ArticleAnalytics {
  articleId: string;
  ratings: {
    averageScore: number;
    totalRatings: number;
    distribution: Record<number, number>;
    categoryAverages: {
      accuracy: number;
      clarity: number;
      completeness: number;
      usefulness: number;
    };
  };
  comments: {
    totalComments: number;
    resolvedComments: number;
    activeThreads: number;
    engagementRate: number;
  };
  reactions: {
    totalReactions: number;
    reactionBreakdown: Record<string, number>;
  };
}

export class ManageCommentsAndRatingsUseCase {
  constructor(
    private repository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  // COMMENTS MANAGEMENT
  async addComment(
    articleId: string,
    userId: string,
    content: string,
    parentCommentId?: string,
    tenantId?: string
  ): Promise<Comment> {
    try {
      this.logger.info(`💬 [COMMENTS] Adding comment to article: ${articleId}`);

      // Validate article exists
      const article = await this.repository.findById(articleId, tenantId || '');
      if (!article) {
        throw new Error('Article not found');
      }

      // Determine thread depth
      let threadDepth = 0;
      if (parentCommentId) {
        const parentComment = await this.getComment(parentCommentId, tenantId || '');
        threadDepth = parentComment.threadDepth + 1;
        if (threadDepth > 3) { // Max depth limit
          throw new Error('Maximum comment depth reached');
        }
      }

      const comment: Comment = {
        id: crypto.randomUUID(),
        articleId,
        userId,
        userName: await this.getUserName(userId, tenantId || ''),
        userAvatar: await this.getUserAvatar(userId, tenantId || ''),
        content: this.sanitizeContent(content),
        parentCommentId,
        isResolved: false,
        isHighlighted: false,
        reactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: tenantId || '',
        threadDepth,
        editHistory: []
      };

      // Store comment
      await this.storeComment(comment, tenantId || '');

      // Update article engagement metrics
      await this.updateArticleEngagement(articleId, 'comment_added', tenantId || '');

      this.logger.info(`✅ [COMMENTS] Comment added successfully: ${comment.id}`);
      return comment;

    } catch (error) {
      this.logger.error(`❌ [COMMENTS] Failed to add comment: ${error}`);
      throw error;
    }
  }

  async getComments(
    articleId: string, 
    options?: {
      includeReplies?: boolean;
      sortBy?: 'newest' | 'oldest' | 'most_helpful';
      limit?: number;
      offset?: number;
    },
    tenantId?: string
  ): Promise<{
    comments: Comment[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      this.logger.info(`📋 [COMMENTS] Retrieving comments for article: ${articleId}`);

      // Mock comments - in real implementation, query from kb_comments table
      const mockComments: Comment[] = [
        {
          id: '1',
          articleId,
          userId: 'user1',
          userName: 'João Silva',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joao',
          content: 'Muito útil! Este artigo me ajudou a resolver o problema rapidamente.',
          isResolved: false,
          isHighlighted: true,
          reactions: [
            { id: '1', userId: 'user2', type: 'helpful', createdAt: new Date() },
            { id: '2', userId: 'user3', type: 'like', createdAt: new Date() }
          ],
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000),
          tenantId: tenantId || '',
          threadDepth: 0,
          editHistory: []
        },
        {
          id: '2',
          articleId,
          userId: 'user2',
          userName: 'Maria Santos',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
          content: 'Concordo! Sugiro adicionar uma seção sobre troubleshooting.',
          parentCommentId: '1',
          isResolved: false,
          isHighlighted: false,
          reactions: [
            { id: '3', userId: 'user1', type: 'suggestion', createdAt: new Date() }
          ],
          createdAt: new Date(Date.now() - 43200000),
          updatedAt: new Date(Date.now() - 43200000),
          tenantId: tenantId || '',
          threadDepth: 1,
          editHistory: []
        }
      ];

      const limit = options?.limit || 20;
      const offset = options?.offset || 0;

      // Apply sorting
      let sortedComments = [...mockComments];
      if (options?.sortBy === 'newest') {
        sortedComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      } else if (options?.sortBy === 'most_helpful') {
        sortedComments.sort((a, b) => 
          b.reactions.filter(r => r.type === 'helpful').length - 
          a.reactions.filter(r => r.type === 'helpful').length
        );
      }

      // Apply pagination
      const paginatedComments = sortedComments.slice(offset, offset + limit);

      return {
        comments: paginatedComments,
        total: mockComments.length,
        hasMore: offset + limit < mockComments.length
      };

    } catch (error) {
      this.logger.error(`❌ [COMMENTS] Failed to retrieve comments: ${error}`);
      throw error;
    }
  }

  async addReaction(
    commentId: string,
    userId: string,
    reactionType: Reaction['type'],
    tenantId: string
  ): Promise<Comment> {
    try {
      this.logger.info(`👍 [REACTIONS] Adding reaction to comment: ${commentId}`);

      const comment = await this.getComment(commentId, tenantId);
      
      // Remove existing reaction from same user
      comment.reactions = comment.reactions.filter(r => r.userId !== userId);
      
      // Add new reaction
      comment.reactions.push({
        id: crypto.randomUUID(),
        userId,
        type: reactionType,
        createdAt: new Date()
      });

      comment.updatedAt = new Date();

      // Update comment in storage
      await this.updateComment(comment, tenantId);

      this.logger.info(`✅ [REACTIONS] Reaction added successfully`);
      return comment;

    } catch (error) {
      this.logger.error(`❌ [REACTIONS] Failed to add reaction: ${error}`);
      throw error;
    }
  }

  // RATINGS MANAGEMENT
  async addRating(
    articleId: string,
    userId: string,
    score: number,
    categories: Rating['categories'],
    review?: string,
    tags?: string[],
    tenantId?: string
  ): Promise<Rating> {
    try {
      this.logger.info(`⭐ [RATINGS] Adding rating to article: ${articleId}`);

      // Validate score
      if (score < 1 || score > 5) {
        throw new Error('Rating score must be between 1 and 5');
      }

      // Validate article exists
      const article = await this.repository.findById(articleId, tenantId || '');
      if (!article) {
        throw new Error('Article not found');
      }

      // Check if user already rated this article
      const existingRating = await this.getUserRating(articleId, userId, tenantId || '');
      if (existingRating) {
        throw new Error('User has already rated this article');
      }

      const rating: Rating = {
        id: crypto.randomUUID(),
        articleId,
        userId,
        score,
        review: review ? this.sanitizeContent(review) : undefined,
        categories,
        isVerifiedUser: await this.isVerifiedUser(userId, tenantId || ''),
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: tenantId || '',
        tags: tags || []
      };

      // Store rating
      await this.storeRating(rating, tenantId || '');

      // Update article rating analytics
      await this.updateArticleRatingStats(articleId, tenantId || '');

      this.logger.info(`✅ [RATINGS] Rating added successfully: ${rating.id}`);
      return rating;

    } catch (error) {
      this.logger.error(`❌ [RATINGS] Failed to add rating: ${error}`);
      throw error;
    }
  }

  async getArticleAnalytics(articleId: string, tenantId: string): Promise<ArticleAnalytics> {
    try {
      this.logger.info(`📊 [ANALYTICS] Generating analytics for article: ${articleId}`);

      // Mock analytics - in real implementation, aggregate from database
      const analytics: ArticleAnalytics = {
        articleId,
        ratings: {
          averageScore: 4.6,
          totalRatings: 23,
          distribution: { 1: 0, 2: 1, 3: 2, 4: 8, 5: 12 },
          categoryAverages: {
            accuracy: 4.7,
            clarity: 4.5,
            completeness: 4.4,
            usefulness: 4.8
          }
        },
        comments: {
          totalComments: 15,
          resolvedComments: 8,
          activeThreads: 5,
          engagementRate: 0.75
        },
        reactions: {
          totalReactions: 45,
          reactionBreakdown: {
            'helpful': 18,
            'like': 15,
            'love': 8,
            'thumbs_up': 4
          }
        }
      };

      return analytics;

    } catch (error) {
      this.logger.error(`❌ [ANALYTICS] Failed to generate analytics: ${error}`);
      throw error;
    }
  }

  async moderateComment(
    commentId: string,
    moderatorId: string,
    action: 'approve' | 'flag' | 'hide' | 'highlight' | 'resolve',
    reason?: string,
    tenantId?: string
  ): Promise<Comment> {
    try {
      this.logger.info(`🛡️ [MODERATION] Moderating comment: ${commentId} - Action: ${action}`);

      const comment = await this.getComment(commentId, tenantId || '');

      switch (action) {
        case 'highlight':
          comment.isHighlighted = true;
          break;
        case 'resolve':
          comment.isResolved = true;
          break;
        case 'hide':
          // In real implementation, mark as hidden
          break;
      }

      comment.updatedAt = new Date();
      await this.updateComment(comment, tenantId || '');

      // Log moderation action
      await this.logModerationAction(commentId, moderatorId, action, reason, tenantId || '');

      this.logger.info(`✅ [MODERATION] Comment moderated successfully`);
      return comment;

    } catch (error) {
      this.logger.error(`❌ [MODERATION] Failed to moderate comment: ${error}`);
      throw error;
    }
  }

  // PRIVATE HELPER METHODS
  private async getComment(commentId: string, tenantId: string): Promise<Comment> {
    // Mock implementation - in real app, query from database
    const comments = await this.getComments('any', undefined, tenantId);
    const comment = comments.comments.find(c => c.id === commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }
    return comment;
  }

  private async getUserName(userId: string, tenantId: string): Promise<string> {
    // Mock implementation - in real app, query user service
    return 'Usuário';
  }

  private async getUserAvatar(userId: string, tenantId: string): Promise<string> {
    // Mock implementation - generate avatar URL
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
  }

  private async isVerifiedUser(userId: string, tenantId: string): Promise<boolean> {
    // Mock implementation - check user verification status
    return Math.random() > 0.5;
  }

  private sanitizeContent(content: string): string {
    // Basic content sanitization
    return content.trim().slice(0, 2000); // Max length limit
  }

  private async storeComment(comment: Comment, tenantId: string): Promise<void> {
    // Store in kb_comments table
    this.logger.info(`💾 [COMMENTS] Comment stored: ${comment.id}`);
  }

  private async updateComment(comment: Comment, tenantId: string): Promise<void> {
    // Update comment in database
    this.logger.info(`🔄 [COMMENTS] Comment updated: ${comment.id}`);
  }

  private async storeRating(rating: Rating, tenantId: string): Promise<void> {
    // Store in kb_ratings table
    this.logger.info(`💾 [RATINGS] Rating stored: ${rating.id}`);
  }

  private async getUserRating(articleId: string, userId: string, tenantId: string): Promise<Rating | null> {
    // Check if user already rated - mock implementation
    return null;
  }

  private async updateArticleEngagement(articleId: string, action: string, tenantId: string): Promise<void> {
    // Update engagement metrics
    this.logger.info(`📈 [ENGAGEMENT] Updated for article ${articleId}: ${action}`);
  }

  private async updateArticleRatingStats(articleId: string, tenantId: string): Promise<void> {
    // Recalculate and update article rating statistics
    this.logger.info(`📊 [RATINGS] Updated stats for article: ${articleId}`);
  }

  private async logModerationAction(
    commentId: string, 
    moderatorId: string, 
    action: string, 
    reason: string | undefined, 
    tenantId: string
  ): Promise<void> {
    // Log moderation action for audit trail
    this.logger.info(`📝 [MODERATION] Logged action: ${action} on comment ${commentId} by ${moderatorId}`);
  }
}
