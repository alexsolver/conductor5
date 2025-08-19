// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE ROUTES - CLEAN ARCHITECTURE
// Presentation layer handling HTTP requests with proper validation and error handling

import { Router } from 'express';
import { z } from 'zod';
import { KnowledgeBaseService } from '../../application/services/KnowledgeBaseService';

const router = Router();
const knowledgeBaseService = new KnowledgeBaseService();

// Validation schemas
const createArticleSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  summary: z.string().optional(),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['public', 'internal', 'restricted', 'private']).optional(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'published', 'archived', 'rejected']).optional(),
  contentType: z.string().optional()
});

const updateArticleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  summary: z.string().optional(),
  category: z.string().min(1).max(100).optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['public', 'internal', 'restricted', 'private']).optional(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'published', 'archived', 'rejected']).optional(),
  approvalStatus: z.string().optional()
});

const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
  visibility: z.string().optional(),
  authorId: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'title', 'view_count']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Middleware for tenant extraction
const extractTenant = (req: any, res: any, next: any) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(400).json({
      success: false,
      message: 'Tenant ID is required',
      code: 'MISSING_TENANT'
    });
  }
  req.tenantId = tenantId;
  next();
};

// Apply tenant middleware to all routes
router.use(extractTenant);

// GET /api/knowledge-base/articles - Search and list articles
router.get('/articles', async (req, res) => {
  try {
    console.log(`🔍 [KB-ROUTES] GET /articles - tenantId: ${req.tenantId}`);
    
    // Parse query parameters
    const queryParams = {
      query: req.query.query as string,
      category: req.query.category as string,
      status: req.query.status as string,
      visibility: req.query.visibility as string,
      authorId: req.query.authorId as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined
    };

    // Validate query parameters
    const validatedQuery = searchSchema.parse(queryParams);
    
    // Search articles
    const result = await knowledgeBaseService.searchArticles(validatedQuery, req.tenantId);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error: any) {
    console.error('Search articles error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to search articles',
      code: 'SEARCH_FAILED'
    });
  }
});

// POST /api/knowledge-base/articles - Create new article
router.post('/articles', async (req, res) => {
  try {
    console.log(`📝 [KB-ROUTES] POST /articles - tenantId: ${req.tenantId}`);
    
    // Validate request body
    const validatedData = createArticleSchema.parse(req.body);
    
    // Add author from authenticated user
    const articleData = {
      ...validatedData,
      authorId: req.user.userId
    };
    
    // Create article
    const article = await knowledgeBaseService.createArticle(articleData, req.tenantId);
    
    res.status(201).json({
      success: true,
      data: article
    });
    
  } catch (error: any) {
    console.error('Create article error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create article',
      code: 'CREATE_FAILED'
    });
  }
});

// GET /api/knowledge-base/articles/:id - Get article by ID
router.get('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👁️ [KB-ROUTES] GET /articles/${id} - tenantId: ${req.tenantId}`);
    
    const article = await knowledgeBaseService.getArticleById(id, req.tenantId);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
        code: 'ARTICLE_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: article
    });
    
  } catch (error: any) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get article',
      code: 'GET_FAILED'
    });
  }
});

// PUT /api/knowledge-base/articles/:id - Update article
router.put('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✏️ [KB-ROUTES] PUT /articles/${id} - tenantId: ${req.tenantId}`);
    
    // Validate request body
    const validatedData = updateArticleSchema.parse(req.body);
    
    // Update article
    const article = await knowledgeBaseService.updateArticle(id, validatedData, req.tenantId);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
        code: 'ARTICLE_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: article
    });
    
  } catch (error: any) {
    console.error('Update article error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update article',
      code: 'UPDATE_FAILED'
    });
  }
});

// DELETE /api/knowledge-base/articles/:id - Delete article
router.delete('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ [KB-ROUTES] DELETE /articles/${id} - tenantId: ${req.tenantId}`);
    
    const success = await knowledgeBaseService.deleteArticle(id, req.tenantId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
        code: 'ARTICLE_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete article',
      code: 'DELETE_FAILED'
    });
  }
});

