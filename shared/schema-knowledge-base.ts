// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE SCHEMA - CLEAN ARCHITECTURE
// Schema seguindo padrões Clean Architecture com Domain-Driven Design

import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  boolean,
  integer,
  numeric,
  pgEnum,
  unique,

} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { tenants } from "./schema-master";

// ========================================
// KNOWLEDGE BASE ENUMS
// ========================================

export const knowledgeBaseStatusEnum = pgEnum("knowledge_base_status", [
  "draft",
  "pending_approval",
  "approved",
  "published",
  "archived",
  "rejected"
]);

export const knowledgeBaseCategoryEnum = pgEnum("knowledge_base_category", [
  "technical_support",
  "troubleshooting", 
  "user_guide",
  "faq",
  "policy",
  "process",
  "training",
  "announcement",
  "best_practice",
  "configuration",
  "other"
]);

export const knowledgeBaseVisibilityEnum = pgEnum("knowledge_base_visibility", [
  "public",
  "internal",
  "restricted",
  "private"
]);

export const knowledgeBaseApprovalStatusEnum = pgEnum("knowledge_base_approval_status", [
  "pending",
  "approved",
  "rejected",
  "needs_revision"
]);

// ========================================
// KNOWLEDGE BASE MAIN TABLES
// ========================================

// Knowledge Base Articles - Exactly matching existing database structure
export const knowledgeBaseArticles = pgTable("knowledge_base_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

  // Basic Article Info - matching actual DB structure
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"),
  excerpt: text("excerpt"),

  // Authoring
  authorId: uuid("author_id"),

  // Categorization - using enum as in actual DB (corrected field name)
  category: knowledgeBaseCategoryEnum("category").default("other"),
  
  // Status & Visibility - using enums as in actual DB
  status: knowledgeBaseStatusEnum("status"),
  visibility: knowledgeBaseVisibilityEnum("visibility"),
  approvalStatus: knowledgeBaseApprovalStatusEnum("approval_status"),

  // Tags as JSONB like in actual DB
  tags: jsonb("tags").default(sql`'[]'::jsonb`),

  // Counters
  viewCount: integer("view_count").default(0),
  helpfulCount: integer("helpful_count").default(0),
  notHelpfulCount: integer("not_helpful_count").default(0),

  // Features
  featured: boolean("featured").default(false),

  // SEO
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: varchar("seo_description", { length: 500 }),
  slug: varchar("slug", { length: 500 }),

  // Publishing
  publishedAt: timestamp("published_at"),
  archivedAt: timestamp("archived_at"),

  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),

  // Audit
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  // TENANT ISOLATION: Critical indexes for multi-tenant performance
  index("kb_articles_tenant_idx").on(table.tenantId),
  index("kb_articles_tenant_status_idx").on(table.tenantId, table.status),
  index("kb_articles_tenant_category_idx").on(table.tenantId, table.category),
  index("kb_articles_tenant_author_idx").on(table.tenantId, table.authorId),
  index("kb_articles_tenant_created_idx").on(table.tenantId, table.createdAt),

  // Unique title per tenant
  unique("kb_articles_tenant_title_unique").on(table.tenantId, table.title),

  // Search optimization
  index("kb_articles_title_idx").on(table.title),
  index("kb_articles_tags_idx").on(table.tags),
]);

// Knowledge Base Article Versions (for revision history)
export const knowledgeBaseArticleVersions = pgTable("knowledge_base_article_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  articleId: uuid("article_id").notNull().references(() => knowledgeBaseArticles.id, { onDelete: "cascade" }),

  // Version Info
  versionNumber: integer("version_number").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  summary: text("summary"),

  // Change Info
  changeDescription: text("change_description"),
  authorId: uuid("author_id").notNull(),

  // Audit
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("kb_versions_tenant_article_idx").on(table.tenantId, table.articleId),
  index("kb_versions_tenant_version_idx").on(table.tenantId, table.versionNumber),
  unique("kb_versions_article_version_unique").on(table.articleId, table.versionNumber),
]);

