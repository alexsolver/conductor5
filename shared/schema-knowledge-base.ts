
import { pgTable, text, uuid, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const knowledgeStatusEnum = pgEnum('knowledge_status', ['draft', 'pending_approval', 'published', 'archived', 'under_review']);
export const knowledgeVisibilityEnum = pgEnum('knowledge_visibility', ['public', 'internal', 'restricted', 'private']);
export const knowledgeTypeEnum = pgEnum('knowledge_type', ['article', 'procedure', 'faq', 'troubleshooting', 'manual', 'video', 'diagram']);
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected', 'needs_revision']);

// Knowledge Base Categories
export const knowledgeCategories = pgTable('knowledge_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  parentCategoryId: uuid('parent_category_id'),
  icon: text('icon'),
  color: text('color'),
  slug: text('slug').notNull(),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull(),
});

// Knowledge Base Articles
export const knowledgeArticles = pgTable('knowledge_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  contentType: text('content_type').default('markdown'), // markdown, html, rich_text
  categoryId: uuid('category_id').notNull(),
  type: knowledgeTypeEnum('type').default('article'),
  status: knowledgeStatusEnum('status').default('draft'),
  visibility: knowledgeVisibilityEnum('visibility').default('internal'),
  authorId: uuid('author_id').notNull(),
  reviewerId: uuid('reviewer_id'),
  publishedAt: timestamp('published_at'),
  scheduledPublishAt: timestamp('scheduled_publish_at'),
  lastReviewedAt: timestamp('last_reviewed_at'),
  nextReviewDate: timestamp('next_review_date'),
  version: integer('version').default(1),
  viewCount: integer('view_count').default(0),
  helpfulCount: integer('helpful_count').default(0),
  notHelpfulCount: integer('not_helpful_count').default(0),
  featured: boolean('featured').default(false),
  searchableContent: text('searchable_content'), // For full-text search
  metadata: jsonb('metadata'), // Additional metadata
  attachments: jsonb('attachments'), // File attachments
  relatedArticles: jsonb('related_articles'), // Related article IDs
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Knowledge Article Versions (for version control)
export const knowledgeArticleVersions = pgTable('knowledge_article_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  articleId: uuid('article_id').notNull(),
  version: integer('version').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  changesSummary: text('changes_summary'),
  authorId: uuid('author_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Knowledge Tags
export const knowledgeTags = pgTable('knowledge_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  color: text('color'),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Article Tags Junction Table
export const knowledgeArticleTags = pgTable('knowledge_article_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  articleId: uuid('article_id').notNull(),
  tagId: uuid('tag_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Knowledge Comments
export const knowledgeComments = pgTable('knowledge_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  articleId: uuid('article_id').notNull(),
  parentCommentId: uuid('parent_comment_id'),
  authorId: uuid('author_id').notNull(),
  content: text('content').notNull(),
  isInternal: boolean('is_internal').default(false),
  isApproved: boolean('is_approved').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Knowledge Ratings/Feedback
export const knowledgeRatings = pgTable('knowledge_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  articleId: uuid('article_id').notNull(),
  userId: uuid('user_id').notNull(),
  rating: integer('rating').notNull(), // 1-5 stars
  isHelpful: boolean('is_helpful'),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Knowledge Access Log (for analytics)
export const knowledgeAccessLog = pgTable('knowledge_access_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  articleId: uuid('article_id').notNull(),
  userId: uuid('user_id'),
  accessType: text('access_type').notNull(), // view, search, download
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  sessionId: text('session_id'),
  referrer: text('referrer'),
  searchQuery: text('search_query'),
  timeSpent: integer('time_spent'), // in seconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Knowledge Approval Workflow
export const knowledgeApprovals = pgTable('knowledge_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  articleId: uuid('article_id').notNull(),
  approverId: uuid('approver_id').notNull(),
  status: approvalStatusEnum('status').default('pending'),
  comments: text('comments'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Knowledge Templates
export const knowledgeTemplates = pgTable('knowledge_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  contentTemplate: text('content_template').notNull(),
  type: knowledgeTypeEnum('type').default('article'),
  categoryId: uuid('category_id'),
  isGlobal: boolean('is_global').default(false),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const knowledgeCategoriesRelations = relations(knowledgeCategories, ({ one, many }) => ({
  parent: one(knowledgeCategories, {
    fields: [knowledgeCategories.parentCategoryId],
    references: [knowledgeCategories.id],
  }),
  children: many(knowledgeCategories),
  articles: many(knowledgeArticles),
}));

export const knowledgeArticlesRelations = relations(knowledgeArticles, ({ one, many }) => ({
  category: one(knowledgeCategories, {
    fields: [knowledgeArticles.categoryId],
    references: [knowledgeCategories.id],
  }),
  versions: many(knowledgeArticleVersions),
  tags: many(knowledgeArticleTags),
  comments: many(knowledgeComments),
  ratings: many(knowledgeRatings),
  approvals: many(knowledgeApprovals),
}));

export const knowledgeArticleVersionsRelations = relations(knowledgeArticleVersions, ({ one }) => ({
  article: one(knowledgeArticles, {
    fields: [knowledgeArticleVersions.articleId],
    references: [knowledgeArticles.id],
  }),
}));

export const knowledgeArticleTagsRelations = relations(knowledgeArticleTags, ({ one }) => ({
  article: one(knowledgeArticles, {
    fields: [knowledgeArticleTags.articleId],
    references: [knowledgeArticles.id],
  }),
  tag: one(knowledgeTags, {
    fields: [knowledgeArticleTags.tagId],
    references: [knowledgeTags.id],
  }),
}));

export const knowledgeCommentsRelations = relations(knowledgeComments, ({ one, many }) => ({
  article: one(knowledgeArticles, {
    fields: [knowledgeComments.articleId],
    references: [knowledgeArticles.id],
  }),
  parent: one(knowledgeComments, {
    fields: [knowledgeComments.parentCommentId],
    references: [knowledgeComments.id],
  }),
  replies: many(knowledgeComments),
}));

export const knowledgeRatingsRelations = relations(knowledgeRatings, ({ one }) => ({
  article: one(knowledgeArticles, {
    fields: [knowledgeRatings.articleId],
    references: [knowledgeArticles.id],
  }),
}));

export const knowledgeApprovalsRelations = relations(knowledgeApprovals, ({ one }) => ({
  article: one(knowledgeArticles, {
    fields: [knowledgeApprovals.articleId],
    references: [knowledgeArticles.id],
  }),
}));
