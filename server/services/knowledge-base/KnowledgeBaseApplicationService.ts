// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE APPLICATION SERVICE - CLEAN ARCHITECTURE
// Follows Domain-Driven Design with comprehensive functionality

import { db } from '../../../shared/schema';
import { 
  knowledgeBaseArticles, 
  knowledgeBaseRatings, 
  knowledgeBaseApprovals,
  knowledgeBaseArticleRelations,
  knowledgeBaseSearchLogs,
  type InsertKnowledgeBaseArticle,
  type UpdateKnowledgeBaseArticle,
  type InsertKnowledgeBaseRating,
  type KnowledgeBaseSearchParams
} from '../../../shared/schema-knowledge-base';
import { eq, and, or, like, desc, asc, sql, inArray } from 'drizzle-orm';

export class KnowledgeBaseApplicationService {
  constructor(private tenantId: string) {}

  // ========================================
  // ARTICLE MANAGEMENT
  // ========================================

  async createArticle(data: InsertKnowledgeBaseArticle) {
    try {
      console.log('🔧 [KB-CREATE] Creating article:', { title: data.title, category: data.category, visibility: data.visibility });
      
      // Generate unique slug
      const baseSlug = this.generateSlug(data.title);
      const slug = await this.ensureUniqueSlug(baseSlug);
      
      const articleData = {
        ...data,
        tenantId: this.tenantId,
        slug,
        status: 'draft' as const,
      };

      const [article] = await db
        .insert(knowledgeBaseArticles)
        .values(articleData)
        .returning();

      console.log('✅ [KB-CREATE] Article created successfully:', article.id);
      return { success: true, data: article };
    } catch (error) {
      console.error('❌ [KB-CREATE] Error creating article:', error);
      throw error;
    }
  }

  async updateArticle(id: string, data: UpdateKnowledgeBaseArticle) {
    try {
      console.log('🔧 [KB-UPDATE] Updating article:', id);
      
      // If title is being updated, generate new slug
      const updateData = { ...data };
      if (data.title && data.title.trim() !== '') {
        const baseSlug = this.generateSlug(data.title);
        updateData.slug = await this.ensureUniqueSlug(baseSlug, id);
      }

      const [article] = await db
        .update(knowledgeBaseArticles)
        .set({ 
          ...updateData, 
          updatedAt: new Date(),
        })
        .where(and(
          eq(knowledgeBaseArticles.id, id),
          eq(knowledgeBaseArticles.tenantId, this.tenantId)
        ))
        .returning();

      if (!article) {
        return { success: false, message: 'Artigo não encontrado' };
      }

      console.log('✅ [KB-UPDATE] Article updated successfully:', article.id);
      return { success: true, data: article };
    } catch (error) {
      console.error('❌ [KB-UPDATE] Error updating article:', error);
      throw error;
    }
  }

  async getArticleById(id: string) {
    try {
      console.log('🔧 [KB-GET] Getting article:', id);
      
      const article = await db.query.knowledgeBaseArticles.findFirst({
        where: and(
          eq(knowledgeBaseArticles.id, id),
          eq(knowledgeBaseArticles.tenantId, this.tenantId)
        ),
        with: {
          attachments: true,
          ratings: true,
          approvals: true,
          relations: true,
        }
      });

      if (!article) {
        return { success: false, message: 'Artigo não encontrado' };
      }

      // Increment view count
      await this.incrementViewCount(id);

      console.log('✅ [KB-GET] Article retrieved successfully:', article.id);
      return { success: true, data: article };
    } catch (error) {
      console.error('❌ [KB-GET] Error getting article:', error);
      throw error;
    }
  }

  async deleteArticle(id: string) {
    try {
      console.log('🔧 [KB-DELETE] Deleting article:', id);
      
      const result = await db
        .delete(knowledgeBaseArticles)
        .where(and(
          eq(knowledgeBaseArticles.id, id),
          eq(knowledgeBaseArticles.tenantId, this.tenantId)
        ))
        .returning();

      if (result.length === 0) {
        return { success: false, message: 'Artigo não encontrado' };
      }

      console.log('✅ [KB-DELETE] Article deleted successfully:', id);
      return { success: true, message: 'Artigo excluído com sucesso' };
    } catch (error) {
      console.error('❌ [KB-DELETE] Error deleting article:', error);
      throw error;
    }
  }

  // ========================================
  // SEARCH FUNCTIONALITY
  // ========================================