// Knowledge Base Article Attachments
export const knowledgeBaseAttachments = pgTable("knowledge_base_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  articleId: uuid("article_id").notNull().references(() => knowledgeBaseArticles.id, { onDelete: "cascade" }),

  // File Info
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  filePath: text("file_path").notNull(),

  // Metadata
  description: text("description"),
  uploadedBy: uuid("uploaded_by").notNull(),

  // Audit
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("kb_attachments_tenant_article_idx").on(table.tenantId, table.articleId),
  index("kb_attachments_tenant_uploader_idx").on(table.tenantId, table.uploadedBy),
]);

// Knowledge Base Article Ratings
export const knowledgeBaseRatings = pgTable("knowledge_base_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  articleId: uuid("article_id").notNull().references(() => knowledgeBaseArticles.id, { onDelete: "cascade" }),

  // Rating Info
  userId: uuid("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 or upvote/downvote (-1, 0, 1)
  feedback: text("feedback"),

  // Audit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("kb_ratings_tenant_article_idx").on(table.tenantId, table.articleId),
  index("kb_ratings_tenant_user_idx").on(table.tenantId, table.userId),
  unique("kb_ratings_article_user_unique").on(table.articleId, table.userId),
]);

// Knowledge Base Approval Workflow
export const knowledgeBaseApprovals = pgTable("knowledge_base_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  articleId: uuid("article_id").notNull().references(() => knowledgeBaseArticles.id, { onDelete: "cascade" }),

  // Approval Info
  approverId: uuid("approver_id").notNull(),
  status: knowledgeBaseApprovalStatusEnum("status").default("pending").notNull(),
  comments: text("comments"),

  // Metadata
  requestedAt: timestamp("requested_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),

  // Audit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("kb_approvals_tenant_article_idx").on(table.tenantId, table.articleId),
  index("kb_approvals_tenant_approver_idx").on(table.tenantId, table.approverId),
  index("kb_approvals_tenant_status_idx").on(table.tenantId, table.status),
]);

// Knowledge Base Article Relations (links to tickets, customers, etc.)
export const knowledgeBaseArticleRelations = pgTable("knowledge_base_article_relations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  articleId: uuid("article_id").notNull().references(() => knowledgeBaseArticles.id, { onDelete: "cascade" }),

  // Relation Info
  entityType: varchar("entity_type", { length: 50 }).notNull(), // "ticket", "customer", "category", etc.
  entityId: uuid("entity_id").notNull(),
  relationType: varchar("relation_type", { length: 50 }).notNull(), // "related", "solution", "reference"

  // Metadata
  createdBy: uuid("created_by").notNull(),

  // Audit
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("kb_relations_tenant_article_idx").on(table.tenantId, table.articleId),
  index("kb_relations_tenant_entity_idx").on(table.tenantId, table.entityType, table.entityId),
  unique("kb_relations_article_entity_unique").on(table.articleId, table.entityType, table.entityId),
]);

// Knowledge Base Search Analytics
export const knowledgeBaseSearchLogs = pgTable("knowledge_base_search_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

  // Search Info
  query: text("query").notNull(),
  userId: uuid("user_id").notNull(),
  resultsCount: integer("results_count").default(0),
  clickedArticleId: uuid("clicked_article_id"),

  // Search Context
  searchContext: jsonb("search_context").default({}), // filters, sorting, etc.
  userAgent: text("user_agent"),

  // Audit
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("kb_search_tenant_query_idx").on(table.tenantId, table.query),
  index("kb_search_tenant_user_idx").on(table.tenantId, table.userId),
  index("kb_search_tenant_created_idx").on(table.tenantId, table.createdAt),
]);

// ========================================
// ZOD SCHEMAS FOR VALIDATION
// ========================================

