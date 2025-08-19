// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE REPOSITORY INTERFACE - CLEAN ARCHITECTURE
// Domain layer interface - defines contracts without implementation details

import { KnowledgeBaseArticle } from '../entities/KnowledgeBaseArticle';

export interface KnowledgeBaseSearchQuery {
  query?: string;
  category?: string;
  tags?: string[];
  status?: string;
  visibility?: string;
  authorId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'title' | 'view_count';
  sortOrder?: 'asc' | 'desc';
}

export interface KnowledgeBaseSearchResult {
  articles: KnowledgeBaseArticle[];
  total: number;
  hasMore: boolean;
}

export interface CreateKnowledgeBaseArticleData {
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags?: string[];
  visibility?: string;
  status?: string;
  authorId: string;
  contentType?: string;
  // accessLevel removed - not part of current schema
}

export interface UpdateKnowledgeBaseArticleData {
  title?: string;
  content?: string;
  summary?: string;
  slug?: string;
  category?: string;
  tags?: string[];
  visibility?: string;
  status?: string;
  reviewerId?: string;
  approvalStatus?: string;
}

export interface IKnowledgeBaseRepository {
  // Basic CRUD operations
  create(data: CreateKnowledgeBaseArticleData, tenantId: string): Promise<KnowledgeBaseArticle>;
  findById(id: string, tenantId: string): Promise<KnowledgeBaseArticle | null>;
  update(id: string, data: UpdateKnowledgeBaseArticleData, tenantId: string): Promise<KnowledgeBaseArticle | null>;
  delete(id: string, tenantId: string): Promise<boolean>;

  // Search and filtering
  search(query: KnowledgeBaseSearchQuery, tenantId: string): Promise<KnowledgeBaseSearchResult>;
  findByCategory(category: string, tenantId: string): Promise<KnowledgeBaseArticle[]>;
  findByTags(tags: string[], tenantId: string): Promise<KnowledgeBaseArticle[]>;
  findByStatus(status: string, tenantId: string): Promise<KnowledgeBaseArticle[]>;
  findByAuthor(authorId: string, tenantId: string): Promise<KnowledgeBaseArticle[]>;

  // Publishing operations
  publish(id: string, tenantId: string): Promise<boolean>;
  unpublish(id: string, tenantId: string): Promise<boolean>;
  archive(id: string, tenantId: string): Promise<boolean>;

  // Approval workflow
  submitForApproval(id: string, tenantId: string): Promise<boolean>;
  approve(id: string, reviewerId: string, tenantId: string): Promise<boolean>;
  reject(id: string, reviewerId: string, reason: string, tenantId: string): Promise<boolean>;

  // Analytics and metrics
  incrementViewCount(id: string, tenantId: string): Promise<boolean>;

  // Template management - following Clean Architecture
  listTemplates(tenantId: string): Promise<any[]>;
  findTemplateById(id: string, tenantId: string): Promise<any | null>;
  createTemplate(templateData: any, tenantId: string): Promise<any>;

  // Comments system - following Domain contracts
  findCommentsByArticle(articleId: string, tenantId: string): Promise<any[]>;
  createComment(commentData: any, tenantId: string): Promise<any>;

  // Version control - following domain rules
  findVersionsByArticle(articleId: string, tenantId: string): Promise<any[]>;
  createVersion(versionData: any, tenantId: string): Promise<any>;
  updateRating(id: string, rating: number, tenantId: string): Promise<boolean>;
  addApprovalHistory(id: string, entry: any, tenantId: string): Promise<boolean>;

  // Advanced queries
  findPendingApproval(tenantId: string): Promise<KnowledgeBaseArticle[]>;
  findExpiredDrafts(tenantId: string): Promise<KnowledgeBaseArticle[]>;
  findPopular(limit: number, tenantId: string): Promise<KnowledgeBaseArticle[]>;
  findRecent(limit: number, tenantId: string): Promise<KnowledgeBaseArticle[]>;
}