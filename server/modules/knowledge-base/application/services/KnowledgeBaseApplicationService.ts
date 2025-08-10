import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';
import { IMediaRepository } from '../../domain/ports/IMediaRepository';

export class KnowledgeBaseApplicationService {
  constructor(
    private knowledgeBaseRepository: IKnowledgeBaseRepository,
    private mediaRepository: IMediaRepository // Added IMediaRepository
  ) {}

  async createCategory(tenantId: string, categoryData: any) {
    return this.knowledgeBaseRepository.createCategory(tenantId, categoryData);
  }

  async getCategories(tenantId: string, filters: any) {
    return this.knowledgeBaseRepository.getCategories(tenantId, filters);
  }

  async updateCategory(tenantId: string, categoryId: string, data: any) {
    return this.knowledgeBaseRepository.updateCategory(tenantId, categoryId, data);
  }

  async deleteCategory(tenantId: string, categoryId: string) {
    return this.knowledgeBaseRepository.deleteCategory(tenantId, categoryId);
  }

  async createArticle(tenantId: string, articleData: any) {
    return this.knowledgeBaseRepository.createArticle(tenantId, articleData);
  }

  async getArticles(tenantId: string, filters: any) {
    return this.knowledgeBaseRepository.getArticles(tenantId, filters);
  }

  async getArticleById(tenantId: string, articleId: string) {
    return this.knowledgeBaseRepository.getArticleById(tenantId, articleId);
  }

  async updateArticle(tenantId: string, articleId: string, data: any) {
    return this.knowledgeBaseRepository.updateArticle(tenantId, articleId, data);
  }

  async deleteArticle(tenantId: string, articleId: string) {
    return this.knowledgeBaseRepository.deleteArticle(tenantId, articleId);
  }

  async searchArticles(tenantId: string, query: string, filters: any) {
    return this.knowledgeBaseRepository.searchArticles(tenantId, query, filters);
  }

  async rateArticle(tenantId: string, articleId: string, userId: string, rating: any) {
    return this.knowledgeBaseRepository.rateArticle(tenantId, articleId, userId, rating);
  }

  async createComment(tenantId: string, commentData: any) {
    return this.knowledgeBaseRepository.createComment(tenantId, commentData);
  }

  async getComments(tenantId: string, articleId: string) {
    return this.knowledgeBaseRepository.getComments(tenantId, articleId);
  }

  async getTags(tenantId: string) {
    return this.knowledgeBaseRepository.getTags(tenantId);
  }

  async createTag(tenantId: string, tagData: any) {
    return this.knowledgeBaseRepository.createTag(tenantId, tagData);
  }

  async getAnalytics(tenantId: string) {
    return this.knowledgeBaseRepository.getAnalytics(tenantId);
  }

  async getAdvancedAnalytics(tenantId: string) {
    return this.knowledgeBaseRepository.getAdvancedAnalytics(tenantId);
  }

  async getPopularArticles(tenantId: string, limit: number) {
    return this.knowledgeBaseRepository.getPopularArticles(tenantId, limit);
  }

  async getRecentArticles(tenantId: string, limit: number) {
    return this.knowledgeBaseRepository.getRecentArticles(tenantId, limit);
  }

  async getSearchAnalytics(tenantId: string) {
    return this.knowledgeBaseRepository.getSearchAnalytics(tenantId);
  }

  async getUserEngagement(tenantId: string) {
    return this.knowledgeBaseRepository.getUserEngagement(tenantId);
  }

  async getMediaLibrary(tenantId: string) {
    return this.mediaRepository.getMediaLibrary(tenantId);
  }

  async uploadMedia(tenantId: string, mediaData: any) {
    return this.mediaRepository.uploadMedia(tenantId, mediaData);
  }

  async getArticleTemplates(tenantId: string) {
    return this.knowledgeBaseRepository.getArticleTemplates(tenantId);
  }

  async createArticleTemplate(tenantId: string, templateData: any) {
    return this.knowledgeBaseRepository.createArticleTemplate(tenantId, templateData);
  }

  async cloneArticle(tenantId: string, articleId: string, cloneData: any) {
    return this.knowledgeBaseRepository.cloneArticle(tenantId, articleId, cloneData);
  }

  async linkArticleToTicket(tenantId: string, articleId: string, ticketId: string) {
    return this.knowledgeBaseRepository.linkArticleToTicket(tenantId, articleId, ticketId);
  }

  async getArticlesByTicket(tenantId: string, ticketId: string) {
    return this.knowledgeBaseRepository.getArticlesByTicket(tenantId, ticketId);
  }

  async toggleFavorite(tenantId: string, articleId: string, userId: string) {
    return this.knowledgeBaseRepository.toggleFavorite(tenantId, articleId, userId);
  }

  async getFavoriteArticles(tenantId: string, userId: string) {
    return this.knowledgeBaseRepository.getFavoriteArticles(tenantId, userId);
  }

  async getArticleVersions(tenantId: string, articleId: string) {
    return this.knowledgeBaseRepository.getArticleVersions(tenantId, articleId);
  }
}