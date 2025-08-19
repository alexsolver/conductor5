// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE DOMAIN ENTITY - CLEAN ARCHITECTURE
// Domain layer entity with pure business logic, no external dependencies

export type ArticleStatus = 'draft' | 'pending_approval' | 'approved' | 'published' | 'archived' | 'rejected';
export type ApprovalStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected' | 'needs_revision';
export type ArticleVisibility = 'public' | 'internal' | 'restricted' | 'private';
export type ContentType = 'rich_text' | 'markdown' | 'plain_text';

export interface ArticleAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface ApprovalHistoryEntry {
  id: string;
  reviewerId: string;
  reviewerName: string;
  action: 'submitted' | 'approved' | 'rejected' | 'revision_requested';
  comment?: string;
  timestamp: string;
}

export interface KnowledgeBaseArticle {
  // Primary identification
  id: string;
  tenantId: string;
  
  // Content
  title: string;
  content: string;
  summary?: string;
  slug?: string;
  
  // Categorization
  category: string;
  tags: string[];
  keywords?: string[];
  
  // Status & Visibility
  status?: string;
  visibility?: string;
  accessLevel?: string;
  
  // Authoring
  authorId: string;
  reviewerId?: string;
  
  // Publishing & Metadata
  published?: boolean;
  publishedAt?: string | null;
  viewCount?: number;
  helpfulCount?: number;
  upvoteCount?: number;
  
  // Additional metadata
  isDeleted?: boolean;
  deletedAt?: string | null;
  version?: number;
  contentType?: string;
  approvalStatus?: string;
  ratingAverage?: number;
  ratingCount?: number;
  attachmentCount?: number;
  lastViewedAt?: string | null;
  
  // Enhanced properties for domain logic
  attachments: ArticleAttachment[];
  approvalHistory: ApprovalHistoryEntry[];
  expiresAt?: string | null;
  
  // Audit
  createdAt: string;
  updatedAt: string;
}

// Domain Methods (Pure Business Logic)
export class KnowledgeBaseArticleDomain {
  static isPublishable(article: KnowledgeBaseArticle): boolean {
    return !!(
      article.title?.trim() &&
      article.content?.trim() &&
      article.category &&
      (article.status === 'approved' || article.approvalStatus === 'approved')
    );
  }

  static canEdit(article: KnowledgeBaseArticle, userId: string): boolean {
    return article.authorId === userId || article.status === 'draft';
  }

  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .substring(0, 200); // Limit length
  }

  static calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  static isExpired(article: KnowledgeBaseArticle): boolean {
    if (!article.expiresAt) return false;
    return new Date(article.expiresAt) < new Date();
  }

  static needsApproval(article: KnowledgeBaseArticle): boolean {
    return article.status === 'pending_approval' || article.approvalStatus === 'pending';
  }
}