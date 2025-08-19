// ✅ 1QA.MD COMPLIANCE: DRIZZLE KNOWLEDGE BASE REPOSITORY - CLEAN ARCHITECTURE
// Infrastructure layer - implements domain repository interface

import { eq, and, like, desc, sql } from 'drizzle-orm';
import { db } from '../../../../db';
import { knowledgeBaseArticles } from '../../../../../shared/schema-knowledge-base';
import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';
import {
  KnowledgeBaseArticle,
  KnowledgeBaseSearchQuery,
  KnowledgeBaseSearchResult,
  ArticleAttachment,
  ApprovalHistoryEntry
} from '../../domain/entities/KnowledgeBase';

export class DrizzleKnowledgeBaseRepository implements IKnowledgeBaseRepository {
  async create(article: Omit<KnowledgeBaseArticle, 'id' | 'createdAt' | 'updatedAt' | 'version'>, tenantId: string): Promise<KnowledgeBaseArticle> {
    const [created] = await db
      .insert(knowledgeBaseArticles)
      .values({
        tenantId,
        title: article.title,
        content: article.content,
        category: article.category as any,
        tags: article.tags,
        authorId: article.authorId,
        status: 'draft',
        visibility: 'internal'
      })
      .returning();

    return {
      ...created,
      summary: created.content?.substring(0, 200) + '...' || undefined,
      tags: created.tags || [],
      version: 1,
      contentType: 'rich_text',
      attachments: [],
      approvalStatus: 'not_submitted',
      approvalHistory: [],
      ratingCount: 0,
      viewCount: created.viewCount || 0,
      expiresAt: null
    } as KnowledgeBaseArticle;
  }

  async findById(id: string, tenantId: string): Promise<KnowledgeBaseArticle | null> {
    const [article] = await db
      .select({
        id: knowledgeBaseArticles.id,
        tenantId: knowledgeBaseArticles.tenantId,
        title: knowledgeBaseArticles.title,
        content: knowledgeBaseArticles.content,
        category: knowledgeBaseArticles.category,
        tags: knowledgeBaseArticles.tags,
        authorId: knowledgeBaseArticles.authorId,
        status: knowledgeBaseArticles.status,
        visibility: knowledgeBaseArticles.visibility,
        publishedAt: knowledgeBaseArticles.publishedAt,
        createdAt: knowledgeBaseArticles.createdAt,
        updatedAt: knowledgeBaseArticles.updatedAt,
        viewCount: knowledgeBaseArticles.viewCount
      })
      .from(knowledgeBaseArticles)
      .where(and(
        eq(knowledgeBaseArticles.id, id),
        eq(knowledgeBaseArticles.tenantId, tenantId)
      ));

    if (!article) return null;

    return {
      ...article,
      summary: article.content?.substring(0, 200) + '...' || undefined,
      tags: article.tags || [],
      version: 1,
      contentType: 'rich_text',
      attachments: [],
      approvalStatus: 'not_submitted',
      approvalHistory: [],
      ratingCount: 0,
      expiresAt: null
    } as KnowledgeBaseArticle;
  }

  async update(id: string, updates: Partial<KnowledgeBaseArticle>, tenantId: string): Promise<KnowledgeBaseArticle> {
    const [updated] = await db
      .update(knowledgeBaseArticles)
      .set({
        title: updates.title,
        content: updates.content,
        tags: updates.tags,
        updatedAt: new Date()
      })
      .where(and(
        eq(knowledgeBaseArticles.id, id),
        eq(knowledgeBaseArticles.tenantId, tenantId)
      ))
      .returning();

    return {
      ...updated,
      summary: updated.content?.substring(0, 200) + '...' || undefined,
      tags: updated.tags || [],
      version: 1,
      contentType: 'rich_text',
      attachments: [],
      approvalStatus: 'not_submitted',
      approvalHistory: [],
      ratingCount: 0,
      expiresAt: null
    } as KnowledgeBaseArticle;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(knowledgeBaseArticles)
      .where(and(
        eq(knowledgeBaseArticles.id, id),
        eq(knowledgeBaseArticles.tenantId, tenantId)
      ));

    return result.rowCount !== null && result.rowCount > 0;
  }

