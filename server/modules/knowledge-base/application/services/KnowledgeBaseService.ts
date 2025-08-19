// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE APPLICATION SERVICE - CLEAN ARCHITECTURE
// Application layer service orchestrating domain and infrastructure concerns

import type { 
  IKnowledgeBaseRepository,
  KnowledgeBaseSearchQuery,
  CreateKnowledgeBaseArticleData,
  UpdateKnowledgeBaseArticleData 
} from '../../domain/repositories/IKnowledgeBaseRepository';

import type { KnowledgeBaseArticle } from '../../domain/entities/KnowledgeBaseArticle';
import { KnowledgeBaseArticleDomain } from '../../domain/entities/KnowledgeBaseArticle';
import { DrizzleKnowledgeBaseRepository } from '../../infrastructure/repositories/DrizzleKnowledgeBaseRepository';

export class KnowledgeBaseService {
  private repository: IKnowledgeBaseRepository;

  constructor() {
    this.repository = new DrizzleKnowledgeBaseRepository();
  }

  // Article CRUD operations
  async createArticle(data: CreateKnowledgeBaseArticleData, tenantId: string): Promise<KnowledgeBaseArticle> {
    // Generate slug if not provided
    const articleData = {
      ...data,
      slug: data.title ? KnowledgeBaseArticleDomain.generateSlug(data.title) : undefined
    };

    const article = await this.repository.create(articleData, tenantId);
    
    console.log(`📝 [KB-SERVICE] Created article: ${article.title} (${article.id})`);
    return article;
  }

  async getArticleById(id: string, tenantId: string): Promise<KnowledgeBaseArticle | null> {
    const article = await this.repository.findById(id, tenantId);
    
    if (article) {
      // Increment view count
      await this.repository.incrementViewCount(id, tenantId);
      console.log(`👁️ [KB-SERVICE] Article viewed: ${article.title} (views: ${(article.viewCount || 0) + 1})`);
    }
    
    return article;
  }

  async updateArticle(id: string, data: UpdateKnowledgeBaseArticleData, tenantId: string): Promise<KnowledgeBaseArticle | null> {
    // Update slug if title changed
    const updateData = { ...data };
    if (updateData.title) {
      updateData.slug = KnowledgeBaseArticleDomain.generateSlug(updateData.title);
    }

    const article = await this.repository.update(id, updateData, tenantId);
    
    if (article) {
      console.log(`✏️ [KB-SERVICE] Updated article: ${article.title} (${article.id})`);
    }
    
    return article;
  }

  async deleteArticle(id: string, tenantId: string): Promise<boolean> {
    const success = await this.repository.delete(id, tenantId);
    
    if (success) {
      console.log(`🗑️ [KB-SERVICE] Deleted article: ${id}`);
    }
    
    return success;
  }

  // Search and filtering
  async searchArticles(query: KnowledgeBaseSearchQuery, tenantId: string) {
    console.log(`🔍 [KB-SERVICE] Searching articles:`, { tenantId, query });
    
    const result = await this.repository.search(query, tenantId);
    
    console.log(`🔍 [KB-SERVICE] Search completed: ${result.articles.length} results, ${result.total} total`);
    
    return result;
  }

  async getArticlesByCategory(category: string, tenantId: string): Promise<KnowledgeBaseArticle[]> {
    return this.repository.findByCategory(category, tenantId);
  }

  async getArticlesByTags(tags: string[], tenantId: string): Promise<KnowledgeBaseArticle[]> {
    return this.repository.findByTags(tags, tenantId);
  }

  async getArticlesByStatus(status: string, tenantId: string): Promise<KnowledgeBaseArticle[]> {
    return this.repository.findByStatus(status, tenantId);
  }

  async getArticlesByAuthor(authorId: string, tenantId: string): Promise<KnowledgeBaseArticle[]> {
    return this.repository.findByAuthor(authorId, tenantId);
  }

