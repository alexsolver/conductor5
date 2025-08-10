// Removed express dependency - using abstract Request/Response types

// Application Services (Use Cases)
import { KnowledgeBaseApplicationService } from '../services/KnowledgeBaseApplicationService';

// Domain interfaces properly imported (Clean Architecture compliance)
import { IKnowledgeBaseRepository } from '../../domain/ports/IKnowledgeBaseRepository';
import { IMediaRepository } from '../../domain/ports/IMediaRepository';

// Use abstracted HTTP types instead of Express directly

interface HttpRequest {
  body: any;
  params: any;
  query: any;
  user?: any;
  headers: any;
}

interface HttpResponse {
  status(code: number): HttpResponse;
  json(data: any): void;
  send(data: any): void;
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
  async createCategory(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error creating knowledge category:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error creating knowledge category:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error creating knowledge category:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error creating knowledge category:', 'User not associated with a tenant'); }
        };
      }

      const createdCategory = await this.knowledgeBaseService.createCategory(userContext.tenantId, {
        ...request.body,
        createdBy: userContext.id
      });

      return {
        status: () => ({ json: (data: any) => { console.log('Category created successfully:', createdCategory); }, send: (data: any) => { console.log('Category created successfully:', createdCategory); } }),
        json: (data: any) => { console.log('Category created successfully:', createdCategory); },
        send: (data: any) => { console.log('Category created successfully:', createdCategory); }
      };
    } catch (error) {
      console.error('Error creating knowledge category:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error creating knowledge category:', error); }, send: (data: any) => { console.error('Error creating knowledge category:', error); } }),
        json: (data: any) => { console.error('Error creating knowledge category:', error); },
        send: (data: any) => { console.error('Error creating knowledge category:', error); }
      };
    }
  }

  async getCategories(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching knowledge categories:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching knowledge categories:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching knowledge categories:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching knowledge categories:', 'User not associated with a tenant'); }
        };
      }

      const categories = await this.knowledgeBaseService.getCategories(userContext.tenantId, request.query);

      return {
        status: () => ({ json: (data: any) => { console.log('Categories fetched successfully:', categories); }, send: (data: any) => { console.log('Categories fetched successfully:', categories); } }),
        json: (data: any) => { console.log('Categories fetched successfully:', categories); },
        send: (data: any) => { console.log('Categories fetched successfully:', categories); }
      };
    } catch (error) {
      console.error('Error fetching knowledge categories:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching knowledge categories:', error); }, send: (data: any) => { console.error('Error fetching knowledge categories:', error); } }),
        json: (data: any) => { console.error('Error fetching knowledge categories:', error); },
        send: (data: any) => { console.error('Error fetching knowledge categories:', error); }
      };
    }
  }

  async updateCategory(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const { id: categoryId } = request.params;
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error updating knowledge category:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error updating knowledge category:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error updating knowledge category:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error updating knowledge category:', 'User not associated with a tenant'); }
        };
      }

      const category = await this.knowledgeBaseService.updateCategory(userContext.tenantId, categoryId, {
        ...request.body,
        updatedBy: userContext.id
      });

      if (!category) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error updating knowledge category:', 'Category not found'); }, send: (data: any) => { console.error('Error updating knowledge category:', 'Category not found'); } }),
          json: (data: any) => { console.error('Error updating knowledge category:', 'Category not found'); },
          send: (data: any) => { console.error('Error updating knowledge category:', 'Category not found'); }
        };
      }

      return {
        status: () => ({ json: (data: any) => { console.log('Category updated successfully:', category); }, send: (data: any) => { console.log('Category updated successfully:', category); } }),
        json: (data: any) => { console.log('Category updated successfully:', category); },
        send: (data: any) => { console.log('Category updated successfully:', category); }
      };
    } catch (error) {
      console.error('Error updating knowledge category:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error updating knowledge category:', error); }, send: (data: any) => { console.error('Error updating knowledge category:', error); } }),
        json: (data: any) => { console.error('Error updating knowledge category:', error); },
        send: (data: any) => { console.error('Error updating knowledge category:', error); }
      };
    }
  }

  async deleteCategory(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const { id: categoryId } = request.params;
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error deleting knowledge category:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error deleting knowledge category:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error deleting knowledge category:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error deleting knowledge category:', 'User not associated with a tenant'); }
        };
      }

      const category = await this.knowledgeBaseRepository.deleteCategory(userContext.tenantId, categoryId);

      if (!category) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error deleting knowledge category:', 'Category not found'); }, send: (data: any) => { console.error('Error deleting knowledge category:', 'Category not found'); } }),
          json: (data: any) => { console.error('Error deleting knowledge category:', 'Category not found'); },
          send: (data: any) => { console.error('Error deleting knowledge category:', 'Category not found'); }
        };
      }

      return {
        status: () => ({ json: (data: any) => { console.log('Category deleted successfully'); }, send: (data: any) => { console.log('Category deleted successfully'); } }),
        json: (data: any) => { console.log('Category deleted successfully'); },
        send: (data: any) => { console.log('Category deleted successfully'); }
      };
    } catch (error) {
      console.error('Error deleting knowledge category:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error deleting knowledge category:', error); }, send: (data: any) => { console.error('Error deleting knowledge category:', error); } }),
        json: (data: any) => { console.error('Error deleting knowledge category:', error); },
        send: (data: any) => { console.error('Error deleting knowledge category:', error); }
      };
    }
  }

  // Articles
  async createArticle(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error creating knowledge article:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error creating knowledge article:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error creating knowledge article:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error creating knowledge article:', 'User not associated with a tenant'); }
        };
      }

      const createdArticle = await this.knowledgeBaseRepository.createArticle(userContext.tenantId, {
        ...request.body,
        authorId: userContext.id,
        slug: request.body.slug || request.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      });

      return {
        status: () => ({ json: (data: any) => { console.log('Article created successfully:', createdArticle); }, send: (data: any) => { console.log('Article created successfully:', createdArticle); } }),
        json: (data: any) => { console.log('Article created successfully:', createdArticle); },
        send: (data: any) => { console.log('Article created successfully:', createdArticle); }
      };
    } catch (error) {
      console.error('Error creating knowledge article:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error creating knowledge article:', error); }, send: (data: any) => { console.error('Error creating knowledge article:', error); } }),
        json: (data: any) => { console.error('Error creating knowledge article:', error); },
        send: (data: any) => { console.error('Error creating knowledge article:', error); }
      };
    }
  }

  async getArticles(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching knowledge articles:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching knowledge articles:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching knowledge articles:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching knowledge articles:', 'User not associated with a tenant'); }
        };
      }

      const articles = await this.knowledgeBaseRepository.getArticles(userContext.tenantId, request.query);

      return {
        status: () => ({ json: (data: any) => { console.log('Articles fetched successfully:', articles); }, send: (data: any) => { console.log('Articles fetched successfully:', articles); } }),
        json: (data: any) => { console.log('Articles fetched successfully:', articles); },
        send: (data: any) => { console.log('Articles fetched successfully:', articles); }
      };
    } catch (error) {
      console.error('Error fetching knowledge articles:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching knowledge articles:', error); }, send: (data: any) => { console.error('Error fetching knowledge articles:', error); } }),
        json: (data: any) => { console.error('Error fetching knowledge articles:', error); },
        send: (data: any) => { console.error('Error fetching knowledge articles:', error); }
      };
    }
  }

  async getArticleById(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const { id: articleId } = request.params;
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching knowledge article:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching knowledge article:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching knowledge article:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching knowledge article:', 'User not associated with a tenant'); }
        };
      }

      const article = await this.knowledgeBaseRepository.getArticleById(userContext.tenantId, articleId);

      if (!article) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching knowledge article:', 'Article not found'); }, send: (data: any) => { console.error('Error fetching knowledge article:', 'Article not found'); } }),
          json: (data: any) => { console.error('Error fetching knowledge article:', 'Article not found'); },
          send: (data: any) => { console.error('Error fetching knowledge article:', 'Article not found'); }
        };
      }

      return {
        status: () => ({ json: (data: any) => { console.log('Article fetched successfully:', article); }, send: (data: any) => { console.log('Article fetched successfully:', article); } }),
        json: (data: any) => { console.log('Article fetched successfully:', article); },
        send: (data: any) => { console.log('Article fetched successfully:', article); }
      };
    } catch (error) {
      console.error('Error fetching knowledge article:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching knowledge article:', error); }, send: (data: any) => { console.error('Error fetching knowledge article:', error); } }),
        json: (data: any) => { console.error('Error fetching knowledge article:', error); },
        send: (data: any) => { console.error('Error fetching knowledge article:', error); }
      };
    }
  }

  async updateArticle(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const { id: articleId } = request.params;
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error updating knowledge article:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error updating knowledge article:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error updating knowledge article:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error updating knowledge article:', 'User not associated with a tenant'); }
        };
      }

      const article = await this.knowledgeBaseRepository.updateArticle(userContext.tenantId, articleId, {
        ...request.body,
        authorId: userContext.id
      });

      if (!article) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error updating knowledge article:', 'Article not found'); }, send: (data: any) => { console.error('Error updating knowledge article:', 'Article not found'); } }),
          json: (data: any) => { console.error('Error updating knowledge article:', 'Article not found'); },
          send: (data: any) => { console.error('Error updating knowledge article:', 'Article not found'); }
        };
      }

      return {
        status: () => ({ json: (data: any) => { console.log('Article updated successfully:', article); }, send: (data: any) => { console.log('Article updated successfully:', article); } }),
        json: (data: any) => { console.log('Article updated successfully:', article); },
        send: (data: any) => { console.log('Article updated successfully:', article); }
      };
    } catch (error) {
      console.error('Error updating knowledge article:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error updating knowledge article:', error); }, send: (data: any) => { console.error('Error updating knowledge article:', error); } }),
        json: (data: any) => { console.error('Error updating knowledge article:', error); },
        send: (data: any) => { console.error('Error updating knowledge article:', error); }
      };
    }
  }

  async deleteArticle(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const { id: articleId } = request.params;
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error deleting knowledge article:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error deleting knowledge article:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error deleting knowledge article:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error deleting knowledge article:', 'User not associated with a tenant'); }
        };
      }

      const article = await this.knowledgeBaseRepository.deleteArticle(userContext.tenantId, articleId);

      if (!article) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error deleting knowledge article:', 'Article not found'); }, send: (data: any) => { console.error('Error deleting knowledge article:', 'Article not found'); } }),
          json: (data: any) => { console.error('Error deleting knowledge article:', 'Article not found'); },
          send: (data: any) => { console.error('Error deleting knowledge article:', 'Article not found'); }
        };
      }

      return {
        status: () => ({ json: (data: any) => { console.log('Article deleted successfully'); }, send: (data: any) => { console.log('Article deleted successfully'); } }),
        json: (data: any) => { console.log('Article deleted successfully'); },
        send: (data: any) => { console.log('Article deleted successfully'); }
      };
    } catch (error) {
      console.error('Error deleting knowledge article:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error deleting knowledge article:', error); }, send: (data: any) => { console.error('Error deleting knowledge article:', error); } }),
        json: (data: any) => { console.error('Error deleting knowledge article:', error); },
        send: (data: any) => { console.error('Error deleting knowledge article:', error); }
      };
    }
  }

  // Search
  async searchArticles(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error searching knowledge articles:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error searching knowledge articles:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error searching knowledge articles:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error searching knowledge articles:', 'User not associated with a tenant'); }
        };
      }

      const articles = await this.knowledgeBaseRepository.searchArticles(userContext.tenantId, request.query.q, request.query);

      return {
        status: () => ({ json: (data: any) => { console.log('Articles searched successfully:', articles); }, send: (data: any) => { console.log('Articles searched successfully:', articles); } }),
        json: (data: any) => { console.log('Articles searched successfully:', articles); },
        send: (data: any) => { console.log('Articles searched successfully:', articles); }
      };
    } catch (error) {
      console.error('Error searching knowledge articles:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error searching knowledge articles:', error); }, send: (data: any) => { console.error('Error searching knowledge articles:', error); } }),
        json: (data: any) => { console.error('Error searching knowledge articles:', error); },
        send: (data: any) => { console.error('Error searching knowledge articles:', error); }
      };
    }
  }

  // Rating
  async rateArticle(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const { id: articleId } = request.params;
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error rating knowledge article:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error rating knowledge article:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error rating knowledge article:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error rating knowledge article:', 'User not associated with a tenant'); }
        };
      }

      const rating = await this.knowledgeBaseRepository.rateArticle(
        userContext.tenantId,
        articleId,
        userContext.id,
        request.body
      );

      return {
        status: () => ({ json: (data: any) => { console.log('Rating submitted successfully:', rating); }, send: (data: any) => { console.log('Rating submitted successfully:', rating); } }),
        json: (data: any) => { console.log('Rating submitted successfully:', rating); },
        send: (data: any) => { console.log('Rating submitted successfully:', rating); }
      };
    } catch (error) {
      console.error('Error rating knowledge article:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error rating knowledge article:', error); }, send: (data: any) => { console.error('Error rating knowledge article:', error); } }),
        json: (data: any) => { console.error('Error rating knowledge article:', error); },
        send: (data: any) => { console.error('Error rating knowledge article:', error); }
      };
    }
  }

  // Comments
  async createComment(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const { id: articleId } = request.params;
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error creating knowledge comment:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error creating knowledge comment:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error creating knowledge comment:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error creating knowledge comment:', 'User not associated with a tenant'); }
        };
      }

      const createdComment = await this.knowledgeBaseRepository.createComment(userContext.tenantId, {
        ...request.body,
        articleId: articleId,
        authorId: userContext.id
      });

      return {
        status: () => ({ json: (data: any) => { console.log('Comment created successfully:', createdComment); }, send: (data: any) => { console.log('Comment created successfully:', createdComment); } }),
        json: (data: any) => { console.log('Comment created successfully:', createdComment); },
        send: (data: any) => { console.log('Comment created successfully:', createdComment); }
      };
    } catch (error) {
      console.error('Error creating knowledge comment:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error creating knowledge comment:', error); }, send: (data: any) => { console.error('Error creating knowledge comment:', error); } }),
        json: (data: any) => { console.error('Error creating knowledge comment:', error); },
        send: (data: any) => { console.error('Error creating knowledge comment:', error); }
      };
    }
  }

  async getComments(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const { id: articleId } = request.params;
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching knowledge comments:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching knowledge comments:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching knowledge comments:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching knowledge comments:', 'User not associated with a tenant'); }
        };
      }

      const comments = await this.knowledgeBaseRepository.getComments(userContext.tenantId, articleId);

      return {
        status: () => ({ json: (data: any) => { console.log('Comments fetched successfully:', comments); }, send: (data: any) => { console.log('Comments fetched successfully:', comments); } }),
        json: (data: any) => { console.log('Comments fetched successfully:', comments); },
        send: (data: any) => { console.log('Comments fetched successfully:', comments); }
      };
    } catch (error) {
      console.error('Error fetching knowledge comments:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching knowledge comments:', error); }, send: (data: any) => { console.error('Error fetching knowledge comments:', error); } }),
        json: (data: any) => { console.error('Error fetching knowledge comments:', error); },
        send: (data: any) => { console.error('Error fetching knowledge comments:', error); }
      };
    }
  }

  // Tags
  async getTags(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching knowledge tags:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching knowledge tags:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching knowledge tags:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching knowledge tags:', 'User not associated with a tenant'); }
        };
      }

      const tags = await this.knowledgeBaseRepository.getTags(userContext.tenantId);

      return {
        status: () => ({ json: (data: any) => { console.log('Tags fetched successfully:', tags); }, send: (data: any) => { console.log('Tags fetched successfully:', tags); } }),
        json: (data: any) => { console.log('Tags fetched successfully:', tags); },
        send: (data: any) => { console.log('Tags fetched successfully:', tags); }
      };
    } catch (error) {
      console.error('Error fetching knowledge tags:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching knowledge tags:', error); }, send: (data: any) => { console.error('Error fetching knowledge tags:', error); } }),
        json: (data: any) => { console.error('Error fetching knowledge tags:', error); },
        send: (data: any) => { console.error('Error fetching knowledge tags:', error); }
      };
    }
  }

  async createTag(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error creating knowledge tag:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error creating knowledge tag:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error creating knowledge tag:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error creating knowledge tag:', 'User not associated with a tenant'); }
        };
      }

      const createdTag = await this.knowledgeBaseRepository.createTag(userContext.tenantId, {
        ...request.body,
        slug: request.body.slug || request.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      });

      return {
        status: () => ({ json: (data: any) => { console.log('Tag created successfully:', createdTag); }, send: (data: any) => { console.log('Tag created successfully:', createdTag); } }),
        json: (data: any) => { console.log('Tag created successfully:', createdTag); },
        send: (data: any) => { console.log('Tag created successfully:', createdTag); }
      };
    } catch (error) {
      console.error('Error creating knowledge tag:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error creating knowledge tag:', error); }, send: (data: any) => { console.error('Error creating knowledge tag:', error); } }),
        json: (data: any) => { console.error('Error creating knowledge tag:', error); },
        send: (data: any) => { console.error('Error creating knowledge tag:', error); }
      };
    }
  }

  // Analytics
  async getAnalytics(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching knowledge analytics:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching knowledge analytics:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching knowledge analytics:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching knowledge analytics:', 'User not associated with a tenant'); }
        };
      }

      const analytics = await this.knowledgeBaseRepository.getAnalytics(userContext.tenantId);

      return {
        status: () => ({ json: (data: any) => { console.log('Analytics fetched successfully:', analytics); }, send: (data: any) => { console.log('Analytics fetched successfully:', analytics); } }),
        json: (data: any) => { console.log('Analytics fetched successfully:', analytics); },
        send: (data: any) => { console.log('Analytics fetched successfully:', analytics); }
      };
    } catch (error) {
      console.error('Error fetching knowledge analytics:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching knowledge analytics:', error); }, send: (data: any) => { console.error('Error fetching knowledge analytics:', error); } }),
        json: (data: any) => { console.error('Error fetching knowledge analytics:', error); },
        send: (data: any) => { console.error('Error fetching knowledge analytics:', error); }
      };
    }
  }

  async getAdvancedAnalytics(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching advanced analytics:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching advanced analytics:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching advanced analytics:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching advanced analytics:', 'User not associated with a tenant'); }
        };
      }

      const analytics = await this.knowledgeBaseRepository.getAdvancedAnalytics(userContext.tenantId);

      return {
        status: () => ({ json: (data: any) => { console.log('Advanced analytics fetched successfully:', analytics); }, send: (data: any) => { console.log('Advanced analytics fetched successfully:', analytics); } }),
        json: (data: any) => { console.log('Advanced analytics fetched successfully:', analytics); },
        send: (data: any) => { console.log('Advanced analytics fetched successfully:', analytics); }
      };
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching advanced analytics:', error); }, send: (data: any) => { console.error('Error fetching advanced analytics:', error); } }),
        json: (data: any) => { console.error('Error fetching advanced analytics:', error); },
        send: (data: any) => { console.error('Error fetching advanced analytics:', error); }
      };
    }
  }

  async getPopularArticles(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const limit = parseInt(request.query.limit || '5'); // Default to 5 if not provided
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching popular articles:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching popular articles:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching popular articles:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching popular articles:', 'User not associated with a tenant'); }
        };
      }

      const articles = await this.knowledgeBaseRepository.getPopularArticles(userContext.tenantId, limit);

      return {
        status: () => ({ json: (data: any) => { console.log('Popular articles fetched successfully:', articles); }, send: (data: any) => { console.log('Popular articles fetched successfully:', articles); } }),
        json: (data: any) => { console.log('Popular articles fetched successfully:', articles); },
        send: (data: any) => { console.log('Popular articles fetched successfully:', articles); }
      };
    } catch (error) {
      console.error('Error fetching popular articles:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching popular articles:', error); }, send: (data: any) => { console.error('Error fetching popular articles:', error); } }),
        json: (data: any) => { console.error('Error fetching popular articles:', error); },
        send: (data: any) => { console.error('Error fetching popular articles:', error); }
      };
    }
  }

  async getRecentArticles(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const limit = parseInt(request.query.limit || '5'); // Default to 5 if not provided
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching recent articles:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching recent articles:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching recent articles:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching recent articles:', 'User not associated with a tenant'); }
        };
      }

      const articles = await this.knowledgeBaseRepository.getRecentArticles(userContext.tenantId, limit);

      return {
        status: () => ({ json: (data: any) => { console.log('Recent articles fetched successfully:', articles); }, send: (data: any) => { console.log('Recent articles fetched successfully:', articles); } }),
        json: (data: any) => { console.log('Recent articles fetched successfully:', articles); },
        send: (data: any) => { console.log('Recent articles fetched successfully:', articles); }
      };
    } catch (error) {
      console.error('Error fetching recent articles:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching recent articles:', error); }, send: (data: any) => { console.error('Error fetching recent articles:', error); } }),
        json: (data: any) => { console.error('Error fetching recent articles:', error); },
        send: (data: any) => { console.error('Error fetching recent articles:', error); }
      };
    }
  }

  // Search Analytics
  async getSearchAnalytics(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching search analytics:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching search analytics:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching search analytics:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching search analytics:', 'User not associated with a tenant'); }
        };
      }

      const analytics = await this.knowledgeBaseRepository.getSearchAnalytics(userContext.tenantId);

      return {
        status: () => ({ json: (data: any) => { console.log('Search analytics fetched successfully:', analytics); }, send: (data: any) => { console.log('Search analytics fetched successfully:', analytics); } }),
        json: (data: any) => { console.log('Search analytics fetched successfully:', analytics); },
        send: (data: any) => { console.log('Search analytics fetched successfully:', analytics); }
      };
    } catch (error) {
      console.error('Error fetching search analytics:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching search analytics:', error); }, send: (data: any) => { console.error('Error fetching search analytics:', error); } }),
        json: (data: any) => { console.error('Error fetching search analytics:', error); },
        send: (data: any) => { console.error('Error fetching search analytics:', error); }
      };
    }
  }

  // User Engagement
  async getUserEngagement(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching user engagement:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching user engagement:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching user engagement:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching user engagement:', 'User not associated with a tenant'); }
        };
      }

      const engagement = await this.knowledgeBaseRepository.getUserEngagement(userContext.tenantId);

      return {
        status: () => ({ json: (data: any) => { console.log('User engagement fetched successfully:', engagement); }, send: (data: any) => { console.log('User engagement fetched successfully:', engagement); } }),
        json: (data: any) => { console.log('User engagement fetched successfully:', engagement); },
        send: (data: any) => { console.log('User engagement fetched successfully:', engagement); }
      };
    } catch (error) {
      console.error('Error fetching user engagement:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching user engagement:', error); }, send: (data: any) => { console.error('Error fetching user engagement:', error); } }),
        json: (data: any) => { console.error('Error fetching user engagement:', error); },
        send: (data: any) => { console.error('Error fetching user engagement:', error); }
      };
    }
  }

  // Media Management
  async getMediaLibrary(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching media library:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching media library:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching media library:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching media library:', 'User not associated with a tenant'); }
        };
      }

      const media = await this.knowledgeBaseRepository.getMediaLibrary(userContext.tenantId);

      return {
        status: () => ({ json: (data: any) => { console.log('Media library fetched successfully:', media); }, send: (data: any) => { console.log('Media library fetched successfully:', media); } }),
        json: (data: any) => { console.log('Media library fetched successfully:', media); },
        send: (data: any) => { console.log('Media library fetched successfully:', media); }
      };
    } catch (error) {
      console.error('Error fetching media library:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching media library:', error); }, send: (data: any) => { console.error('Error fetching media library:', error); } }),
        json: (data: any) => { console.error('Error fetching media library:', error); },
        send: (data: any) => { console.error('Error fetching media library:', error); }
      };
    }
  }

  async uploadMedia(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error uploading media:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error uploading media:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error uploading media:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error uploading media:', 'User not associated with a tenant'); }
        };
      }

      const uploadedMedia = await this.knowledgeBaseRepository.uploadMedia(userContext.tenantId, {
        ...request.body,
        uploadedBy: userContext.id
      });

      return {
        status: () => ({ json: (data: any) => { console.log('Media uploaded successfully:', uploadedMedia); }, send: (data: any) => { console.log('Media uploaded successfully:', uploadedMedia); } }),
        json: (data: any) => { console.log('Media uploaded successfully:', uploadedMedia); },
        send: (data: any) => { console.log('Media uploaded successfully:', uploadedMedia); }
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error uploading media:', error); }, send: (data: any) => { console.error('Error uploading media:', error); } }),
        json: (data: any) => { console.error('Error uploading media:', error); },
        send: (data: any) => { console.error('Error uploading media:', error); }
      };
    }
  }

  // Article Templates
  async getArticleTemplates(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching article templates:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching article templates:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching article templates:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching article templates:', 'User not associated with a tenant'); }
        };
      }

      const templates = await this.knowledgeBaseRepository.getArticleTemplates(userContext.tenantId);

      return {
        status: () => ({ json: (data: any) => { console.log('Article templates fetched successfully:', templates); }, send: (data: any) => { console.log('Article templates fetched successfully:', templates); } }),
        json: (data: any) => { console.log('Article templates fetched successfully:', templates); },
        send: (data: any) => { console.log('Article templates fetched successfully:', templates); }
      };
    } catch (error) {
      console.error('Error fetching article templates:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching article templates:', error); }, send: (data: any) => { console.error('Error fetching article templates:', error); } }),
        json: (data: any) => { console.error('Error fetching article templates:', error); },
        send: (data: any) => { console.error('Error fetching article templates:', error); }
      };
    }
  }

  async createArticleTemplate(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error creating article template:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error creating article template:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error creating article template:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error creating article template:', 'User not associated with a tenant'); }
        };
      }

      const createdTemplate = await this.knowledgeBaseRepository.createArticleTemplate(userContext.tenantId, {
        ...request.body,
        createdBy: userContext.id
      });

      return {
        status: () => ({ json: (data: any) => { console.log('Template created successfully:', createdTemplate); }, send: (data: any) => { console.log('Template created successfully:', createdTemplate); } }),
        json: (data: any) => { console.log('Template created successfully:', createdTemplate); },
        send: (data: any) => { console.log('Template created successfully:', createdTemplate); }
      };
    } catch (error) {
      console.error('Error creating article template:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error creating article template:', error); }, send: (data: any) => { console.error('Error creating article template:', error); } }),
        json: (data: any) => { console.error('Error creating article template:', error); },
        send: (data: any) => { console.error('Error creating article template:', error); }
      };
    }
  }

  // Article Cloning
  async cloneArticle(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const { id: articleId } = request.params;
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error cloning article:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error cloning article:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error cloning article:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error cloning article:', 'User not associated with a tenant'); }
        };
      }

      const clonedArticle = await this.knowledgeBaseRepository.cloneArticle(userContext.tenantId, articleId, {
        ...request.body,
        authorId: userContext.id
      });

      return {
        status: () => ({ json: (data: any) => { console.log('Article cloned successfully:', clonedArticle); }, send: (data: any) => { console.log('Article cloned successfully:', clonedArticle); } }),
        json: (data: any) => { console.log('Article cloned successfully:', clonedArticle); },
        send: (data: any) => { console.log('Article cloned successfully:', clonedArticle); }
      };
    } catch (error) {
      console.error('Error cloning article:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error cloning article:', error); }, send: (data: any) => { console.error('Error cloning article:', error); } }),
        json: (data: any) => { console.error('Error cloning article:', error); },
        send: (data: any) => { console.error('Error cloning article:', error); }
      };
    }
  }

  // Ticket Integration
  async linkArticleToTicket(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const { id: articleId } = request.params;
      const { ticketId } = request.body;

      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error linking article to ticket:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error linking article to ticket:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error linking article to ticket:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error linking article to ticket:', 'User not associated with a tenant'); }
        };
      }
      if (!ticketId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error linking article to ticket:', 'Ticket ID is required'); }, send: (data: any) => { console.error('Error linking article to ticket:', 'Ticket ID is required'); } }),
          json: (data: any) => { console.error('Error linking article to ticket:', 'Ticket ID is required'); },
          send: (data: any) => { console.error('Error linking article to ticket:', 'Ticket ID is required'); }
        };
      }


      const link = await this.knowledgeBaseRepository.linkArticleToTicket(userContext.tenantId, articleId, ticketId);

      return {
        status: () => ({ json: (data: any) => { console.log('Article linked to ticket successfully:', link); }, send: (data: any) => { console.log('Article linked to ticket successfully:', link); } }),
        json: (data: any) => { console.log('Article linked to ticket successfully:', link); },
        send: (data: any) => { console.log('Article linked to ticket successfully:', link); }
      };
    } catch (error) {
      console.error('Error linking article to ticket:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error linking article to ticket:', error); }, send: (data: any) => { console.error('Error linking article to ticket:', error); } }),
        json: (data: any) => { console.error('Error linking article to ticket:', error); },
        send: (data: any) => { console.error('Error linking article to ticket:', error); }
      };
    }
  }

  async getArticlesByTicket(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const { ticketId } = request.params;
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching articles by ticket:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching articles by ticket:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching articles by ticket:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching articles by ticket:', 'User not associated with a tenant'); }
        };
      }
      if (!ticketId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching articles by ticket:', 'Ticket ID is required'); }, send: (data: any) => { console.error('Error fetching articles by ticket:', 'Ticket ID is required'); } }),
          json: (data: any) => { console.error('Error fetching articles by ticket:', 'Ticket ID is required'); },
          send: (data: any) => { console.error('Error fetching articles by ticket:', 'Ticket ID is required'); }
        };
      }


      const articles = await this.knowledgeBaseRepository.getArticlesByTicket(userContext.tenantId, ticketId);

      return {
        status: () => ({ json: (data: any) => { console.log('Articles by ticket fetched successfully:', articles); }, send: (data: any) => { console.log('Articles by ticket fetched successfully:', articles); } }),
        json: (data: any) => { console.log('Articles by ticket fetched successfully:', articles); },
        send: (data: any) => { console.log('Articles by ticket fetched successfully:', articles); }
      };
    } catch (error) {
      console.error('Error fetching articles by ticket:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching articles by ticket:', error); }, send: (data: any) => { console.error('Error fetching articles by ticket:', error); } }),
        json: (data: any) => { console.error('Error fetching articles by ticket:', error); },
        send: (data: any) => { console.error('Error fetching articles by ticket:', error); }
      };
    }
  }

  // Favorites
  async toggleFavorite(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const { id: articleId } = request.params;
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error toggling favorite:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error toggling favorite:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error toggling favorite:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error toggling favorite:', 'User not associated with a tenant'); }
        };
      }

      const favorite = await this.knowledgeBaseRepository.toggleFavorite(userContext.tenantId, articleId, userContext.id);

      return {
        status: () => ({ json: (data: any) => { console.log('Favorite toggled successfully:', favorite); }, send: (data: any) => { console.log('Favorite toggled successfully:', favorite); } }),
        json: (data: any) => { console.log('Favorite toggled successfully:', favorite); },
        send: (data: any) => { console.log('Favorite toggled successfully:', favorite); }
      };
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error toggling favorite:', error); }, send: (data: any) => { console.error('Error toggling favorite:', error); } }),
        json: (data: any) => { console.error('Error toggling favorite:', error); },
        send: (data: any) => { console.error('Error toggling favorite:', error); }
      };
    }
  }

  async getFavoriteArticles(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching favorite articles:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching favorite articles:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching favorite articles:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching favorite articles:', 'User not associated with a tenant'); }
        };
      }

      const articles = await this.knowledgeBaseRepository.getFavoriteArticles(userContext.tenantId, userContext.id);

      return {
        status: () => ({ json: (data: any) => { console.log('Favorite articles fetched successfully:', articles); }, send: (data: any) => { console.log('Favorite articles fetched successfully:', articles); } }),
        json: (data: any) => { console.log('Favorite articles fetched successfully:', articles); },
        send: (data: any) => { console.log('Favorite articles fetched successfully:', articles); }
      };
    } catch (error) {
      console.error('Error fetching favorite articles:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching favorite articles:', error); }, send: (data: any) => { console.error('Error fetching favorite articles:', error); } }),
        json: (data: any) => { console.error('Error fetching favorite articles:', error); },
        send: (data: any) => { console.error('Error fetching favorite articles:', error); }
      };
    }
  }

  // Versions
  async getArticleVersions(request: HttpRequest, userContext: any): Promise<HttpResponse> {
    try {
      const { id: articleId } = request.params;
      if (!userContext?.tenantId) {
        return {
          status: () => ({ json: (data: any) => { console.error('Error fetching article versions:', 'User not associated with a tenant'); }, send: (data: any) => { console.error('Error fetching article versions:', 'User not associated with a tenant'); } }),
          json: (data: any) => { console.error('Error fetching article versions:', 'User not associated with a tenant'); },
          send: (data: any) => { console.error('Error fetching article versions:', 'User not associated with a tenant'); }
        };
      }

      const versions = await this.knowledgeBaseRepository.getArticleVersions(userContext.tenantId, articleId);

      return {
        status: () => ({ json: (data: any) => { console.log('Article versions fetched successfully:', versions); }, send: (data: any) => { console.log('Article versions fetched successfully:', versions); } }),
        json: (data: any) => { console.log('Article versions fetched successfully:', versions); },
        send: (data: any) => { console.log('Article versions fetched successfully:', versions); }
      };
    } catch (error) {
      console.error('Error fetching article versions:', error);
      // Return an error response
      return {
        status: () => ({ json: (data: any) => { console.error('Error fetching article versions:', error); }, send: (data: any) => { console.error('Error fetching article versions:', error); } }),
        json: (data: any) => { console.error('Error fetching article versions:', error); },
        send: (data: any) => { console.error('Error fetching article versions:', error); }
      };
    }
  }

  // Entry methods for backward compatibility are removed as they were tied to express Request/Response.
  // New methods accept DTOs and user context.
}