// Article schemas
export const insertKnowledgeBaseArticleSchema = createInsertSchema(knowledgeBaseArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  helpfulCount: true,
  notHelpfulCount: true,
}).extend({
  title: z.string().min(1, "Título é obrigatório").max(500, "Título muito longo"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  excerpt: z.string().optional(),
  category: z.enum(["technical_support", "troubleshooting", "user_guide", "faq", "policy", "process", "training", "announcement", "best_practice", "configuration", "other"]).optional().default("other"),
  status: z.enum(["draft", "pending_approval", "approved", "published", "archived", "rejected"]).optional().default("draft"),
  visibility: z.enum(["public", "internal", "restricted", "private"]).optional().default("public"),
  tags: z.array(z.string()).optional().default([]),
});

export const updateKnowledgeBaseArticleSchema = insertKnowledgeBaseArticleSchema.partial().extend({
  id: z.string().uuid(),
});

// Rating schema
export const insertKnowledgeBaseRatingSchema = createInsertSchema(knowledgeBaseRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  rating: z.number().min(-1).max(5),
  feedback: z.string().optional(),
});

// Approval schema
export const insertKnowledgeBaseApprovalSchema = createInsertSchema(knowledgeBaseApprovals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  requestedAt: true,
  reviewedAt: true,
});

// Relation schema
export const insertKnowledgeBaseRelationSchema = createInsertSchema(knowledgeBaseArticleRelations).omit({
  id: true,
  createdAt: true,
});

// Search schema
export const knowledgeBaseSearchSchema = z.object({
  query: z.string().optional(), // Query opcional para permitir busca geral
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(["public", "internal", "restricted", "private"]).optional(),
  status: z.enum(["draft", "pending_approval", "approved", "published", "archived", "rejected"]).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type KnowledgeBaseArticle = typeof knowledgeBaseArticles.$inferSelect;
export type InsertKnowledgeBaseArticle = z.infer<typeof insertKnowledgeBaseArticleSchema>;
export type UpdateKnowledgeBaseArticle = z.infer<typeof updateKnowledgeBaseArticleSchema>;

export type KnowledgeBaseRating = typeof knowledgeBaseRatings.$inferSelect;
export type InsertKnowledgeBaseRating = z.infer<typeof insertKnowledgeBaseRatingSchema>;

export type KnowledgeBaseApproval = typeof knowledgeBaseApprovals.$inferSelect;
export type InsertKnowledgeBaseApproval = z.infer<typeof insertKnowledgeBaseApprovalSchema>;

export type KnowledgeBaseRelation = typeof knowledgeBaseArticleRelations.$inferSelect;
export type InsertKnowledgeBaseRelation = z.infer<typeof insertKnowledgeBaseRelationSchema>;

export type KnowledgeBaseSearchParams = z.infer<typeof knowledgeBaseSearchSchema>;

// ========================================
// RELATIONS
// ========================================

import { relations } from "drizzle-orm";

export const knowledgeBaseArticlesRelations = relations(knowledgeBaseArticles, ({ many }) => ({
  versions: many(knowledgeBaseArticleVersions),
  attachments: many(knowledgeBaseAttachments),
  ratings: many(knowledgeBaseRatings),
  approvals: many(knowledgeBaseApprovals),
  relations: many(knowledgeBaseArticleRelations),
}));

export const knowledgeBaseArticleVersionsRelations = relations(knowledgeBaseArticleVersions, ({ one }) => ({
  article: one(knowledgeBaseArticles, {
    fields: [knowledgeBaseArticleVersions.articleId],
    references: [knowledgeBaseArticles.id],
  }),
}));

export const knowledgeBaseAttachmentsRelations = relations(knowledgeBaseAttachments, ({ one }) => ({
  article: one(knowledgeBaseArticles, {
    fields: [knowledgeBaseAttachments.articleId],
    references: [knowledgeBaseArticles.id],
  }),
}));

export const knowledgeBaseRatingsRelations = relations(knowledgeBaseRatings, ({ one }) => ({
  article: one(knowledgeBaseArticles, {
    fields: [knowledgeBaseRatings.articleId],
    references: [knowledgeBaseArticles.id],
  }),
}));

export const knowledgeBaseApprovalsRelations = relations(knowledgeBaseApprovals, ({ one }) => ({
  article: one(knowledgeBaseArticles, {
    fields: [knowledgeBaseApprovals.articleId],
    references: [knowledgeBaseArticles.id],
  }),
}));

export const knowledgeBaseArticleRelationsRelations = relations(knowledgeBaseArticleRelations, ({ one }) => ({
  article: one(knowledgeBaseArticles, {
    fields: [knowledgeBaseArticleRelations.articleId],
    references: [knowledgeBaseArticles.id],
  }),
}));

// ========================================
// ADDITIONAL TABLES FOR ADVANCED FEATURES
// ========================================

// Knowledge Base Templates
export const knowledgeBaseTemplates = pgTable("knowledge_base_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

  // Template Info
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  category: knowledgeBaseCategoryEnum("category").notNull(),

  // Template Fields
  fields: jsonb("fields").default([]), // Dynamic fields for template
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),

  // Authoring
  createdBy: uuid("created_by").notNull(),

  // Audit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("kb_templates_tenant_idx").on(table.tenantId),
  index("kb_templates_tenant_category_idx").on(table.tenantId, table.category),
  index("kb_templates_tenant_active_idx").on(table.tenantId, table.isActive),
]);

