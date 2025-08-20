/**
 * GDPR Compliance Reports Schema
 * Clean Architecture - Domain Layer Schema Definition
 * Following 1qa.md standards for enterprise compliance management
 */

import { pgTable, text, uuid, timestamp, boolean, jsonb, pgEnum, integer, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ✅ GDPR Compliance Report Status Enum
export const gdprReportStatusEnum = pgEnum('gdpr_report_status', [
  'draft',
  'in_progress', 
  'under_review',
  'approved',
  'published',
  'archived'
]);

// ✅ GDPR Report Type Enum
export const gdprReportTypeEnum = pgEnum('gdpr_report_type', [
  'dpia', // Data Protection Impact Assessment
  'audit_trail',
  'data_breach',
  'consent_management',
  'right_of_access',
  'right_of_rectification',
  'right_of_erasure',
  'data_portability',
  'processing_activities',
  'vendor_assessment',
  'training_compliance',
  'incident_response'
]);

// ✅ Priority Level Enum
export const gdprPriorityEnum = pgEnum('gdpr_priority', [
  'low',
  'medium', 
  'high',
  'critical',
  'urgent'
]);

// ✅ Risk Level Enum  
export const gdprRiskLevelEnum = pgEnum('gdpr_risk_level', [
  'minimal',
  'low',
  'medium',
  'high',
  'very_high'
]);

// ✅ Consent Type Enum
export const consentTypeEnum = pgEnum('consent_type', [
  'cookies_necessary',
  'cookies_statistics', 
  'cookies_marketing',
  'data_processing',
  'communications',
  'profiling',
  'third_party_sharing'
]);

// ✅ Data Request Type Enum
export const dataRequestTypeEnum = pgEnum('data_request_type', [
  'access', // Direito de Acesso
  'portability', // Direito de Portabilidade 
  'rectification', // Direito de Correção
  'erasure', // Direito ao Esquecimento
  'restriction', // Restrição de Processamento
  'objection', // Direito de Oposição
  'complaint' // Reclamação
]);

// ✅ Data Request Status Enum
export const dataRequestStatusEnum = pgEnum('data_request_status', [
  'pending',
  'in_progress', 
  'completed',
  'rejected',
  'partially_fulfilled'
]);

// ✅ Policy Type Enum
export const policyTypeEnum = pgEnum('policy_type', [
  'privacy_policy',
  'terms_of_use',
  'cookie_policy',
  'data_processing_policy'
]);

// ✅ 1. Consentimento de Cookies & Rastreamento
export const cookieConsents = pgTable('cookie_consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'), // Pode ser null para visitantes anônimos
  sessionId: varchar('session_id', { length: 255 }),
  consentType: consentTypeEnum('consent_type').notNull(),
  granted: boolean('granted').notNull(),
  consentVersion: varchar('consent_version', { length: 50 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // Tracking
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
  
  // Auditoria
  auditTrail: jsonb('audit_trail') // Histórico de mudanças
});

// ✅ 2. Gestão de Consentimento de Dados Pessoais  
export const dataConsents = pgTable('data_consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  purpose: varchar('purpose', { length: 255 }).notNull(), // "marketing", "support", etc
  consentGiven: boolean('consent_given').notNull(),
  consentDate: timestamp('consent_date').notNull(),
  consentMethod: varchar('consent_method', { length: 100 }), // "form", "api", "phone"
  legalBasis: varchar('legal_basis', { length: 100 }), // "consent", "contract", "legitimate_interest"
  
  // Controle
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // Consentimento pode expirar
  isActive: boolean('is_active').default(true).notNull()
});

