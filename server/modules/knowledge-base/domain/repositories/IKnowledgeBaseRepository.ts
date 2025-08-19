// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE REPOSITORY INTERFACE - CLEAN ARCHITECTURE
// Pure domain interface - no implementation details

import { 
  KnowledgeBaseArticle, 
  KnowledgeBaseSearchQuery, 
  KnowledgeBaseSearchResult,
  ArticleAttachment,
  ApprovalHistoryEntry
} from '../entities/KnowledgeBase';

export interface IKnowledgeBaseRepository {
  // Article CRUD operations
  create(article: Omit<KnowledgeBaseArticle, 'id' | 'createdAt' | 'updatedAt' | 'version'>, tenantId: string): Promise<KnowledgeBaseArticle>;
  findById(id: string, tenantId: string): Promise<KnowledgeBaseArticle | null>;
  update(id: string, updates: Partial<KnowledgeBaseArticle>, tenantId: string): Promise<KnowledgeBaseArticle>;
  delete(id: string, tenantId: string): Promise<boolean>;
  
  // Search and listing
  search(query: KnowledgeBaseSearchQuery, tenantId: string): Promise<KnowledgeBaseSearchResult>;
  findByCategory(category: string, tenantId: string): Promise<KnowledgeBaseArticle[]>;
  findByAuthor(authorId: string, tenantId: string): Promise<KnowledgeBaseArticle[]>;
  findByTags(tags: string[], tenantId: string): Promise<KnowledgeBaseArticle[]>;
  
  // Analytics
  incrementViewCount(id: string, tenantId: string): Promise<void>;
  updateRating(id: string, rating: number, tenantId: string): Promise<void>;
  getPopularArticles(limit: number, tenantId: string): Promise<KnowledgeBaseArticle[]>;
  
  // Attachments
  addAttachment(attachment: Omit<ArticleAttachment, 'id' | 'uploadedAt'>, tenantId: string): Promise<ArticleAttachment>;
  removeAttachment(attachmentId: string, tenantId: string): Promise<boolean>;
  getAttachments(articleId: string, tenantId: string): Promise<ArticleAttachment[]>;
  
  // Approval workflow
  addApprovalHistory(entry: Omit<ApprovalHistoryEntry, 'id' | 'timestamp'>, tenantId: string): Promise<ApprovalHistoryEntry>;
  getApprovalHistory(articleId: string, tenantId: string): Promise<ApprovalHistoryEntry[]>;
  
  // Batch operations
  findPendingApproval(tenantId: string): Promise<KnowledgeBaseArticle[]>;
  findExpiredDrafts(daysOld: number, tenantId: string): Promise<KnowledgeBaseArticle[]>;
  bulkUpdateStatus(articleIds: string[], status: any, tenantId: string): Promise<number>;
  
  // Full-text search
  fullTextSearch(query: string, tenantId: string, options?: {
    categories?: string[];
    limit?: number;
    offset?: number;
  }): Promise<KnowledgeBaseSearchResult>;
  
  // Categories and tags
  getCategories(tenantId: string): Promise<{ name: string; count: number }[]>;
  getTags(tenantId: string): Promise<{ name: string; count: number }[]>;
  getRelatedArticles(articleId: string, tenantId: string, limit?: number): Promise<KnowledgeBaseArticle[]>;
}