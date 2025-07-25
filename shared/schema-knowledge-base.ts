import { pgTable, uuid, varchar, text, boolean, timestamp, integer, jsonb, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums específicos do módulo Base de Conhecimento
export const articleStatusEnum = pgEnum('article_status', ['draft', 'pending_approval', 'approved', 'published', 'archived', 'rejected']);
export const articleTypeEnum = pgEnum('article_type', ['procedure', 'troubleshooting', 'faq', 'manual', 'policy', 'tutorial', 'announcement']);
export const contentFormatEnum = pgEnum('content_format', ['markdown', 'html', 'rich_text', 'video', 'audio', 'interactive']);
export const accessLevelEnum = pgEnum('access_level', ['public', 'internal', 'restricted', 'confidential']);
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected', 'revision_required']);
export const notificationTypeEnum = pgEnum('notification_type', ['comment', 'approval', 'update', 'expiration', 'mention']);

// 1. CATEGORIAS HIERÁRQUICAS
export const kbCategories = pgTable('kb_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  
  // Hierarquia
  parentId: uuid('parent_id'),
  level: integer('level').default(0),
  path: varchar('path', { length: 1000 }), // /parent/child/grandchild
  sortOrder: integer('sort_order').default(0),
  
  // Metadados
  icon: varchar('icon', { length: 100 }),
  color: varchar('color', { length: 7 }), // hex color
  isActive: boolean('is_active').default(true),
  
  // Permissões específicas da categoria
  accessLevel: accessLevelEnum('access_level').default('internal'),
  allowedRoles: jsonb('allowed_roles'), // array de roles que podem acessar
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by')
});

// 2. ARTIGOS PRINCIPAIS
export const kbArticles = pgTable('kb_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Conteúdo básico
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull(),
  summary: text('summary'),
  content: text('content').notNull(),
  contentFormat: contentFormatEnum('content_format').default('markdown'),
  
  // Classificação
  categoryId: uuid('category_id').notNull(),
  type: articleTypeEnum('type').default('procedure'),
  tags: text('tags').array(), // tags do artigo
  
  // Status e workflow
  status: articleStatusEnum('status').default('draft'),
  accessLevel: accessLevelEnum('access_level').default('internal'),
  
  // Métricas de engajamento
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  shareCount: integer('share_count').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0.00'),
  ratingCount: integer('rating_count').default(0),
  
  // Gestão de conteúdo
  featuredImageUrl: varchar('featured_image_url', { length: 500 }),
  estimatedReadTime: integer('estimated_read_time'), // em minutos
  difficulty: varchar('difficulty', { length: 20 }), // beginner, intermediate, advanced
  
  // Publicação
  publishedAt: timestamp('published_at'),
  scheduledPublishAt: timestamp('scheduled_publish_at'),
  
  // Revisão e expiração
  lastReviewedAt: timestamp('last_reviewed_at'),
  nextReviewDate: timestamp('next_review_date'),
  expiresAt: timestamp('expires_at'),
  
  // SEO e descoberta
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: varchar('meta_description', { length: 500 }),
  keywords: text('keywords').array(),
  
  // Relações com outros módulos
  relatedTicketIds: uuid('related_ticket_ids').array(),
  relatedAssetIds: uuid('related_asset_ids').array(),
  relatedContractIds: uuid('related_contract_ids').array(),
  
  // Auditoria
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by')
});

// 3. VERSIONAMENTO DE ARTIGOS
export const kbArticleVersions = pgTable('kb_article_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  articleId: uuid('article_id').notNull(),
  
  versionNumber: integer('version_number').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  summary: text('summary'),
  
  // Metadados da versão
  changeLog: text('change_log'),
  changeType: varchar('change_type', { length: 50 }), // major, minor, patch, hotfix
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull()
});

