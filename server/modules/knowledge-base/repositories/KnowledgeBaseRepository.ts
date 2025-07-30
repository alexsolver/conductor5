import { db } from '../../../db';
import { eq, and, like, desc, asc, sql, or, count, isNull } from 'drizzle-orm';
import {
  kbCategories,
  kbArticles,
  kbArticleVersions,
  kbAttachments,
  kbComments,
  kbRatings,
  kbApprovals,
  kbTemplates,
  kbAnalytics,
  kbSearchQueries,
  kbNotifications,
  kbSettings,
  type KBCategory,
  type InsertKBCategory,
  type KBArticle,
  type InsertKBArticle,
  type KBComment,
  type InsertKBComment,
  type KBRating,
  type InsertKBRating,
  type KBTemplate,
  type InsertKBTemplate
} from '../../../../shared/schema-knowledge-base';

export class KnowledgeBaseRepository {
  // GESTÃO DE CATEGORIAS
  async getAllCategories(tenantId: string) {
    return await db
      .select()
      .from(kbCategories)
      .where(and(eq(kbCategories.tenantId, tenantId), eq(kbCategories.isActive, true)))
      .orderBy(asc(kbCategories.level), asc(kbCategories.sortOrder));
  }

  async getCategoryById(id: string, tenantId: string) {
    const [category] = await db
      .select()
      .from(kbCategories)
      .where(and(eq(kbCategories.id, id), eq(kbCategories.tenantId, tenantId)));
    return category;
  }

  async createCategory(data: InsertKBCategory) {
    const [category] = await db
      .insert(kbCategories)
      .values(data)
      .returning();
    return category;
  }