// ✅ 3-7. Direitos GDPR (Acesso, Portabilidade, Esquecimento, Correção, Restrição)
export const dataSubjectRequests = pgTable('data_subject_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  requestType: dataRequestTypeEnum('request_type').notNull(),
  status: dataRequestStatusEnum('status').default('pending').notNull(),
  
  // Detalhes do pedido
  requestDetails: text('request_details'), // Descrição detalhada 
  requestedData: jsonb('requested_data'), // Dados específicos solicitados
  responseData: jsonb('response_data'), // Resposta/dados fornecidos
  
  // Processamento
  processedBy: uuid('processed_by'), // ID do usuário que processou
  processedAt: timestamp('processed_at'),
  dueDate: timestamp('due_date').notNull(), // GDPR exige resposta em 30 dias
  completedAt: timestamp('completed_at'),
  
  // Controle
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // Auditoria
  notes: text('notes'), // Notas internas
  attachments: jsonb('attachments') // Documentos relacionados
});

// ✅ 8. Auditoria e Log de Ações Sensíveis
export const gdprAuditLogs = pgTable('gdpr_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'), // Quem realizou a ação
  subjectUserId: uuid('subject_user_id'), // Sobre quem foi a ação
  action: varchar('action', { length: 255 }).notNull(), // "data_access", "data_export", etc
  entityType: varchar('entity_type', { length: 100 }), // "user", "ticket", "customer"
  entityId: uuid('entity_id'), // ID da entidade afetada
  
  // Detalhes técnicos
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  userAgent: text('user_agent'),
  requestData: jsonb('request_data'), // Dados da requisição
  responseData: jsonb('response_data'), // Dados da resposta
  
  // Controle
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  // Metadados
  severity: gdprRiskLevelEnum('severity').default('low').notNull(),
  tags: jsonb('tags') // Tags para categorização
});

// ✅ 9. Política de Privacidade & Termos de Uso
export const privacyPolicies = pgTable('privacy_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  policyType: policyTypeEnum('policy_type').notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(), // Conteúdo da política
  effectiveDate: timestamp('effective_date').notNull(),
  expiryDate: timestamp('expiry_date'),
  
  // Status
  isActive: boolean('is_active').default(false).notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  
  // Controle
  tenantId: uuid('tenant_id').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // Metadados
  language: varchar('language', { length: 10 }).default('pt-BR').notNull(),
  changeLog: jsonb('change_log') // Registro de mudanças
});

