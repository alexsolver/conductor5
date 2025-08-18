/**
 * GDPR Compliance Complete Schema
 * Clean Architecture - Domain Layer Schema Definition
 * Following 1qa.md standards for enterprise GDPR/LGPD compliance
 */

import { pgTable, text, uuid, timestamp, boolean, jsonb, pgEnum, integer, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ✅ GDPR Enums
export const consentTypeEnum = pgEnum('consent_type', [
  'cookies_necessary',
  'cookies_statistics', 
  'cookies_marketing',
  'data_processing',
  'communications',
  'profiling',
  'third_party_sharing'
]);

export const dataRequestTypeEnum = pgEnum('data_request_type', [
  'access',
  'portability', 
  'rectification',
  'erasure',
  'restriction',
  'objection',
  'complaint'
]);

export const dataRequestStatusEnum = pgEnum('data_request_status', [
  'pending',
  'in_progress', 
  'completed',
  'rejected',
  'partially_fulfilled'
]);

export const policyTypeEnum = pgEnum('policy_type', [
  'privacy_policy',
  'terms_of_use',
  'cookie_policy',
  'data_processing_policy'
]);

export const gdprRiskLevelEnum = pgEnum('gdpr_risk_level', [
  'minimal',
  'low',
  'medium',
  'high',
  'very_high'
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
  auditTrail: jsonb('audit_trail')
});

// ✅ 2. Gestão de Consentimento de Dados Pessoais  
export const dataConsents = pgTable('data_consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  purpose: varchar('purpose', { length: 255 }).notNull(),
  consentGiven: boolean('consent_given').notNull(),
  consentDate: timestamp('consent_date').notNull(),
  consentMethod: varchar('consent_method', { length: 100 }),
  legalBasis: varchar('legal_basis', { length: 100 }),
  
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true).notNull()
});

// ✅ 3-7. Direitos GDPR (Acesso, Portabilidade, Esquecimento, Correção, Restrição)
export const dataSubjectRequests = pgTable('data_subject_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  requestType: dataRequestTypeEnum('request_type').notNull(),
  status: dataRequestStatusEnum('status').default('pending').notNull(),
  
  requestDetails: text('request_details'),
  requestedData: jsonb('requested_data'),
  responseData: jsonb('response_data'),
  
  processedBy: uuid('processed_by'),
  processedAt: timestamp('processed_at'),
  dueDate: timestamp('due_date').notNull(),
  completedAt: timestamp('completed_at'),
  
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  notes: text('notes'),
  attachments: jsonb('attachments')
});

// ✅ 8. Auditoria e Log de Ações Sensíveis
export const gdprAuditLogs = pgTable('gdpr_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  subjectUserId: uuid('subject_user_id'),
  action: varchar('action', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: uuid('entity_id'),
  
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  userAgent: text('user_agent'),
  requestData: jsonb('request_data'),
  responseData: jsonb('response_data'),
  
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  severity: gdprRiskLevelEnum('severity').default('low').notNull(),
  tags: jsonb('tags')
});

// ✅ 9. Política de Privacidade & Termos de Uso
export const privacyPolicies = pgTable('privacy_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  policyType: policyTypeEnum('policy_type').notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  effectiveDate: timestamp('effective_date').notNull(),
  expiryDate: timestamp('expiry_date'),
  
  isActive: boolean('is_active').default(false).notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  
  tenantId: uuid('tenant_id').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  language: varchar('language', { length: 10 }).default('pt-BR').notNull(),
  changeLog: jsonb('change_log')
});

// ✅ 10. Notificações de Incidentes de Segurança
export const securityIncidents = pgTable('security_incidents', {
  id: uuid('id').defaultRandom().primaryKey(),
  incidentType: varchar('incident_type', { length: 100 }).notNull(),
  severity: gdprRiskLevelEnum('severity').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  
  affectedDataTypes: jsonb('affected_data_types'),
  affectedUserCount: integer('affected_user_count'),
  discoveredAt: timestamp('discovered_at').notNull(),
  containedAt: timestamp('contained_at'),
  resolvedAt: timestamp('resolved_at'),
  
  authorityNotified: boolean('authority_notified').default(false).notNull(),
  authorityNotifiedAt: timestamp('authority_notified_at'),
  usersNotified: boolean('users_notified').default(false).notNull(),
  usersNotifiedAt: timestamp('users_notified_at'),
  
  tenantId: uuid('tenant_id').notNull(),
  reportedBy: uuid('reported_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  remediationActions: jsonb('remediation_actions'),
  attachments: jsonb('attachments')
});

// ✅ 11. Gestão de Retenção de Dados
export const dataRetentionPolicies = pgTable('data_retention_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  dataCategory: varchar('data_category', { length: 255 }).notNull(),
  retentionPeriodDays: integer('retention_period_days').notNull(),
  legalBasis: varchar('legal_basis', { length: 255 }).notNull(),
  description: text('description'),
  
  autoDeleteEnabled: boolean('auto_delete_enabled').default(false).notNull(),
  anonymizeInstead: boolean('anonymize_instead').default(false).notNull(),
  
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
  
  emailMarketing: boolean('email_marketing').default(false).notNull(),
  emailSupport: boolean('email_support').default(true).notNull(),
  smsMarketing: boolean('sms_marketing').default(false).notNull(),
  phoneMarketing: boolean('phone_marketing').default(false).notNull(),
  
  dataProcessingForMarketing: boolean('data_processing_for_marketing').default(false).notNull(),
  dataProcessingForAnalytics: boolean('data_processing_for_analytics').default(false).notNull(),
  profileSharing: boolean('profile_sharing').default(false).notNull(),
  
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  lastReviewedAt: timestamp('last_reviewed_at')
});

// ✅ Zod Schemas for Validation
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