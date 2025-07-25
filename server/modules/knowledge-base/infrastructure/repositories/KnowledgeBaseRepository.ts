import { eq, and, like, desc, asc, sql, count, inArray, isNull, or } from 'drizzle-orm';
import { poolManager } from '../../../../database/ConnectionPoolManager';
import { logError } from '../../../../utils/logger';
import {
  knowledgeCategories,
  knowledgeArticles,
  knowledgeArticleVersions,
  knowledgeTags,
  knowledgeArticleTags,
  knowledgeComments,
  knowledgeRatings,
  knowledgeAccessLog,
  knowledgeApprovals,
  knowledgeTemplates
} from '../../../../../shared/schema-knowledge-base';
import { TenantValidator } from '../../../../utils/TenantValidator';

export class KnowledgeBaseRepository {
  // Categories
  async createCategory(tenantId: string, categoryData: any) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.knowledge_categories 
        (tenant_id, name, description, parent_category_id, icon, color, slug, sort_order, created_by)
        VALUES (
          ${validatedTenantId},
          ${categoryData.name},
          ${categoryData.description || null},
          ${categoryData.parentCategoryId || null},
          ${categoryData.icon || null},
          ${categoryData.color || null},
          ${categoryData.slug},
          ${categoryData.sortOrder || 0},
          ${categoryData.createdBy}
        )
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error creating knowledge category', error, { tenantId, categoryData });
      throw error;
    }
  }

  async getCategories(tenantId: string, filters: any = {}) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      let whereClause = `WHERE tenant_id = '${validatedTenantId}' AND is_active = true`;

      if (filters.parentId !== undefined) {
        whereClause += filters.parentId ? 
          ` AND parent_category_id = '${filters.parentId}'` : 
          ` AND parent_category_id IS NULL`;
      }

      const result = await tenantDb.execute(sql`
        SELECT 
          c.*,
          COUNT(a.id) as article_count
        FROM ${sql.identifier(schemaName)}.knowledge_categories c
        LEFT JOIN ${sql.identifier(schemaName)}.knowledge_articles a ON c.id = a.category_id AND a.status = 'published'
        ${sql.raw(whereClause)}
        GROUP BY c.id
        ORDER BY c.sort_order, c.name
      `);

      return result.rows || [];
    } catch (error) {
      logError('Error fetching knowledge categories', error, { tenantId, filters });
      throw error;
    }
  }

  async updateCategory(tenantId: string, categoryId: string, updateData: any) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.knowledge_categories 
        SET 
          name = COALESCE(${updateData.name}, name),
          description = COALESCE(${updateData.description}, description),
          parent_category_id = COALESCE(${updateData.parentCategoryId}, parent_category_id),
          icon = COALESCE(${updateData.icon}, icon),
          color = COALESCE(${updateData.color}, color),
          slug = COALESCE(${updateData.slug}, slug),
          sort_order = COALESCE(${updateData.sortOrder}, sort_order),
          updated_at = NOW()
        WHERE id = ${categoryId} AND tenant_id = ${validatedTenantId}
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error updating knowledge category', error, { tenantId, categoryId, updateData });
      throw error;
    }
  }

  async deleteCategory(tenantId: string, categoryId: string) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.knowledge_categories 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${categoryId} AND tenant_id = ${validatedTenantId}
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error deleting knowledge category', error, { tenantId, categoryId });
      throw error;
    }
  }

  // Articles
  async createArticle(tenantId: string, articleData: any) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      // Create searchable content
      const searchableContent = `${articleData.title} ${articleData.excerpt || ''} ${articleData.content}`.toLowerCase();

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.knowledge_articles 
        (tenant_id, title, slug, excerpt, content, content_type, category_id, type, status, 
         visibility, author_id, searchable_content, metadata, attachments, scheduled_publish_at)
        VALUES (
          ${validatedTenantId},
          ${articleData.title},
          ${articleData.slug},
          ${articleData.excerpt || null},
          ${articleData.content},
          ${articleData.contentType || 'markdown'},
          ${articleData.categoryId},
          ${articleData.type || 'article'},
          ${articleData.status || 'draft'},
          ${articleData.visibility || 'internal'},
          ${articleData.authorId},
          ${searchableContent},
          ${JSON.stringify(articleData.metadata || {})},
          ${JSON.stringify(articleData.attachments || [])},
          ${articleData.scheduledPublishAt || null}
        )
        RETURNING *
      `);

      const article = result.rows?.[0];

      // Create first version
      if (article) {
        await this.createArticleVersion(tenantId, article.id, {
          version: 1,
          title: articleData.title,
          content: articleData.content,
          changesSummary: 'Initial version',
          authorId: articleData.authorId
        });
      }

      return article;
    } catch (error) {
      logError('Error creating knowledge article', error, { tenantId, articleData });
      throw error;
    }
  }

  async getArticles(tenantId: string, filters: any = {}) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      let whereClause = `WHERE a.tenant_id = '${validatedTenantId}'`;

      if (filters.categoryId) {
        whereClause += ` AND a.category_id = '${filters.categoryId}'`;
      }

      if (filters.status) {
        whereClause += ` AND a.status = '${filters.status}'`;
      }

      if (filters.visibility) {
        whereClause += ` AND a.visibility = '${filters.visibility}'`;
      }

      if (filters.search) {
        whereClause += ` AND a.searchable_content ILIKE '%${filters.search.toLowerCase()}%'`;
      }

      if (filters.featured !== undefined) {
        whereClause += ` AND a.featured = ${filters.featured}`;
      }

      const limit = parseInt(filters.limit || '50');
      const offset = parseInt(filters.offset || '0');

      const result = await tenantDb.execute(sql`
        SELECT 
          a.*,
          c.name as category_name,
          c.color as category_color,
          COALESCE(a.helpful_count, 0) as helpful_count,
          COALESCE(a.not_helpful_count, 0) as not_helpful_count,
          COALESCE(a.view_count, 0) as view_count
        FROM ${sql.identifier(schemaName)}.knowledge_articles a
        LEFT JOIN ${sql.identifier(schemaName)}.knowledge_categories c ON a.category_id = c.id
        ${sql.raw(whereClause)}
        ORDER BY 
          CASE WHEN a.featured = true THEN 0 ELSE 1 END,
          a.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      return result.rows || [];
    } catch (error) {
      logError('Error fetching knowledge articles', error, { tenantId, filters });
      throw error;
    }
  }

  async getArticleById(tenantId: string, articleId: string, trackView: boolean = true) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        SELECT 
          a.*,
          c.name as category_name,
          c.color as category_color,
          c.slug as category_slug
        FROM ${sql.identifier(schemaName)}.knowledge_articles a
        LEFT JOIN ${sql.identifier(schemaName)}.knowledge_categories c ON a.category_id = c.id
        WHERE a.id = ${articleId} AND a.tenant_id = ${validatedTenantId}
      `);

      const article = result.rows?.[0];

      if (article && trackView) {
        // Increment view count
        await tenantDb.execute(sql`
          UPDATE ${sql.identifier(schemaName)}.knowledge_articles 
          SET view_count = view_count + 1
          WHERE id = ${articleId} AND tenant_id = ${validatedTenantId}
        `);
      }

      return article;
    } catch (error) {
      logError('Error fetching knowledge article', error, { tenantId, articleId });
      throw error;
    }
  }

  async updateArticle(tenantId: string, articleId: string, updateData: any) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      // Update searchable content if content changed
      let searchableContent;
      if (updateData.title || updateData.excerpt || updateData.content) {
        const currentArticle = await this.getArticleById(tenantId, articleId, false);
        searchableContent = `${updateData.title || currentArticle.title} ${updateData.excerpt || currentArticle.excerpt || ''} ${updateData.content || currentArticle.content}`.toLowerCase();
      }

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.knowledge_articles 
        SET 
          title = COALESCE(${updateData.title}, title),
          excerpt = COALESCE(${updateData.excerpt}, excerpt),
          content = COALESCE(${updateData.content}, content),
          content_type = COALESCE(${updateData.contentType}, content_type),
          category_id = COALESCE(${updateData.categoryId}, category_id),
          type = COALESCE(${updateData.type}, type),
          status = COALESCE(${updateData.status}, status),
          visibility = COALESCE(${updateData.visibility}, visibility),
          reviewer_id = COALESCE(${updateData.reviewerId}, reviewer_id),
          published_at = COALESCE(${updateData.publishedAt}, published_at),
          scheduled_publish_at = COALESCE(${updateData.scheduledPublishAt}, scheduled_publish_at),
          last_reviewed_at = COALESCE(${updateData.lastReviewedAt}, last_reviewed_at),
          next_review_date = COALESCE(${updateData.nextReviewDate}, next_review_date),
          featured = COALESCE(${updateData.featured}, featured),
          searchable_content = COALESCE(${searchableContent}, searchable_content),
          metadata = COALESCE(${updateData.metadata ? JSON.stringify(updateData.metadata) : null}, metadata),
          attachments = COALESCE(${updateData.attachments ? JSON.stringify(updateData.attachments) : null}, attachments),
          version = version + 1,
          updated_at = NOW()
        WHERE id = ${articleId} AND tenant_id = ${validatedTenantId}
        RETURNING *
      `);

      const article = result.rows?.[0];

      // Create new version if content changed
      if (article && (updateData.title || updateData.content)) {
        await this.createArticleVersion(tenantId, articleId, {
          version: article.version,
          title: article.title,
          content: article.content,
          changesSummary: updateData.changesSummary || 'Content updated',
          authorId: updateData.authorId || article.author_id
        });
      }

      return article;
    } catch (error) {
      logError('Error updating knowledge article', error, { tenantId, articleId, updateData });
      throw error;
    }
  }

  async deleteArticle(tenantId: string, articleId: string) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        UPDATE ${sql.identifier(schemaName)}.knowledge_articles 
        SET status = 'archived', updated_at = NOW()
        WHERE id = ${articleId} AND tenant_id = ${validatedTenantId}
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error deleting knowledge article', error, { tenantId, articleId });
      throw error;
    }
  }

  // Article Versions
  async createArticleVersion(tenantId: string, articleId: string, versionData: any) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.knowledge_article_versions 
        (tenant_id, article_id, version, title, content, changes_summary, author_id)
        VALUES (
          ${validatedTenantId},
          ${articleId},
          ${versionData.version},
          ${versionData.title},
          ${versionData.content},
          ${versionData.changesSummary || null},
          ${versionData.authorId}
        )
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error creating article version', error, { tenantId, articleId, versionData });
      throw error;
    }
  }

  async getArticleVersions(tenantId: string, articleId: string) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        SELECT *
        FROM ${sql.identifier(schemaName)}.knowledge_article_versions
        WHERE article_id = ${articleId} AND tenant_id = ${validatedTenantId}
        ORDER BY version DESC
      `);

      return result.rows || [];
    } catch (error) {
      logError('Error fetching article versions', error, { tenantId, articleId });
      throw error;
    }
  }

  // Tags
  async createTag(tenantId: string, tagData: any) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.knowledge_tags 
        (tenant_id, name, slug, color)
        VALUES (
          ${validatedTenantId},
          ${tagData.name},
          ${tagData.slug},
          ${tagData.color || null}
        )
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error creating knowledge tag', error, { tenantId, tagData });
      throw error;
    }
  }

  async getTags(tenantId: string) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        SELECT *
        FROM ${sql.identifier(schemaName)}.knowledge_tags
        WHERE tenant_id = ${validatedTenantId}
        ORDER BY usage_count DESC, name
      `);

      return result.rows || [];
    } catch (error) {
      logError('Error fetching knowledge tags', error, { tenantId });
      throw error;
    }
  }

  // Search
  async searchArticles(tenantId: string, query: string, filters: any = {}) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      let whereClause = `WHERE a.tenant_id = '${validatedTenantId}' AND a.status = 'published'`;

      if (query) {
        whereClause += ` AND a.searchable_content ILIKE '%${query.toLowerCase()}%'`;
      }

      if (filters.categoryId) {
        whereClause += ` AND a.category_id = '${filters.categoryId}'`;
      }

      const limit = parseInt(filters.limit || '20');

      const result = await tenantDb.execute(sql`
        SELECT 
          a.*,
          c.name as category_name,
          c.color as category_color,
          ts_rank_cd(to_tsvector('portuguese', a.searchable_content), plainto_tsquery('portuguese', ${query || ''})) as relevance
        FROM ${sql.identifier(schemaName)}.knowledge_articles a
        LEFT JOIN ${sql.identifier(schemaName)}.knowledge_categories c ON a.category_id = c.id
        ${sql.raw(whereClause)}
        ORDER BY 
          ${query ? 'relevance DESC,' : ''} 
          a.view_count DESC, 
          a.helpful_count DESC,
          a.updated_at DESC
        LIMIT ${limit}
      `);

      return result.rows || [];
    } catch (error) {
      logError('Error searching knowledge articles', error, { tenantId, query, filters });
      throw error;
    }
  }

  // Rating
  async rateArticle(tenantId: string, articleId: string, userId: string, ratingData: any) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      // Check if user already rated
      const existingRating = await tenantDb.execute(sql`
        SELECT id FROM ${sql.identifier(schemaName)}.knowledge_ratings
        WHERE article_id = ${articleId} AND user_id = ${userId} AND tenant_id = ${validatedTenantId}
      `);

      if (existingRating.rows?.length > 0) {
        // Update existing rating
        const result = await tenantDb.execute(sql`
          UPDATE ${sql.identifier(schemaName)}.knowledge_ratings 
          SET 
            rating = ${ratingData.rating || null},
            is_helpful = ${ratingData.isHelpful},
            feedback = ${ratingData.feedback || null},
            updated_at = NOW()
          WHERE article_id = ${articleId} AND user_id = ${userId} AND tenant_id = ${validatedTenantId}
          RETURNING *
        `);

        return result.rows?.[0];
      } else {
        // Create new rating
        const result = await tenantDb.execute(sql`
          INSERT INTO ${sql.identifier(schemaName)}.knowledge_ratings 
          (tenant_id, article_id, user_id, rating, is_helpful, feedback)
          VALUES (
            ${validatedTenantId},
            ${articleId},
            ${userId},
            ${ratingData.rating || null},
            ${ratingData.isHelpful},
            ${ratingData.feedback || null}
          )
          RETURNING *
        `);

        // Update article counters
        if (ratingData.isHelpful !== undefined) {
          await tenantDb.execute(sql`
            UPDATE ${sql.identifier(schemaName)}.knowledge_articles 
            SET 
              helpful_count = CASE WHEN ${ratingData.isHelpful} THEN helpful_count + 1 ELSE helpful_count END,
              not_helpful_count = CASE WHEN NOT ${ratingData.isHelpful} THEN not_helpful_count + 1 ELSE not_helpful_count END
            WHERE id = ${articleId} AND tenant_id = ${validatedTenantId}
          `);
        }

        return result.rows?.[0];
      }
    } catch (error) {
      logError('Error rating knowledge article', error, { tenantId, articleId, userId, ratingData });
      throw error;
    }
  }

  // Comments
  async createComment(tenantId: string, commentData: any) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.knowledge_comments 
        (tenant_id, article_id, parent_comment_id, author_id, content, is_internal)
        VALUES (
          ${validatedTenantId},
          ${commentData.articleId},
          ${commentData.parentCommentId || null},
          ${commentData.authorId},
          ${commentData.content},
          ${commentData.isInternal || false}
        )
        RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      logError('Error creating knowledge comment', error, { tenantId, commentData });
      throw error;
    }
  }

  async getComments(tenantId: string, articleId: string) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        SELECT *
        FROM ${sql.identifier(schemaName)}.knowledge_comments
        WHERE article_id = ${articleId} AND tenant_id = ${validatedTenantId} AND is_approved = true
        ORDER BY created_at DESC
      `);

      return result.rows || [];
    } catch (error) {
      logError('Error fetching knowledge comments', error, { tenantId, articleId });
      throw error;
    }
  }

  // Analytics
  async getAnalytics(tenantId: string, filters: any = {}) {
    try {
      const validatedTenantId = await TenantValidator.validateTenantAccess(tenantId);
      const tenantDb = await poolManager.getTenantConnection(validatedTenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        SELECT 
          COUNT(*) as total_articles,
          COUNT(CASE WHEN status = 'published' THEN 1 END) as published_articles,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_articles,
          SUM(view_count) as total_views,
          SUM(helpful_count) as total_helpful,
          SUM(not_helpful_count) as total_not_helpful,
          AVG(CASE WHEN helpful_count + not_helpful_count > 0 THEN helpful_count::float / (helpful_count + not_helpful_count) END) as avg_helpfulness
        FROM ${sql.identifier(schemaName)}.knowledge_articles
        WHERE tenant_id = ${validatedTenantId}
      `);

      return result.rows?.[0] || {};
    } catch (error) {
      logError('Error fetching knowledge analytics', error, { tenantId, filters });
      throw error;
    }
  }
}