// POST /api/knowledge-base/articles/:id/publish - Publish article
router.post('/articles/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📢 [KB-ROUTES] POST /articles/${id}/publish - tenantId: ${req.tenantId}`);
    
    const success = await knowledgeBaseService.publishArticle(id, req.tenantId);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to publish article',
        code: 'PUBLISH_FAILED'
      });
    }
    
    res.json({
      success: true,
      message: 'Article published successfully'
    });
    
  } catch (error: any) {
    console.error('Publish article error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to publish article',
      code: 'PUBLISH_FAILED'
    });
  }
});

// POST /api/knowledge-base/articles/:id/unpublish - Unpublish article
router.post('/articles/:id/unpublish', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 [KB-ROUTES] POST /articles/${id}/unpublish - tenantId: ${req.tenantId}`);
    
    const success = await knowledgeBaseService.unpublishArticle(id, req.tenantId);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to unpublish article',
        code: 'UNPUBLISH_FAILED'
      });
    }
    
    res.json({
      success: true,
      message: 'Article unpublished successfully'
    });
    
  } catch (error: any) {
    console.error('Unpublish article error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to unpublish article',
      code: 'UNPUBLISH_FAILED'
    });
  }
});

// POST /api/knowledge-base/articles/:id/rate - Rate article
router.post('/articles/:id/rate', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    
    console.log(`⭐ [KB-ROUTES] POST /articles/${id}/rate - rating: ${rating} - tenantId: ${req.tenantId}`);
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
        code: 'INVALID_RATING'
      });
    }
    
    const success = await knowledgeBaseService.rateArticle(id, rating, req.tenantId);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to rate article',
        code: 'RATE_FAILED'
      });
    }
    
    res.json({
      success: true,
      message: 'Article rated successfully'
    });
    
  } catch (error: any) {
    console.error('Rate article error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to rate article',
      code: 'RATE_FAILED'
    });
  }
});

// GET /api/knowledge-base/stats - Get knowledge base statistics
router.get('/stats', async (req, res) => {
  try {
    console.log(`📊 [KB-ROUTES] GET /stats - tenantId: ${req.tenantId}`);
    
    const stats = await knowledgeBaseService.getArticleStatistics(req.tenantId);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get statistics',
      code: 'STATS_FAILED'
    });
  }
});

// GET /api/knowledge-base/categories/:category - Get articles by category
router.get('/categories/:category', async (req, res) => {
  try {
    const { category } = req.params;
    console.log(`📂 [KB-ROUTES] GET /categories/${category} - tenantId: ${req.tenantId}`);
    
    const articles = await knowledgeBaseService.getArticlesByCategory(category, req.tenantId);
    
    res.json({
      success: true,
      data: articles
    });
    
  } catch (error: any) {
    console.error('Get articles by category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get articles by category',
      code: 'CATEGORY_FAILED'
    });
  }
});

// GET /api/knowledge-base/popular - Get popular articles
router.get('/popular', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    console.log(`🔥 [KB-ROUTES] GET /popular - limit: ${limit} - tenantId: ${req.tenantId}`);
    
    const articles = await knowledgeBaseService.getPopularArticles(limit, req.tenantId);
    
    res.json({
      success: true,
      data: articles
    });
    
  } catch (error: any) {
    console.error('Get popular articles error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get popular articles',
      code: 'POPULAR_FAILED'
    });
  }
});

// GET /api/knowledge-base/recent - Get recent articles
router.get('/recent', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    console.log(`⏰ [KB-ROUTES] GET /recent - limit: ${limit} - tenantId: ${req.tenantId}`);
    
    const articles = await knowledgeBaseService.getRecentArticles(limit, req.tenantId);
    
    res.json({
      success: true,
      data: articles
    });
    
  } catch (error: any) {
    console.error('Get recent articles error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recent articles',
      code: 'RECENT_FAILED'
    });
  }
});

export { router as knowledgeBaseRoutes };