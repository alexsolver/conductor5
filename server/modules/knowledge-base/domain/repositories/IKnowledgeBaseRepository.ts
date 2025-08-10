export interface IKnowledgeBaseRepository {
  // Categories
  createCategory(tenantId: string, categoryData: any): Promise<any>;
  getCategories(tenantId: string, filters: any): Promise<any[]>;
  updateCategory(tenantId: string, categoryId: string, updateData: any): Promise<any>;
  deleteCategory(tenantId: string, categoryId: string): Promise<any>;

  // Articles
  createArticle(tenantId: string, articleData: any): Promise<any>;
  getArticles(tenantId: string, filters: any): Promise<any[]>;
  getArticleById(tenantId: string, articleId: string): Promise<any>;
  updateArticle(tenantId: string, articleId: string, updateData: any): Promise<any>;
  deleteArticle(tenantId: string, articleId: string): Promise<any>;

  // Search
  searchArticles(tenantId: string, query: string, filters: any): Promise<any[]>;

  // Rating
  rateArticle(tenantId: string, articleId: string, userId: string, ratingData: any): Promise<any>;

  // Comments
  createComment(tenantId: string, commentData: any): Promise<any>;
  getComments(tenantId: string, articleId: string): Promise<any[]>;

  // Tags
  getTags(tenantId: string): Promise<any[]>;
  createTag(tenantId: string, tagData: any): Promise<any>;

  // Analytics
  getAnalytics(tenantId: string): Promise<any>;
  getAdvancedAnalytics(tenantId: string): Promise<any>;
  getPopularArticles(tenantId: string, limit: number): Promise<any[]>;
  getRecentArticles(tenantId: string, limit: number): Promise<any[]>;
  getSearchAnalytics(tenantId: string): Promise<any>;
  getUserEngagement(tenantId: string): Promise<any>;

  // Media
  getMediaLibrary(tenantId: string): Promise<any[]>;
  uploadMedia(tenantId: string, mediaData: any): Promise<any>;

  // Templates
  getArticleTemplates(tenantId: string): Promise<any[]>;
  createArticleTemplate(tenantId: string, templateData: any): Promise<any>;

  // Article Cloning
  cloneArticle(tenantId: string, articleId: string, cloneData: any): Promise<any>;

  // Ticket Integration
  linkArticleToTicket(tenantId: string, articleId: string, ticketId: string): Promise<any>;
  getArticlesByTicket(tenantId: string, ticketId: string): Promise<any[]>;

  // Favorites
  toggleFavorite(tenantId: string, articleId: string, userId: string): Promise<boolean>;
  getFavoriteArticles(tenantId: string, userId: string): Promise<any[]>;

  // Versions
  getArticleVersions(tenantId: string, articleId: string): Promise<any[]>;
}
export interface IKnowledgeBaseRepository {
  // Categories
  createCategory(tenantId: string, categoryData: any): Promise<any>;
  getCategories(tenantId: string, filters: any): Promise<any[]>;
  updateCategory(tenantId: string, categoryId: string, data: any): Promise<any>;
  deleteCategory(tenantId: string, categoryId: string): Promise<any>;

  // Articles  
  createArticle(tenantId: string, articleData: any): Promise<any>;
  getArticles(tenantId: string, filters: any): Promise<any[]>;
  getArticleById(tenantId: string, articleId: string): Promise<any>;
  updateArticle(tenantId: string, articleId: string, data: any): Promise<any>;
  deleteArticle(tenantId: string, articleId: string): Promise<any>;

  // Search
  searchArticles(tenantId: string, query: string, filters: any): Promise<any[]>;

