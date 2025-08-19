// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE DTOs - CLEAN ARCHITECTURE
// Application layer data transfer objects

import { ArticleStatus, ArticleVisibility } from '../../domain/entities/KnowledgeBase';

export interface CreateKnowledgeBaseArticleDTO {
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  visibility: ArticleVisibility;
  contentType: 'rich_text' | 'markdown' | 'html';
  authorId: string;
  tenantId: string;
  attachments?: CreateArticleAttachmentDTO[];
}

export interface UpdateKnowledgeBaseArticleDTO {
  title?: string;
  content?: string;
  summary?: string;
  category?: string;
  tags?: string[];
  status?: ArticleStatus;
  visibility?: ArticleVisibility;
  contentType?: 'rich_text' | 'markdown' | 'html';
  reviewerId?: string;
}

export interface CreateArticleAttachmentDTO {
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedBy: string;
}

export interface KnowledgeBaseSearchDTO {
  query?: string;
  category?: string;
  tags?: string[];
  status?: ArticleStatus;
  visibility?: ArticleVisibility;
  authorId?: string;
  dateFrom?: string; // ISO string
  dateTo?: string;   // ISO string
  limit?: number;
  offset?: number;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'viewCount' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface ApprovalActionDTO {
  action: 'submit' | 'approve' | 'reject' | 'request_changes' | 'withdraw';
  comment?: string;
  userId: string;
  tenantId: string;
}

export interface RateArticleDTO {
  rating: number; // 1-5
  userId: string;
  tenantId: string;
}

export interface BulkOperationDTO {
  articleIds: string[];
  action: 'publish' | 'archive' | 'delete' | 'change_category';
  newValue?: string; // For change_category
  tenantId: string;
  userId: string;
}