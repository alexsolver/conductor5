// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE APPLICATION SERVICE - CLEAN ARCHITECTURE
// Application Layer - Orquestra use cases e coordena operações de domínio

import { db } from '../../db';
import { 
  knowledgeBaseArticles,
  insertKnowledgeBaseArticleSchema,
  updateKnowledgeBaseArticleSchema,
  type KnowledgeBaseArticle,
  type InsertKnowledgeBaseArticle
} from '../../../shared/schema-knowledge-base';
import { eq, and, like, ilike, desc, asc, sql } from 'drizzle-orm';
export class KnowledgeBaseApplicationService {
  private logger = console;

  constructor(private tenantId: string) {
    if (!tenantId) {
      throw new Error('[KB-SERVICE] Tenant ID is required');
    }
  }

  /**
   * Search articles with comprehensive filtering and pagination
   */
  async searchArticles(params: any, userId?: string): Promise<{
    success: boolean;
    message: string;
    data: {
      articles: KnowledgeBaseArticle[];
      total: number;
      hasMore: boolean;
    };
  }> {
    try {
      this.logger.log(`[KB-SERVICE] Searching articles for tenant: ${this.tenantId}`);
      this.logger.log(`[KB-SERVICE] Search params:`, JSON.stringify(params, null, 2));

      // Build dynamic query conditions
      const conditions = [
        eq(knowledgeBaseArticles.tenantId, this.tenantId)
      ];
      
      this.logger.log(`[KB-SERVICE] Base condition: tenantId = ${this.tenantId}`);

      // Add search conditions
      if (params.query) {
        conditions.push(
          sql`(${knowledgeBaseArticles.title} ILIKE ${'%' + params.query + '%'} OR ${knowledgeBaseArticles.content} ILIKE ${'%' + params.query + '%'})`
        );
      }

      if (params.category) {
        conditions.push(eq(knowledgeBaseArticles.categoryId, params.category));
      }

      if (params.access_level) {
        conditions.push(eq(knowledgeBaseArticles.accessLevel, params.access_level));
      }

      if (params.status) {
        conditions.push(eq(knowledgeBaseArticles.status, params.status));
      }

      // Execute search query
      const limit = params.limit || 50;
      const offset = params.offset || 0;

      this.logger.log(`[KB-SERVICE] Query params: limit=${limit}, offset=${offset}`);
      this.logger.log(`[KB-SERVICE] Conditions count: ${conditions.length}`);

      const articles = await db
        .select()
        .from(knowledgeBaseArticles)
        .where(and(...conditions))
        .limit(limit + 1) // +1 to check if there are more
        .offset(offset)
        .orderBy(desc(knowledgeBaseArticles.createdAt));

      this.logger.log(`[KB-SERVICE] Raw articles found: ${articles.length}`);

      // Count total for pagination
      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(knowledgeBaseArticles)
        .where(and(...conditions));

      const hasMore = articles.length > limit;
      if (hasMore) articles.pop(); // Remove the extra item

      this.logger.log(`[KB-SERVICE] Found ${articles.length} articles`);

      return {
        success: true,
        message: 'Articles retrieved successfully',
        data: {
          articles,
          total: Number(count),
          hasMore
        }
      };
    } catch (error) {
      this.logger.error(`[KB-SERVICE] Error searching articles:`, error);
      throw new Error('Failed to search articles');
    }
  }

  /**
   * Create new article
   */
  async createArticle(articleData: any, authorId: string): Promise<{
    success: boolean;
    message: string;
    data: KnowledgeBaseArticle;
  }> {
    try {
      this.logger.log(`[KB-SERVICE] Creating article for tenant: ${this.tenantId}`);

      // Map category string to categoryId (using category as ID for now)
      const categoryMapping: Record<string, string> = {
        'technical_support': 'technical_support',
        'troubleshooting': 'troubleshooting', 
        'user_guide': 'user_guide',
        'faq': 'faq',
        'policy': 'policy',
        'process': 'process',
        'training': 'training',
        'announcement': 'announcement',
        'best_practice': 'best_practice',
        'configuration': 'configuration',
        'other': 'other'
      };

      // Prepare article for insertion with correct field mapping
      const newArticle = {
        title: articleData.title,
        content: articleData.content,
        category: categoryMapping[articleData.category] || 'other',
        tenantId: this.tenantId,
        authorId,
        status: articleData.status || 'draft',
        published: articleData.published || false,
        tags: articleData.tags || [],
        accessLevel: articleData.access_level || 'public', // Use snake_case from frontend
        visibility: articleData.visibility || 'internal', // Match DB default
        publishedAt: articleData.published ? new Date() : null,
      };

      // Debug: Log exactly what we're trying to insert
      console.log('[KB-DEBUG] Attempting to insert:', JSON.stringify(newArticle, null, 2));
      
      // Insert article
      const [createdArticle] = await db
        .insert(knowledgeBaseArticles)
        .values(newArticle)
        .returning();

      this.logger.log(`[KB-SERVICE] Article created successfully: ${createdArticle.id}`);

      return {
        success: true,
        message: 'Article created successfully',
        data: createdArticle
      };
    } catch (error) {
      this.logger.error(`[KB-SERVICE] Error creating article:`, error);
      throw new Error('Failed to create article');
    }
  }