// 4. ANEXOS E MÍDIA
export const kbAttachments = pgTable('kb_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  articleId: uuid('article_id').notNull(),
  
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  
  // Metadados específicos
  fileType: varchar('file_type', { length: 50 }), // image, video, audio, document, diagram
  thumbnail: varchar('thumbnail', { length: 500 }),
  duration: integer('duration'), // para vídeos/áudios em segundos
  dimensions: jsonb('dimensions'), // {width, height} para imagens
  
  // Descrição e alt text
  title: varchar('title', { length: 255 }),
  description: text('description'),
  altText: varchar('alt_text', { length: 255 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull()
});

// 5. COMENTÁRIOS E DISCUSSÕES
export const kbComments = pgTable('kb_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  articleId: uuid('article_id').notNull(),
  
  content: text('content').notNull(),
  contentFormat: varchar('content_format', { length: 20 }).default('text'),
  
  // Hierarquia de comentários
  parentId: uuid('parent_id'), // para comentários aninhados
  level: integer('level').default(0),
  
  // Engajamento
  likeCount: integer('like_count').default(0),
  isResolution: boolean('is_resolution').default(false), // marca se resolve uma dúvida
  isHighlighted: boolean('is_highlighted').default(false),
  
  // Status
  isApproved: boolean('is_approved').default(true),
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by')
});

// 6. AVALIAÇÕES E FEEDBACK
export const kbRatings = pgTable('kb_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  articleId: uuid('article_id').notNull(),
  userId: uuid('user_id').notNull(),
  
  rating: integer('rating').notNull(), // 1-5
  feedback: text('feedback'),
  isHelpful: boolean('is_helpful'),
  
  // Categorias de avaliação
  accuracyRating: integer('accuracy_rating'), // 1-5
  clarityRating: integer('clarity_rating'), // 1-5
  completenessRating: integer('completeness_rating'), // 1-5
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// 7. WORKFLOW DE APROVAÇÃO
export const kbApprovals = pgTable('kb_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  articleId: uuid('article_id').notNull(),
  
  approverId: uuid('approver_id').notNull(),
  status: approvalStatusEnum('status').default('pending'),
  
  comments: text('comments'),
  reviewedAt: timestamp('reviewed_at'),
  
  // Configuração do workflow
  approvalLevel: integer('approval_level').default(1),
  isRequired: boolean('is_required').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull()
});

// 8. TEMPLATES DE ARTIGOS
export const kbTemplates = pgTable('kb_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  content: text('content').notNull(),
  
  // Configuração do template
  type: articleTypeEnum('type').notNull(),
  categoryId: uuid('category_id'),
  requiredFields: jsonb('required_fields'), // campos obrigatórios
  
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by')
});