  // Other methods...
  rateArticle(tenantId: string, articleId: string, userId: string, data: any): Promise<any>;
  createComment(tenantId: string, commentData: any): Promise<any>;
  getComments(tenantId: string, articleId: string): Promise<any[]>;
  getTags(tenantId: string): Promise<any[]>;
  createTag(tenantId: string, tagData: any): Promise<any>;
  getAnalytics(tenantId: string): Promise<any>;
  getAdvancedAnalytics(tenantId: string): Promise<any>;
  getPopularArticles(tenantId: string, limit: number): Promise<any[]>;
  getRecentArticles(tenantId: string, limit: number): Promise<any[]>;
  getSearchAnalytics(tenantId: string): Promise<any>;
  getUserEngagement(tenantId: string): Promise<any>;
  getMediaLibrary(tenantId: string): Promise<any[]>;
  uploadMedia(tenantId: string, mediaData: any): Promise<any>;
  getArticleTemplates(tenantId: string): Promise<any[]>;
  createArticleTemplate(tenantId: string, templateData: any): Promise<any>;
  cloneArticle(tenantId: string, articleId: string, cloneData: any): Promise<any>;
  linkArticleToTicket(tenantId: string, articleId: string, ticketId: string): Promise<any>;
  getArticlesByTicket(tenantId: string, ticketId: string): Promise<any[]>;
  toggleFavorite(tenantId: string, articleId: string, userId: string): Promise<any>;
  getFavoriteArticles(tenantId: string, userId: string): Promise<any[]>;
  getArticleVersions(tenantId: string, articleId: string): Promise<any[]>;
}
export interface IKnowledgeBaseRepository {
  // Categories
  createCategory(tenantId: string, categoryData: any): Promise<any>;
  getCategories(tenantId: string, filters?: any): Promise<any[]>;
  updateCategory(tenantId: string, categoryId: string, data: any): Promise<any>;
  deleteCategory(tenantId: string, categoryId: string): Promise<any>;
  
  // Articles
  createArticle(tenantId: string, articleData: any): Promise<any>;
  getArticles(tenantId: string, filters?: any): Promise<any[]>;
  getArticleById(tenantId: string, articleId: string): Promise<any>;
  updateArticle(tenantId: string, articleId: string, data: any): Promise<any>;
  deleteArticle(tenantId: string, articleId: string): Promise<any>;
  searchArticles(tenantId: string, query: string, filters?: any): Promise<any[]>;
  
  // Comments and Ratings
  createComment(tenantId: string, commentData: any): Promise<any>;
  getComments(tenantId: string, articleId: string): Promise<any[]>;
  rateArticle(tenantId: string, articleId: string, userId: string, rating: any): Promise<any>;
  
  // Tags
  getTags(tenantId: string): Promise<any[]>;
  createTag(tenantId: string, tagData: any): Promise<any>;
  
  // Analytics
  getAnalytics(tenantId: string): Promise<any>;
  getAdvancedAnalytics(tenantId: string): Promise<any>;
  getPopularArticles(tenantId: string, limit: number): Promise<any[]>;
  getRecentArticles(tenantId: string, limit: number): Promise<any[]>;
  getSearchAnalytics(tenantId: string): Promise<any>;
  getUserEngagement(tenantId: string): Promise<any>;
  
  // Media
  getMediaLibrary(tenantId: string): Promise<any[]>;
  uploadMedia(tenantId: string, mediaData: any): Promise<any>;
  
  // Templates
  getArticleTemplates(tenantId: string): Promise<any[]>;
  createArticleTemplate(tenantId: string, templateData: any): Promise<any>;
  cloneArticle(tenantId: string, articleId: string, cloneData: any): Promise<any>;
  
  // Ticket Integration
  linkArticleToTicket(tenantId: string, articleId: string, ticketId: string): Promise<any>;
  getArticlesByTicket(tenantId: string, ticketId: string): Promise<any[]>;
  
  // Favorites
  toggleFavorite(tenantId: string, articleId: string, userId: string): Promise<boolean>;
  getFavoriteArticles(tenantId: string, userId: string): Promise<any[]>;
  
  // Versions
  getArticleVersions(tenantId: string, articleId: string): Promise<any[]>;
}