  /**
   * Get article by ID
   */
  async getArticleById(id: string): Promise<{
    success: boolean;
    message: string;
    data: KnowledgeBaseArticle | null;
  }> {
    try {
      this.logger.log(`[KB-SERVICE] Getting article: ${id}`);

      const [article] = await db
        .select()
        .from(knowledgeBaseArticles)
        .where(and(
          eq(knowledgeBaseArticles.id, id),
          eq(knowledgeBaseArticles.tenantId, this.tenantId)
        ));

      if (!article) {
        return {
          success: false,
          message: 'Article not found',
          data: null
        };
      }

      // Increment view count
      await db
        .update(knowledgeBaseArticles)
        .set({ 
          viewCount: sql`${knowledgeBaseArticles.viewCount} + 1`,
          lastViewedAt: new Date()
        })
        .where(eq(knowledgeBaseArticles.id, id));

      this.logger.log(`[KB-SERVICE] Article retrieved: ${article.id}`);

      return {
        success: true,
        message: 'Article retrieved successfully',
        data: { ...article, viewCount: (article.viewCount || 0) + 1 }
      };
    } catch (error) {
      this.logger.error(`[KB-SERVICE] Error getting article:`, error);
      throw new Error('Failed to get article');
    }
  }

  /**
   * Update existing article
   */
  async updateArticle(id: string, updates: Partial<InsertKnowledgeBaseArticle>, userId: string): Promise<{
    success: boolean;
    message: string;
    data: KnowledgeBaseArticle;
  }> {
    try {
      this.logger.log(`[KB-SERVICE] Updating article: ${id}`);

      // Validate updates
      const validatedUpdates = updateKnowledgeBaseArticleSchema.parse({ ...updates, id });

      // Update article
      const [updatedArticle] = await db
        .update(knowledgeBaseArticles)
        .set({
          ...validatedUpdates,
          updatedAt: new Date()
        })
        .where(and(
          eq(knowledgeBaseArticles.id, id),
          eq(knowledgeBaseArticles.tenantId, this.tenantId)
        ))
        .returning();

      if (!updatedArticle) {
        throw new Error('Article not found or not authorized');
      }

      this.logger.log(`[KB-SERVICE] Article updated successfully: ${updatedArticle.id}`);

      return {
        success: true,
        message: 'Article updated successfully',
        data: updatedArticle
      };
    } catch (error) {
      this.logger.error(`[KB-SERVICE] Error updating article:`, error);
      throw new Error('Failed to update article');
    }
  }

  /**
   * Delete article (soft delete)
   */
  async deleteArticle(id: string, userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.logger.log(`[KB-SERVICE] Deleting article: ${id}`);

      const [deletedArticle] = await db
        .update(knowledgeBaseArticles)
        .set({
          isDeleted: true,
          deletedAt: new Date()
        })
        .where(and(
          eq(knowledgeBaseArticles.id, id),
          eq(knowledgeBaseArticles.tenantId, this.tenantId)
        ))
        .returning();

      if (!deletedArticle) {
        throw new Error('Article not found or not authorized');
      }

      this.logger.log(`[KB-SERVICE] Article deleted successfully: ${deletedArticle.id}`);

      return {
        success: true,
        message: 'Article deleted successfully'
      };
    } catch (error) {
      this.logger.error(`[KB-SERVICE] Error deleting article:`, error);
      throw new Error('Failed to delete article');
    }
  }
}