// ✅ 10. Notificações de Incidentes de Segurança
export const securityIncidents = pgTable('security_incidents', {
  id: uuid('id').defaultRandom().primaryKey(),
  incidentType: varchar('incident_type', { length: 100 }).notNull(), // "data_breach", "unauthorized_access"
  severity: gdprRiskLevelEnum('severity').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  
  // Detalhes do incidente
  affectedDataTypes: jsonb('affected_data_types'), // Tipos de dados afetados
  affectedUserCount: integer('affected_user_count'),
  discoveredAt: timestamp('discovered_at').notNull(),
  containedAt: timestamp('contained_at'),
  resolvedAt: timestamp('resolved_at'),
  
  // Notificações obrigatórias
  authorityNotified: boolean('authority_notified').default(false).notNull(),
  authorityNotifiedAt: timestamp('authority_notified_at'),
  usersNotified: boolean('users_notified').default(false).notNull(),
  usersNotifiedAt: timestamp('users_notified_at'),
  
  // Controle  
  tenantId: uuid('tenant_id').notNull(),
  reportedBy: uuid('reported_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // Documentação
  remediationActions: jsonb('remediation_actions'),
  attachments: jsonb('attachments')
});

// ✅ 11. Gestão de Retenção de Dados
export const dataRetentionPolicies = pgTable('data_retention_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  dataCategory: varchar('data_category', { length: 255 }).notNull(), // "customer_data", "logs", etc
  retentionPeriodDays: integer('retention_period_days').notNull(),
  legalBasis: varchar('legal_basis', { length: 255 }).notNull(),
  description: text('description'),
  
  // Ações automatizadas
  autoDeleteEnabled: boolean('auto_delete_enabled').default(false).notNull(),
  anonymizeInstead: boolean('anonymize_instead').default(false).notNull(),
  
  // Controle
  tenantId: uuid('tenant_id').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ✅ 12. User Preferences (Portal do Cliente)
export const gdprUserPreferences = pgTable('gdpr_user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  
  // Preferências de comunicação
  emailMarketing: boolean('email_marketing').default(false).notNull(),
  emailSupport: boolean('email_support').default(true).notNull(),
  smsMarketing: boolean('sms_marketing').default(false).notNull(),
  phoneMarketing: boolean('phone_marketing').default(false).notNull(),
  
  // Preferências de dados
  dataProcessingForMarketing: boolean('data_processing_for_marketing').default(false).notNull(),
  dataProcessingForAnalytics: boolean('data_processing_for_analytics').default(false).notNull(),
  profileSharing: boolean('profile_sharing').default(false).notNull(),
  
  // Controle
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // Auditoria  
  lastReviewedAt: timestamp('last_reviewed_at')
});

// ✅ GDPR Reports Main Table (mantendo existente e expandindo)
export const gdprReports = pgTable('gdpr_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  reportType: gdprReportTypeEnum('report_type').notNull(),
  status: gdprReportStatusEnum('status').notNull().default('draft'),
  priority: gdprPriorityEnum('priority').notNull().default('medium'),
  riskLevel: gdprRiskLevelEnum('risk_level').default('medium'),
  
  // Metadata fields
  reportData: jsonb('report_data'), // Structured report content
  findings: jsonb('findings'), // Key findings and recommendations
  actionItems: jsonb('action_items'), // Required actions and deadlines
  attachments: jsonb('attachments'), // File references and metadata
  
  // Compliance tracking
  complianceScore: integer('compliance_score'), // 0-100 score
  lastAuditDate: timestamp('last_audit_date'),
  nextReviewDate: timestamp('next_review_date'),
  
  // Tracking & Audit
  tenantId: uuid('tenant_id').notNull(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by'),
  assignedTo: uuid('assigned_to'), // Responsável pelo relatório
  reviewedBy: uuid('reviewed_by'), // Quem revisou
  approvedBy: uuid('approved_by'), // Quem aprovou
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  
  // Template & Versioning
  templateId: uuid('template_id'), // Base template usado
  version: varchar('version', { length: 50 }).default('1.0').notNull(),
  tags: jsonb('tags') // Categorização e busca
});

// ✅ Zod Schemas for Validation - Following 1qa.md patterns
export const insertCookieConsentSchema = createInsertSchema(cookieConsents).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDataConsentSchema = createInsertSchema(dataConsents).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDataSubjectRequestSchema = createInsertSchema(dataSubjectRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  // Validação adicional para due date (GDPR: máximo 30 dias)
  dueDate: z.string().datetime().optional(),
});

export const insertGdprAuditLogSchema = createInsertSchema(gdprAuditLogs).omit({
  id: true,
  createdAt: true
});