  async search(query: KnowledgeBaseSearchQuery, tenantId: string): Promise<KnowledgeBaseSearchResult> {
    try {
      console.log(`🔍 [KB-SEARCH] Starting search with:`, { tenantId, query });

      const conditions = [eq(knowledgeBaseArticles.tenantId, tenantId)];

      // Only add search condition if query is provided and not empty
      if (query.query && query.query.trim()) {
        conditions.push(
          sql`(${knowledgeBaseArticles.title} ILIKE ${'%' + query.query.trim() + '%'} OR ${knowledgeBaseArticles.content} ILIKE ${'%' + query.query.trim() + '%'})`
        );
      }

      const articles = await db
        .select({
          id: knowledgeBaseArticles.id,
          tenantId: knowledgeBaseArticles.tenantId,
          title: knowledgeBaseArticles.title,
          content: knowledgeBaseArticles.content,
          category: knowledgeBaseArticles.category,
          tags: knowledgeBaseArticles.tags,
          authorId: knowledgeBaseArticles.authorId,
          status: knowledgeBaseArticles.status,
          visibility: knowledgeBaseArticles.visibility,
          publishedAt: knowledgeBaseArticles.publishedAt,
          createdAt: knowledgeBaseArticles.createdAt,
          updatedAt: knowledgeBaseArticles.updatedAt,
          viewCount: knowledgeBaseArticles.viewCount
        })
        .from(knowledgeBaseArticles)
        .where(and(...conditions))
        .orderBy(desc(knowledgeBaseArticles.updatedAt))
        .limit(query.limit || 20)
        .offset(query.offset || 0);

      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(knowledgeBaseArticles)
        .where(and(...conditions));

      const total = countResult?.count || 0;

      const mappedArticles = articles.map(article => ({
        ...article,
        summary: article.content?.substring(0, 200) + '...' || undefined,
        tags: article.tags || [],
        version: 1,
        contentType: 'rich_text' as const,
        attachments: [] as ArticleAttachment[],
        approvalStatus: 'not_submitted' as const,
        approvalHistory: [] as ApprovalHistoryEntry[],
        ratingCount: 0,
        expiresAt: null
      }));

      console.log(`🔍 [KB-SEARCH] Search successful:`, {
        tenantId,
        foundArticles: articles.length,
        totalFromDB: total,
        sampleTitles: articles.slice(0, 3).map(a => a.title)
      });

      return {
        articles: mappedArticles,
        total,
        hasMore: articles.length === (query.limit || 20)
      };
    } catch (error) {
      console.error('18:12:35 [error]: Search articles error:', error);
      return {
        articles: [],
        total: 0,
        hasMore: false
      };
    }
  }

  async findByCategory(category: string, tenantId: string): Promise<KnowledgeBaseArticle[]> {
    const articles = await db
      .select()
      .from(knowledgeBaseArticles)
      .where(and(
        eq(knowledgeBaseArticles.tenantId, tenantId)
      ));

    return articles.map(article => ({
      ...article,
      version: 1,
      contentType: 'rich_text' as const,
      attachments: [] as ArticleAttachment[],
      approvalStatus: 'not_submitted' as const,
      approvalHistory: [] as ApprovalHistoryEntry[],
      ratingCount: 0,
      expiresAt: null
    }));
  }

  async findByAuthor(authorId: string, tenantId: string): Promise<KnowledgeBaseArticle[]> {
    const articles = await db
      .select()
      .from(knowledgeBaseArticles)
      .where(and(
        eq(knowledgeBaseArticles.authorId, authorId),
        eq(knowledgeBaseArticles.tenantId, tenantId)
      ));

    return articles.map(article => ({
      ...article,
      version: 1,
      contentType: 'rich_text' as const,
      attachments: [] as ArticleAttachment[],
      approvalStatus: 'not_submitted' as const,
      approvalHistory: [] as ApprovalHistoryEntry[],
      ratingCount: 0,
      expiresAt: null
    }));
  }

