
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { KnowledgeBaseRepository } from '../infrastructure/repositories/KnowledgeBaseRepository';

export class KnowledgeBaseController {
  private knowledgeBaseRepository: KnowledgeBaseRepository;

  constructor() {
    this.knowledgeBaseRepository = new KnowledgeBaseRepository();
  }

  // Categories
  async createCategory(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const categoryData = {
        ...req.body,
        createdBy: req.user.id
      };

      const category = await this.knowledgeBaseRepository.createCategory(req.user.tenantId, categoryData);
      
      res.status(201).json({ 
        success: true, 
        data: category,
        message: 'Category created successfully' 
      });
    } catch (error) {
      console.error('Error creating knowledge category:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create category' 
      });
    }
  }

  async getCategories(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const filters = {
        parentId: req.query.parentId as string,
      };

      const categories = await this.knowledgeBaseRepository.getCategories(req.user.tenantId, filters);
      
      res.json({ 
        success: true, 
        data: categories 
      });
    } catch (error) {
      console.error('Error fetching knowledge categories:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch categories' 
      });
    }
  }

  async updateCategory(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const { categoryId } = req.params;
      const category = await this.knowledgeBaseRepository.updateCategory(req.user.tenantId, categoryId, req.body);
      
      if (!category) {
        return res.status(404).json({ 
          success: false, 
          message: 'Category not found' 
        });
      }

      res.json({ 
        success: true, 
        data: category,
        message: 'Category updated successfully' 
      });
    } catch (error) {
      console.error('Error updating knowledge category:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update category' 
      });
    }
  }

  async deleteCategory(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const { categoryId } = req.params;
      const category = await this.knowledgeBaseRepository.deleteCategory(req.user.tenantId, categoryId);
      
      if (!category) {
        return res.status(404).json({ 
          success: false, 
          message: 'Category not found' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Category deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting knowledge category:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete category' 
      });
    }
  }

  // Articles
  async createArticle(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const articleData = {
        ...req.body,
        authorId: req.user.id,
        slug: req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      };

      const article = await this.knowledgeBaseRepository.createArticle(req.user.tenantId, articleData);
      
      res.status(201).json({ 
        success: true, 
        data: article,
        message: 'Article created successfully' 
      });
    } catch (error) {
      console.error('Error creating knowledge article:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create article' 
      });
    }
  }

  async getArticles(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const filters = {
        categoryId: req.query.categoryId as string,
        status: req.query.status as string,
        visibility: req.query.visibility as string,
        search: req.query.search as string,
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        limit: req.query.limit as string,
        offset: req.query.offset as string,
      };

      const articles = await this.knowledgeBaseRepository.getArticles(req.user.tenantId, filters);
      
      res.json({ 
        success: true, 
        data: articles,
        pagination: {
          total: articles.length,
          limit: parseInt(filters.limit || '50'),
          offset: parseInt(filters.offset || '0'),
          hasMore: articles.length >= parseInt(filters.limit || '50')
        }
      });
    } catch (error) {
      console.error('Error fetching knowledge articles:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch articles' 
      });
    }
  }

  async getArticleById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const { articleId } = req.params;
      const article = await this.knowledgeBaseRepository.getArticleById(req.user.tenantId, articleId);
      
      if (!article) {
        return res.status(404).json({ 
          success: false, 
          message: 'Article not found' 
        });
      }

      res.json({ 
        success: true, 
        data: article 
      });
    } catch (error) {
      console.error('Error fetching knowledge article:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch article' 
      });
    }
  }

  async updateArticle(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const { articleId } = req.params;
      const updateData = {
        ...req.body,
        authorId: req.user.id
      };

      const article = await this.knowledgeBaseRepository.updateArticle(req.user.tenantId, articleId, updateData);
      
      if (!article) {
        return res.status(404).json({ 
          success: false, 
          message: 'Article not found' 
        });
      }

      res.json({ 
        success: true, 
        data: article,
        message: 'Article updated successfully' 
      });
    } catch (error) {
      console.error('Error updating knowledge article:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update article' 
      });
    }
  }

  async deleteArticle(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const { articleId } = req.params;
      const article = await this.knowledgeBaseRepository.deleteArticle(req.user.tenantId, articleId);
      
      if (!article) {
        return res.status(404).json({ 
          success: false, 
          message: 'Article not found' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Article deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting knowledge article:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete article' 
      });
    }
  }

  // Search
  async searchArticles(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const query = req.query.q as string;
      const filters = {
        categoryId: req.query.categoryId as string,
        limit: req.query.limit as string,
      };

      const articles = await this.knowledgeBaseRepository.searchArticles(req.user.tenantId, query, filters);
      
      res.json({ 
        success: true, 
        data: articles,
        query: query
      });
    } catch (error) {
      console.error('Error searching knowledge articles:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to search articles' 
      });
    }
  }

  // Rating
  async rateArticle(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const { articleId } = req.params;
      const rating = await this.knowledgeBaseRepository.rateArticle(
        req.user.tenantId, 
        articleId, 
        req.user.id, 
        req.body
      );
      
      res.json({ 
        success: true, 
        data: rating,
        message: 'Rating submitted successfully' 
      });
    } catch (error) {
      console.error('Error rating knowledge article:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to submit rating' 
      });
    }
  }

  // Comments
  async createComment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const commentData = {
        ...req.body,
        authorId: req.user.id
      };

      const comment = await this.knowledgeBaseRepository.createComment(req.user.tenantId, commentData);
      
      res.status(201).json({ 
        success: true, 
        data: comment,
        message: 'Comment created successfully' 
      });
    } catch (error) {
      console.error('Error creating knowledge comment:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create comment' 
      });
    }
  }

  async getComments(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const { articleId } = req.params;
      const comments = await this.knowledgeBaseRepository.getComments(req.user.tenantId, articleId);
      
      res.json({ 
        success: true, 
        data: comments 
      });
    } catch (error) {
      console.error('Error fetching knowledge comments:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch comments' 
      });
    }
  }

  // Tags
  async getTags(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const tags = await this.knowledgeBaseRepository.getTags(req.user.tenantId);
      
      res.json({ 
        success: true, 
        data: tags 
      });
    } catch (error) {
      console.error('Error fetching knowledge tags:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch tags' 
      });
    }
  }

  async createTag(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const tagData = {
        ...req.body,
        slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      };

      const tag = await this.knowledgeBaseRepository.createTag(req.user.tenantId, tagData);
      
      res.status(201).json({ 
        success: true, 
        data: tag,
        message: 'Tag created successfully' 
      });
    } catch (error) {
      console.error('Error creating knowledge tag:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create tag' 
      });
    }
  }

  // Analytics
  async getAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const analytics = await this.knowledgeBaseRepository.getAnalytics(req.user.tenantId);
      
      res.json({ 
        success: true, 
        data: analytics 
      });
    } catch (error) {
      console.error('Error fetching knowledge analytics:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch analytics' 
      });
    }
  }

  // Versions
  async getArticleVersions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const { articleId } = req.params;
      const versions = await this.knowledgeBaseRepository.getArticleVersions(req.user.tenantId, articleId);
      
      res.json({ 
        success: true, 
        data: versions 
      });
    } catch (error) {
      console.error('Error fetching article versions:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch versions' 
      });
    }
  }
}