// Knowledge Base Article Comments
export const knowledgeBaseComments: any = pgTable("knowledge_base_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  articleId: uuid("article_id").notNull().references(() => knowledgeBaseArticles.id, { onDelete: "cascade" }),

  // Comment Structure
  parentId: uuid("parent_id").references(() => knowledgeBaseComments.id, { onDelete: "cascade" }),
  content: text("content").notNull(),

  // Author Info
  authorId: uuid("author_id").notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull(),

  // Status
  isEdited: boolean("is_edited").notNull().default(false),
  isApproved: boolean("is_approved").notNull().default(true),

  // Audit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("kb_comments_tenant_article_idx").on(table.tenantId, table.articleId),
  index("kb_comments_tenant_author_idx").on(table.tenantId, table.authorId),
  index("kb_comments_parent_idx").on(table.parentId),
]);

// Knowledge Base Scheduled Publications
export const knowledgeBaseScheduledPublications = pgTable("knowledge_base_scheduled_publications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  articleId: uuid("article_id").notNull().references(() => knowledgeBaseArticles.id, { onDelete: "cascade" }),

  // Scheduling Info
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("scheduled"), // scheduled, published, cancelled, failed
  publishedAt: timestamp("published_at"),

  // Configuration
  autoPublish: boolean("auto_publish").notNull().default(true),
  notifyUsers: boolean("notify_users").notNull().default(false),

  // Authoring
  scheduledBy: uuid("scheduled_by").notNull(),

  // Execution Log
  executionLog: jsonb("execution_log").default({}),
  failureReason: text("failure_reason"),

  // Audit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("kb_scheduled_tenant_idx").on(table.tenantId),
  index("kb_scheduled_tenant_article_idx").on(table.tenantId, table.articleId),
  index("kb_scheduled_tenant_status_idx").on(table.tenantId, table.status),
  index("kb_scheduled_execution_idx").on(table.scheduledFor),
]);

// Additional schemas for new tables
export const insertKnowledgeBaseTemplateSchema = createInsertSchema(knowledgeBaseTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKnowledgeBaseCommentSchema = createInsertSchema(knowledgeBaseComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  isEdited: true,
});

export const insertKnowledgeBaseScheduledPublicationSchema = createInsertSchema(knowledgeBaseScheduledPublications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  executionLog: true,
  failureReason: true,
});

// Additional type exports
export type KnowledgeBaseTemplate = typeof knowledgeBaseTemplates.$inferSelect;
export type InsertKnowledgeBaseTemplate = z.infer<typeof insertKnowledgeBaseTemplateSchema>;

export type KnowledgeBaseComment = typeof knowledgeBaseComments.$inferSelect;
export type InsertKnowledgeBaseComment = z.infer<typeof insertKnowledgeBaseCommentSchema>;

export type KnowledgeBaseScheduledPublication = typeof knowledgeBaseScheduledPublications.$inferSelect;
export type InsertKnowledgeBaseScheduledPublication = z.infer<typeof insertKnowledgeBaseScheduledPublicationSchema>;

// Template field type definition
export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number';
  label: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select fields
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}