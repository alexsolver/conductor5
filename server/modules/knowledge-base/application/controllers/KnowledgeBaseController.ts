import { z } from 'zod';

// Application Services (Use Cases)
import { KnowledgeBaseApplicationService } from '../services/KnowledgeBaseApplicationService';

// Domain interfaces properly imported (Clean Architecture compliance)
import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';
import { IMediaRepository } from '../../domain/ports/IMediaRepository';

// Use abstracted HTTP types instead of Express directly
interface IRequest {
  user?: any;
  params: any;
  body: any;
  query: any;
  files?: any;
}

interface IResponse {
  status(code: number): IResponse;
  json(data: any): void;
}

// Inject repository through dependency injection instead of direct import

export class KnowledgeBaseController {
  private knowledgeBaseService: KnowledgeBaseApplicationService;
  private knowledgeBaseRepository: IKnowledgeBaseRepository; // Assuming this is injected or initialized
  private mediaRepository: IMediaRepository; // Assuming this is injected or initialized


  constructor(
    knowledgeBaseService?: KnowledgeBaseApplicationService,
    knowledgeBaseRepository?: IKnowledgeBaseRepository,
    mediaRepository?: IMediaRepository
  ) {
    this.knowledgeBaseService = knowledgeBaseService || new KnowledgeBaseApplicationService();
    // Initialize repositories. In a real scenario, these would likely be injected.
    // For now, assuming a placeholder initialization or that they are available.
    this.knowledgeBaseRepository = knowledgeBaseRepository || {
      createCategory: async () => ({}),
      getCategories: async () => [],
      updateCategory: async () => ({}),
      deleteCategory: async () => ({}),
      createArticle: async () => ({}),
      getArticles: async () => [],
      getArticleById: async () => ({}),
      updateArticle: async () => ({}),
      deleteArticle: async () => ({}),
      searchArticles: async () => [],
      rateArticle: async () => ({}),
      createComment: async () => ({}),
      getComments: async () => [],
      getTags: async () => [],
      createTag: async () => ({}),
      getAnalytics: async () => ({}),
      getAdvancedAnalytics: async () => ({}),
      getPopularArticles: async () => [],
      getRecentArticles: async () => [],
      getSearchAnalytics: async () => ({}),
      getUserEngagement: async () => ({}),
      getMediaLibrary: async () => [],
      uploadMedia: async () => ({}),
      getArticleTemplates: async () => [],
      createArticleTemplate: async () => ({}),
      cloneArticle: async () => ({}),
      linkArticleToTicket: async () => ({}),
      getArticlesByTicket: async () => [],
      toggleFavorite: async () => ({}),
      getFavoriteArticles: async () => [],
      getArticleVersions: async () => [],
    };
    this.mediaRepository = mediaRepository || {
      upload: async () => ({}),
      get: async () => [],
      delete: async () => ({}),
    };
  }


  // Categories
  async createCategory(categoryData: any, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const createdCategory = await this.knowledgeBaseService.createCategory(userContext.tenantId, {
        ...categoryData,
        createdBy: userContext.id
      });

      return {
        success: true,
        data: createdCategory,
        message: 'Category created successfully'
      };
    } catch (error) {
      console.error('Error creating knowledge category:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  async getCategories(filters: any, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const categories = await this.knowledgeBaseService.getCategories(userContext.tenantId, filters);

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      console.error('Error fetching knowledge categories:', error);
      throw error;
    }
  }