export const insertPrivacyPolicySchema = createInsertSchema(privacyPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSecurityIncidentSchema = createInsertSchema(securityIncidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDataRetentionPolicySchema = createInsertSchema(dataRetentionPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertGdprUserPreferencesSchema = createInsertSchema(gdprUserPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertGdprReportSchema = createInsertSchema(gdprReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// ✅ Types for Domain Entities
export type CookieConsent = typeof cookieConsents.$inferSelect;
export type InsertCookieConsent = z.infer<typeof insertCookieConsentSchema>;

export type DataConsent = typeof dataConsents.$inferSelect;
export type InsertDataConsent = z.infer<typeof insertDataConsentSchema>;

export type DataSubjectRequest = typeof dataSubjectRequests.$inferSelect;
export type InsertDataSubjectRequest = z.infer<typeof insertDataSubjectRequestSchema>;

export type GdprAuditLog = typeof gdprAuditLogs.$inferSelect;
export type InsertGdprAuditLog = z.infer<typeof insertGdprAuditLogSchema>;

export type PrivacyPolicy = typeof privacyPolicies.$inferSelect;
export type InsertPrivacyPolicy = z.infer<typeof insertPrivacyPolicySchema>;

export type SecurityIncident = typeof securityIncidents.$inferSelect;
export type InsertSecurityIncident = z.infer<typeof insertSecurityIncidentSchema>;

export type DataRetentionPolicy = typeof dataRetentionPolicies.$inferSelect;
export type InsertDataRetentionPolicy = z.infer<typeof insertDataRetentionPolicySchema>;

export type GdprUserPreferences = typeof gdprUserPreferences.$inferSelect;
export type InsertGdprUserPreferences = z.infer<typeof insertGdprUserPreferencesSchema>;

export type GdprReport = typeof gdprReports.$inferSelect;
export type InsertGdprReport = z.infer<typeof insertGdprReportSchema>;
  assignedUserId: uuid('assigned_user_id'),
  reviewerUserId: uuid('reviewer_user_id'),
  approverUserId: uuid('approver_user_id'),
  
  // Workflow tracking
  submittedAt: timestamp('submitted_at'),
  approvedAt: timestamp('approved_at'),
  publishedAt: timestamp('published_at'),
  
  // Audit fields
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by'),
  isActive: boolean('is_active').notNull().default(true)
});

// ✅ GDPR Report Templates Table
export const gdprReportTemplates = pgTable('gdpr_report_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  reportType: gdprReportTypeEnum('report_type').notNull(),
  templateData: jsonb('template_data').notNull(), // Template structure and fields
  isDefault: boolean('is_default').notNull().default(false),
  
  // Audit fields
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by'),
  isActive: boolean('is_active').notNull().default(true)
});

// ✅ GDPR Compliance Tasks Table
export const gdprComplianceTasks = pgTable('gdpr_compliance_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportId: uuid('report_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: gdprReportStatusEnum('status').notNull().default('draft'),
  priority: gdprPriorityEnum('priority').notNull().default('medium'),
  
  // Task specifics
  taskType: varchar('task_type', { length: 100 }), // action_item, review, approval, etc.
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  
  // Assignment
  assignedUserId: uuid('assigned_user_id'),
  assignedBy: uuid('assigned_by'),
  
  // Task data
  taskData: jsonb('task_data'), // Specific task requirements and progress
  evidence: jsonb('evidence'), // Supporting documentation
  
  // Audit fields
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  
  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by'),
  isActive: boolean('is_active').notNull().default(true)
});

// ✅ GDPR Audit Log Table
export const gdprAuditLog = pgTable('gdpr_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // gdpr_reports, gdpr_tasks, etc.
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(), // created, updated, deleted, approved, etc.
  
  // Change tracking
  previousData: jsonb('previous_data'),
  newData: jsonb('new_data'),
  changes: jsonb('changes'), // Specific field changes
  
  // Context
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  sessionId: varchar('session_id', { length: 255 }),
  
  // Audit fields
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  tenantId: uuid('tenant_id').notNull()
});

// ✅ Insert Schemas using drizzle-zod
export const insertGdprReportSchema = createInsertSchema(gdprReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedBy: true
});

export const insertGdprReportTemplateSchema = createInsertSchema(gdprReportTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedBy: true
});

export const insertGdprComplianceTaskSchema = createInsertSchema(gdprComplianceTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedBy: true
});

export const insertGdprAuditLogSchema = createInsertSchema(gdprAuditLog).omit({
  id: true,
  createdAt: true
});

// ✅ Select Types
export type GdprReport = typeof gdprReports.$inferSelect;
export type InsertGdprReport = z.infer<typeof insertGdprReportSchema>;

export type GdprReportTemplate = typeof gdprReportTemplates.$inferSelect;
export type InsertGdprReportTemplate = z.infer<typeof insertGdprReportTemplateSchema>;

export type GdprComplianceTask = typeof gdprComplianceTasks.$inferSelect;
export type InsertGdprComplianceTask = z.infer<typeof insertGdprComplianceTaskSchema>;

export type GdprAuditLog = typeof gdprAuditLog.$inferSelect;
export type InsertGdprAuditLog = z.infer<typeof insertGdprAuditLogSchema>;