  async searchArticles(params: KnowledgeBaseSearchParams, userId: string) {
    try {
      console.log('🔧 [KB-SEARCH] Searching articles:', params);
      
      // Log search for analytics
      await this.logSearch(params.query, userId, params);
      
      let whereConditions = [eq(knowledgeBaseArticles.tenantId, this.tenantId)];
      
      // Status filter (default to published articles)
      if (params.status) {
        whereConditions.push(eq(knowledgeBaseArticles.status, params.status));
      } else {
        whereConditions.push(eq(knowledgeBaseArticles.status, 'published'));
      }
      
      // Text search
      if (params.query) {
        whereConditions.push(
          or(
            like(knowledgeBaseArticles.title, `%${params.query}%`),
            like(knowledgeBaseArticles.content, `%${params.query}%`),
            like(knowledgeBaseArticles.summary, `%${params.query}%`)
          )
        );
      }
      
      // Category filter
      if (params.category) {
        whereConditions.push(eq(knowledgeBaseArticles.category, params.category as any));
      }
      
      // Visibility filter
      if (params.visibility) {
        whereConditions.push(eq(knowledgeBaseArticles.visibility, params.visibility as any));
      }
      
      // Tags filter
      if (params.tags && params.tags.length > 0) {
        // PostgreSQL array overlap operator
        whereConditions.push(sql`${knowledgeBaseArticles.tags} && ${params.tags}`);
      }

      const articles = await db
        .select({
          id: knowledgeBaseArticles.id,
          title: knowledgeBaseArticles.title,
          summary: knowledgeBaseArticles.summary,
          category: knowledgeBaseArticles.category,
          tags: knowledgeBaseArticles.tags,
          status: knowledgeBaseArticles.status,
          visibility: knowledgeBaseArticles.visibility,
          viewCount: knowledgeBaseArticles.viewCount,
          upvoteCount: knowledgeBaseArticles.upvoteCount,
          downvoteCount: knowledgeBaseArticles.downvoteCount,
          publishedAt: knowledgeBaseArticles.publishedAt,
          createdAt: knowledgeBaseArticles.createdAt,
          updatedAt: knowledgeBaseArticles.updatedAt,
        })
        .from(knowledgeBaseArticles)
        .where(and(...whereConditions))
        .orderBy(desc(knowledgeBaseArticles.publishedAt), desc(knowledgeBaseArticles.viewCount))
        .limit(params.limit || 20)
        .offset(params.offset || 0);

      console.log('✅ [KB-SEARCH] Found articles:', articles.length);
      return { success: true, data: articles, total: articles.length };
    } catch (error) {
      console.error('❌ [KB-SEARCH] Error searching articles:', error);
      throw error;
    }
  }

  // ========================================
  // TICKET INTEGRATION
  // ========================================

  async getRelatedArticlesByTicket(ticketId: string) {
    try {
      console.log('🔧 [KB-TICKET] Getting articles related to ticket:', ticketId);
      
      const relations = await db.query.knowledgeBaseArticleRelations.findMany({
        where: and(
          eq(knowledgeBaseArticleRelations.tenantId, this.tenantId),
          eq(knowledgeBaseArticleRelations.entityType, 'ticket'),
          eq(knowledgeBaseArticleRelations.entityId, ticketId)
        ),
        with: {
          article: {
            columns: {
              id: true,
              title: true,
              summary: true,
              category: true,
              tags: true,
              status: true,
              visibility: true,
              viewCount: true,
              upvoteCount: true,
              downvoteCount: true,
              publishedAt: true,
            }
          }
        }
      });

      const articles = relations
        .map(rel => rel.article)
        .filter(article => article.status === 'published');

      console.log('✅ [KB-TICKET] Found related articles:', articles.length);
      return { success: true, data: articles };
    } catch (error) {
      console.error('❌ [KB-TICKET] Error getting related articles:', error);
      throw error;
    }
  }

  async linkArticleToTicket(articleId: string, ticketId: string, relationType: string, createdBy: string) {
    try {
      console.log('🔧 [KB-LINK] Linking article to ticket:', { articleId, ticketId, relationType });
      
      const relation = await db
        .insert(knowledgeBaseArticleRelations)
        .values({
          tenantId: this.tenantId,
          articleId,
          entityType: 'ticket',
          entityId: ticketId,
          relationType,
          createdBy,
        })
        .returning();

      console.log('✅ [KB-LINK] Article linked to ticket successfully');
      return { success: true, data: relation[0] };
    } catch (error) {
      console.error('❌ [KB-LINK] Error linking article to ticket:', error);
      throw error;
    }
  }

  // ========================================
  // RATING SYSTEM
  // ========================================