  async updateCategory(categoryId: string, updateData: any, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const category = await this.knowledgeBaseService.updateCategory(userContext.tenantId, categoryId, updateData);

      if (!category) {
        throw new Error('Category not found');
      }

      return {
        success: true,
        data: category,
        message: 'Category updated successfully'
      };
    } catch (error) {
      console.error('Error updating knowledge category:', error);
      throw error;
    }
  }

  async deleteCategory(categoryId: string, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const category = await this.knowledgeBaseRepository.deleteCategory(userContext.tenantId, categoryId);

      if (!category) {
        throw new Error('Category not found');
      }

      return {
        success: true,
        message: 'Category deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting knowledge category:', error);
      throw error;
    }
  }

  // Articles
  async createArticle(articleData: any, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const createdArticle = await this.knowledgeBaseRepository.createArticle(userContext.tenantId, {
        ...articleData,
        authorId: userContext.id,
        slug: articleData.slug || articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      });

      return {
        success: true,
        data: createdArticle,
        message: 'Article created successfully'
      };
    } catch (error) {
      console.error('Error creating knowledge article:', error);
      throw error;
    }
  }

  async getArticles(filters: any, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const articles = await this.knowledgeBaseRepository.getArticles(userContext.tenantId, filters);

      return {
        success: true,
        data: articles,
        pagination: {
          total: articles.length,
          limit: parseInt(filters.limit || '50'),
          offset: parseInt(filters.offset || '0'),
          hasMore: articles.length >= parseInt(filters.limit || '50')
        }
      };
    } catch (error) {
      console.error('Error fetching knowledge articles:', error);
      throw error;
    }
  }

  async getArticleById(articleId: string, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const article = await this.knowledgeBaseRepository.getArticleById(userContext.tenantId, articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      return {
        success: true,
        data: article
      };
    } catch (error) {
      console.error('Error fetching knowledge article:', error);
      throw error;
    }
  }

  async updateArticle(articleId: string, updateData: any, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const article = await this.knowledgeBaseRepository.updateArticle(userContext.tenantId, articleId, {
        ...updateData,
        authorId: userContext.id
      });

      if (!article) {
        throw new Error('Article not found');
      }

      return {
        success: true,
        data: article,
        message: 'Article updated successfully'
      };
    } catch (error) {
      console.error('Error updating knowledge article:', error);
      throw error;
    }
  }

  async deleteArticle(articleId: string, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const article = await this.knowledgeBaseRepository.deleteArticle(userContext.tenantId, articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      return {
        success: true,
        message: 'Article deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting knowledge article:', error);
      throw error;
    }
  }

  // Search
  async searchArticles(query: string, filters: any, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const articles = await this.knowledgeBaseRepository.searchArticles(userContext.tenantId, query, filters);

      return {
        success: true,
        data: articles,
        query: query
      };
    } catch (error) {
      console.error('Error searching knowledge articles:', error);
      throw error;
    }
  }

  // Rating
  async rateArticle(articleId: string, ratingData: any, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const rating = await this.knowledgeBaseRepository.rateArticle(
        userContext.tenantId,
        articleId,
        userContext.id,
        ratingData
      );

      return {
        success: true,
        data: rating,
        message: 'Rating submitted successfully'
      };
    } catch (error) {
      console.error('Error rating knowledge article:', error);
      throw error;
    }
  }

  // Comments
  async createComment(commentData: any, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const createdComment = await this.knowledgeBaseRepository.createComment(userContext.tenantId, {
        ...commentData,
        authorId: userContext.id
      });

      return {
        success: true,
        data: createdComment,
        message: 'Comment created successfully'
      };
    } catch (error) {
      console.error('Error creating knowledge comment:', error);
      throw error;
    }
  }

  async getComments(articleId: string, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const comments = await this.knowledgeBaseRepository.getComments(userContext.tenantId, articleId);

      return {
        success: true,
        data: comments
      };
    } catch (error) {
      console.error('Error fetching knowledge comments:', error);
      throw error;
    }
  }

  // Tags
  async getTags(userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const tags = await this.knowledgeBaseRepository.getTags(userContext.tenantId);

      return {
        success: true,
        data: tags
      };
    } catch (error) {
      console.error('Error fetching knowledge tags:', error);
      throw error;
    }
  }

  async createTag(tagData: any, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const createdTag = await this.knowledgeBaseRepository.createTag(userContext.tenantId, {
        ...tagData,
        slug: tagData.slug || tagData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      });

      return {
        success: true,
        data: createdTag,
        message: 'Tag created successfully'
      };
    } catch (error) {
      console.error('Error creating knowledge tag:', error);
      throw error;
    }
  }

  // Analytics
  async getAnalytics(userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const analytics = await this.knowledgeBaseRepository.getAnalytics(userContext.tenantId);

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      console.error('Error fetching knowledge analytics:', error);
      throw error;
    }
  }

  async getAdvancedAnalytics(userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const analytics = await this.knowledgeBaseRepository.getAdvancedAnalytics(userContext.tenantId);

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
      throw error;
    }
  }

  async getPopularArticles(limit: number, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const articles = await this.knowledgeBaseRepository.getPopularArticles(userContext.tenantId, limit);

      return {
        success: true,
        data: articles
      };
    } catch (error) {
      console.error('Error fetching popular articles:', error);
      throw error;
    }
  }

  async getRecentArticles(limit: number, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const articles = await this.knowledgeBaseRepository.getRecentArticles(userContext.tenantId, limit);

      return {
        success: true,
        data: articles
      };
    } catch (error) {
      console.error('Error fetching recent articles:', error);
      throw error;
    }
  }

  // Search Analytics
  async getSearchAnalytics(userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const analytics = await this.knowledgeBaseRepository.getSearchAnalytics(userContext.tenantId);

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      console.error('Error fetching search analytics:', error);
      throw error;
    }
  }

  // User Engagement
  async getUserEngagement(userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const engagement = await this.knowledgeBaseRepository.getUserEngagement(userContext.tenantId);

      return {
        success: true,
        data: engagement
      };
    } catch (error) {
      console.error('Error fetching user engagement:', error);
      throw error;
    }
  }

  // Media Management
  async getMediaLibrary(userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const media = await this.knowledgeBaseRepository.getMediaLibrary(userContext.tenantId);

      return {
        success: true,
        data: media
      };
    } catch (error) {
      console.error('Error fetching media library:', error);
      throw error;
    }
  }

  async uploadMedia(mediaData: any, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const uploadedMedia = await this.knowledgeBaseRepository.uploadMedia(userContext.tenantId, {
        ...mediaData,
        uploadedBy: userContext.id
      });

      return {
        success: true,
        data: uploadedMedia,
        message: 'Media uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  // Article Templates
  async getArticleTemplates(userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const templates = await this.knowledgeBaseRepository.getArticleTemplates(userContext.tenantId);

      return {
        success: true,
        data: templates
      };
    } catch (error) {
      console.error('Error fetching article templates:', error);
      throw error;
    }
  }

  async createArticleTemplate(templateData: any, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const createdTemplate = await this.knowledgeBaseRepository.createArticleTemplate(userContext.tenantId, {
        ...templateData,
        createdBy: userContext.id
      });

      return {
        success: true,
        data: createdTemplate,
        message: 'Template created successfully'
      };
    } catch (error) {
      console.error('Error creating article template:', error);
      throw error;
    }
  }

  // Article Cloning
  async cloneArticle(articleId: string, cloneData: any, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const clonedArticle = await this.knowledgeBaseRepository.cloneArticle(userContext.tenantId, articleId, {
        ...cloneData,
        authorId: userContext.id
      });

      return {
        success: true,
        data: clonedArticle,
        message: 'Article cloned successfully'
      };
    } catch (error) {
      console.error('Error cloning article:', error);
      throw error;
    }
  }

  // Ticket Integration
  async linkArticleToTicket(articleId: string, ticketId: string, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const link = await this.knowledgeBaseRepository.linkArticleToTicket(userContext.tenantId, articleId, ticketId);

      return {
        success: true,
        data: link,
        message: 'Article linked to ticket successfully'
      };
    } catch (error) {
      console.error('Error linking article to ticket:', error);
      throw error;
    }
  }

  async getArticlesByTicket(ticketId: string, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const articles = await this.knowledgeBaseRepository.getArticlesByTicket(userContext.tenantId, ticketId);

      return {
        success: true,
        data: articles
      };
    } catch (error) {
      console.error('Error fetching articles by ticket:', error);
      throw error;
    }
  }

  // Favorites
  async toggleFavorite(articleId: string, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const favorite = await this.knowledgeBaseRepository.toggleFavorite(userContext.tenantId, articleId, userContext.id);

      return {
        success: true,
        data: favorite,
        message: favorite ? 'Article added to favorites' : 'Article removed from favorites'
      };
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  async getFavoriteArticles(userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const articles = await this.knowledgeBaseRepository.getFavoriteArticles(userContext.tenantId, userContext.id);

      return {
        success: true,
        data: articles
      };
    } catch (error) {
      console.error('Error fetching favorite articles:', error);
      throw error;
    }
  }

  // Versions
  async getArticleVersions(articleId: string, userContext: any): Promise<any> {
    try {
      if (!userContext?.tenantId) {
        throw new Error("User not associated with a tenant");
      }

      const versions = await this.knowledgeBaseRepository.getArticleVersions(userContext.tenantId, articleId);

      return {
        success: true,
        data: versions
      };
    } catch (error) {
      console.error('Error fetching article versions:', error);
      throw error;
    }
  }

  // Entry methods for backward compatibility are removed as they were tied to express Request/Response.
  // New methods accept DTOs and user context.
}