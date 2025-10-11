// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE APPLICATION SERVICE - CLEAN ARCHITECTURE
// Application Layer - Orquestra use cases e coordena operações de domínio

import { db, pool } from '../../db';
import {
  knowledgeBaseArticles,
  insertKnowledgeBaseArticleSchema,
  updateKnowledgeBaseArticleSchema,
  type KnowledgeBaseArticle,
  type InsertKnowledgeBaseArticle
} from '../../../shared/schema-knowledge-base';
import { eq, and, like, ilike, desc, asc, sql, or } from 'drizzle-orm';

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
        // This is the fix: use categoryId instead of category
        conditions.push(eq(knowledgeBaseArticles.categoryId, params.category));
      }

      if (params.status) {
        conditions.push(eq(knowledgeBaseArticles.status, params.status));
      }

      // Execute search query
      const limit = params.limit || 50;
      const offset = params.offset || 0;

      this.logger.log(`[KB-SERVICE] Query params: limit=${limit}, offset=${offset}`);
      this.logger.log(`[KB-SERVICE] Conditions count: ${conditions.length}`);

      // Use raw SQL to query the actual database structure
      const schemaName = `tenant_${this.tenantId.replace(/-/g, '_')}`;
      const articlesResult = await db.execute(sql.raw(`
        SELECT 
          id, tenant_id as "tenantId", title, content, excerpt, summary,
          category, tags, access_level as visibility, author_id as "authorId",
          created_at as "createdAt", updated_at as "updatedAt",
          published, published_at as "published_at", view_count, helpful_count,
          status, version, approval_status
        FROM ${schemaName}.knowledge_base_articles
        WHERE tenant_id = '${this.tenantId}'
        ${params.query ? `AND (title ILIKE '%${params.query}%' OR content ILIKE '%${params.query}%')` : ''}
        ${params.category ? `AND category = '${params.category}'` : ''}
        ${params.status ? `AND status = '${params.status}'` : ''}
        ORDER BY created_at DESC
        LIMIT ${limit + 1}
        OFFSET ${offset}
      `));

      const articles = articlesResult.rows || [];

      this.logger.log(`[KB-SERVICE] Raw articles found: ${articles.length}`);

      // Count total for pagination
      const countResult = await db.execute(sql.raw(`
        SELECT COUNT(*) as count
        FROM ${schemaName}.knowledge_base_articles
        WHERE tenant_id = '${this.tenantId}'
        ${params.query ? `AND (title ILIKE '%${params.query}%' OR content ILIKE '%${params.query}%')` : ''}
        ${params.category ? `AND category = '${params.category}'` : ''}
        ${params.status ? `AND status = '${params.status}'` : ''}
      `));
      const count = countResult.rows?.[0]?.count || 0;

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
      this.logger.log(`[KB-SERVICE] Article data received:`, JSON.stringify(articleData, null, 2));

      // Validate required fields
      if (!articleData.title || !articleData.content) {
        throw new Error('Title and content are required');
      }

      // Map category values to match enum values from knowledgeBaseCategoryEnum
      const categoryMapping: Record<string, string> = {
        'technical_support': 'technical_support',
        'troubleshooting': 'troubleshooting',
        'user_guide': 'user_guide',
        'faq': 'faq',
        'policy': 'policy',
        'policies': 'policy',
        'process': 'process',
        'training': 'training',
        'announcement': 'announcement',
        'best_practice': 'best_practice',
        'configuration': 'configuration',
        'other': 'other'
      };

      // Prepare data for insertion matching actual database structure
      const category = categoryMapping[articleData.category] || 'other';
      const status = articleData.status || 'draft';
      const accessLevel = articleData.access_level || 'public';
      const tags = articleData.tags || [];
      const summary = articleData.summary || '';

      // Debug: Log exactly what we're trying to insert
      this.logger.log('[KB-DEBUG] Attempting to insert article with data:', {
        title: articleData.title,
        category,
        status,
        accessLevel,
        tags
      });

      // Insert article using raw SQL to match actual database structure
      const schemaName = `tenant_${this.tenantId.replace(/-/g, '_')}`;
      const insertResult = await db.execute(sql.raw(`
        INSERT INTO ${schemaName}.knowledge_base_articles (
          tenant_id, title, content, category, tags, access_level, author_id,
          status, published, view_count, helpful_count, summary, version, approval_status
        ) VALUES (
          '${this.tenantId}',
          '${articleData.title.replace(/'/g, "''")}',
          '${articleData.content.replace(/'/g, "''")}',
          '${category}',
          ARRAY[${tags.map((t: string) => `'${t.replace(/'/g, "''")}'`).join(',')}]::text[],
          '${accessLevel}',
          '${authorId}',
          '${status}',
          false,
          0,
          0,
          '${summary.replace(/'/g, "''")}',
          1,
          'pending'
        )
        RETURNING *
      `));

      const createdArticle = insertResult.rows?.[0];
      this.logger.log(`[KB-SERVICE] Article created successfully: ${createdArticle?.id}`);

      return {
        success: true,
        message: 'Article created successfully',
        data: createdArticle
      };
    } catch (error) {
      this.logger.error(`[KB-SERVICE] Error creating article:`, error);
      this.logger.error(`[KB-SERVICE] Error details:`, error.message);
      this.logger.error(`[KB-SERVICE] Error stack:`, error.stack);

      // Return a more detailed error message
      return {
        success: false,
        message: `Failed to create article: ${error.message}`,
        data: null as any
      };
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

      // Use raw SQL to query the tenant's schema directly
      const schemaName = `tenant_${this.tenantId.replace(/-/g, '_')}`;
      const articleResult = await db.execute(sql.raw(`
        SELECT 
          id, tenant_id as "tenantId", title, content, excerpt, summary,
          category, tags, access_level as visibility, author_id as "authorId",
          created_at as "createdAt", updated_at as "updatedAt",
          published, published_at as "published_at", view_count, helpful_count,
          status, version, approval_status
        FROM ${schemaName}.knowledge_base_articles
        WHERE id = '${id}' AND tenant_id = '${this.tenantId}'
        LIMIT 1
      `));

      const article = articleResult.rows?.[0];

      if (!article) {
        return {
          success: false,
          message: 'Article not found',
          data: null
        };
      }

      // Increment view count
      await db.execute(sql.raw(`
        UPDATE ${schemaName}.knowledge_base_articles
        SET view_count = view_count + 1
        WHERE id = '${id}'
      `));

      this.logger.log(`[KB-SERVICE] Article retrieved: ${article.id}`);

      return {
        success: true,
        message: 'Article retrieved successfully',
        data: { ...article, viewCount: (article.view_count || 0) + 1 }
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
      this.logger.log(`[KB-SERVICE] Update data:`, JSON.stringify(updates, null, 2));

      // Build update fields dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;

      if (updates.title !== undefined) {
        updateFields.push(`title = $${paramCount++}`);
        updateValues.push(updates.title);
      }
      if (updates.content !== undefined) {
        updateFields.push(`content = $${paramCount++}`);
        updateValues.push(updates.content);
      }
      if (updates.category !== undefined) {
        updateFields.push(`category = $${paramCount++}`);
        updateValues.push(updates.category);
      }
      if (updates.tags !== undefined) {
        updateFields.push(`tags = $${paramCount++}`);
        updateValues.push(updates.tags);
      }
      if (updates.status !== undefined) {
        updateFields.push(`status = $${paramCount++}`);
        updateValues.push(updates.status);
      }
      if (updates.summary !== undefined) {
        updateFields.push(`summary = $${paramCount++}`);
        updateValues.push(updates.summary);
      }

      // Always update updated_at
      updateFields.push(`updated_at = $${paramCount++}`);
      updateValues.push(new Date());

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      // Add WHERE clause parameters
      const idParam = paramCount++;
      const tenantParam = paramCount++;
      updateValues.push(id);
      updateValues.push(this.tenantId);

      const schemaName = `tenant_${this.tenantId.replace(/-/g, '_')}`;
      const updateQuery = `
        UPDATE ${schemaName}.knowledge_base_articles
        SET ${updateFields.join(', ')}
        WHERE id = $${idParam} AND tenant_id = $${tenantParam}
        RETURNING *
      `;

      this.logger.log(`[KB-SERVICE] Update query:`, updateQuery);
      this.logger.log(`[KB-SERVICE] Update values:`, updateValues);
      
      const updateResult = await pool.query(updateQuery, updateValues);
      const updatedArticle = updateResult.rows?.[0];

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
      this.logger.error(`[KB-SERVICE] Error details:`, error.message);
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
          archivedAt: new Date(),
          status: 'archived'
        })
        .where(and(
          eq(knowledgeBaseArticles.id, id),
          eq(knowledgeBaseArticles.tenantId, this.tenantId)
        ))
        .returning();

      if (!deletedArticle) {
        throw new Error('Article not found or not authorized');
      }

      this.logger.log(`[KB-SERVICE] Article archived successfully: ${deletedArticle.id}`);

      return {
        success: true,
        message: 'Article archived successfully'
      };
    } catch (error) {
      this.logger.error(`[KB-SERVICE] Error archiving article:`, error);
      throw new Error('Failed to archive article');
    }
  }
}