  async rateArticle(data: InsertKnowledgeBaseRating) {
    try {
      console.log('🔧 [KB-RATE] Rating article:', data.articleId);
      
      // Upsert rating (update if exists, insert if not)
      await db
        .insert(knowledgeBaseRatings)
        .values({
          ...data,
          tenantId: this.tenantId,
        })
        .onConflictDoUpdate({
          target: [knowledgeBaseRatings.articleId, knowledgeBaseRatings.userId],
          set: {
            rating: data.rating,
            feedback: data.feedback,
            updatedAt: new Date(),
          }
        });

      // Update article rating counts
      await this.updateArticleRatingCounts(data.articleId);

      console.log('✅ [KB-RATE] Article rated successfully');
      return { success: true, message: 'Avaliação registrada com sucesso' };
    } catch (error) {
      console.error('❌ [KB-RATE] Error rating article:', error);
      throw error;
    }
  }

  // ========================================
  // APPROVAL WORKFLOW
  // ========================================

  async submitForApproval(articleId: string, approverId: string) {
    try {
      console.log('🔧 [KB-APPROVAL] Submitting article for approval:', articleId);
      
      // Update article status
      await db
        .update(knowledgeBaseArticles)
        .set({ status: 'pending_approval' })
        .where(and(
          eq(knowledgeBaseArticles.id, articleId),
          eq(knowledgeBaseArticles.tenantId, this.tenantId)
        ));

      // Create approval request
      await db
        .insert(knowledgeBaseApprovals)
        .values({
          tenantId: this.tenantId,
          articleId,
          approverId,
          status: 'pending',
        });

      console.log('✅ [KB-APPROVAL] Article submitted for approval successfully');
      return { success: true, message: 'Artigo enviado para aprovação' };
    } catch (error) {
      console.error('❌ [KB-APPROVAL] Error submitting for approval:', error);
      throw error;
    }
  }

  async approveArticle(approvalId: string, comments?: string) {
    try {
      console.log('🔧 [KB-APPROVE] Approving article:', approvalId);
      
      // Update approval status
      const [approval] = await db
        .update(knowledgeBaseApprovals)
        .set({
          status: 'approved',
          comments,
          reviewedAt: new Date(),
        })
        .where(and(
          eq(knowledgeBaseApprovals.id, approvalId),
          eq(knowledgeBaseApprovals.tenantId, this.tenantId)
        ))
        .returning();

      // Update article status
      await db
        .update(knowledgeBaseArticles)
        .set({ 
          status: 'published',
          publishedAt: new Date(),
        })
        .where(and(
          eq(knowledgeBaseArticles.id, approval.articleId),
          eq(knowledgeBaseArticles.tenantId, this.tenantId)
        ));

      console.log('✅ [KB-APPROVE] Article approved successfully');
      return { success: true, message: 'Artigo aprovado e publicado' };
    } catch (error) {
      console.error('❌ [KB-APPROVE] Error approving article:', error);
      throw error;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Remove duplicate hyphens
  }

  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await db
        .select()
        .from(knowledgeBaseArticles)
        .where(and(
          eq(knowledgeBaseArticles.tenantId, this.tenantId),
          eq(knowledgeBaseArticles.slug, slug),
          excludeId ? sql`${knowledgeBaseArticles.id} != ${excludeId}` : sql`true`
        ))
        .limit(1);

      if (existing.length === 0) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  private async incrementViewCount(articleId: string) {
    await db
      .update(knowledgeBaseArticles)
      .set({ viewCount: sql`${knowledgeBaseArticles.viewCount} + 1` })
      .where(and(
        eq(knowledgeBaseArticles.id, articleId),
        eq(knowledgeBaseArticles.tenantId, this.tenantId)
      ));
  }

  private async updateArticleRatingCounts(articleId: string) {
    const ratings = await db
      .select({ rating: knowledgeBaseRatings.rating })
      .from(knowledgeBaseRatings)
      .where(and(
        eq(knowledgeBaseRatings.articleId, articleId),
        eq(knowledgeBaseRatings.tenantId, this.tenantId)
      ));

    const upvotes = ratings.filter(r => r.rating > 0).length;
    const downvotes = ratings.filter(r => r.rating < 0).length;

    await db
      .update(knowledgeBaseArticles)
      .set({
        upvoteCount: upvotes,
        downvoteCount: downvotes,
      })
      .where(and(
        eq(knowledgeBaseArticles.id, articleId),
        eq(knowledgeBaseArticles.tenantId, this.tenantId)
      ));
  }

  private async logSearch(query: string, userId: string, context: any) {
    try {
      await db
        .insert(knowledgeBaseSearchLogs)
        .values({
          tenantId: this.tenantId,
          query,
          userId,
          searchContext: context,
        });
    } catch (error) {
      console.error('❌ [KB-LOG] Error logging search:', error);
      // Don't throw - search logging is not critical
    }
  }
}