// 9. ANALYTICS E MÉTRICAS
export const kbAnalytics = pgTable('kb_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Identificação
  articleId: uuid('article_id'),
  categoryId: uuid('category_id'),
  userId: uuid('user_id'),
  sessionId: varchar('session_id', { length: 255 }),
  
  // Evento
  eventType: varchar('event_type', { length: 50 }).notNull(), // view, search, download, share, like
  eventData: jsonb('event_data'), // dados específicos do evento
  
  // Contexto
  userAgent: varchar('user_agent', { length: 500 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  referer: varchar('referer', { length: 500 }),
  
  // Localização e tempo
  location: jsonb('location'), // geolocalização se disponível
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  duration: integer('duration') // tempo gasto em segundos
});

// 10. BUSCA E INDEXAÇÃO
export const kbSearchQueries = pgTable('kb_search_queries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  query: varchar('query', { length: 500 }).notNull(),
  userId: uuid('user_id'),
  sessionId: varchar('session_id', { length: 255 }),
  
  // Resultados
  resultCount: integer('result_count').default(0),
  clickedResultId: uuid('clicked_result_id'),
  clickedPosition: integer('clicked_position'),
  
  // Contexto
  filters: jsonb('filters'), // filtros aplicados
  sortBy: varchar('sort_by', { length: 50 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// 11. NOTIFICAÇÕES
export const kbNotifications = pgTable('kb_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  userId: uuid('user_id').notNull(),
  type: notificationTypeEnum('type').notNull(),
  
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  
  // Referências
  articleId: uuid('article_id'),
  commentId: uuid('comment_id'),
  approvalId: uuid('approval_id'),
  
  // Status
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  
  // Metadados
  metadata: jsonb('metadata'),
  
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// 12. CONFIGURAÇÕES DO SISTEMA
export const kbSettings = pgTable('kb_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Configurações gerais
  siteName: varchar('site_name', { length: 255 }).default('Base de Conhecimento'),
  siteDescription: text('site_description'),
  logoUrl: varchar('logo_url', { length: 500 }),
  
  // Configurações de conteúdo
  defaultLanguage: varchar('default_language', { length: 10 }).default('pt-BR'),
  supportedLanguages: text('supported_languages').array(),
  
  // Configurações de moderação
  requireApproval: boolean('require_approval').default(true),
  allowComments: boolean('allow_comments').default(true),
  allowRatings: boolean('allow_ratings').default(true),
  allowUserContributions: boolean('allow_user_contributions').default(false),
  
  // Configurações de notificação
  emailNotifications: boolean('email_notifications').default(true),
  reviewReminders: boolean('review_reminders').default(true),
  reviewIntervalDays: integer('review_interval_days').default(90),
  
  // SEO e Analytics
  enableAnalytics: boolean('enable_analytics').default(true),
  enableSEO: boolean('enable_seo').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: uuid('updated_by')
});

// Tipos TypeScript para exportação
export type KBCategory = typeof kbCategories.$inferSelect;
export type InsertKBCategory = typeof kbCategories.$inferInsert;
export type KBArticle = typeof kbArticles.$inferSelect;
export type InsertKBArticle = typeof kbArticles.$inferInsert;
export type KBArticleVersion = typeof kbArticleVersions.$inferSelect;
export type InsertKBArticleVersion = typeof kbArticleVersions.$inferInsert;
export type KBAttachment = typeof kbAttachments.$inferSelect;
export type InsertKBAttachment = typeof kbAttachments.$inferInsert;
export type KBComment = typeof kbComments.$inferSelect;
export type InsertKBComment = typeof kbComments.$inferInsert;
export type KBRating = typeof kbRatings.$inferSelect;
export type InsertKBRating = typeof kbRatings.$inferInsert;
export type KBApproval = typeof kbApprovals.$inferSelect;
export type InsertKBApproval = typeof kbApprovals.$inferInsert;
export type KBTemplate = typeof kbTemplates.$inferSelect;
export type InsertKBTemplate = typeof kbTemplates.$inferInsert;
export type KBAnalytics = typeof kbAnalytics.$inferSelect;
export type InsertKBAnalytics = typeof kbAnalytics.$inferInsert;
export type KBSearchQuery = typeof kbSearchQueries.$inferSelect;
export type InsertKBSearchQuery = typeof kbSearchQueries.$inferInsert;
export type KBNotification = typeof kbNotifications.$inferSelect;
export type InsertKBNotification = typeof kbNotifications.$inferInsert;
export type KBSettings = typeof kbSettings.$inferSelect;
export type InsertKBSettings = typeof kbSettings.$inferInsert;

// Relacionamentos
export const kbCategoriesRelations = relations(kbCategories, ({ one, many }) => ({
  parent: one(kbCategories, { fields: [kbCategories.parentId], references: [kbCategories.id] }),
  children: many(kbCategories),
  articles: many(kbArticles)
}));

export const kbArticlesRelations = relations(kbArticles, ({ one, many }) => ({
  category: one(kbCategories, { fields: [kbArticles.categoryId], references: [kbCategories.id] }),
  versions: many(kbArticleVersions),
  attachments: many(kbAttachments),
  comments: many(kbComments),
  ratings: many(kbRatings),
  approvals: many(kbApprovals)
}));

export const kbArticleVersionsRelations = relations(kbArticleVersions, ({ one }) => ({
  article: one(kbArticles, { fields: [kbArticleVersions.articleId], references: [kbArticles.id] })
}));

export const kbAttachmentsRelations = relations(kbAttachments, ({ one }) => ({
  article: one(kbArticles, { fields: [kbAttachments.articleId], references: [kbArticles.id] })
}));

export const kbCommentsRelations = relations(kbComments, ({ one, many }) => ({
  article: one(kbArticles, { fields: [kbComments.articleId], references: [kbArticles.id] }),
  parent: one(kbComments, { fields: [kbComments.parentId], references: [kbComments.id] }),
  children: many(kbComments)
}));

export const kbRatingsRelations = relations(kbRatings, ({ one }) => ({
  article: one(kbArticles, { fields: [kbRatings.articleId], references: [kbArticles.id] })
}));

export const kbApprovalsRelations = relations(kbApprovals, ({ one }) => ({
  article: one(kbArticles, { fields: [kbApprovals.articleId], references: [kbArticles.id] })
}));

export const kbTemplatesRelations = relations(kbTemplates, ({ one }) => ({
  category: one(kbCategories, { fields: [kbTemplates.categoryId], references: [kbCategories.id] })
}));