  // Publishing operations
  async publishArticle(id: string, tenantId: string): Promise<boolean> {
    const article = await this.repository.findById(id, tenantId);
    
    if (!article) {
      return false;
    }

    // Check if article is publishable
    if (!KnowledgeBaseArticleDomain.isPublishable(article)) {
      throw new Error('Article is not ready for publishing. Ensure it has title, content, category and is approved.');
    }

    const success = await this.repository.publish(id, tenantId);
    
    if (success) {
      console.log(`📢 [KB-SERVICE] Published article: ${article.title} (${id})`);
    }
    
    return success;
  }

  async unpublishArticle(id: string, tenantId: string): Promise<boolean> {
    const success = await this.repository.unpublish(id, tenantId);
    
    if (success) {
      console.log(`📝 [KB-SERVICE] Unpublished article: ${id}`);
    }
    
    return success;
  }

  async archiveArticle(id: string, tenantId: string): Promise<boolean> {
    const success = await this.repository.archive(id, tenantId);
    
    if (success) {
      console.log(`📁 [KB-SERVICE] Archived article: ${id}`);
    }
    
    return success;
  }

  // Approval workflow
  async submitArticleForApproval(id: string, tenantId: string): Promise<boolean> {
    const success = await this.repository.submitForApproval(id, tenantId);
    
    if (success) {
      console.log(`✋ [KB-SERVICE] Submitted article for approval: ${id}`);
    }
    
    return success;
  }

  async approveArticle(id: string, reviewerId: string, tenantId: string): Promise<boolean> {
    const success = await this.repository.approve(id, reviewerId, tenantId);
    
    if (success) {
      console.log(`✅ [KB-SERVICE] Approved article: ${id} by reviewer: ${reviewerId}`);
    }
    
    return success;
  }

  async rejectArticle(id: string, reviewerId: string, reason: string, tenantId: string): Promise<boolean> {
    const success = await this.repository.reject(id, reviewerId, reason, tenantId);
    
    if (success) {
      console.log(`❌ [KB-SERVICE] Rejected article: ${id} by reviewer: ${reviewerId}, reason: ${reason}`);
    }
    
    return success;
  }

  // Analytics and metrics
  async rateArticle(id: string, rating: number, tenantId: string): Promise<boolean> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const success = await this.repository.updateRating(id, rating, tenantId);
    
    if (success) {
      console.log(`⭐ [KB-SERVICE] Rated article: ${id} with ${rating} stars`);
    }
    
    return success;
  }

  // Dashboard queries
  async getPendingApprovals(tenantId: string): Promise<KnowledgeBaseArticle[]> {
    return this.repository.findPendingApproval(tenantId);
  }

  async getExpiredDrafts(tenantId: string): Promise<KnowledgeBaseArticle[]> {
    return this.repository.findExpiredDrafts(tenantId);
  }

  async getPopularArticles(limit: number = 10, tenantId: string): Promise<KnowledgeBaseArticle[]> {
    return this.repository.findPopular(limit, tenantId);
  }

  async getRecentArticles(limit: number = 10, tenantId: string): Promise<KnowledgeBaseArticle[]> {
    return this.repository.findRecent(limit, tenantId);
  }

  // Statistics
  async getArticleStatistics(tenantId: string) {
    try {
      const [
        totalArticles,
        publishedArticles,
        draftArticles,
        pendingApproval,
        popularArticles
      ] = await Promise.all([
        this.repository.search({ limit: 1 }, tenantId),
        this.repository.findByStatus('published', tenantId),
        this.repository.findByStatus('draft', tenantId),
        this.repository.findPendingApproval(tenantId),
        this.repository.findPopular(5, tenantId)
      ]);

      return {
        total: totalArticles.total,
        published: publishedArticles.length,
        drafts: draftArticles.length,
        pendingApproval: pendingApproval.length,
        popular: popularArticles
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        total: 0,
        published: 0,
        drafts: 0,
        pendingApproval: 0,
        popular: []
      };
    }
  }
}