  async updateCategory(id: string, tenantId: string, data: Partial<InsertKBCategory>) {
    const [category] = await db
      .update(kbCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(kbCategories.id, id), eq(kbCategories.tenantId, tenantId)))
      .returning();
    return category;
  }

  async deleteCategory(id: string, tenantId: string) {
    await db
      .update(kbCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(kbCategories.id, id), eq(kbCategories.tenantId, tenantId)));
  }

  // GESTÃO DE ARTIGOS
  async getAllArticles(tenantId: string, options?: {
    categoryId?: string;
    status?: string;
    type?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [eq(kbArticles.tenantId, tenantId)];

    if (options?.categoryId) {
      conditions.push(eq(kbArticles.categoryId, options.categoryId));
    }

    if (options?.status) {
      conditions.push(eq(kbArticles.status, options.status as any));
    }

    if (options?.type) {
      conditions.push(eq(kbArticles.type, options.type as any));
    }

    if (options?.search) {
      conditions.push(
        or(
          like(kbArticles.title, `%${options.search}%`),
          like(kbArticles.summary, `%${options.search}%`),
          like(kbArticles.content, `%${options.search}%`)
        )!
      );
    }

    const query = db
      .select({
        article: kbArticles,
        category: {
          id: kbCategories.id,
          name: kbCategories.name,
          slug: kbCategories.slug,
          color: kbCategories.color,
          icon: kbCategories.icon
        }
      })
      .from(kbArticles)
      .leftJoin(kbCategories, eq(kbArticles.categoryId, kbCategories.id))
      .where(and(...conditions))
      .orderBy(desc(kbArticles.createdAt));

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    return await query;
  }

  async getArticleById(id: string, tenantId: string) {
    const [result] = await db
      .select({
        article: kbArticles,
        category: {
          id: kbCategories.id,
          name: kbCategories.name,
          slug: kbCategories.slug,
          color: kbCategories.color,
          icon: kbCategories.icon
        }
      })
      .from(kbArticles)
      .leftJoin(kbCategories, eq(kbArticles.categoryId, kbCategories.id))
      .where(and(eq(kbArticles.id, id), eq(kbArticles.tenantId, tenantId)));
    
    return result;
  }

  async createArticle(data: InsertKBArticle) {
    const [article] = await db
      .insert(kbArticles)
      .values(data)
      .returning();
    return article;
  }

  async updateArticle(id: string, tenantId: string, data: Partial<InsertKBArticle>) {
    const [article] = await db
      .update(kbArticles)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(kbArticles.id, id), eq(kbArticles.tenantId, tenantId)))
      .returning();
    return article;
  }

  async deleteArticle(id: string, tenantId: string) {
    await db
      .delete(kbArticles)
      .where(and(eq(kbArticles.id, id), eq(kbArticles.tenantId, tenantId)));
  }

  // INCREMENTO DE VISUALIZAÇÕES
  async incrementViewCount(id: string, tenantId: string) {
    await db
      .update(kbArticles)
      .set({ 
        viewCount: sql`${kbArticles.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(and(eq(kbArticles.id, id), eq(kbArticles.tenantId, tenantId)));
  }

  // GESTÃO DE COMENTÁRIOS
  async getArticleComments(articleId: string, tenantId: string) {
    return await db
      .select()
      .from(kbComments)
      .where(and(
        eq(kbComments.articleId, articleId),
        eq(kbComments.tenantId, tenantId),
        eq(kbComments.isApproved, true)
      ))
      .orderBy(asc(kbComments.createdAt));
  }

  async createComment(data: InsertKBComment) {
    const [comment] = await db
      .insert(kbComments)
      .values(data)
      .returning();
    return comment;
  }

  async updateComment(id: string, tenantId: string, data: Partial<InsertKBComment>) {
    const [comment] = await db
      .update(kbComments)
      .set({ ...data, updatedAt: new Date(), isEdited: true, editedAt: new Date() })
      .where(and(eq(kbComments.id, id), eq(kbComments.tenantId, tenantId)))
      .returning();
    return comment;
  }

  async deleteComment(id: string, tenantId: string) {
    await db
      .delete(kbComments)
      .where(and(eq(kbComments.id, id), eq(kbComments.tenantId, tenantId)));
  }

  // GESTÃO DE AVALIAÇÕES
  async getArticleRatings(articleId: string, tenantId: string) {
    return await db
      .select()
      .from(kbRatings)
      .where(and(eq(kbRatings.articleId, articleId), eq(kbRatings.tenantId, tenantId)))
      .orderBy(desc(kbRatings.createdAt));
  }

  async createRating(data: InsertKBRating) {
    // Verificar se o usuário já avaliou este artigo
    const existingRating = await db
      .select()
      .from(kbRatings)
      .where(and(
        eq(kbRatings.articleId, data.articleId),
        eq(kbRatings.userId, data.userId),
        eq(kbRatings.tenantId, data.tenantId)
      ));

    if (existingRating.length > 0) {
      // Atualizar avaliação existente
      const [rating] = await db
        .update(kbRatings)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(kbRatings.articleId, data.articleId),
          eq(kbRatings.userId, data.userId),
          eq(kbRatings.tenantId, data.tenantId)
        ))
        .returning();
      return rating;
    } else {
      // Criar nova avaliação
      const [rating] = await db
        .insert(kbRatings)
        .values(data)
        .returning();
      return rating;
    }
  }

  // ATUALIZAR MÉDIA DE AVALIAÇÕES DO ARTIGO
  async updateArticleRatingAverage(articleId: string, tenantId: string) {
    const result = await db
      .select({
        avgRating: sql<number>`ROUND(AVG(${kbRatings.rating}), 2)`,
        count: count(kbRatings.id)
      })
      .from(kbRatings)
      .where(and(eq(kbRatings.articleId, articleId), eq(kbRatings.tenantId, tenantId)));

    const { avgRating, count: ratingCount } = result[0];

    await db
      .update(kbArticles)
      .set({
        averageRating: avgRating?.toString() || '0.00',
        ratingCount: ratingCount || 0,
        updatedAt: new Date()
      })
      .where(and(eq(kbArticles.id, articleId), eq(kbArticles.tenantId, tenantId)));
  }

  // GESTÃO DE TEMPLATES
  async getAllTemplates(tenantId: string, type?: string) {
    const conditions = [eq(kbTemplates.tenantId, tenantId), eq(kbTemplates.isActive, true)];
    
    if (type) {
      conditions.push(eq(kbTemplates.type, type as any));
    }

    return await db
      .select()
      .from(kbTemplates)
      .where(and(...conditions))
      .orderBy(desc(kbTemplates.isDefault), asc(kbTemplates.name));
  }

  async createTemplate(data: InsertKBTemplate) {
    const [template] = await db
      .insert(kbTemplates)
      .values(data)
      .returning();
    return template;
  }

  async updateTemplate(id: string, tenantId: string, data: Partial<InsertKBTemplate>) {
    const [template] = await db
      .update(kbTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(kbTemplates.id, id), eq(kbTemplates.tenantId, tenantId)))
      .returning();
    return template;
  }

  async deleteTemplate(id: string, tenantId: string) {
    await db
      .update(kbTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(kbTemplates.id, id), eq(kbTemplates.tenantId, tenantId)));
  }

  // ANALYTICS E MÉTRICAS
  async getAnalyticsOverview(tenantId: string) {
    // Total de artigos por status
    const articlesByStatus = await db
      .select({
        status: kbArticles.status,
        count: count(kbArticles.id)
      })
      .from(kbArticles)
      .where(eq(kbArticles.tenantId, tenantId))
      .groupBy(kbArticles.status);

    // Artigos mais visualizados
    const mostViewed = await db
      .select({
        id: kbArticles.id,
        title: kbArticles.title,
        viewCount: kbArticles.viewCount,
        averageRating: kbArticles.averageRating
      })
      .from(kbArticles)
      .where(eq(kbArticles.tenantId, tenantId))
      .orderBy(desc(kbArticles.viewCount))
      .limit(10);

    // Artigos melhor avaliados
    const topRated = await db
      .select({
        id: kbArticles.id,
        title: kbArticles.title,
        averageRating: kbArticles.averageRating,
        ratingCount: kbArticles.ratingCount
      })
      .from(kbArticles)
      .where(and(
        eq(kbArticles.tenantId, tenantId),
        sql`${kbArticles.ratingCount} > 0`
      ))
      .orderBy(desc(kbArticles.averageRating), desc(kbArticles.ratingCount))
      .limit(10);

    // Estatísticas gerais
    const [stats] = await db
      .select({
        totalArticles: count(kbArticles.id),
        publishedArticles: sql<number>`COUNT(CASE WHEN ${kbArticles.status} = 'published' THEN 1 END)`,
        draftArticles: sql<number>`COUNT(CASE WHEN ${kbArticles.status} = 'draft' THEN 1 END)`,
        totalViews: sql<number>`COALESCE(SUM(${kbArticles.viewCount}), 0)`,
        averageRating: sql<number>`ROUND(AVG(CASE WHEN ${kbArticles.ratingCount} > 0 THEN CAST(${kbArticles.averageRating} AS DECIMAL) END), 2)`
      })
      .from(kbArticles)
      .where(eq(kbArticles.tenantId, tenantId));

    return {
      stats,
      articlesByStatus,
      mostViewed,
      topRated
    };
  }

  // BUSCA INTELIGENTE
  async searchArticles(tenantId: string, query: string, options?: {
    categoryId?: string;
    type?: string;
    limit?: number;
  }) {
    const conditions = [
      eq(kbArticles.tenantId, tenantId),
      eq(kbArticles.status, 'published'),
      or(
        like(kbArticles.title, `%${query}%`),
        like(kbArticles.summary, `%${query}%`),
        like(kbArticles.content, `%${query}%`),
        sql`${kbArticles.tags} && ARRAY[${query}]::text[]`
      )!
    ];

    if (options?.categoryId) {
      conditions.push(eq(kbArticles.categoryId, options.categoryId));
    }

    if (options?.type) {
      conditions.push(eq(kbArticles.type, options.type as any));
    }

    const searchQuery = db
      .select({
        article: kbArticles,
        category: {
          id: kbCategories.id,
          name: kbCategories.name,
          slug: kbCategories.slug,
          color: kbCategories.color,
          icon: kbCategories.icon
        }
      })
      .from(kbArticles)
      .leftJoin(kbCategories, eq(kbArticles.categoryId, kbCategories.id))
      .where(and(...conditions))
      .orderBy(desc(kbArticles.viewCount), desc(kbArticles.averageRating));

    if (options?.limit) {
      searchQuery.limit(options.limit);
    }

    return await searchQuery;
  }

  // CONFIGURAÇÕES
  async getSettings(tenantId: string) {
    const [settings] = await db
      .select()
      .from(kbSettings)
      .where(eq(kbSettings.tenantId, tenantId));
    return settings;
  }

  async updateSettings(tenantId: string, data: any, updatedBy: string) {
    const existingSettings = await this.getSettings(tenantId);
    
    if (existingSettings) {
      const [settings] = await db
        .update(kbSettings)
        .set({ ...data, updatedAt: new Date(), updatedBy })
        .where(eq(kbSettings.tenantId, tenantId))
        .returning();
      return settings;
    } else {
      const [settings] = await db
        .insert(kbSettings)
        .values({ tenantId, ...data, updatedBy })
        .returning();
      return settings;
    }
  }
}