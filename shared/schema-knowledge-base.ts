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
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
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

// Knowledge Base Articles
export const knowledgeBaseArticles = pgTable("knowledge_base_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  
  // Basic Article Info
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  slug: varchar("slug", { length: 200 }).notNull(),
  
  // Categorization
  category: knowledgeBaseCategoryEnum("category").notNull(),
  tags: text("tags").array(),
  keywords: text("keywords").array(),
  
  // Status & Visibility
  status: knowledgeBaseStatusEnum("status").default("draft").notNull(),
  visibility: knowledgeBaseVisibilityEnum("visibility").default("internal").notNull(),
  
  // Authoring
  authorId: uuid("author_id").notNull(),
  reviewerId: uuid("reviewer_id"),
  
  // Metadata
  viewCount: integer("view_count").default(0),
  upvoteCount: integer("upvote_count").default(0),
  downvoteCount: integer("downvote_count").default(0),
  
  // Publishing
  publishedAt: timestamp("published_at"),
  expiresAt: timestamp("expires_at"),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // TENANT ISOLATION: Critical indexes for multi-tenant performance
  index("kb_articles_tenant_idx").on(table.tenantId),
  index("kb_articles_tenant_status_idx").on(table.tenantId, table.status),
  index("kb_articles_tenant_category_idx").on(table.tenantId, table.category),
  index("kb_articles_tenant_author_idx").on(table.tenantId, table.authorId),
  index("kb_articles_tenant_published_idx").on(table.tenantId, table.publishedAt),
  
  // Unique slug per tenant
  unique("kb_articles_tenant_slug_unique").on(table.tenantId, table.slug),
  
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
  upvoteCount: true,
  downvoteCount: true,
}).extend({
  title: z.string().min(1, "Título é obrigatório").max(500, "Título muito longo"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  category: z.enum(["technical_support", "troubleshooting", "user_guide", "faq", "policy", "process", "training", "announcement", "best_practice", "other"]),
  visibility: z.enum(["public", "internal", "restricted", "private"]).optional(),
  tags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  expiresAt: z.string().optional().nullable(),
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
  query: z.string().min(1, "Query é obrigatória"),
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