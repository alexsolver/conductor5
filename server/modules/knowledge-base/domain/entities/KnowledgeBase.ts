// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE DOMAIN ENTITY - CLEAN ARCHITECTURE
// Pure domain entity with business rules

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  summary?: string; // Gerado automaticamente do content
  category: string;
  tags: string[];
  status: ArticleStatus;
  visibility: ArticleVisibility;
  authorId: string;
  reviewerId?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  tenantId: string;
  
  // Rich content support
  contentType: 'rich_text' | 'markdown' | 'html';
  attachments: ArticleAttachment[];
  
  // Approval workflow
  approvalStatus: ApprovalStatus;
  approvalHistory: ApprovalHistoryEntry[];
  
  // Analytics
  viewCount: number;
  lastViewedAt?: Date;
  rating?: number;
  ratingCount: number;
}

export interface ArticleAttachment {
  id: string;
  articleId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface ApprovalHistoryEntry {
  id: string;
  articleId: string;
  userId: string;
  action: ApprovalAction;
  comment?: string;
  timestamp: Date;
  previousStatus: ApprovalStatus;
  newStatus: ApprovalStatus;
}

export enum ArticleStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  REJECTED = 'rejected'
}

export enum ArticleVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted'
}

export enum ApprovalStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHANGES_REQUESTED = 'changes_requested'
}

export enum ApprovalAction {
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_CHANGES = 'request_changes',
  WITHDRAW = 'withdraw'
}

export interface KnowledgeBaseSearchQuery {
  query?: string;
  category?: string;
  tags?: string[];
  status?: ArticleStatus;
  visibility?: ArticleVisibility;
  authorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'viewCount' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface KnowledgeBaseSearchResult {
  articles: KnowledgeBaseArticle[];
  total: number;
  hasMore: boolean;
  aggregations?: {
    categories: { [key: string]: number };
    tags: { [key: string]: number };
    authors: { [key: string]: number };
  };
}

// Domain business rules
export class KnowledgeBaseBusinessRules {
  static canPublish(article: KnowledgeBaseArticle, userId: string): boolean {
    return article.authorId === userId || article.approvalStatus === ApprovalStatus.APPROVED;
  }

  static canEdit(article: KnowledgeBaseArticle, userId: string): boolean {
    return article.authorId === userId && article.status !== ArticleStatus.PUBLISHED;
  }

  static canApprove(article: KnowledgeBaseArticle, userId: string): boolean {
    return article.authorId !== userId && article.approvalStatus === ApprovalStatus.PENDING_APPROVAL;
  }

  static getNextVersion(currentVersion: number): number {
    return currentVersion + 1;
  }

  static validateContent(content: string): boolean {
    return content.trim().length >= 10;
  }

  static validateTitle(title: string): boolean {
    return title.trim().length >= 3 && title.trim().length <= 200;
  }

  static sanitizeTags(tags: string[]): string[] {
    return tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .filter((tag, index, self) => self.indexOf(tag) === index);
  }
}