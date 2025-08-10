import { Request, Response } from 'express';
import { KnowledgeBaseApplicationService } from '../services/KnowledgeBaseApplicationService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

class KnowledgeBaseController {
  private knowledgeBaseService: KnowledgeBaseApplicationService;
  private knowledgeBaseRepository: any; // Temporary fix - will be properly injected

  constructor(knowledgeBaseService: KnowledgeBaseApplicationService) {
    this.knowledgeBaseService = knowledgeBaseService;
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

      const category = await this.knowledgeBaseService.createCategory(req.user.tenantId, categoryData);

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

      const categories = await this.knowledgeBaseService.getCategories(req.user.tenantId, filters);

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

  async getAdvancedAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const analytics = await this.knowledgeBaseRepository.getAdvancedAnalytics(req.user.tenantId);

      res.json({ 
        success: true, 
        data: analytics 
      });
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch advanced analytics' 
      });
    }
  }

  async getPopularArticles(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const limit = req.query.limit as string || '10';
      const articles = await this.knowledgeBaseRepository.getPopularArticles(req.user.tenantId, parseInt(limit));

      res.json({ 
        success: true, 
        data: articles 
      });
    } catch (error) {
      console.error('Error fetching popular articles:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch popular articles' 
      });
    }
  }

  async getRecentArticles(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const limit = req.query.limit as string || '10';
      const articles = await this.knowledgeBaseRepository.getRecentArticles(req.user.tenantId, parseInt(limit));

      res.json({ 
        success: true, 
        data: articles 
      });
    } catch (error) {
      console.error('Error fetching recent articles:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch recent articles' 
      });
    }
  }

  // Search Analytics
  async getSearchAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const analytics = await this.knowledgeBaseRepository.getSearchAnalytics(req.user.tenantId);

      res.json({ 
        success: true, 
        data: analytics 
      });
    } catch (error) {
      console.error('Error fetching search analytics:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch search analytics' 
      });
    }
  }

  // User Engagement
  async getUserEngagement(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const engagement = await this.knowledgeBaseRepository.getUserEngagement(req.user.tenantId);

      res.json({ 
        success: true, 
        data: engagement 
      });
    } catch (error) {
      console.error('Error fetching user engagement:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch user engagement' 
      });
    }
  }

  // Media Management
  async getMediaLibrary(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const media = await this.knowledgeBaseRepository.getMediaLibrary(req.user.tenantId);

      res.json({ 
        success: true, 
        data: media 
      });
    } catch (error) {
      console.error('Error fetching media library:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch media library' 
      });
    }
  }

  async uploadMedia(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const mediaData = {
        ...req.body,
        uploadedBy: req.user.id
      };

      const media = await this.knowledgeBaseRepository.uploadMedia(req.user.tenantId, mediaData);

      res.status(201).json({ 
        success: true, 
        data: media,
        message: 'Media uploaded successfully' 
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload media' 
      });
    }
  }

  // Article Templates
  async getArticleTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const templates = await this.knowledgeBaseRepository.getArticleTemplates(req.user.tenantId);

      res.json({ 
        success: true, 
        data: templates 
      });
    } catch (error) {
      console.error('Error fetching article templates:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch article templates' 
      });
    }
  }

  async createArticleTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const templateData = {
        ...req.body,
        createdBy: req.user.id
      };

      const template = await this.knowledgeBaseRepository.createArticleTemplate(req.user.tenantId, templateData);

      res.status(201).json({ 
        success: true, 
        data: template,
        message: 'Template created successfully' 
      });
    } catch (error) {
      console.error('Error creating article template:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create template' 
      });
    }
  }

  // Article Cloning
  async cloneArticle(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const { articleId } = req.params;
      const cloneData = {
        ...req.body,
        authorId: req.user.id
      };

      const clonedArticle = await this.knowledgeBaseRepository.cloneArticle(req.user.tenantId, articleId, cloneData);

      res.status(201).json({ 
        success: true, 
        data: clonedArticle,
        message: 'Article cloned successfully' 
      });
    } catch (error) {
      console.error('Error cloning article:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to clone article' 
      });
    }
  }

  // Ticket Integration
  async linkArticleToTicket(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const { articleId } = req.params;
      const { ticketId } = req.body;

      const link = await this.knowledgeBaseRepository.linkArticleToTicket(req.user.tenantId, articleId, ticketId);

      res.json({ 
        success: true, 
        data: link,
        message: 'Article linked to ticket successfully' 
      });
    } catch (error) {
      console.error('Error linking article to ticket:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to link article to ticket' 
      });
    }
  }

  async getArticlesByTicket(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const { ticketId } = req.params;
      const articles = await this.knowledgeBaseRepository.getArticlesByTicket(req.user.tenantId, ticketId);

      res.json({ 
        success: true, 
        data: articles 
      });
    } catch (error) {
      console.error('Error fetching articles by ticket:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch articles by ticket' 
      });
    }
  }

  // Favorites
  async toggleFavorite(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const { articleId } = req.params;
      const favorite = await this.knowledgeBaseRepository.toggleFavorite(req.user.tenantId, articleId, req.user.id);

      res.json({ 
        success: true, 
        data: favorite,
        message: favorite ? 'Article added to favorites' : 'Article removed from favorites'
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to toggle favorite' 
      });
    }
  }

  async getFavoriteArticles(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ success: false, message: "User not associated with a tenant" });
      }

      const articles = await this.knowledgeBaseRepository.getFavoriteArticles(req.user.tenantId, req.user.id);

      res.json({ 
        success: true, 
        data: articles 
      });
    } catch (error) {
      console.error('Error fetching favorite articles:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch favorite articles' 
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