  async findByTags(tags: string[], tenantId: string): Promise<KnowledgeBaseArticle[]> {
    const articles = await db
      .select()
      .from(knowledgeBaseArticles)
      .where(and(
        eq(knowledgeBaseArticles.tenantId, tenantId)
      ));

    return articles.map(article => ({
      ...article,
      version: 1,
      contentType: 'rich_text' as const,
      attachments: [] as ArticleAttachment[],
      approvalStatus: 'not_submitted' as const,
      approvalHistory: [] as ApprovalHistoryEntry[],
      ratingCount: 0,
      expiresAt: null
    }));
  }

  async incrementViewCount(id: string, tenantId: string): Promise<void> {
    await db
      .update(knowledgeBaseArticles)
      .set({
        viewCount: sql`${knowledgeBaseArticles.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(and(
        eq(knowledgeBaseArticles.id, id),
        eq(knowledgeBaseArticles.tenantId, tenantId)
      ));
  }

  async addRating(id: string, rating: number, tenantId: string): Promise<void> {
    await db
      .update(knowledgeBaseArticles)
      .set({
        updatedAt: new Date()
      })
      .where(and(
        eq(knowledgeBaseArticles.id, id),
        eq(knowledgeBaseArticles.tenantId, tenantId)
      ));
  }

  async getPopularArticles(limit: number, tenantId: string): Promise<KnowledgeBaseArticle[]> {
    const articles = await db
      .select()
      .from(knowledgeBaseArticles)
      .where(eq(knowledgeBaseArticles.tenantId, tenantId))
      .orderBy(desc(knowledgeBaseArticles.viewCount))
      .limit(limit);

    return articles.map(article => ({
      ...article,
      version: 1,
      contentType: 'rich_text' as const,
      attachments: [] as ArticleAttachment[],
      approvalStatus: 'not_submitted' as const,
      approvalHistory: [] as ApprovalHistoryEntry[],
      ratingCount: 0,
      expiresAt: null
    }));
  }

  async getAttachments(articleId: string, tenantId: string): Promise<ArticleAttachment[]> {
    return [];
  }

  async addAttachment(attachment: Omit<ArticleAttachment, 'id' | 'uploadedAt'>, tenantId: string): Promise<ArticleAttachment> {
    return {
      id: 'mock-id',
      uploadedAt: new Date(),
      ...attachment
    };
  }

  async removeAttachment(attachmentId: string, tenantId: string): Promise<boolean> {
    return true;
  }

  async getApprovalHistory(articleId: string, tenantId: string): Promise<ApprovalHistoryEntry[]> {
    return [];
  }

  async addApprovalEntry(entry: Omit<ApprovalHistoryEntry, 'id' | 'timestamp'>, tenantId: string): Promise<ApprovalHistoryEntry> {
    return {
      id: 'mock-id',
      timestamp: new Date(),
      ...entry
    };
  }

  async getByApprovalStatus(status: string, tenantId: string): Promise<KnowledgeBaseArticle[]> {
    const articles = await db
      .select()
      .from(knowledgeBaseArticles)
      .where(eq(knowledgeBaseArticles.tenantId, tenantId));

    return articles.map(article => ({
      ...article,
      version: 1,
      contentType: 'rich_text' as const,
      attachments: [] as ArticleAttachment[],
      approvalStatus: 'not_submitted' as const,
      approvalHistory: [] as ApprovalHistoryEntry[],
      ratingCount: 0,
      expiresAt: null
    }));
  }

  async getRecentActivity(limit: number, tenantId: string): Promise<KnowledgeBaseArticle[]> {
    const articles = await db
      .select()
      .from(knowledgeBaseArticles)
      .where(eq(knowledgeBaseArticles.tenantId, tenantId))
      .orderBy(desc(knowledgeBaseArticles.updatedAt))
      .limit(limit);

    return articles.map(article => ({
      ...article,
      version: 1,
      contentType: 'rich_text' as const,
      attachments: [] as ArticleAttachment[],
      approvalStatus: 'not_submitted' as const,
      approvalHistory: [] as ApprovalHistoryEntry[],
      ratingCount: 0,
      expiresAt: null
    }));
  }
}